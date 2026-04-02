import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const SITE_URL = import.meta.env.VITE_SITE_URL || window.location.origin;

export const isSupabaseConfigured = () =>
  Boolean(
    supabaseUrl &&
      supabaseAnonKey &&
      typeof supabaseUrl === 'string' &&
      supabaseUrl.startsWith('http')
  );

const getSupabaseClient = () => {
  if (!isSupabaseConfigured()) return null;
  if (!globalThis.__impactCompassSupabase) {
    globalThis.__impactCompassSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  }
  return globalThis.__impactCompassSupabase;
};

if (isSupabaseConfigured()) {
  const sanitizedUrl = supabaseUrl?.slice(0, 15) + '...';
  console.log('Supabase initialized with URL:', sanitizedUrl);
}

export const supabase = getSupabaseClient();

const PUBLIC_EVENT_SELECT =
  'id,title,description,cause_domain,date_time,end_time,duration_minutes,location_address,capacity,requirements,status,organization_id,organizer_user_id,organizations(name),imported_organizer_name,contact_phone,contact_email,contact_website';

const normalizeEventRow = (row, { fallbackVerified = false } = {}) => {
  if (!row) return null;

  const capacity = Number(row.capacity) || 0;
  const signupCount = Number(row.signup_count) || 0;
  const organizerName =
    row.organizations?.name ||
    row.organizations?.[0]?.name ||
    row.imported_organizer_name ||
    'Community Organizer';
  const organizerVerified =
    typeof row.organizer_verified === 'boolean'
      ? row.organizer_verified
      : Boolean(row.organizations?.name || row.organizations?.[0]?.name || fallbackVerified);

  return {
    id: String(row.id),
    title: row.title,
    description: row.description,
    cause_domain: row.cause_domain,
    organizer_name: organizerName,
    organizer_verified: organizerVerified,
    date_time: row.date_time,
    end_time: row.end_time || null,
    duration_minutes: row.duration_minutes,
    location_address: row.location_address,
    capacity,
    requirements: row.requirements,
    status: row.status,
    spots_left:
      typeof row.spots_left === 'number'
        ? row.spots_left
        : Math.max(capacity - signupCount, 0),
    organization_id: row.organization_id || null,
    organizer_user_id: row.organizer_user_id || null,
    contact_phone: row.contact_phone || null,
    contact_email: row.contact_email || null,
    contact_website: row.contact_website || null,
  };
};

const clearPendingOrganizerIntent = () => {
  if (typeof window === 'undefined') return;
  if (window.localStorage.getItem('pending_role') === 'organizer') {
    window.localStorage.removeItem('pending_role');
  }
};

/**
 * RAW fetch diagnostic — bypasses Supabase-JS library entirely.
 * If this works, then the Supabase-JS client is being over-zealous with its abort signals.
 */
export const checkSupabaseRawFetch = async () => {
  if (!supabaseUrl || !supabaseAnonKey) return { ok: false, error: 'Config missing' };
  try {
    const url = `${supabaseUrl}/rest/v1/profiles?select=id&limit=1`;
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });
    if (!response.ok) return { ok: false, error: `HTTP ${response.status}` };
    return { ok: true };
  } catch (err) {
    return { ok: false, error: `RAW FETCH ERROR: ${err.message || 'Unknown'}` };
  }
};

export const fetchOpportunitiesRaw = async ({ offset = 0, limit = 24 } = {}) => {
  const rawLimit = limit + 1;
  const url = `${supabaseUrl}/rest/v1/events?select=${encodeURIComponent(PUBLIC_EVENT_SELECT)}&status=eq.active&order=date_time.asc&limit=${rawLimit}&offset=${offset}`;
  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    const page = data ?? [];
    const hasMore = page.length > limit;
    return {
      items: page.slice(0, limit).map((row) => normalizeEventRow(row)),
      hasMore,
      nextOffset: offset + Math.min(page.length, limit),
    };
  } catch (err) {
    console.error('fetchOpportunitiesRaw error:', err);
    throw err;
  }
};

