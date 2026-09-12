import fs from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'
import { Window } from 'happy-dom'
import console from 'node:console'
import path from 'node:path'
import { fileURLToPath, URL } from 'node:url'
const root = fileURLToPath(new URL('../../', import.meta.url))
const items = JSON.parse(fs.readFileSync(new URL('./group-2.json', import.meta.url), 'utf8')).map(
  (item) => ({ ...item, directory: path.join(root, item.directory) })
)
const openWindows = []
function load(id) {
  const dir = items.find((x) => x.id === id).directory
  const html = fs.readFileSync(dir + '/index.html', 'utf8')
  const win = new Window()
  openWindows.push(win)
  const proto = win.HTMLElement.prototype
  const inner = Object.getOwnPropertyDescriptor(proto, 'innerText')
  Object.defineProperty(proto, 'innerText', {
    get: inner.get,
    set(value) {
      inner.set.call(this, String(value))
    },
    configurable: true,
  })
  win.document.write(html)
  let src = fs.existsSync(dir + '/script.js')
    ? fs.readFileSync(dir + '/script.js', 'utf8')
    : [...html.matchAll(/<script([^>]*)>([\s\S]*?)<\/script>/g)]
        .filter((x) => x[2].trim() && !x[1].includes('importmap'))
        .map((x) => x[2])
        .join('\n')
  const ctx = vm.createContext({
    document: win.document,
    window: win,
    Phaser: { Scene: class {} },
    setTimeout() {
      return 1
    },
    clearTimeout() {},
    requestAnimationFrame() {},
    cancelAnimationFrame() {},
    console,
    Math: Object.create(Math),
    alert() {},
  })
  vm.runInContext(src, ctx)
  return { ctx, doc: win.document, run: (s) => vm.runInContext(s, ctx) }
}
const passed = []
function check(name, fn) {
  fn()
  passed.push(name)
}
check('alpha exact target/equivalence, approximate rejection, one-whole bounds', () => {
  const x = load('fraction-precision-alpha')
  x.run('Math.random=()=>0.21;ContentApp.resetCoreGame()')
  assert.equal(x.doc.getElementById('target-decimal').innerText, '1/3')
  x.doc.getElementById('denominator').value = 6
  x.doc.getElementById('numerator').value = 2
  x.run('ContentApp.checkCoreAnswer()')
  assert.equal(x.doc.getElementById('check-btn').disabled, true)
  x.doc.getElementById('check-btn').disabled = false
  x.doc.getElementById('denominator').value = 10
  x.doc.getElementById('numerator').value = 3
  x.run('ContentApp.checkCoreAnswer()')
  assert.equal(x.doc.getElementById('check-btn').disabled, false)
  x.doc.getElementById('denominator').value = 2
  x.doc.getElementById('numerator').value = 8
  x.run('ContentApp.updateCoreGame()')
  assert.equal(x.doc.getElementById('numerator').value, '2')
})
check('beta decimal answer not truncated', () => {
  const x = load('fraction-precision-beta')
  x.doc.getElementById('quiz-input').value = '30.9'
  x.run('ContentApp.checkQuiz()')
  assert.match(x.doc.getElementById('quiz-feedback').textContent, /틀렸/)
  x.doc.getElementById('quiz-input').value = '30'
  x.run('ContentApp.checkQuiz()')
  assert.match(x.doc.getElementById('quiz-feedback').textContent, /정답/)
})
check('epsilon displayed boundary accepted, outside rejected', () => {
  const x = load('fraction-precision-epsilon')
  x.run('ContentApp.epsilon=0.05; Math.random=()=>0.55;ContentApp.playGame()')
  assert.match(x.doc.getElementById('result-panel').textContent, /성공/)
  x.run('Math.random=()=>0.551;ContentApp.playGame()')
  assert.match(x.doc.getElementById('result-panel').textContent, /실패/)
})
check('data maximum and minimum ties accepted once', () => {
  const x = load('data-visualization-hub')
  x.run("currentData={labels:['A','B','C'],values:[10,10,2]};currentQuestion=questionTypes[0]")
  const btn = x.doc.createElement('button')
  btn.className = 'option-btn'
  btn.dataset.answer = 'B'
  x.doc.getElementById('answer-options').append(btn)
  x.ctx.btn = btn
  x.run("checkAnswer('B',btn);checkAnswer('B',btn)")
  assert.equal(x.run('correct'), 1)
  x.run("currentData={labels:['A','B','C'],values:[10,2,2]};currentQuestion=questionTypes[1]")
  btn.disabled = false
  x.run("checkAnswer('C',btn)")
  assert.equal(x.run('correct'), 2)
})
check('algebra hard equations always have unique intended solution', () => {
  const x = load('3d-algebra-city')
  for (let n = 0; n < 20; n++) {
    x.ctx.f = n / 20
    x.run('Math.random=()=>f')
    const p = x.run('problemGenerators.linear.hard()')
    const m = p.equation.match(/(\d+)x \+ 5 = (\d+)x \+ (-?\d+)/)
    assert.notEqual(Number(m[1]), Number(m[2]))
    assert.equal((Number(m[3]) - 5) / (Number(m[1]) - Number(m[2])), p.answer)
  }
})
check('geometry rejects near answer, credits correct answer once', () => {
  const x = load('geometry-world-3d')
  x.run('currentProblem={answer:54};')
  x.doc.getElementById('answer-input').value = '54.09'
  x.run('submitAnswer()')
  assert.equal(x.run('correct'), 0)
  x.doc.getElementById('answer-input').value = '54'
  x.run('submitAnswer();submitAnswer()')
  assert.equal(x.run('correct'), 1)
})
check('function exact answer one credit', () => {
  const x = load('function-explorer-3d')
  x.run('currentProblem={answer:7}')
  x.doc.getElementById('answer-input').value = '7'
  x.run('submitAnswer();submitAnswer()')
  assert.equal(x.run('correct'), 1)
})
check('space stars distinct and stage click not repeated', () => {
  const x = load('space-numbers')
  x.run('ContentApp.coreStage=2;ContentApp.renderCoreLevel()')
  const planets = x.doc.querySelectorAll('.planet')
  const stars = [...planets[1].querySelectorAll('svg[style]')]
  assert.equal(stars.length, 5)
  assert.equal(new Set(stars.map((s) => s.style.left)).size, 5)
  planets[1].click()
  planets[1].click()
  assert.equal(x.doc.getElementById('planets-container').dataset.answered, 'true')
})
check('isometric quiz credits one attempt until next question', () => {
  const x = load('pythagorean-isometric')
  x.run('setupQuiz()')
  x.doc.getElementById('quiz-input').value = String(x.run('APP.quiz.current.ans'))
  x.doc.getElementById('quiz-check').click()
  x.doc.getElementById('quiz-check').click()
  assert.equal(x.run('APP.quiz.score'), 1)
  assert.equal(x.run('APP.quiz.total'), 1)
  x.run('nextQuizQuestion()')
  assert.equal(x.doc.getElementById('quiz-check').disabled, false)
})
check('racing and coordinate quiz repeated submit only counts once', () => {
  for (const id of ['multiplication-racing', 'coordinate-explorer']) {
    const dir = items.find((x) => x.id === id).directory
    const src = fs.readFileSync(dir + '/index.html', 'utf8')
    const start = src.indexOf('    checkQuizAnswer(selected, correct) {')
    const end = src.indexOf('\n    showFeedback(', start)
    const method = src.slice(start, end).trim()
    const obj = vm.runInNewContext('({quizCorrect:0,showFeedback(){},' + method + '})')
    obj.checkQuizAnswer(4, 4)
    obj.checkQuizAnswer(4, 4)
    assert.equal(obj.quizCorrect, 1)
  }
})
check(
  'IRP actual model equal-baseline, zero-return, zero-deduction, zero-year, one-year and growth cases',
  () => {
    const dir = items.find((x) => x.id === 'irp-future-wealth-simulator').directory
    const src = fs.readFileSync(dir + '/script.js', 'utf8')
    const helper = src.slice(
      src.indexOf('function calculateModelComparison'),
      src.indexOf('const irpData')
    )
    const ctx = vm.createContext({})
    vm.runInContext(helper, ctx)
    const calc = (p, r, y, d) =>
      vm.runInContext(`calculateModelComparison(${p},${r},${y},${d})`, ctx)
    for (const args of [
      [1000, 0, 30, 0.1],
      [1000, 0.05, 0, 0.1],
      [1000, 0.05, 30, 0],
      [1000, 0.05, 1, 0.1],
    ]) {
      const r = calc(...args)
      assert.ok(Math.abs(r.annual - r.deferred) < 1e-8)
    }
    const r = calc(1000, 0.05, 30, 0.1)
    assert.ok(Math.abs(r.annual - 1000 * 1.045 ** 30) < 1e-8)
    assert.ok(Math.abs(r.deferred - (1000 + (1000 * 1.05 ** 30 - 1000) * 0.9)) < 1e-8)
    assert.ok(r.deferred > r.annual)
    const doubled = calc(2000, 0.05, 30, 0.1)
    assert.equal(doubled.annual, r.annual * 2)
    assert.throws(() => calc(-1, 0.05, 30, 0.1))
  }
)
Promise.all(openWindows.map((w) => w.happyDOM.close())).then(() => {
  console.log(JSON.stringify({ passed: passed.length, checks: passed }, null, 2))
})
