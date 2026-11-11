// This endpoint exposes only browser-safe Supabase settings.
const productionUrl = 'https://jsqiqxflgokfdooogcst.supabase.co';
const productionKey = 'sb_publishable_CUCKjIg3vkVLk2qKQsjcKQ_Bs0MlfSf';

function schoolConfig(env) {
  if (env.VERCEL_ENV === 'production') {
    return { url: productionUrl, key: productionKey, emailRecoveryEnabled: false, staffInvitesEnabled: false };
  }
  if (env.VERCEL_ENV !== 'preview') return null;

  const url = env.RUHUKA_TEST_SUPABASE_URL;
  const key = env.RUHUKA_TEST_SUPABASE_PUBLISHABLE_KEY;
  if (!/^https:\/\/[a-z0-9]{20}\.supabase\.co$/.test(url || '') || url === productionUrl) return null;
  if (!/^sb_publishable_[A-Za-z0-9_-]+$/.test(key || '') || key === productionKey) return null;
  return { url, key, emailRecoveryEnabled: false, staffInvitesEnabled: false };
}

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).end();
  }
  res.setHeader('Content-Type', 'application/javascript; charset=utf-8');
  return res.status(200).send('window.RUHUKA_CONFIG = ' + JSON.stringify(schoolConfig(process.env)) + ';');
};

module.exports.schoolConfig = schoolConfig;
