import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { signUpForWaitlist } from '../lib/supabase';
import { checkSubmissionRate, markSubmission } from '../lib/antiAbuse';
import './LandingPage.css';

const LandingPage = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');
    const [website, setWebsite] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        // Honeypot: bots often fill this hidden field.
        if (website.trim()) {
            setStatus('success');
            return;
        }

        const rate = checkSubmissionRate('waitlist', { minIntervalMs: 15000, maxPerHour: 5 });
        if (rate.blocked) {
            setStatus('throttled');
            return;
        }

        setStatus('loading');
        markSubmission('waitlist');

        try {
            await signUpForWaitlist(email);
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    return (
        <Layout backTo="/" backLabel="Back to home">
            {/* Hero */}
            <section className="landing-hero">
                <div className="landing-pill animate-fade-in stagger-1">
                    <span className="landing-pill__dot" />
                    <span>Waitlist</span>
                </div>

                <h1 className="landing-headline animate-fade-in stagger-2">
                    Be the first<br />
                    to <em className="landing-headline__em">make an impact</em>
                </h1>

                <p className="landing-subhead animate-fade-in stagger-3">
                    We're launching soon. Drop your email to<br />
                    get early access when we go live.
                </p>
            </section>

            {/* CTA Card */}
            <section className="landing-cta-card card-elevated animate-fade-in stagger-4">
                {status === 'success' ? (
                    <div className="landing-success animate-scale-in">
                        <div className="landing-success__icon">
                            <CheckCircle size={28} />
                        </div>
                        <h3>You're on the list!</h3>
                        <p className="text-muted text-sm">We'll email you when spots open up.</p>
                    </div>
                ) : status === 'throttled' ? (
                    <div className="landing-form">
                        <p className="text-muted text-sm" style={{ marginBottom: 12 }}>
                            You are submitting a bit too quickly. Please wait a few seconds and try again.
                        </p>
                        <button
                            type="button"
                            className="btn btn-outline"
                            style={{ width: '100%' }}
                            onClick={() => setStatus('idle')}
                        >
                            Back
                        </button>
                    </div>
                ) : status === 'error' ? (
                    <div className="landing-form">
                        <p className="text-muted text-sm" style={{ marginBottom: 12 }}>
                            Something went wrong. We couldn't add you to the waitlist right now. Please try again shortly.
                        </p>
                        <button
                            type="button"
                            className="btn btn-outline"
                            style={{ width: '100%' }}
                            onClick={() => setStatus('idle')}
                        >
                            Dismiss
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="landing-form">
                        <div className="landing-form__header">
                            <span className="text-eyebrow">Get notified</span>
                        </div>
                        <div className="landing-form__input-group">
                            <label htmlFor="waitlist-email" className="sr-only">Email address</label>
                            <input
                                id="waitlist-email"
                                type="email"
                                placeholder="Your email address"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <input
                                type="text"
                                className="hp-field"
                                tabIndex="-1"
                                autoComplete="off"
                                value={website}
                                onChange={(e) => setWebsite(e.target.value)}
                                aria-hidden="true"
                            />
                            <button
                                type="submit"
                                className="btn btn-primary landing-form__btn"
                                disabled={status === 'loading'}
                            >
                                {status === 'loading' ? (
                                    <span className="landing-spinner" />
                                ) : (
                                    <>Join <ArrowRight size={16} /></>
                                )}
                            </button>
                        </div>
                        <p className="text-center text-soft text-xs" style={{ marginTop: 8 }}>
                            No spam, ever. We'll only email when it's time.
                        </p>
                    </form>
                )}
            </section>

            {/* Value Props */}
            <section className="landing-features">
                <div className="landing-feature animate-fade-in stagger-5">
                    <div className="landing-feature__marker" />
                    <div>
                        <h3 className="landing-feature__title">Curated, not crowded</h3>
                        <p className="landing-feature__desc">Vetted events that match your time, interests, and location.</p>
                    </div>
                </div>
                <div className="landing-feature animate-fade-in stagger-6">
                    <div className="landing-feature__marker landing-feature__marker--warm" />
                    <div>
                        <h3 className="landing-feature__title">One tap, you're in</h3>
                        <p className="landing-feature__desc">RSVP instantly. Calendar invite. Reminder the day before.</p>
                    </div>
                </div>
            </section>
        </Layout>
    );
};

export default LandingPage;
