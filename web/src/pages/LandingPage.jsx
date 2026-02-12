import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, ArrowLeft } from 'lucide-react';
import Layout from '../components/Layout';
import { signUpForWaitlist } from '../lib/supabase';
import './LandingPage.css';

const LandingPage = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState('idle');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;
        setStatus('loading');

        try {
            await signUpForWaitlist(email);
            setStatus('success');
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    };

    return (
        <Layout>
            {/* Nav */}
            <nav className="landing-nav animate-fade-in">
                <Link to="/" className="landing-back-link">
                    <ArrowLeft size={16} /> Home
                </Link>
            </nav>

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
                ) : (
                    <form onSubmit={handleSubmit} className="landing-form">
                        <div className="landing-form__header">
                            <span className="text-eyebrow">Get notified</span>
                        </div>
                        <div className="landing-form__input-group">
                            <input
                                type="email"
                                placeholder="Your email address"
                                className="input"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
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
