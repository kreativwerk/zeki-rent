// Publishable values — safe to ship, RLS governs all access
export const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ??
  "https://riqrpvmmesqnrjcntmtt.supabase.co";

export const SUPABASE_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
  "sb_publishable_K9Hav9z5EI9_6XvMsamnDg_JxVTxcst";
