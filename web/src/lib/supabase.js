import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Data Access Layer

export const signUpForWaitlist = async (email) => {
    const { data, error } = await supabase
        .from('waitlist')
        .insert([{ email }])
        .select();

    if (error) throw error;
    return data;
};
