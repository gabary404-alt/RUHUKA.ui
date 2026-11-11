const { test } = require('node:test');
const assert = require('node:assert/strict');
const handler = require('../api/school-config.js');
const { schoolConfig } = handler;

const testUrl = 'https://abcdefghijklmnopqrst.supabase.co';
const testKey = 'sb_publishable_synthetic-test-key';

test('preview school configuration is disabled unless both isolated settings are valid', () => {
  const env = {
    VERCEL_ENV: 'preview',
    RUHUKA_TEST_SUPABASE_URL: testUrl,
    RUHUKA_TEST_SUPABASE_PUBLISHABLE_KEY: testKey
  };
  const production = schoolConfig({ VERCEL_ENV: 'production' });
  for (const overrides of [
    { RUHUKA_TEST_SUPABASE_URL: production.url },
    { RUHUKA_TEST_SUPABASE_URL: production.url + '/' },
    { RUHUKA_TEST_SUPABASE_URL: 'https://api.example.test' },
    { RUHUKA_TEST_SUPABASE_PUBLISHABLE_KEY: production.key },
    { RUHUKA_TEST_SUPABASE_PUBLISHABLE_KEY: 'sb_secret_synthetic' },
    { VERCEL_ENV: undefined }
  ]) assert.equal(schoolConfig({ ...env, ...overrides }), null);
  assert.equal(schoolConfig({ VERCEL_ENV: 'preview' }), null);
  assert.deepEqual(schoolConfig(env), {
    url: testUrl, key: testKey, emailRecoveryEnabled: false, staffInvitesEnabled: false
  });
  assert.deepEqual(schoolConfig({ ...env, VERCEL_ENV: 'production' }), production);
});

test('school config does not cache or accept mutations', () => {
  const headers = {};
  let status, ended = false;
  handler({ method: 'POST' }, {
    setHeader(name, value) { headers[name] = value; },
    status(code) { status = code; return this; },
    end() { ended = true; }
  });
  assert.equal(headers['Cache-Control'], 'no-store');
  assert.equal(headers.Allow, 'GET');
  assert.equal(status, 405);
  assert.equal(ended, true);
});
