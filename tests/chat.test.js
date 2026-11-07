const { test } = require('node:test');
const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');
const { localHelp, extractReply } = require('../chat.js');
const code = fs.readFileSync(require.resolve('../chat.js'), 'utf8');

// Small DOM boundary double; no browser dependencies or live provider calls.
function setup(fetchImpl, options = {}) {
  class Node {
    constructor() {
      this.children = []; this.attrs = {}; this.listeners = {}; this.value = '';
      this.hidden = false; this.disabled = false; this.style = {}; this.text = '';
      this.scrollHeight = 100; this.scrollTop = 0; this.clientHeight = 100;
      this.classList = { add() {}, remove() {} };
    }
    set textContent(value) { this.text = value; this.children = []; }
    get textContent() { return this.text + this.children.map(c => c.textContent).join(''); }
    appendChild(node) { this.children.push(node); }
    replaceChildren() { this.children = []; this.text = ''; }
    setAttribute(k,v) { this.attrs[k] = v; }
    removeAttribute(k) { delete this.attrs[k]; }
    addEventListener(k,v) { this.listeners[k] = v; }
    focus() { this.focused = true; }
  }
  const nodes = new Map();
  const node = id => { if (!nodes.has(id)) nodes.set(id,new Node()); return nodes.get(id); };
  const listeners = {};
  const ctx = { document: { readyState:options.readyState,getElementById:node,createElement:()=>new Node(),addEventListener:(k,v)=>listeners[k]=v },
    AbortController, console, clearTimeout, TextEncoder,
    setTimeout:(cb,ms)=>setTimeout(cb,ms===45000?(options.timeout || 1000):ms),
    navigator:{onLine:options.online!==false},matchMedia:()=>({matches:options.reduced!==false}),
    AI_CONFIG:{USE_API:options.api!==false,API_URL:'/api/chat',MODEL:'existing-model',SYSTEM_PROMPT:'No private records or live search.'},fetch:fetchImpl
  };
  ctx.window=ctx;vm.createContext(ctx);vm.runInContext(code,ctx);listeners.DOMContentLoaded?.();
  return {ctx,node,messages:()=>node('ai-messages').children.map(n=>n.textContent)};
}
const response = text => ({ok:true,json:async()=>({choices:[{message:{content:text}}]})});

test('supported provider JSON and invalid data',()=>{
  assert.equal(extractReply({choices:[{message:{content:' hello '}}]}),'hello');
  assert.equal(extractReply({message:{content:'hello'}}),'hello');
  assert.equal(extractReply({response:'hello'}),'hello');
  for(const invalid of [{},{response:''},{response:{secret:'do not display'}},null]) assert.throws(()=>extractReply(invalid));
});
test('offline help does not export or inspect private school data',()=>{
  assert.match(localHelp('export every student'),/cannot read private student records, export records/);
  assert.match(localHelp('attendance'),/Sign in/);
  assert.doesNotMatch(code,/schoolData|localStorage|createObjectURL/);
});
test('successful answer remains literal text and controls recover',async()=>{
  const malicious='<img src=x onerror=alert(1)><script>bad()</script>';
  const s=setup(async()=>response(malicious));await s.ctx.sendAIMessage('hello');
  assert.equal(s.messages().at(-1),malicious);
  assert.equal(s.node('ai-send').disabled,false);
  assert.equal(s.node('ai-stop').hidden,true);
  assert.equal(s.node('ai-messages').attrs['aria-busy'],'false');
});
test('only one request runs at once, stop ignores late completion',async()=>{
  let resolve,calls=0;
  const s=setup(()=>{calls++;return new Promise(r=>resolve=r);});
  const first=s.ctx.sendAIMessage('first');await s.ctx.sendAIMessage('second');
  assert.equal(calls,1);s.ctx.stopAIResponse();resolve(response('late answer'));await first;
  assert.equal(s.messages().some(m=>m.includes('late answer')),false);
  assert.match(s.messages().at(-1),/Stopped/);assert.equal(s.node('ai-send').disabled,false);
});
test('failed service offers local help and retry, hides diagnostics',async()=>{
  const s=setup(async()=>({ok:false,status:500}));await s.ctx.sendAIMessage('attendance');
  assert.match(s.messages().at(-1),/local help/);assert.equal(s.node('ai-retry').hidden,false);
  assert.doesNotMatch(s.messages().at(-1),/API_KEY|500|stack|CORS/);
});
test('malformed JSON does not dump provider payload',async()=>{
  const s=setup(async()=>({ok:true,json:async()=>({secret:'private diagnostic'})}));
  await s.ctx.sendAIMessage('hello');assert.doesNotMatch(s.messages().join(' '),/private diagnostic/);
});
test('request timeout releases controls and shows recoverable help',async()=>{
  const s=setup((url,opts)=>new Promise((resolve,reject)=>opts.signal.addEventListener('abort',()=>reject(new Error('aborted')))),{timeout:5});
  await s.ctx.sendAIMessage('hello');assert.match(s.messages().at(-1),/took too long/);
  assert.equal(s.node('ai-send').disabled,false);
});
test('typing reveals progressively and can stop during rendering',async()=>{
  const s=setup(async()=>response('This answer is long enough to reveal over multiple frames.'),{reduced:false});
  const pending=s.ctx.sendAIMessage('hello');await new Promise(r=>setTimeout(r,5));
  const partial=s.messages().at(-1);assert.ok(partial.length>0 && partial.length<57);
  s.ctx.stopAIResponse();await pending;assert.match(s.messages().at(-1),/Stopped/);
});
test('new chat clears context and an older request cannot overwrite it',async()=>{
  let resolve;
  const s=setup(()=>new Promise(r=>resolve=r));const pending=s.ctx.sendAIMessage('old');
  s.ctx.clearAIConversation();resolve(response('old result'));await pending;
  assert.equal(s.messages().length,1);assert.match(s.messages()[0],/Hello/);
});
test('history includes complete turns but is cleared between chats',async()=>{
  const bodies=[];const s=setup(async(u,o)=>{bodies.push(JSON.parse(o.body));return response('Answer');});
  await s.ctx.sendAIMessage('one');await s.ctx.sendAIMessage('two');
  assert.equal(bodies[1].messages.length,3);
  s.ctx.clearAIConversation();await s.ctx.sendAIMessage('three');assert.equal(bodies[2].messages.length,1);
});
test('offline mode never calls provider',async()=>{
  const s=setup(()=>{throw new Error('must not fetch')},{online:false});
  await s.ctx.sendAIMessage('attendance');assert.match(s.messages().at(-1),/Sign in/);
});
test('empty and too-long questions never call provider',async()=>{
  let calls=0;const s=setup(async()=>{calls++;return response('Answer')});
  await s.ctx.sendAIMessage('   ');await s.ctx.sendAIMessage('a'.repeat(2001));assert.equal(calls,0);
});

