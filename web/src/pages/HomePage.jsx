import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Users, Building2, ChevronRight, Send } from 'lucide-react';
import Layout from '../components/Layout';
import { submitExpandedOrgInterest } from '../lib/supabase';
import { checkSubmissionRate, markSubmission } from '../lib/antiAbuse';
import './HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();
    const [showOrgForm, setShowOrgForm] = useState(false);
    const [orgData, setOrgData] = useState({ name: '', email: '', cause: '', phone: '', description: '' });
    const [orgStatus, setOrgStatus] = useState('idle'); // idle | loading | success
    const [website, setWebsite] = useState('');

    const handleOrgSubmit = async (e) => {
        e.preventDefault();
        if (website.trim()) {
            setOrgStatus('success');
            return;
        }
        const rate = checkSubmissionRate('org_interest', { minIntervalMs: 15000, maxPerHour: 5 });
        if (rate.blocked) {
            setOrgStatus('throttled');
            return;
        }
        setOrgStatus('loading');
        markSubmission('org_interest');
        try {
            const result = await submitExpandedOrgInterest({
                name: orgData.name,
                email: orgData.email,
                cause: orgData.cause,
                phone: orgData.phone,
                description: orgData.description,
            });
            if (result?.skipped) {
                const existing = JSON.parse(localStorage.getItem('org_interests') || '[]');
                existing.push({ ...orgData, submitted_at: new Date().toISOString() });
                localStorage.setItem('org_interests', JSON.stringify(existing));
            }
            setOrgStatus('success');
        } catch (err) {
            console.error(err);
            setOrgStatus('error');
        }
    };

    return (
        <Layout>
            {/* Decorative background */}
            <div className="home-deco">
                <div className="home-deco__blob home-deco__blob--1" />
                <div className="home-deco__blob home-deco__blob--2" />
            </div>

            {/* Hero */}
            <section className="home-hero">
                <h1 className="home-headline animate-fade-in stagger-1">
                    Find your way<br />
                    to <em className="home-headline__em">real impact</em>
                </h1>

                <p className="home-subhead animate-fade-in stagger-2">
                    The compass that connects volunteers with causes<br />
                    and organizations with people who care.
                </p>

                {/* Cause icons */}
                <div className="home-proof animate-fade-in stagger-3">
                    <div className="home-proof__avatars">
                        <span className="home-proof__dot" style={{ background: '#2D6A4F' }}>🌱</span>
                        <span className="home-proof__dot" style={{ background: '#C2540A' }}>🤝</span>
                        <span className="home-proof__dot" style={{ background: '#1E4092' }}>📚</span>
                    </div>
                    <span className="home-proof__text">Launching in Barcelona</span>
                </div>
            </section>

            {/* Two-path fork */}
            <section className="home-paths animate-fade-in stagger-4">
                <button
                    className="home-path home-path--volunteer"
                    onClick={() => navigate('/onboarding')}
                >
                    <div className="home-path__icon">
                        <Users size={22} />
                    </div>
                    <div className="home-path__content">
                        <h3 className="home-path__title">I want to volunteer</h3>
                        <p className="home-path__desc">Find opportunities that match your skills, interests, and schedule.</p>
                    </div>
                    <ChevronRight size={18} className="home-path__arrow" />
                </button>

                <button
                    className="home-path home-path--org"
                    onClick={() => setShowOrgForm(!showOrgForm)}
                >
                    <div className="home-path__icon home-path__icon--org">
                        <Building2 size={22} />
                    </div>
                    <div className="home-path__content">
                        <h3 className="home-path__title">I'm an organizer</h3>
                        <p className="home-path__desc">Reach motivated volunteers for your events and programs.</p>
                    </div>
                    <ChevronRight size={18} className={`home-path__arrow ${showOrgForm ? 'home-path__arrow--open' : ''}`} />
                </button>
            </section>

            {/* Org interest form (inline, expandable) */}
            {showOrgForm && (
                <section className="home-org-form card-elevated animate-scale-in">
                    {orgStatus === 'success' ? (
                        <div className="home-org-success">
                            <span className="home-org-success__icon">🎉</span>
                            <h3>Thanks! We'll be in touch.</h3>
                            <p className="text-muted text-sm">You're set. Create your organizer account to start publishing events.</p>
                            <Link to="/auth" className="btn btn-primary" style={{ marginTop: 'var(--space-3)' }}>
                                Continue as organizer
                            </Link>
                        </div>
                    ) : orgStatus === 'throttled' ? (
                        <div className="home-org-success">
                            <h3>Slow down a little</h3>
                            <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-4)' }}>
                                Please wait a few seconds before submitting again.
                            </p>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setOrgStatus('idle')}
                            >
                                Back
                            </button>
                        </div>
                    ) : orgStatus === 'error' ? (
                        <div className="home-org-success">
                            <h3>Something went wrong</h3>
                            <p className="text-muted text-sm" style={{ marginBottom: 'var(--space-4)' }}>
                                We couldn't save your details right now. Please try again in a moment.
                            </p>
                            <button
                                type="button"
                                className="btn btn-outline"
                                onClick={() => setOrgStatus('idle')}
                            >
                                Try again
                            </button>
                        </div>
                    ) : (
                        <form onSubmit={handleOrgSubmit} className="home-org-fields">
                            <p className="text-eyebrow text-accent">Organizer Interest</p>
                            <label htmlFor="home-org-name" className="sr-only">Organization name</label>
                            <input
                                id="home-org-name"
                                type="text"
                                placeholder="Organization name"
                                className="input"
                                required
                                value={orgData.name}
                                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                            />
                            <label htmlFor="home-org-email" className="sr-only">Contact email</label>
                            <input
                                id="home-org-email"
                                type="email"
                                placeholder="Contact email"
                                className="input"
                                required
                                value={orgData.email}
                                onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                            />
                            <label htmlFor="home-org-phone" className="sr-only">Phone number</label>
                            <input
                                id="home-org-phone"
                                type="tel"
                                placeholder="Phone number"
                                className="input"
                                value={orgData.phone}
                                onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
                            />
                            <label htmlFor="home-org-desc" className="sr-only">Organization description</label>
                            <textarea
                                id="home-org-desc"
                                placeholder="Organization description"
                                className="input"
                                value={orgData.description}
                                onChange={(e) => setOrgData({ ...orgData, description: e.target.value })}
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
                            <label htmlFor="home-org-cause" className="sr-only">Cause area</label>
                            <select
                                id="home-org-cause"
                                className="input home-select"
                                value={orgData.cause}
                                onChange={(e) => setOrgData({ ...orgData, cause: e.target.value })}
                                required
                            >
                                <option value="" disabled>What cause area?</option>
                                <option>Climate Action</option>
                                <option>Social Justice</option>
                                <option>Education</option>
                                <option>Animal Welfare</option>
                                <option>Health & Wellbeing</option>
                                <option>Community Building</option>
                                <option>Arts & Culture</option>
                                <option>Poverty Alleviation</option>
                            </select>
                            <button
                                type="submit"
                                className="btn btn-accent"
                                style={{ width: '100%' }}
                                disabled={orgStatus === 'loading'}
                            >
                                {orgStatus === 'loading' ? 'Submitting…' : <><Send size={15} /> Get in touch</>}
                            </button>
                            <Link to="/auth" className="btn btn-outline" style={{ width: '100%' }}>
                                I already have organizer access
                            </Link>
                        </form>
                    )}
                </section>
            )}

            {/* Bottom tagline */}
            <footer className="home-footer animate-fade-in stagger-6">
                <p className="text-soft text-xs">
                    Built with care, launching in Barcelona.
                    {/* <Link to="/waitlist" className="home-footer__link">Join the waitlist →</Link> */}
                </p>
            </footer>
        </Layout>
    );
};

export default HomePage;
