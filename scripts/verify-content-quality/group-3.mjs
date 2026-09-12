import fs from 'node:fs'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import ts from 'typescript'
import { Window } from 'happy-dom'
import console from 'node:console'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
const root = fileURLToPath(new URL('../../', import.meta.url))
const items = JSON.parse(fs.readFileSync(new URL('./group-3.json', import.meta.url), 'utf8')).map(
  (item) => ({ ...item, directory: path.join(root, item.directory) })
)
const read = (i, f = 'script.js') => fs.readFileSync(items[i].directory + '/' + f, 'utf8')
for (const i of [0, 1]) {
  const w = new Window()
  w.document.body.innerHTML = '<div id="scene-container"></div>'
  const { data, engine } = new Function(
    'window',
    'document',
    read(i).replace('Engine.init(contentData);', '') +
      ';return {data:contentData,engine:window.Engine}'
  )(w, w.document)
  engine.init(data)
  engine.switchScene('core')
  if (i === 1) {
    const click = (type) => w.document.querySelector(`[data-type="${type}"]`).onclick()
    const next = w.document.getElementById('core-next-btn')
    click('indicator')
    assert.equal(next.style.display, 'none')
    click('acid')
    assert(+w.document.getElementById('ph-val').textContent < 7)
    click('base')
    assert.equal(w.document.getElementById('ph-val').textContent, '7.0')
    assert.equal(next.style.display, 'inline-block')
    w.document.getElementById('reset-btn').onclick()
    assert.equal(next.style.display, 'none')
    console.log('chemistry: indicator-only rejected; balanced molar acid/base pH7; reset relocks')
  }
  engine.switchScene('quiz')
  let q = w.document.querySelector('.quiz-option')
  engine.checkQuiz(data.quiz[0].answer, data.quiz[0].answer, q)
  const next = w.document.querySelector('#scene-quiz .btn')
  assert.equal(next.textContent, '다음 문항')
  next.onclick()
  assert.equal(w.document.getElementById('quiz-question').textContent, data.quiz[1].question)
  console.log(items[i].id, 'second question reachable')
  w.happyDOM.abort()
}
{
  const w = new Window()
  w.document.body.innerHTML = read(10, 'index.html').replace(/<script[\s\S]*?<\/script>/g, '')
  const frames = [],
    timers = []
  const app = new Function(
    'document',
    'requestAnimationFrame',
    'cancelAnimationFrame',
    'setTimeout',
    read(10) + ';return ScienceApp;'
  )(
    w.document,
    (fn) => {
      frames.push(fn)
      return frames.length
    },
    () => {},
    (fn) => {
      timers.push(fn)
      return timers.length
    }
  )
  app.force = 10
  app.applyForce()
  assert(app.boxVelocity > 0)
  timers[0]()
  const prior = app.boxVelocity
  frames.shift()()
  assert.equal(app.boxVelocity, prior)
  console.log('Newton: force release keeps velocity constant without friction')
  w.happyDOM.abort()
}
{
  const w = new Window()
  w.document.body.innerHTML = '<div id="core-feedback"></div><button id="core-next-btn"></button>'
  const src = read(33)
  const marker = src.indexOf('const listCompData =')
  const data = new Function(
    'document',
    src.slice(marker).replace('Engine.init(listCompData);', '') + 'return listCompData;'
  )(w.document)
  let message = ''
  const engine = {
    showFeedback(m) {
      message = m
    },
    enableNext() {},
  }
  const host = w.document.createElement('div')
  w.document.body.append(host)
  const timers = []
  const original = globalThis.setTimeout
  globalThis.setTimeout = (fn) => {
    timers.push(fn)
    return 0
  }
  try {
    data.interaction.onInit(host, engine)
    host.querySelector('[data-value="2"]').onclick()
    assert(message.includes('지금은 0'))
    for (let i = 0; i < 3; i++) {
      host.querySelector(`[data-value="${i}"]`).onclick()
      host.querySelector('#lever-btn').click()
      timers.shift()()
    }
    assert.deepEqual(
      [...host.querySelectorAll('.result-card')].map((e) => e.textContent),
      ['0', '2', '4']
    )
    console.log('Python: out-of-order input rejected; sequence outputs 0,2,4')
  } finally {
    globalThis.setTimeout = original
    w.happyDOM.abort()
  }
}
function inline(i) {
  return [...read(i, 'index.html').matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g)]
    .map((m) => m[1])
    .join('\n')
}
function fn(i, name) {
  const ast = ts.createSourceFile('x.js', inline(i), ts.ScriptTarget.Latest, true)
  let text
  function walk(n) {
    if (ts.isFunctionDeclaration(n) && n.name?.text === name) text = n.getText(ast)
    ts.forEachChild(n, walk)
  }
  walk(ast)
  return text
}
{
  const w = new Window()
  w.document.body.innerHTML =
    '<button class="word-bank-item selected">wrong</button><span class="blank" data-correct="bright"></span>'
  const btn = w.document.querySelector('button'),
    blank = w.document.querySelector('span'),
    timers = []
  const context = {
    document: w.document,
    selectedWord: { word: 'wrong', btn },
    setTimeout: (callback) => timers.push(callback),
    showFeedback() {},
    playSoundFeedback() {},
    combo: 2,
  }
  vm.createContext(context)
  vm.runInContext(fn(20, 'fillBlank'), context)
  context.fillBlank(blank, { clientX: 0, clientY: 0 })
  assert.equal(context.selectedWord, null)
  timers[0]()
  assert(!btn.classList.contains('used'))
  assert.equal(blank.textContent, '')
  console.log('Story builder: incorrect choice restores original button after selection cleared')
  w.happyDOM.abort()
}
{
  const w = new Window()
  w.document.body.innerHTML =
    '<button id="submit-btn"></button><span id="score"></span><span id="best-score"></span><section id="result-display"><span id="result-score"></span><p id="result-message"></p></section>'
  const context = {
    document: w.document,
    submittedStory: false,
    currentStoryIndex: 0,
    storiesData: [
      {
        questions: [
          { correct: 0, options: ['answer', 'wrong'] },
          { correct: 1, options: ['wrong', 'answer'] },
        ],
      },
    ],
    answers: { 0: 0, 1: 1 },
    score: 0,
    bestScore: 0,
    readingEvidence: [['Evidence A', 'Evidence B']],
  }
  vm.createContext(context)
  vm.runInContext(fn(27, 'submitAnswers'), context)
  context.submitAnswers()
  assert.equal(context.score, 100)
  context.submitAnswers()
  assert.equal(context.score, 100)
  assert.equal(w.document.querySelectorAll('.answer-review p').length, 2)
  console.log('Reading: single submission scores once and exposes answer evidence')
  w.happyDOM.abort()
}

console.log('PASS 7 science/language execution groups')
