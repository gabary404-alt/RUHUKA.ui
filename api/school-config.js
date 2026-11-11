// This endpoint exposes only browser-safe Supabase settings.
const { schoolBackend } = require('../server/school-environment.js');

function schoolConfig(env) {
  const backend = schoolBackend(env);
  return backend && { ...backend, testWorkspace: env.VERCEL_ENV === 'preview', emailRecoveryEnabled: false, staffInvitesEnabled: false };
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
