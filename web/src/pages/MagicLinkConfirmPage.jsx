import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { verifyMagicLinkToken } from '../lib/supabase';

const MagicLinkConfirmPage = () => {
  const navigate = useNavigate();
  const searchParams = useMemo(() => new URLSearchParams(window.location.search), []);
  const tokenHash = searchParams.get('token_hash');
  const type = searchParams.get('type') || 'email';
  const next = searchParams.get('next');
  const initialError = searchParams.get('error_description');
  const [status, setStatus] = useState('idle');
  const [errorMessage, setErrorMessage] = useState(
    initialError ? decodeURIComponent(initialError) : ''
  );

  const handleConfirm = async () => {
    if (!tokenHash || status === 'loading') return;
    setStatus('loading');
    setErrorMessage('');

    if (next?.startsWith('/')) {
      window.localStorage.setItem('pending_auth_from', next);
    }

    try {
      await verifyMagicLinkToken({ tokenHash, type });
      navigate('/auth', { replace: true });
    } catch (error) {
      console.error(error);
      setStatus('error');
      setErrorMessage(
        error?.message || 'This sign-in link is no longer valid. Please request a new one.'
      );
    }
  };

  const hasRequiredParams = Boolean(tokenHash);

  return (
    <Layout>
      <section className="card-elevated" style={{ marginTop: 'var(--space-10)' }}>
        <span className="text-eyebrow">Secure Sign-In</span>
        <h1 style={{ marginBottom: 'var(--space-3)' }}>Confirm your magic link</h1>
        <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-5)' }}>
          This extra step helps prevent email scanners from consuming your one-time sign-in link
          before you use it.
        </p>

        {hasRequiredParams ? (
          <button
            className="btn btn-primary"
            type="button"
            style={{ width: '100%' }}
            onClick={handleConfirm}
            disabled={status === 'loading'}
          >
            {status === 'loading' ? 'Signing you in…' : 'Sign in'}
          </button>
        ) : (
          <p className="text-sm" role="alert" style={{ color: 'var(--color-error)' }}>
            This sign-in link is incomplete. Please request a new magic link.
          </p>
        )}

        {errorMessage && (
          <p className="text-sm" role="alert" style={{ color: 'var(--color-error)', marginTop: 'var(--space-3)' }}>
            {errorMessage}
          </p>
        )}
      </section>
    </Layout>
  );
};

export default MagicLinkConfirmPage;
