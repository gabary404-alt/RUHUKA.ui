const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createElement(tag) {
  return {
    tag,
    children: [],
    append(...children) { this.children.push(...children); },
    setAttribute() {},
    removeAttribute(name) { delete this[name]; },
    replaceChildren() { this.children = []; },
    focus() {},
    select() {},
  };
}

function descendants(node) {
  return [node, ...node.children.flatMap(descendants)];
}

test('Headmaster can review, create and email a private staff invitation', async () => {
  const context = {
    document: { createElement },
    RUHUKA_CONFIG: { staffInvitesEnabled: true },
    location: { origin: 'https://portal.example.test' },
    URL,
  };
  vm.runInNewContext(fs.readFileSync('connected/staff-accounts.js', 'utf8'), context);
  const host = createElement('main');
  const setupUrl = context.location.origin + '/connected/account.html#type=invite&token_hash=fixture';
  const requests = [];
  const panel = context.mountStaffAccounts(host, async (path, options) => {
    if (path.endsWith('staff_directory')) return [];
    assert.equal(path, '/functions/v1/staff-accounts');
    requests.push(JSON.parse(options.body));
    return { setup_url: setupUrl, message: 'Setup link created' };
  }, () => true);
  await panel.ready;

  const elements = descendants(host);
  const invite = elements.find(node => node.tag === 'details');
  assert.equal(invite.open, true);
  const form = elements.find(node => node.tag === 'form');
  const review = elements.find(node => node.textContent === 'Review invitation');
  const send = elements.find(node => node.textContent === 'Send invite by email');
  const result = elements.find(node => node.children.includes(send));
  assert.equal(result.hidden, true);
  elements.find(node => node.type === 'text').value = 'Test Teacher';
  elements.find(node => node.type === 'email').value = 'teacher@example.test';
  elements.find(node => node.tag === 'select').value = 'teacher';
  const event = { preventDefault() {} };

  await form.onsubmit(event);
  assert.equal(review.textContent, 'Create setup link');
  assert.deepEqual(requests, []);
  await form.onsubmit(event);

  assert.deepEqual(requests, [{
    action: 'invite_link',
    email: 'teacher@example.test',
    display_name: 'Test Teacher',
    roles: ['teacher'],
  }]);
  assert.equal(result.hidden, false);
  const draft = new URL(send.href);
  assert.equal(draft.protocol, 'mailto:');
  assert.equal(decodeURIComponent(draft.pathname), 'teacher@example.test');
  assert.ok(draft.searchParams.get('body').includes(setupUrl));

  form.oninput();
  assert.equal(result.hidden, true);
  assert.equal(send.href, undefined);
});