export const fetchOpportunityByIdRaw = async (id) => {
  const cleanId = id?.trim(); // Defensive trim
  try {
    const columns = 'id,title,description,cause_domain,date_time,duration_minutes,location_address,capacity,requirements,status,contact_phone,contact_email,contact_website';
    const url = `${supabaseUrl}/rest/v1/events?id=eq.${cleanId}&select=${columns}`;
    console.log('fetchOpportunityByIdRaw: Attempting fetch with restricted columns for ID:', cleanId);
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
        console.error('fetchOpportunityByIdRaw: HTTP error', response.status);
        throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    console.log('fetchOpportunityByIdRaw: Data received count:', data?.length || 0);
    
    if (!data || !data.length) {
        console.warn('fetchOpportunityByIdRaw: No event found with ID:', cleanId);
        return null;
    }
    
    const row = data[0];
    return normalizeEventRow(row);
  } catch (err) {
    console.error('fetchOpportunityByIdRaw error:', err);
    throw err;
  }
};

export const getEventSignupCountRaw = async (eventId) => {
  const url = `${supabaseUrl}/rest/v1/event_signups?event_id=eq.${eventId}&status=eq.registered&select=count`;
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
        'Range-Unit': 'items',
        'Prefer': 'count=exact'
      }
    });
    const range = response.headers.get('content-range');
    if (range) return parseInt(range.split('/')[1]);
    return 0;
  } catch (err) {
    console.error('getEventSignupCountRaw error:', err);
    return 0;
  }
};

const isMissingRpcError = (message = '') =>
  message.includes('Could not find the function') ||
  message.includes('does not exist') ||
  message.includes('PGRST');

