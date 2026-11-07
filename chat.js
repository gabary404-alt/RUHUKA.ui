/* Frontend chat. The existing endpoint returns JSON; text is progressively
   revealed after it arrives. This is not provider token streaming or web search. */
(function (root) {
  'use strict';
  const HELP = {
    attendance: 'Sign in, open Attendance and choose your class and date. Mark each student, review the totals, then confirm. Only a Discipline Officer can correct a submitted main register.',
    results: 'Students can open My records for the information already recorded by the school. Missing results mean Not recorded. Full result uploads and ranking views are still being completed.',
    absence: 'Contact the Discipline Office about an absence. Online student absence submissions are postponed. A Discipline Officer can correct the main attendance record with a reason.',
    account: 'Use your assigned school email to sign in. Complete school-managed account setup and recovery are still being built; contact the school administrator if you cannot sign in. Never share passwords or setup codes here.',
    general: 'I can explain Ruhuka and help with general learning questions when the AI service is available. Local help covers attendance, results, absence explanations and account setup. I cannot read private student records, export records, or verify current news.'
  };
  function localHelp(message) {
    if (/\b(attendance|register)\b/i.test(message)) return HELP.attendance;
    if (/\b(results?|rankings?|marks?|discipline)\b/i.test(message)) return HELP.results;
    if (/\b(absence|absent|justif\w*|excuse\w*)\b/i.test(message)) return HELP.absence;
    if (/\b(account|password|login|sign.?in|code)\b/i.test(message)) return HELP.account;
    return HELP.general;
  }
  function extractReply(data) {
    const reply = data?.choices?.[0]?.message?.content ?? data?.message?.content ?? data?.response;
    if (typeof reply !== 'string' || !reply.trim()) throw new Error('Invalid reply');
    return reply.trim().slice(0, 16000);
  }
  // Export only pure helpers for dependency-free Node tests.
  if (typeof module !== 'undefined' && module.exports) module.exports = { localHelp, extractReply };
  if (!root.document) return;

  const byId = id => document.getElementById(id);
  let active = null;
  let history = [];
  let lastQuestion = '';
  const requestTimeout = 45000;
  function setStatus(text) { byId('ai-status').textContent = text; }
  function announce(text) { byId('ai-announcement').textContent = text; }
  function busy(value) {
    byId('ai-send').disabled = value;
    byId('ai-stop').hidden = !value;
    byId('ai-messages').setAttribute('aria-busy', String(value));
  }
  function append(text, role) {
    const node = document.createElement('div');
    node.className = 'ai-message ai-message-' + role;
    node.setAttribute('role','article');node.setAttribute('aria-label',role==='user'?'Your message':'Ruhuka assistant message');
    // Model output is text, never trusted HTML, scripts, or executable links.
    node.textContent = text;
    byId('ai-messages').appendChild(node);
    scroll(true);
    return node;
  }
  function scroll(force) {
    const list = byId('ai-messages');
    if (force || list.scrollHeight - list.scrollTop - list.clientHeight < 120) list.scrollTop = list.scrollHeight;
  }
  function waiting() {
    const node = append('', 'assistant');
    node.classList.add('ai-waiting');
    node.setAttribute('aria-label', 'Preparing a response');
    for (let i = 0; i < 3; i++) node.appendChild(document.createElement('span'));
    return node;
  }
  function release(run) {
    clearTimeout(run.timeout);
    clearTimeout(run.tick);
    if (active !== run) return;
    active = null;
    busy(false);
  }
  function reveal(run, text) {
    return new Promise(resolve => {
      run.finishReveal = resolve;
      run.node.textContent = '';
      run.node.classList.remove('ai-waiting');
      run.node.removeAttribute('aria-label');
      const chars = Array.from(text);
      const reduced = root.matchMedia && root.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const step = Math.max(2, Math.ceil(chars.length / 160));
      let offset = 0;
      function next() {
        if (active !== run) return resolve(false);
        offset = reduced ? chars.length : Math.min(chars.length, offset + step);
        run.node.textContent = chars.slice(0, offset).join('');
        scroll(false);
        if (offset >= chars.length) return resolve(true);
        run.tick = setTimeout(next, 20);
      }
      next();
    });
  }
  root.toggleAI = function () {
    const panel = byId('ai-chat-panel');
    const open = panel.hidden;
    panel.hidden = !open;
    byId('ai-fab').hidden = open;
    byId('ai-fab').setAttribute('aria-expanded', String(open));
    if (open) byId('ai-input').focus();
    else byId('ai-fab').focus();
  };
  root.checkAIVisibility = function () {
    const host = byId('ai-assistant');
    if (host) host.style.display = 'block';
  };
  root.stopAIResponse = function () {
    const run = active;
    if (!run) return;
    run.controller.abort();
    run.node.classList.remove('ai-waiting');
    run.node.removeAttribute('aria-label');
    run.node.textContent = (run.node.textContent || '') + '\n[Stopped]';
    // A partial/stopped reply is not added to future model context.
    release(run);
    if (run.finishReveal) run.finishReveal(false);
    setStatus('Stopped. You can ask another question.');announce('Response stopped. The partial response remains in the conversation.');
    byId('ai-input').focus();
  };
  root.clearAIConversation = function (quiet) {
    root.stopAIResponse();
    history = [];
    lastQuestion = '';
    byId('ai-messages').replaceChildren();
    append('Hello! Ask about RUHUKA or a learning topic. I cannot access private records or check live web sources.', 'assistant');
    byId('ai-retry').hidden = true;
    byId('ai-input').value = '';
    setStatus('Ready');announce(quiet?'':'New chat. Previous conversation cleared.');
    if (!quiet) byId('ai-input').focus();
  };
  root.sendAIMessage = async function (suggestion) {
    if (active) return;
    const input = byId('ai-input');
    const message = (typeof suggestion === 'string' ? suggestion : input.value).trim();
    if (!message) return;
    if (message.length > 2000) { setStatus('Please keep your question under 2,000 characters.'); return; }
    lastQuestion = message;
    append(message, 'user');
    input.value = '';
    byId('ai-retry').hidden = true;
    const run = { controller: new AbortController(), node: waiting(), timeout: null, tick: null, timedOut: false };
    active = run;
    busy(true);announce('');input.focus();
    setStatus('Preparing a response…');
    let reply;
    let online = false;
    try {
      if (!AI_CONFIG.USE_API || root.navigator.onLine === false) {
        reply = localHelp(message);
        setStatus('Local help — AI service unavailable');
      } else {
        run.timeout = setTimeout(() => { run.timedOut = true; run.controller.abort(); }, requestTimeout);
        const response = await fetch(AI_CONFIG.API_URL, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: run.controller.signal,
          body: JSON.stringify({messages:(()=>{const messages=[...history,{role:'user',content:message}];while(messages.length>1&&(messages.length>13||messages.reduce((n,m)=>n+m.content.length,0)>24000))messages.splice(0,2);return messages;})()})
        });
        if (!response.ok) throw new Error('AI unavailable');
        reply = extractReply(await response.json());
        clearTimeout(run.timeout);
        online = true;
      }
    } catch (error) {
      if (active !== run) return;
      clearTimeout(run.timeout);
      reply = (run.timedOut ? 'The AI took too long to respond. ' : 'The AI service is unavailable right now. ') + 'Here is local help instead:\n\n' + localHelp(message);
      byId('ai-retry').hidden = false;
    }
    if (active !== run) return;
    setStatus(online ? 'Writing response…' : 'Showing local help…');
    try {
      const complete = await reveal(run, reply);
      if (complete && active === run) {
        if (online) history = [...history, { role: 'user', content: message }, { role: 'assistant', content: reply }].slice(-12);
        setStatus(online ? 'Response complete · Current facts are not verified' : 'Local help · AI service unavailable');
        announce((online?'Ruhuka assistant: ':'Local help: ')+reply);
      }
    } finally { release(run); }
  };
  root.retryAIMessage = function () { if (lastQuestion) root.sendAIMessage(lastQuestion); };
  function initialiseChat() {
    byId('ai-input').addEventListener('keydown', event => {
      if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
        event.preventDefault(); root.sendAIMessage();
      }
    });
    byId('ai-chat-panel').addEventListener('keydown', event => {
      if (event.key === 'Escape'&&!byId('ai-chat-panel').hidden) {event.preventDefault();event.stopPropagation();root.toggleAI();}
    });
    root.clearAIConversation(true);
  }
  if(document.readyState==='loading'||!document.readyState)document.addEventListener('DOMContentLoaded',initialiseChat);else initialiseChat();
})(typeof window === 'undefined' ? globalThis : window);
