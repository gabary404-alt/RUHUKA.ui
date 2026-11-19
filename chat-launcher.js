/* Shared launcher for every published LDK page. The chat engine loads on demand. */
(function () {
  'use strict';
  if (document.getElementById('ai-assistant')) return;

  const base = document.currentScript.src;
  const asset = path => new URL(path, base).href;
  window.AI_CONFIG = { USE_API: true, API_URL: '/api/chat' };

  document.body.insertAdjacentHTML('beforeend', `<div id="ai-assistant">
  <section id="ai-chat-panel" hidden role="region" aria-labelledby="ai-title">
    <header class="ai-header">
      <div class="ai-avatar" aria-hidden="true"><img src="${asset('assets/ldk-crest.png')}" width="38" height="38" alt=""></div>
      <div class="ai-heading"><h2 id="ai-title">LDK’s AI assistant</h2><p>School help &amp; everyday learning</p></div>
      <button type="button" class="ai-icon-button" onclick="toggleAI()" aria-label="Close assistant">Close</button>
    </header>
    <div class="ai-toolbar"><span>School help & learning</span><button onclick="clearAIConversation()">New chat</button></div>
    <div id="ai-messages" role="log" aria-label="Chat messages" aria-live="off" aria-busy="false" tabindex="0"></div>
    <p id="ai-announcement" class="ai-sr-only" role="status" aria-live="polite" aria-atomic="true"></p>
    <div class="ai-suggestions" aria-label="Suggested questions">
      <button onclick="sendAIMessage('How do I take attendance?')">Attendance help</button>
      <button onclick="sendAIMessage('Explain how to study effectively.')">Study tips</button>
    </div>
    <div class="ai-progress"><span id="ai-status" role="status" aria-live="polite">Ready</span><button id="ai-retry" hidden onclick="retryAIMessage()">Try again</button></div>
    <div class="ai-composer">
      <label class="ai-sr-only" for="ai-input">Your question</label>
      <textarea id="ai-input" aria-describedby="ai-privacy-note" rows="2" maxlength="2000" placeholder="Ask a question…"></textarea>
      <button id="ai-send" onclick="sendAIMessage()" aria-label="Send message">Send</button>
      <button id="ai-stop" hidden onclick="stopAIResponse()" aria-label="Stop response">Stop</button>
    </div>
    <p id="ai-privacy-note" class="ai-disclaimer">Only your conversation text is sent to the AI provider. No access to private school records. Live web lookup is not connected. Don’t share passwords or private details.</p>
  </section>
  <p id="ai-load-status" role="status"></p>
  <button id="ai-fab" aria-label="Open LDK’s AI assistant" aria-controls="ai-chat-panel" aria-expanded="false">Ask LDK</button>
</div>`);
  document.body.classList.add('ldk-chat-page');
  const button = document.getElementById('ai-fab');
  const status = document.getElementById('ai-load-status');

  function loadChat() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = asset('chat.js');
      script.onload = () => {
        if (typeof window.toggleAI === 'function') resolve();
        else script.onerror();
      };
      script.onerror = () => {
        script.remove();
        reject(new Error('Could not load the assistant.'));
      };
      document.body.append(script);
    });
  }

  button.addEventListener('click', async () => {
    if (button.disabled) return;
    button.disabled = true;
    status.textContent = '';
    try {
      if (typeof window.toggleAI !== 'function') await loadChat();
      button.disabled = false;
      window.toggleAI();
    } catch {
      status.textContent = 'The assistant could not load. Check your connection and try again.';
    } finally {
      button.disabled = false;
    }
  });
})();
