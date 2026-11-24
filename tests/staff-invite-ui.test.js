const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

function createElement(tag) {
  return {
    tag,
    children: [],
    append(...children) {
      this.children.push(...children);
      for (const child of children) child.parent = this;
    },
    remove() { this.parent.children = this.parent.children.filter(node => node !== this); },
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

test('Headmaster can send a setup link and use a manual fallback when email is unavailable', async () => {
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
  let emailEnabled=true;
  const panel = context.mountStaffAccounts(host, async (path, options) => {
    if (path.endsWith('staff_directory')) return [];
    assert.equal(path, '/functions/v1/staff-accounts');
    const payload=JSON.parse(options.body);
    requests.push(payload);
    if(payload.action==='invite'&&emailEnabled)return {saved:true};
    if(payload.action==='invite')throw Object.assign(Error('Email disabled'),{code:'staff_email_unavailable'});
    return { saved:true, setup_url: setupUrl, message: 'Setup link created' };
  }, () => true);
  await panel.ready;

  const elements = descendants(host);
  const invite = elements.find(node => node.tag === 'details');
  assert.equal(invite.open, false);
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
  assert.equal(review.textContent, 'Send setup link');
  assert.deepEqual(requests, []);
  await form.onsubmit(event);

  assert.deepEqual(requests, [{
    action: 'invite',
    email: 'teacher@example.test',
    display_name: 'Test Teacher',
    roles: ['teacher'],
  }]);
  assert.equal(result.hidden, true);
  assert.ok(descendants(host).some(node=>node.textContent==='Setup link sent to teacher@example.test.'));

  emailEnabled=false;
  elements.find(node => node.type === 'text').value = 'Second Teacher';
  elements.find(node => node.type === 'email').value = 'second@example.test';
  form.oninput();
  await form.onsubmit(event);
  await form.onsubmit(event);
  const manual=elements.find(node=>node.textContent==='Create link manually');
  assert.equal(manual.hidden,false);
  await manual.onclick();
  assert.deepEqual(requests.map(x=>x.action),['invite','invite','invite_link']);
  assert.equal(result.hidden, false);
  const draft = new URL(send.href);
  assert.equal(draft.protocol, 'mailto:');
  assert.equal(decodeURIComponent(draft.pathname), 'second@example.test');
  assert.ok(draft.searchParams.get('body').includes(setupUrl));

  form.oninput();
  assert.equal(result.hidden, true);
  assert.equal(send.href, undefined);
});

test('staff deletion requires confirmation and removes only the chosen account', async () => {
  const context = { document: { createElement } };
  vm.runInNewContext(fs.readFileSync('connected/staff-accounts.js', 'utf8'), context);
  const host = createElement('main');
  const teacher = { id: 'teacher', display_name: 'Test Teacher', email: 'teacher@example.test', roles: ['teacher'], is_active: true, can_delete: true };
  const headmaster = { id: 'headmaster', display_name: 'Test Headmaster', roles: ['headmaster'], is_active: true };
  let directory = [teacher, headmaster];
  const deletes = [];
  const panel = context.mountStaffAccounts(host, async (path, options) => {
    if (path.endsWith('staff_directory')) return directory;
    assert.equal(path, '/rest/v1/rpc/staff_account_delete');
    deletes.push(JSON.parse(options.body));
    directory = [headmaster];
    return { deleted: true };
  }, () => true);
  await panel.ready;

  const controls = descendants(host).filter(node => node.textContent === 'Delete account');
  assert.equal(controls.length, 1);
  const [open] = controls;
  const cancel = descendants(host).find(node => node.textContent === 'Cancel');
  const confirm = descendants(host).find(node => node.textContent === 'Confirm delete');
  assert.equal(confirm.parent.hidden, true);
  open.onclick();
  assert.equal(confirm.parent.hidden, false);
  cancel.onclick();
  assert.equal(confirm.parent.hidden, true);
  assert.deepEqual(deletes, []);
  open.onclick();
  await confirm.onclick();

  assert.deepEqual(deletes, [{ target_user: teacher.id }]);
  const rendered = descendants(host).map(node => node.textContent);
  assert.ok(!rendered.includes(teacher.display_name));
  assert.ok(rendered.includes(headmaster.display_name));
  assert.ok(rendered.includes('Staff account deleted. Past school records were kept.'));
});

test('Manage staff searches, filters disabled accounts and reviews edits before saving', async () => {
  const context = { document: { createElement } };
  vm.runInNewContext(fs.readFileSync('connected/staff-accounts.js', 'utf8'), context);
  const host = createElement('main');
  const teacher = { id: 'a', display_name: 'Alice', email: 'alice@example.test', roles: ['teacher'], is_active: true, can_delete: true };
  const officer = { id: 'b', display_name: 'Bob', email: 'bob@example.test', roles: ['discipline_officer'], is_active: false, can_delete: true };
  const saved = [];
  const panel = context.mountStaffAccounts(host, async (path, options) => {
    if (path.endsWith('staff_directory')) return [teacher, officer];
    assert.match(path, /staff_account_save$/);
    saved.push(JSON.parse(options.body));
  }, () => true);
  await panel.ready;
  const nodes = descendants(host);
  const find = nodes.find(node => node.type === 'search');
  const filter = nodes.find(node => node.tag === 'select' && node.value === 'all');
  const cards = nodes.filter(node => node.tag === 'article');
  find.value = 'BOB@example.test';
  find.oninput();
  assert.equal(cards[0].hidden, true);
  assert.equal(cards[1].hidden, false);
  find.value = '';
  filter.value = 'active';
  filter.onchange();
  assert.equal(cards[0].hidden, false);
  assert.equal(cards[1].hidden, true);

  const editor = descendants(cards[0]).find(node => node.tag === 'form');
  const name = descendants(editor).find(node => node.tag === 'input' && node.value === 'Alice');
  name.value = 'Alice Smith';
  const checkboxes = descendants(editor).filter(node => node.type === 'checkbox');
  checkboxes[0].checked = false;
  checkboxes[3].checked = true;
  checkboxes[4].checked = false;
  const submit = () => editor.onsubmit({ preventDefault() {} });
  await submit();
  assert.equal(saved.length, 0);
  await submit();
  assert.deepEqual(saved, [{target_user:'a',display_name:'Alice Smith',staff_roles:['dean'],enabled:false}]);
});
