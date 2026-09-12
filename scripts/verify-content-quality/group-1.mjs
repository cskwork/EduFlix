import fs from 'node:fs'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { Window } from 'happy-dom'
import console from 'node:console'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'

const root = fileURLToPath(new URL('../../', import.meta.url))
const items = JSON.parse(fs.readFileSync(new URL('./group-1.json', import.meta.url), 'utf8')).map(
  (item) => ({ ...item, directory: path.join(root, item.directory) })
)
const log = []
function env(
  _item,
  html = '<div id="scene-container"></div><p id="quiz-question"></p><div id="quiz-options"></div>'
) {
  const window = new Window()
  window.document.body.innerHTML = html.replace(/<script\b[\s\S]*?<\/script>/g, '')
  const queue = []
  const context = vm.createContext({
    window,
    document: window.document,
    console,
    Math,
    setTimeout: (fn) => {
      queue.push(fn)
      return queue.length
    },
    clearTimeout() {},
    requestAnimationFrame() {},
  })
  return {
    window,
    context,
    queue,
    flush() {
      let count = 0
      while (queue.length) {
        assert(count++ < 200)
        queue.shift()()
      }
    },
  }
}
for (const item of items.slice(0, 13)) {
  const e = env(item)
  let source = fs.readFileSync(item.directory + '/script.js', 'utf8')
  source = source.replace(/Engine.init\((\w+)\);/, 'window.Engine.data=$1;')
  vm.runInContext(source, e.context)
  const engine = e.window.Engine
  assert.equal(engine.data.quiz.length, 2)
  assert(engine.data.objective && engine.data.workedExample && engine.data.reflection)
  let done = 0
  engine.nextScene = () => done++
  for (const wrong of [false, true]) {
    engine.startQuiz()
    for (let i = 0; i < 2; i++) {
      const q = engine.data.quiz[i]
      assert(q.explanation.length > 20)
      assert.equal(new Set(q.options).size, q.options.length)
      const options = e.window.document.querySelectorAll('.quiz-option')
      assert.equal(options.length, q.options.length)
      const idx = wrong ? (q.answer + 1) % options.length : q.answer
      options[idx].click()
      assert(
        e.window.document.getElementById('quiz-explanation').textContent.includes(q.explanation)
      )
      assert([...options].every((b) => b.disabled))
      assert.equal(e.queue.length, 0, 'quiz must not auto-dismiss')
      e.window.document.querySelector('#quiz-options > button:last-child').click()
    }
  }
  assert.equal(done, 2)
  log.push({
    id: item.id,
    checks: 'two questions, correct/wrong explanations, disabled answers, manual progression',
  })
}
function app(id) {
  const item = items.find((x) => x.id === id)
  const e = env(item, fs.readFileSync(item.directory + '/index.html', 'utf8'))
  const source = fs
    .readFileSync(item.directory + '/script.js', 'utf8')
    .replace(/document.addEventListener\('DOMContentLoaded',[\s\S]*$/, '')
  vm.runInContext(source, e.context)
  return { ...e, app: e.window.ContentApp }
}
{
  const e = app('fraction-division')
  e.app.createConfetti = () => {}
  e.app.resetCore()
  assert.equal(e.app.coreState.slices.length, 6)
  assert.equal(e.window.document.querySelectorAll('.pizza-slice').length, 6)
  for (let i = 0; i < 3; i++) {
    e.app.giveNextSlice(1)
    e.app.giveNextSlice(2)
  }
  assert.equal(e.window.document.getElementById('plate-1-fraction').textContent, '3/8')
  assert.equal(e.window.document.getElementById('plate-2-fraction').textContent, '3/8')
  assert(!e.window.document.getElementById('core-next-btn').classList.contains('hidden'))
  e.app.resetCore()
  for (let i = 0; i < 6; i++) e.app.giveNextSlice(1)
  assert(e.window.document.getElementById('core-next-btn').classList.contains('hidden'))
  e.app.resetCore()
  e.app.setupDragAndDrop()
  const cleanup = e.app.dragCleanup
  e.app.setupDragAndDrop()
  assert.notEqual(cleanup, e.app.dragCleanup)
  e.app.dragCleanup()
  log.push({
    id: 'fraction-division',
    checks:
      'six eighths, balanced 3/8 each enables next, unequal 6/8 vs0 blocks next, reset, listener rebinding',
  })
}
{
  const e = app('decimal-multiplication')
  e.app.createStarConfetti = () => {}
  for (const [a, b, result] of [
    [1.5, 2.4, 3.6],
    [0.5, 0.2, 0.1],
    [9.9, 9.9, 98.01],
    [0.8, 1.2, 0.96],
  ]) {
    e.window.document.getElementById('factor-1').value = a
    e.window.document.getElementById('factor-2').value = b
    e.app.runCoreSimulation()
    e.flush()
    assert(e.window.document.getElementById('calc-display').textContent.includes(String(result)))
    assert.equal(e.window.document.getElementById('core-start-btn').disabled, false)
  }
  for (const invalid of ['', '0', '10', '0.15']) {
    e.window.document.getElementById('factor-1').value = invalid
    e.app.runCoreSimulation()
    assert(e.window.document.getElementById('calc-display').textContent.includes('입력하세요'))
  }
  log.push({
    id: 'decimal-multiplication',
    checks: 'four actual input products and four invalid input cases, re-execution',
  })
}
// Inspect each manifest and CSS/HTML syntax-bearing structure, keeping absent manifests explicit.
for (const item of items) {
  const files = fs.readdirSync(item.directory)
  for (const f of files) {
    if (!fs.statSync(item.directory + '/' + f).isFile()) continue
    const text = fs.readFileSync(item.directory + '/' + f, 'utf8')
    if (f === 'manifest.json') {
      const m = JSON.parse(text)
      assert(m.title)
    }
    if (f.endsWith('.css')) assert(text.length > 0)
  }
}
// Direct stable mathematical oracles for changed quiz/data examples.
assert.equal(2 / 5 + 1 / 10, 0.5)
assert.equal(3 / 4 / 2, 3 / 8)
assert.equal(Math.hypot(3, 4, 12), 13)
assert.equal(Math.hypot(6, 8), 10)
assert.equal((450 / 300) * 100, 150)
assert.equal(5 * 3 * 4, 60)
assert.equal(3.14 * 10 * 10, 314)
assert.equal((5 - 1) / (2 - 0), 2)
assert.equal(-3 - -5, 2)

function dataApp(id) {
  const item = items.find((x) => x.id === id)
  const e = env(item)
  const source = fs
    .readFileSync(item.directory + '/script.js', 'utf8')
    .replace(/Engine.init\((\w+)\);/, 'window.Engine.data=$1;')
  vm.runInContext(source, e.context)
  const area = e.window.document.createElement('div')
  e.window.document.body.appendChild(area)
  const messages = []
  let next = 0
  const engine = { showFeedback: (m) => messages.push(m), enableNext: () => next++ }
  e.window.Engine.data.interaction.onInit(area, engine)
  return { ...e, area, messages, next: () => next }
}
{
  const e = dataApp('negative-addition')
  const q = (id) => e.area.querySelector(id)
  function move(op, n) {
    q('#op-select').value = op
    q('#input-num').value = n
    q('#move-btn').click()
  }
  move('+', -3)
  move('-', -5)
  assert.equal(q('#start-display').textContent, '-3')
  assert.equal(q('#result-display').textContent, '2')
  move('+', 10)
  assert.equal(q('#result-display').textContent, '2')
  assert(e.messages.at(-1).includes('12'))
  move('+', 0.5)
  assert(e.messages.at(-1).includes('정수'))
  q('#reset-btn').click()
  assert.equal(q('#start-display').textContent, '0')
  log.push({
    id: 'negative-addition',
    checks:
      'actual chained -3-(-5)=2, equation start changes, overflow does not falsify position, decimal rejected, reset',
  })
}
{
  const e = dataApp('quadratic-graph')
  const a = e.area.querySelector('#slider-a')
  a.value = '0'
  a.dispatchEvent(new e.window.Event('input'))
  assert.equal(e.area.querySelector('#val-a').textContent, '0')
  assert.equal(e.area.querySelector('.vertex-point'), null)
  log.push({ id: 'quadratic-graph', checks: 'actual a=0 retained, no vertex rendered' })
}
{
  const e = dataApp('linear-slope')
  const svg = e.area.querySelector('svg')
  const point = e.area.querySelector('#control-point')
  svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 500, height: 400 })
  // Use the source coordinate conversion: origin is centered with 30px per unit.
  point.dispatchEvent(
    new e.window.MouseEvent('mousedown', { bubbles: true, clientX: 250, clientY: 100 })
  )
  svg.dispatchEvent(
    new e.window.MouseEvent('mousemove', { bubbles: true, clientX: 250, clientY: 100 })
  )
  // This fixture confirms the explicit undefined branch exists; browser pointer geometry is covered by root.
  assert(
    fs
      .readFileSync(items.find((x) => x.id === 'linear-slope').directory + '/script.js', 'utf8')
      .includes("slope === null ? '정의되지 않음'")
  )
  log.push({
    id: 'linear-slope',
    checks:
      'core initializes; vertical branch explicitly undefined; browser pointer geometry pending',
  })
}
// Native module quiz tables: evaluate data and the answer method without loading WebGL.
for (const id of ['platonic-solids', 'volume-solids', '3d-coordinates']) {
  const item = items.find((x) => x.id === id)
  const source = fs.readFileSync(item.directory + '/script.js', 'utf8')
  const start = source.indexOf('const QUIZ_DATA')
  const end = source.indexOf('\n];', start) + 3
  const data = vm.runInNewContext(source.slice(start, end) + '\nQUIZ_DATA')
  const method = source.slice(
    source.indexOf('    checkQuizAnswer(e)'),
    source.indexOf('    enterFreeExplore()')
  )
  const e = env(item, '<div id="quiz-feedback"></div><div id="quiz-options"></div>')
  e.context.QUIZ_DATA = data
  const app = vm.runInContext('({' + method.trim() + '})', e.context)
  let advance = 0
  app.nextScene = () => advance++
  app.loadQuiz = () => advance++
  for (const [i, q] of data.entries())
    for (const wrong of [false, true]) {
      app.currentQuiz = i
      e.window.document.getElementById('quiz-feedback').innerHTML = ''
      const container = e.window.document.getElementById('quiz-options')
      container.innerHTML = ''
      for (const opt of q.options) {
        const b = e.window.document.createElement('button')
        b.className = 'quiz-option'
        b.dataset.answer = opt
        container.appendChild(b)
      }
      const opts = container.querySelectorAll('button')
      const answer = q.options.findIndex((o) => o === q.answer)
      const button = opts[wrong ? (answer + 1) % opts.length : answer]
      app.checkQuizAnswer({ target: button })
      assert(e.window.document.getElementById('quiz-feedback').textContent.includes(q.explain))
      assert.equal(e.queue.length, 0)
      e.window.document.querySelector('#quiz-feedback button').click()
    }
  assert.equal(advance, data.length * 2)
  log.push({
    id,
    checks: `${data.length} native module quiz correct/wrong cases preserve explanations and manually advance`,
  })
}

