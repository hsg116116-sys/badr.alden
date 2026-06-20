import { createClient } from '@supabase/supabase-js';

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || '') as string;
const supabaseKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || '') as string;

if (!supabaseUrl || !supabaseKey) {
    console.warn("⚠️ Supabase URL or Key is missing! Auth features will not work.");
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        detectSessionInUrl: true,
        persistSession: true,
        autoRefreshToken: true,
        flowType: 'pkce',
    },
});
