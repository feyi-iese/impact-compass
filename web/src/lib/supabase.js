import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = () =>
  Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      typeof supabaseUrl === 'string' &&
      supabaseUrl.startsWith('http')
  );

export const supabase = isSupabaseConfigured()
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Data Access Layer

export const signUpForWaitlist = async (email) => {
  if (!supabase) {
    throw new Error(
      'Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'
    );
  }
  // No .select() — RLS denies SELECT on waitlist for anon; returning rows would fail the whole request.
  const { error } = await supabase.from('waitlist').insert([{ email }]);

  if (error) throw error;
  return true;
};

/** Home page organizer form → org_interests (RLS: insert-only for anon). */
export const submitOrgInterest = async ({ name, email, cause }) => {
  if (!supabase) {
    return { skipped: true };
  }
  const { error } = await supabase.from('org_interests').insert([
    {
      organization_name: name,
      email: email?.trim(),
      cause,
    },
  ]);
  if (error) throw error;
  return { ok: true };
};

/** Anonymous onboarding: persists preferences server-side (RLS: insert-only for anon). */
export const submitOnboardingPreferences = async ({
  zipCode,
  causes = [],
  skills = [],
  email = '',
}) => {
  if (!supabase) {
    return { skipped: true };
  }
  const row = {
    zip_code: zipCode,
    causes: causes.length ? causes : null,
    skills: skills.length ? skills : null,
    email: email?.trim() || null,
  };
  const { error } = await supabase.from('onboarding_submissions').insert([row]);
  if (error) throw error;
  return { ok: true };
};

/** Active opportunities from DB, or null if unconfigured / error should fallback. */
export const fetchOpportunities = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('status', 'active')
    .order('date_time', { ascending: true });

  if (error) throw error;
  return data ?? [];
};

export const fetchOpportunityById = async (id) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('opportunities')
    .select('*')
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  return data;
};
