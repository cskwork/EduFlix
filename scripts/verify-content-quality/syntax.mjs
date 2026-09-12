import fs from 'node:fs'
import path from 'node:path'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import { fileURLToPath, URL } from 'node:url'
import process from 'node:process'
import console from 'node:console'
import { Window } from 'happy-dom'

const root = fileURLToPath(new URL('../../', import.meta.url))
const publicRoot = path.join(root, 'public')
const catalog = JSON.parse(fs.readFileSync(path.join(publicRoot, 'contents/index.json'), 'utf8'))
const window = new Window({
  settings: {
    disableJavaScriptEvaluation: true,
    disableJavaScriptFileLoading: true,
    disableCSSFileLoading: true,
    disableIframePageLoading: true,
  },
})
const counts = { lessons: 0, javascriptFiles: 0, inlineScripts: 0, eventHandlers: 0 }
const failures = []
const files = new Map()
const jsTypes = new Set([
  '',
  'text/javascript',
  'application/javascript',
  'text/ecmascript',
  'application/ecmascript',
  'application/x-javascript',
  'text/jscript',
])

function compile(source, label, mode = 'classic') {
  // Compile only. No lesson code, imports, or event handlers are executed.
  if (mode === 'module') {
    const result = spawnSync(process.execPath, ['--input-type=module', '--check'], {
      input: source,
      encoding: 'utf8',
    })
    if (result.error) throw result.error
    if (result.status !== 0) throw new SyntaxError(`${label}\n${result.stderr}`)
  } else {
    new vm.Script(mode === 'handler' ? `(function(event) {\n${source}\n})` : source, {
      filename: label,
    })
  }
}

function check(source, label, mode) {
  try {
    compile(source, label, mode)
  } catch (error) {
    failures.push(`${label}: ${error.message}`)
  }
}

function parse(html) {
  window.document.documentElement.innerHTML = html
  return window.document
}

// The modal-can regression: HTML entity decoding must precede handler parsing.
// A doubled backslash leaves the apostrophe unescaped in JavaScript.
const invalid = String.raw`<button onclick="answer('can\\'t')"></button>`
const valid = '<button onclick="return answer(&quot;can&#39;t&quot;)"></button>'
assert.throws(
  () =>
    compile(
      parse(invalid).querySelector('button').getAttribute('onclick'),
      'malformed-handler fixture',
      'handler'
    ),
  SyntaxError
)
compile(
  parse(valid).querySelector('button').getAttribute('onclick'),
  'decoded-handler fixture',
  'handler'
)

try {
  for (const lesson of catalog.contents) {
    const htmlPath = path.join(publicRoot, lesson.path)
    const label = path.relative(root, htmlPath)
    const document = parse(fs.readFileSync(htmlPath, 'utf8'))
    counts.lessons++
    let index = 0
    for (const script of document.querySelectorAll('script')) {
      index++
      const type = (script.getAttribute('type') || '').trim().toLowerCase()
      if (type !== 'module' && !jsTypes.has(type)) continue
      const mode = type === 'module' ? 'module' : 'classic'
      const src = script.getAttribute('src')
      if (src) {
        const url = new URL(src, `https://content.invalid${lesson.path}`)
        if (url.origin !== 'https://content.invalid') continue
        const filename = path.join(publicRoot, decodeURIComponent(url.pathname))
        // A shared file can be loaded in both modes; validate each actual mode.
        files.set(`${filename}:${mode}`, { filename, mode })
      } else if (script.textContent.trim()) {
        check(script.textContent, `${label} script[${index}]`, mode)
        counts.inlineScripts++
      }
    }
    for (const element of document.querySelectorAll('*')) {
      for (const attribute of element.attributes) {
        if (!/^on[a-z]+$/i.test(attribute.name)) continue
        check(
          attribute.value,
          `${label} ${element.localName}${element.id ? `#${element.id}` : ''}[${attribute.name}]`,
          'handler'
        )
        counts.eventHandlers++
      }
    }
    // Also catch syntax errors in lesson JS files not present in a script tag.
    for (const entry of fs.readdirSync(path.dirname(htmlPath), { withFileTypes: true })) {
      if (!entry.isFile() || !/\.(?:js|mjs|cjs)$/.test(entry.name)) continue
      const filename = path.join(path.dirname(htmlPath), entry.name)
      if (![...files.values()].some((file) => file.filename === filename)) {
        const mode = entry.name.endsWith('.mjs') ? 'module' : 'classic'
        files.set(`${filename}:${mode}`, { filename, mode })
      }
    }
  }
  for (const { filename, mode } of files.values()) {
    try {
      check(fs.readFileSync(filename, 'utf8'), path.relative(root, filename), mode)
      counts.javascriptFiles++
    } catch (error) {
      failures.push(`${path.relative(root, filename)}: ${error.message}`)
    }
  }
} finally {
  await window.happyDOM.close()
}
if (failures.length) {
  console.error(failures.join('\n\n'))
  process.exitCode = 1
}
console.log(
  JSON.stringify({ ...counts, failures: failures.length, negativeHandlerFixture: 'passed' })
)
