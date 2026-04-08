import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { sendMagicLink, setSessionFromTokens, upsertMyProfile, supabase } from '../lib/supabase';
import { useAuth } from '../context/useAuth';

const AuthPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, refreshProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('volunteer');
  const [status, setStatus] = useState('idle');
  const [authError, setAuthError] = useState('');
  const [cooldownEndsAt, setCooldownEndsAt] = useState(0);
  const [isFinishing, setIsFinishing] = useState(false);
  const from = location.state?.from || '/dashboard';
  const cooldownSeconds = useMemo(
    () => Math.max(0, Math.ceil((cooldownEndsAt - Date.now()) / 1000)),
    [cooldownEndsAt]
  );

  useEffect(() => {
    const hash = window.location.hash?.replace(/^#/, '');
    const searchParams = new URL(window.location.href).searchParams;
    const errorCode = searchParams.get('error_code');
    const errorDescription = searchParams.get('error_description');

    (async () => {
      // 1. Check if we already have a session (Supabase auto-detection might have worked)
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        setStatus('verified');
        setAuthError('');
        if (window.location.hash) {
          window.history.replaceState({}, document.title, window.location.pathname + window.location.search);
        }
        return;
      }

      // 2. If no session, process the hash manually
      if (!hash) return;

      const params = new URLSearchParams(hash);
      const hashErrorCode = params.get('error_code');
      const hashErrorDescription = params.get('error_description');
      const accessToken = params.get('access_token');
      const refreshToken = params.get('refresh_token');

      const anyErrorCode = hashErrorCode || errorCode;
      const anyErrorDescription = hashErrorDescription || errorDescription;

      if (anyErrorCode) {
        setAuthError(
          anyErrorCode === 'otp_expired'
            ? 'This link expired. Request a new magic link.'
            : decodeURIComponent(anyErrorDescription || 'Authentication failed.')
        );
        window.history.replaceState({}, document.title, '/auth');
        return;
      }

      if (accessToken && refreshToken) {
        try {
          await setSessionFromTokens({ accessToken, refreshToken });
          await refreshProfile();
          setStatus('verified');
          setAuthError('');
        } catch (error) {
          console.error(error);
          // If setting session fails, check one last time if we are actually signed in
          const { data: { session: retrySession } } = await supabase.auth.getSession();
          if (retrySession) {
            setStatus('verified');
            setAuthError('');
          } else {
            setAuthError('Could not finalize sign-in from this link. Please request a new one.');
          }
        } finally {
          window.history.replaceState({}, document.title, '/auth');
        }
      }
    })();
  }, [refreshProfile]);

  const handleMagicLink = async (e) => {
    e.preventDefault();
    if (cooldownSeconds > 0) return;
    setStatus('loading');
    setAuthError('');
    try {
      await sendMagicLink({ email });
      localStorage.setItem('pending_role', role);
      setCooldownEndsAt(Date.now() + 30_000);
      setStatus('sent');
    } catch (error) {
      console.error(error);
      setAuthError(error?.message || 'Could not send magic link. Please try again.');
      setStatus('error');
    }
  };

  const handleFinish = async () => {
    if (!user || isFinishing) return;
    setIsFinishing(true);
    const pendingRole = localStorage.getItem('pending_role') || 'volunteer';
    const pendingOnboardingRaw = localStorage.getItem('pending_onboarding');
    const pendingOnboarding = pendingOnboardingRaw ? JSON.parse(pendingOnboardingRaw) : null;
    try {
      const profileUpdates = {
        ...(pendingOnboarding
          ? {
              display_name: pendingOnboarding.displayName || null,
              zip_code: pendingOnboarding.zipCode || null,
              causes: pendingOnboarding.causes || null,
              skills: pendingOnboarding.skills || null,
              onboarding_completed: true,
            }
          : {}),
      };

      // Volunteer is the default role. Organizer role is only persisted once
      // the user completes organization setup inside the organizer flow.
      if (pendingRole === 'volunteer') {
        profileUpdates.role = 'volunteer';
      }

      if (Object.keys(profileUpdates).length > 0) {
        await upsertMyProfile(profileUpdates);
      }

      const refreshedProfile = await refreshProfile();
      if (pendingRole !== 'organizer') {
        localStorage.removeItem('pending_role');
      }
      localStorage.removeItem('pending_onboarding');
      
      // 1. Determine the logical dashboard for this user
      const userRole = refreshedProfile?.role || pendingRole;
      const roleDest = userRole === 'organizer' || pendingRole === 'organizer'
        ? '/dashboard/organizer'
        : '/dashboard/volunteer';
      
      // 2. Decide the final destination
      // We only use 'from' if it's a specific deep link (e.g. /opportunity/123).
      // If 'from' is just the default dashboard, we prefer the role-specific one.
      const isDeepLink = from && from !== '/auth' && from !== '/dashboard' && from !== '/dashboard/volunteer' && from !== '/dashboard/organizer';
      const finalDest = isDeepLink ? from : roleDest;

      navigate(finalDest, { replace: true });
    } catch (error) {
      console.error(error);
      setAuthError('Signed in, but could not finish account setup. Please try Continue again.');
    } finally {
      setIsFinishing(false);
    }
  };

  useEffect(() => {
    if (user && (status === 'verified' || status === 'sent')) {
      handleFinish();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, status]);

  return (
    <Layout>
      <section className="card-elevated" style={{ marginTop: 'var(--space-10)' }}>
        <span className="text-eyebrow">Authentication</span>
        <h1 style={{ marginBottom: 'var(--space-3)' }}>Sign in with magic link</h1>
        <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-5)' }}>
          We will send a secure link to your email. No password required.
        </p>

        {!user ? (
          <form onSubmit={handleMagicLink} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label htmlFor="auth-email" className="text-sm font-medium">Email</label>
              <input
                id="auth-email"
                type="email"
                className="input"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-1)' }}>
              <label htmlFor="auth-role" className="text-sm font-medium">I am a...</label>
              <select id="auth-role" className="input" value={role} onChange={(e) => setRole(e.target.value)}>
                <option value="volunteer">Volunteer</option>
                <option value="organizer">Organizer</option>
              </select>
            </div>
            <button className="btn btn-primary" type="submit" disabled={status === 'loading' || cooldownSeconds > 0}>
              {status === 'loading'
                ? 'Sending…'
                : cooldownSeconds > 0
                  ? `Resend in ${cooldownSeconds}s`
                  : 'Send magic link'}
            </button>
          </form>
        ) : (
          <button className="btn btn-primary" onClick={handleFinish} style={{ width: '100%' }} disabled={isFinishing}>
            {isFinishing ? 'Finishing…' : 'Continue'}
          </button>
        )}

        <div aria-live="polite">
          {status === 'sent' && (
            <p className="text-sm text-muted" style={{ marginTop: 'var(--space-3)' }}>
              Magic link sent. Open your email and return via the link.
            </p>
          )}
          {status === 'verified' && (
            <p className="text-sm text-muted" style={{ marginTop: 'var(--space-3)' }}>
              Magic link verified. Finishing sign-in…
            </p>
          )}
          {status === 'error' && (
            <p className="text-sm" role="alert" style={{ color: 'var(--color-error)', marginTop: 'var(--space-3)' }}>
              Could not send magic link. Please try again.
            </p>
          )}
          {authError && (
            <p className="text-sm" role="alert" style={{ color: 'var(--color-error)', marginTop: 'var(--space-3)' }}>
              {authError}
            </p>
          )}
        </div>
      </section>
    </Layout>
  );
};

export default AuthPage;
