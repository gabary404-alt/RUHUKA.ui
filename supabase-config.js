// Supabase public browser configuration.
// This publishable key is safe to expose in frontend code when RLS is enabled.
const SUPABASE_URL = 'https://mmdtdovzpinytbxaroma.supabase.co';
const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_fUw5hemVKsq1j3fiAJBxRQ_rYi2AWy0';

const supabaseClient = window.supabase.createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY
);
