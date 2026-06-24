import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || 'https://wktdyicxgstokaizyhmw.supabase.co') as string;
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_mhoi-jzztVfFQjKL6-cK6Q_aPVzi56g') as string;

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce',
    },
});