const callRpcRaw = async ({ fnName, session, body }) => {
  const url = `${supabaseUrl}/rest/v1/rpc/${fnName}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(errorBody?.message || errorBody?.hint || `HTTP ${response.status}`);
  }

  return response.json();
};

export const getMySignupForEventRaw = async (eventId) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  const url = `${supabaseUrl}/rest/v1/event_signups?event_id=eq.${eventId}&volunteer_user_id=eq.${session.user.id}&select=*`;
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    const data = await response.json();
    return data[0] || null;
  } catch (err) {
    console.error('getMySignupForEventRaw error:', err);
    return null;
  }
};

export const signupForEventRaw = async (eventId) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  try {
    return await callRpcRaw({
      fnName: 'register_for_event',
      session,
      body: { target_event_id: eventId },
    });
  } catch (err) {
    if (!isMissingRpcError(err.message || '')) {
      console.error('signupForEventRaw rpc error:', err);
      throw err;
    }
  }

  const url = `${supabaseUrl}/rest/v1/event_signups`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation,resolution=merge-duplicates'
      },
      body: JSON.stringify({
        event_id: eventId,
        volunteer_user_id: session.user.id,
        status: 'registered'
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (err) {
    console.error('signupForEventRaw error:', err);
    throw err;
  }
};

export const cancelSignupRaw = async (eventId) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Not authenticated');

  try {
    return await callRpcRaw({
      fnName: 'cancel_event_signup',
      session,
      body: { target_event_id: eventId },
    });
  } catch (err) {
    if (!isMissingRpcError(err.message || '')) {
      console.error('cancelSignupRaw rpc error:', err);
      throw err;
    }
  }

  const url = `${supabaseUrl}/rest/v1/event_signups?event_id=eq.${eventId}&volunteer_user_id=eq.${session.user.id}`;
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status: 'cancelled' })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return true;
  } catch (err) {
    console.error('cancelSignupRaw error:', err);
    throw err;
  }
};

export const getMyVolunteerSignupsRaw = async () => {
  const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  if (!session) return [];

  // 1. Get the signup records themselves
  const url = `${supabaseUrl}/rest/v1/event_signups?volunteer_user_id=eq.${session.user.id}&select=*&order=created_at.desc`;
  console.log('getMyVolunteerSignupsRaw: Fetching signups for user', session.user.id);
  
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const signups = await response.json();
    console.log('getMyVolunteerSignupsRaw: Found signups count:', signups.length);

    if (!signups.length) return [];

    // 2. FOR EACH SIGNUP, FETCH THE EVENT DETAILS (in parallel)
    // This avoids the 'events(*)' RLS join issue
    const richSignups = await Promise.all(
      signups.map(async (signup) => {
        try {
          const event = await fetchOpportunityByIdRaw(signup.event_id).catch(() => null);
          return {
            ...signup,
            events: event, // PLURAL for dashboard compatibility
            event: event,
            date_time: event?.date_time
          };
        } catch {
          console.warn('Could not fetch event detail for signup', signup.id);
          return signup;
        }
      })
    );

    return richSignups;
  } catch (err) {
    console.error('getMyVolunteerSignupsRaw error:', err);
    return [];
  }
};

export const getMyOrganizationRaw = async () => {
  const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  if (!session) return null;

  const url = `${supabaseUrl}/rest/v1/organizations?owner_user_id=eq.${session.user.id}&select=*`;
  try {
    const response = await fetch(url, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    const data = await response.json();
    return data[0] || null;
  } catch (err) {
    console.error('getMyOrganizationRaw error:', err);
    return null;
  }
};

export const ensureOrganizationRaw = async ({ name, focusAreas = [], phone = '', description = '' }) => {
  const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  if (!session) throw new Error('Not authenticated');

  const existing = await getMyOrganizationRaw();
  if (existing) return existing;

  const url = `${supabaseUrl}/rest/v1/organizations`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        owner_user_id: session.user.id,
        name,
        focus_areas: focusAreas,
        phone: phone || null,
        description: description || null,
        contact_email: session.user.email || null
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    
    // Update profile role
    await upsertMyProfile({ role: 'organizer', organization_id: data[0].id });
    clearPendingOrganizerIntent();
    return data[0];
  } catch (err) {
    console.error('ensureOrganizationRaw error:', err);
    throw err;
  }
};

export const updateMyOrganizationRaw = async (updates) => {
  const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  if (!session) throw new Error('Not authenticated');

  const existing = await getMyOrganizationRaw();
  if (!existing) throw new Error('Organization not found');

  const url = `${supabaseUrl}/rest/v1/organizations?id=eq.${existing.id}`;
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({
        name: updates.name,
        focus_areas: updates.focusAreas,
        phone: updates.phone || null,
        description: updates.description || null,
        contact_email: updates.contactEmail || null
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data[0];
  } catch (err) {
    console.error('updateMyOrganizationRaw error:', err);
    throw err;
  }
};

export const createEventRaw = async (eventInput) => {
  const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  if (!session) throw new Error('Not authenticated');

  const org = await getMyOrganizationRaw();
  if (!org) throw new Error('Organization profile is required');

  const body = {
    organization_id: org.id,
    organizer_user_id: session.user.id,
    title: eventInput.title,
    description: eventInput.description,
    cause_domain: eventInput.cause_domain,
    location_address: eventInput.location_address,
    date_time: eventInput.date_time,
    end_time: eventInput.end_time || null,
    duration_minutes: eventInput.duration_minutes,
    capacity: eventInput.capacity,
    frequency: eventInput.frequency || null,
    requirements: eventInput.requirements || null,
    status: eventInput.status || 'active'
  };

  // Add metadata fields only if present (to avoid 400 if columns don't exist yet)
  if (eventInput.skills_needed && eventInput.skills_needed.length > 0) {
    body.skills_needed = eventInput.skills_needed;
  }
  if (eventInput.event_category) {
    body.event_category = eventInput.event_category;
  }

  const url = `${supabaseUrl}/rest/v1/events`;
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(body)
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('createEventRaw error details:', errorBody);
      throw new Error(`HTTP ${response.status}: ${errorBody.message || 'Unknown error'}`);
    }
    const data = await response.json();
    return data[0];
  } catch (err) {
    console.error('createEventRaw error:', err);
    throw err;
  }
};

export const updateEventRaw = async (eventId, updates) => {
  const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  if (!session) throw new Error('Not authenticated');

  const url = `${supabaseUrl}/rest/v1/events?id=eq.${eventId}`;
  try {
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(updates)
    });
    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      console.error('updateEventRaw error details:', errorBody);
      throw new Error(`HTTP ${response.status}: ${errorBody.message || 'Unknown error'}`);
    }
    const data = await response.json();
    return data[0];
  } catch (err) {
    console.error('updateEventRaw error:', err);
    throw err;
  }
};

export const getOrganizerEventMetricsRaw = async () => {
  const { data: { session } } = await supabase.auth.getSession().catch(() => ({ data: { session: null } }));
  if (!session) return [];

  // 1. Get organizer's events
  const eventsUrl = `${supabaseUrl}/rest/v1/events?organizer_user_id=eq.${session.user.id}&order=date_time.asc`;
  try {
    const evResp = await fetch(eventsUrl, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${session.access_token}`
      }
    });
    const events = await evResp.json();

    // 2. Map and fetch signup counts in parallel
    return await Promise.all(
      events.map(async (event) => {
        const signupCount = await getEventSignupCountRaw(event.id);
        return {
          ...event,
          signup_count: signupCount,
          spots_left: Math.max(event.capacity - signupCount, 0)
        };
      })
    );
  } catch (err) {
    console.error('getOrganizerEventMetricsRaw error:', err);
    return [];
  }
};

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