test('outgoing chat contains only conversation text and never reads private application stores',async()=>{
 const bodies=[];const s=setup(async(u,o)=>{bodies.push(JSON.parse(o.body));return response('General answer')});s.ctx.schoolData={privateRecords:'PRIVATE_APP_CANARY'};s.ctx.localStorage={getItem(){throw Error('Private storage was touched')}};await s.ctx.sendAIMessage('Explain fractions');assert.deepEqual(Object.keys(bodies[0]),['messages']);assert.deepEqual(bodies[0].messages,[{role:'user',content:'Explain fractions'}]);assert.ok(!JSON.stringify(bodies).includes('PRIVATE_APP_CANARY'));
});
test('keyboard Enter sends, while Shift+Enter and composition preserve typing',async()=>{
 let calls=0;const s=setup(async()=>{calls++;return response('Answer')});const input=s.node('ai-input');input.value='Study help';let prevented=0;const event={key:'Enter',preventDefault(){prevented++}};input.listeners.keydown({...event,shiftKey:true});input.listeners.keydown({...event,isComposing:true});assert.equal(calls,0);input.listeners.keydown(event);await new Promise(r=>setImmediate(r));assert.equal(calls,1);assert.equal(prevented,1);assert.equal(input.focused,true);
});
test('assistant open/close updates expanded state and Escape returns focus to the launcher',()=>{
 const s=setup(async()=>response('Answer'));s.node('ai-chat-panel').hidden=true;s.ctx.toggleAI();assert.equal(s.node('ai-chat-panel').hidden,false);assert.equal(s.node('ai-fab').attrs['aria-expanded'],'true');assert.equal(s.node('ai-input').focused,true);let handled=0;s.node('ai-chat-panel').listeners.keydown({key:'Escape',preventDefault(){handled++},stopPropagation(){handled++}});assert.equal(handled,2);assert.equal(s.node('ai-chat-panel').hidden,true);assert.equal(s.node('ai-fab').focused,true);assert.equal(s.node('ai-fab').attrs['aria-expanded'],'false');
});
test('completed response has one full announcement; partial typing is not announced',async()=>{
 const s=setup(async()=>response('An answer long enough to reveal across several animation frames.'),{reduced:false});const pending=s.ctx.sendAIMessage('Question');await new Promise(r=>setTimeout(r,5));assert.equal(s.node('ai-announcement').textContent,'');s.ctx.stopAIResponse();await pending;assert.match(s.node('ai-announcement').textContent,/Response stopped/);
 const reduced=setup(async()=>response('Full answer'),{reduced:true});await reduced.ctx.sendAIMessage('Question');assert.equal(reduced.node('ai-announcement').textContent,'Ruhuka assistant: Full answer');assert.equal(reduced.messages().at(-1),'Full answer');
});

test('lazy-loaded chat initialises after the page has already loaded',async()=>{const s=setup(async()=>response('Answer'),{readyState:'complete'});assert.equal(s.messages().length,1);assert.ok(s.node('ai-input').listeners.keydown);await s.ctx.sendAIMessage('Hello');assert.equal(s.messages().at(-1),'Answer');});
