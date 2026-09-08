/* global window, Response, URL, location */
// Disposable browser fixture. Install with agent-browser eval --stdin on /create.
// All /api fetches and EventSource calls are mocked; no provider is contacted.
(() => {
  const originalFetch = window.fetch.bind(window)
  const json = data => new Response(JSON.stringify(data), {headers: {'Content-Type':'application/json'}})
  const qa = window.generationQA = {requests: [], signals: [], releases: {}, streams: [], run: 0}
  window.EventSource = class {
    static OPEN = 1
    readyState = 1
    constructor(url) { this.url = url; qa.streams.push({url, closed:false}); this.record = qa.streams.at(-1) }
    close() { this.readyState = 2; this.record.closed = true }
  }
  window.fetch = async (input, options = {}) => {
    const path = new URL(typeof input === 'string' ? input : input.url, location.href).pathname
    if (!path.startsWith('/api/')) return originalFetch(input, options)
    qa.requests.push({path, body: options.body})
    if (path === '/api/health') return json({status:'ok'})
    if (path === '/api/generate') { qa.run++; qa.signals.push(options.signal); return json({success:true,jobId:`qa-${qa.run}`}) }
    if (path.startsWith('/api/generate/status/')) {
      const id = path.split('/').at(-1)
      qa.signals.push(options.signal)
      // Intentionally ignore abort, so a cancelled run can deliver a stale success.
      return new Promise(resolve => { qa.releases[id] = () => resolve(json({status:'completed',progress:100,message:`Completed ${id}`,contentId:id,manifest:{id,title:id,description:'mock',type:'exploration',subject:'math',gradeLevel:'elementary',grade:'elementary-5',path:'/contents/math/elementary/shapes-explorer/index.html'}})) })
    }
    return json({success:true})
  }
  return 'mock installed'
})()