export const submitExpandedOrgInterest = async ({
  name,
  email,
  cause,
  phone,
  description,
}) => {
  if (!supabase) return { skipped: true };
  const { error } = await supabase.from('org_interests').insert([
    {
      organization_name: name,
      email: email?.trim(),
      cause,
      phone: phone?.trim() || null,
      description: description?.trim() || null,
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
export const fetchOpportunities = async ({ offset = 0, limit = 24 } = {}) => {
  if (!supabase) return null;
  const end = offset + limit;
  const { data, error } = await supabase
    .from('events')
    .select(PUBLIC_EVENT_SELECT)
    .eq('status', 'active')
    .order('date_time', { ascending: true })
    .range(offset, end);

  if (error) {
    console.error('fetchOpportunities error:', error.message, error.details, error.hint);
    throw error;
  }
  
  if (!data || data.length === 0) {
    console.log('No active events found in DB.');
  }

  const page = data ?? [];
  const hasMore = page.length > limit;
  return {
    items: page.slice(0, limit).map((row) => normalizeEventRow(row)),
    hasMore,
    nextOffset: offset + Math.min(page.length, limit),
  };
};

export const fetchOpportunityById = async (id) => {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('events')
    .select(
      'id,title,description,cause_domain,date_time,end_time,duration_minutes,location_address,capacity,requirements,status,organization_id,organizer_user_id,organizations(name),imported_organizer_name,contact_phone,contact_email,contact_website'
    )
    .eq('id', id)
    .eq('status', 'active')
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  const signupCount = await getEventSignupCount(id).catch(() => 0);
  return normalizeEventRow({
    ...data,
    signup_count: signupCount,
  });
};

export const sendMagicLink = async ({ email }) => {
  if (!supabase) throw new Error('Supabase is not configured');
  const { error } = await supabase.auth.signInWithOtp({
    email: email?.trim(),
    options: {
      emailRedirectTo: `${SITE_URL}/auth`,
    },
  });
  if (error) throw error;
  return { ok: true };
};

export const getSession = async () => {
  if (!supabase) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
};

export const setSessionFromTokens = async ({ accessToken, refreshToken }) => {
  if (!supabase) throw new Error('Supabase is not configured');
  // Optional: check if current session already matches. Supabase setSession usually handles this.
  const { data, error } = await supabase.auth.setSession({
    access_token: accessToken,
    refresh_token: refreshToken,
  });
  if (error) {
    // If setSession fails but we already have a valid session, let it pass.
    const { data: { session } } = await supabase.auth.getSession();
    if (session) return session;
    throw error;
  }
  return data.session;
};

export const onAuthStateChange = (callback) => {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
  return supabase.auth.onAuthStateChange((_event, session) => callback(session));
};

export const signOut = async () => {
  if (!supabase) return;
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getMyProfile = async () => {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const upsertMyProfile = async (fields) => {
  if (!supabase) throw new Error('Supabase is not configured');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const payload = {
    id: user.id,
    email: user.email,
    ...fields,
  };

  const { error } = await supabase
    .from('profiles')
    .upsert(payload, { onConflict: 'id' });
  if (error) throw error;
  return { ok: true };
};

export const ensureOrganization = async ({
  name,
  focusAreas = [],
  phone = '',
  description = '',
}) => {
  if (!supabase) throw new Error('Supabase is not configured');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const { data: existing, error: readError } = await supabase
    .from('organizations')
    .select('*')
    .eq('owner_user_id', user.id)
    .maybeSingle();
  if (readError) throw readError;
  if (existing) return existing;

  const { data, error } = await supabase
    .from('organizations')
    .insert([
      {
        owner_user_id: user.id,
        name,
        focus_areas: focusAreas,
        phone: phone || null,
        description: description || null,
        contact_email: user.email || null,
      },
    ])
    .select('*')
    .single();
  if (error) throw error;

  await upsertMyProfile({ role: 'organizer', organization_id: data.id });
  clearPendingOrganizerIntent();
  return data;
};

export const getMyOrganization = async () => {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('organizations')
    .select('*')
    .eq('owner_user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const createEvent = async (eventInput) => {
  if (!supabase) throw new Error('Supabase is not configured');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  const org = await getMyOrganization();
  if (!org) throw new Error('Organization profile is required');

  const payload = {
    organization_id: org.id,
    organizer_user_id: user.id,
    title: eventInput.title,
    description: eventInput.description,
    cause_domain: eventInput.cause_domain,
    location_address: eventInput.location_address,
    date_time: eventInput.date_time,
    end_time: eventInput.end_time || null,
    duration_minutes: eventInput.duration_minutes,
    capacity: eventInput.capacity,
    frequency: eventInput.frequency || null,
    requirements: eventInput.requirements || null,
    status: eventInput.status || 'active',
  };

  const { data, error } = await supabase.from('events').insert([payload]).select('*').single();
  if (error) throw error;
  return data;
};

export const updateEvent = async (eventId, updates) => {
  if (!supabase) throw new Error('Supabase is not configured');
  const { data, error } = await supabase
    .from('events')
    .update(updates)
    .eq('id', eventId)
    .select('*')
    .single();
  if (error) throw error;
  return data;
};

export const getMyEvents = async () => {
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('organizer_user_id', user.id)
    .order('date_time', { ascending: true });
  if (error) throw error;
  return data ?? [];
};

export const signupForEvent = async (eventId) => {
  if (!supabase) throw new Error('Supabase is not configured');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  try {
    const { data, error } = await supabase.rpc('register_for_event', {
      target_event_id: eventId,
    });
    if (!error) return data;
    if (!isMissingRpcError(error.message || '')) throw error;
  } catch (error) {
    if (!isMissingRpcError(error.message || '')) throw error;
  }

  const { data, error } = await supabase
    .from('event_signups')
    .upsert([{ event_id: eventId, volunteer_user_id: user.id, status: 'registered' }], {
      onConflict: 'event_id,volunteer_user_id',
    })
    .select('*')
    .single();
  if (error) throw error;
  await scheduleReminderJobs(eventId, data.id).catch(() => {});
  return data;
};

export const cancelSignup = async (eventId) => {
  if (!supabase) throw new Error('Supabase is not configured');
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error('Authentication required');

  try {
    const { data, error } = await supabase.rpc('cancel_event_signup', {
      target_event_id: eventId,
    });
    if (!error) return data;
    if (!isMissingRpcError(error.message || '')) throw error;
  } catch (error) {
    if (!isMissingRpcError(error.message || '')) throw error;
  }

  const { error } = await supabase
    .from('event_signups')
    .update({ status: 'cancelled' })
    .eq('event_id', eventId)
    .eq('volunteer_user_id', user.id);
  if (error) throw error;
  return { ok: true };
};

export const getMyVolunteerSignups = async () => {
  if (!supabase) return [];
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from('event_signups')
    .select('id,event_id,status,created_at,events(*)')
    .eq('volunteer_user_id', user.id)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data ?? [];
};

export const getEventSignupCount = async (eventId) => {
  if (!supabase) return 0;
  const { count, error } = await supabase
    .from('event_signups')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'registered');
  if (error) throw error;
  return count ?? 0;
};

export const getMySignupForEvent = async (eventId) => {
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data, error } = await supabase
    .from('event_signups')
    .select('*')
    .eq('event_id', eventId)
    .eq('volunteer_user_id', user.id)
    .maybeSingle();
  if (error) throw error;
  return data;
};

export const scheduleReminderJobs = async (eventId, signupId) => {
  if (!supabase) return { skipped: true };
  const { data: eventRow, error: eventError } = await supabase
    .from('events')
    .select('date_time')
    .eq('id', eventId)
    .single();
  if (eventError) throw eventError;
  const eventTime = new Date(eventRow.date_time);
  const oneDay = new Date(eventTime.getTime() - 24 * 60 * 60 * 1000);
  const oneHour = new Date(eventTime.getTime() - 60 * 60 * 1000);

  const jobs = [
    { event_id: eventId, signup_id: signupId, reminder_type: '24h', send_at: oneDay.toISOString() },
    { event_id: eventId, signup_id: signupId, reminder_type: '1h', send_at: oneHour.toISOString() },
  ].filter((j) => new Date(j.send_at).getTime() > Date.now());

  if (!jobs.length) return { ok: true };
  const { error } = await supabase.from('reminder_jobs').upsert(jobs, {
    onConflict: 'signup_id,reminder_type',
  });
  if (error) throw error;
  return { ok: true };
};

export const getOrganizerEventMetrics = async () => {
  const events = await getMyEvents();
  const rows = await Promise.all(
    events.map(async (event) => {
      const signupCount = await getEventSignupCount(event.id);
      return {
        ...event,
        signup_count: signupCount,
        spots_left: Math.max(event.capacity - signupCount, 0),
      };
    })
  );
  return rows;
};