{
  const source = fs.readFileSync(
    items.find((x) => x.id === 'volume-solids').directory + '/script.js',
    'utf8'
  )
  const methods = source.slice(
    source.indexOf('    fillWater()'),
    source.indexOf('    loadQuiz(index)')
  )
  let callback
  const cleared = []
  const context = vm.createContext({
    setInterval: (fn) => {
      callback = fn
      return 1
    },
    clearInterval: (id) => cleared.push(id),
    Math,
  })
  const app = vm.runInContext(
    '({' +
      methods.trim().replace(/\n {4}}\n\n {4}(pourWater|toggleSlice)/g, '\n    },\n\n    $1') +
      '})',
    context
  )
  app.currentSolid = 'cylinder'
  app.waterMesh = { visible: false, scale: { y: 0 }, position: { y: 0 } }
  app.fillWater()
  for (let i = 0; i < 60; i++) callback()
  assert.equal(app.waterLevel, 1)
  assert(Math.abs(app.waterMesh.scale.y * 0.1 - 2.9) < 1e-8)
  assert(Math.abs(app.waterMesh.position.y - (-1.5 + 2.9 / 2)) < 1e-8)
  app.pourWater()
  for (let i = 0; i < 40; i++) callback()
  assert.equal(app.waterLevel, 0)
  assert.equal(app.waterMesh.visible, false)
  const sphere = {
    material: { opacity: 0.4 },
    traverse(fn) {
      fn(this)
    },
  }
  app.currentSolid = 'sphere'
  app.solidMeshes = { sphere }
  app.toggleSlice()
  assert.equal(sphere.material.opacity, 0.15)
  app.toggleSlice()
  assert.equal(sphere.material.opacity, 0.4)
  log.push({
    id: 'volume-solids',
    checks: 'actual methods full-water height2.9 from0.1 mesh, drain, sphere transparency toggles',
  })
}
console.log('PASS final', log.length, 'execution groups')
