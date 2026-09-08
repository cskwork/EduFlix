"""Replay local UI acceptance with agent-browser in a disposable session.
Start Vite on 4184 first. No provider calls: creator fetch and SSE are mocked.
Usage: AGENT_BROWSER_SOCKET_DIR=/tmp/eduflix-learning-resume python3 <this-file>
"""
import json
import os
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent
BASE = os.environ.get('EDUFLIX_QA_URL', 'http://127.0.0.1:4184')
LOG = []


def ab(*args, stdin=None):
    proc = subprocess.run(['agent-browser', '--session', 'learning', *args], input=stdin,
                          text=True, capture_output=True, timeout=40)
    LOG.append({'args': args, 'stdin': stdin, 'stdout': proc.stdout, 'stderr': proc.stderr, 'exit': proc.returncode})
    (ROOT / 'continuation-learning-results.json').write_text(json.dumps(LOG, ensure_ascii=False, indent=2))
    if proc.returncode:
        raise RuntimeError(proc.stdout + proc.stderr)
    return proc.stdout


def ev(js):
    return ab('eval', '--stdin', stdin=js)


def check(js):
    return ev(f'(() => {{ if (!({js})) throw new Error("Browser assertion failed: " + {json.dumps(js)}); return "PASS" }})()')


def wait(js):
    ab('wait', '--fn', js)


def button(name):
    ab('find', 'role', 'button', 'click', '--name', name, '--exact')


def shot(name):
    ab('screenshot', str(ROOT / f'continuation-learning-{name}.png'))


def opened(path):
    ab('open', BASE + path)


opened('/map')
ev('localStorage.removeItem("eduflix_learning_progress"); localStorage.removeItem("eduflix_learning_streak")')
ab('reload')
ab('wait', '.subject-header')
button('Math 0/13 ▼')
wait('document.querySelectorAll(".node-card").length > 0')
node = 'Array.from(document.querySelectorAll(".node-card")).find(n=>n.querySelector(".node-name").textContent === "일차방정식")'
check(f'{node}?.classList.contains("status-locked")')
ev(f'{node}.scrollIntoView({{block: "center"}})')
shot('map-locked')
opened('/content/negative-addition')
ab('wait', '.learning-actions button')
button('Mark complete')
wait('document.querySelector(".learning-actions button").disabled')
ab('reload')
ab('wait', '.learning-actions button')
check('document.querySelector(".learning-actions button").disabled')
opened('/my-learning')
ab('wait', '.stats-grid')
check('document.body.innerText.includes("1/13")')
opened('/map')
ab('wait', '.subject-header')
button('Math 1/13 ▼')
wait('document.querySelectorAll(".node-card").length > 0')
check(f'{node}?.classList.contains("status-available") && !{node}.querySelector(".locked-overlay")')
ev(f'{node}.scrollIntoView({{block: "center"}})')
shot('map-unlocked')

opened('/content/shapes-explorer')
ab('wait', '.learning-actions button')
button('Mark complete')
wait('document.querySelector(".learning-actions button").disabled')
ab('reload')
ab('wait', '.learning-actions button')
check('document.querySelector(".learning-actions button").disabled')
check('JSON.parse(localStorage.getItem("eduflix_learning_progress")).find(p=>p.nodeId==="shapes-2d-3d").status === "in_progress"')
ab('find', 'role', 'link', 'click', '--name', '3D Shape Expedition', '--exact')
ab('wait', '--url', '**/content/3d-shapes-discovery')
ab('wait', '.learning-actions button')
ev('window.originalSetItem=Storage.prototype.setItem; Storage.prototype.setItem=function(k,v){if(k==="eduflix_learning_progress") throw new DOMException("QA quota", "QuotaExceededError"); return window.originalSetItem.call(this,k,v)}')
button('Mark complete')
ab('wait', '[role="alert"]')
check('!document.querySelector(".learning-actions button").disabled && document.querySelector("[role=alert]").textContent.includes("could not be saved")')
shot('retry')
ev('Storage.prototype.setItem=window.originalSetItem')
button('Mark complete')
wait('document.querySelector(".learning-actions button").disabled')
check('!document.querySelector("[role=alert]")')
opened('/my-learning')
ab('wait', '.stats-grid')
check('document.body.innerText.includes("2/13")')
ev('JSON.parse(localStorage.getItem("eduflix_learning_progress"))')
shot('my-learning')

opened('/create')
ab('wait', '.creator-wizard')
ev((ROOT / 'continuation-learning-generation-mock.js').read_text())
button('Start from my problem Turn a problem you already have into something fun')
button('Next')
ab('wait', 'textarea')
ab('fill', 'textarea', 'What is two plus three?')
button('Next')
ab('wait', '--text', 'Start creating!')
button('Start creating!')
wait('Boolean(window.generationQA.releases["qa-1"])')
check('generationQA.streams.length === 1 && !generationQA.streams[0].closed')
shot('creator-running')
button('Cancel')
ab('wait', '--text', 'Start creating!')
check('generationQA.signals.every(s=>s.aborted) && generationQA.streams[0].closed')
button('Start creating!')
wait('Boolean(window.generationQA.releases["qa-2"])')
check('generationQA.streams.length === 2 && !generationQA.streams[1].closed')
ev('generationQA.releases["qa-1"]()')
ev('''(async()=>{const {useGenerationStore}=await import('/src/stores/generation.ts');const s=useGenerationStore();if(s.currentJobId!=='qa-2'||s.lastResult!==null||s.history.length!==0||s.currentProgress.status==='completed')throw Error('stale result changed active run');return 'PASS stale response ignored'})()''')
check('!document.body.innerText.includes("Your lesson is ready!")')
ev('generationQA.releases["qa-2"]()')
ab('wait', '--text', 'Your lesson is ready!')
check('generationQA.streams.every(s=>s.closed)')
ev('''(async()=>{const {useGenerationStore}=await import('/src/stores/generation.ts');const s=useGenerationStore();if(s.lastResult.contentId!=='qa-2'||s.history.length!==1)throw Error('incorrect final result');return {job:s.currentJobId,result:s.lastResult.contentId,history:s.history.length,streams:generationQA.streams,requests:generationQA.requests}})()''')
shot('creator-completed')
ab('errors')
ab('console')
ab('network', 'requests')
print(f'Passed {sum(x["args"][0] == "eval" and "PASS" in x["stdout"] for x in LOG)} browser assertions; {len(LOG)} commands recorded.')
