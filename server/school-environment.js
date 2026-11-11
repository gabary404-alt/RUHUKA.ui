'use strict';

const productionUrl = 'https://jsqiqxflgokfdooogcst.supabase.co';
const productionKey = 'sb_publishable_CUCKjIg3vkVLk2qKQsjcKQ_Bs0MlfSf';

function schoolBackend(env) {
  if (env.VERCEL_ENV === 'production') return { url: productionUrl, key: productionKey };
  if (env.VERCEL_ENV !== 'preview') return null;

  const url = env.RUHUKA_TEST_SUPABASE_URL;
  const key = env.RUHUKA_TEST_SUPABASE_PUBLISHABLE_KEY;
  if (!/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(url || '') || url === productionUrl) return null;
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key || '') || key === productionKey) return null;
  return { url, key };
}

module.exports = { schoolBackend };
