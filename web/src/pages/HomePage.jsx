import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowRight, Compass, Users, Building2, ChevronRight, Send } from 'lucide-react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabase';
import './HomePage.css';

const HomePage = () => {
    const navigate = useNavigate();
    const [showOrgForm, setShowOrgForm] = useState(false);
    const [orgData, setOrgData] = useState({ name: '', email: '', cause: '' });
    const [orgStatus, setOrgStatus] = useState('idle'); // idle | loading | success

    const [compassReady, setCompassReady] = useState(false);
    useEffect(() => {
        const t = setTimeout(() => setCompassReady(true), 300);
        return () => clearTimeout(t);
    }, []);

    const handleOrgSubmit = async (e) => {
        e.preventDefault();
        setOrgStatus('loading');
        try {
            // Save org interest — for MVP just store in localStorage
            // In production, this would go to a Supabase "org_interests" table
            const existing = JSON.parse(localStorage.getItem('org_interests') || '[]');
            existing.push({ ...orgData, submitted_at: new Date().toISOString() });
            localStorage.setItem('org_interests', JSON.stringify(existing));
            setOrgStatus('success');
        } catch (err) {
            console.error(err);
            setOrgStatus('success'); // succeed anyway for MVP
        }
    };

    return (
        <Layout>
            {/* Decorative background */}
            <div className="home-deco">
                <div className="home-deco__blob home-deco__blob--1" />
                <div className="home-deco__blob home-deco__blob--2" />
            </div>

            {/* Nav */}
            <nav className="home-nav animate-fade-in">
                <div className="home-logo">
                    <div className={`home-logo__compass ${compassReady ? 'home-logo__compass--ready' : ''}`}>
                        <Compass size={20} strokeWidth={2} />
                    </div>
                    <span className="home-logo__text">Impact Compass</span>
                </div>
                <Link to="/waitlist" className="home-nav__link">
                    Join waitlist
                </Link>
            </nav>

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

                {/* Social proof */}
                <div className="home-proof animate-fade-in stagger-3">
                    <div className="home-proof__avatars">
                        <span className="home-proof__dot" style={{ background: '#2D6A4F' }}>🌱</span>
                        <span className="home-proof__dot" style={{ background: '#C2540A' }}>🤝</span>
                        <span className="home-proof__dot" style={{ background: '#1E4092' }}>📚</span>
                    </div>
                    <span className="home-proof__text">127 volunteers matched this month</span>
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
                            <p className="text-muted text-sm">We're onboarding organizers for the pilot — expect to hear from us within a week.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleOrgSubmit} className="home-org-fields">
                            <p className="text-eyebrow text-accent">Organizer Interest</p>
                            <input
                                type="text"
                                placeholder="Organization name"
                                className="input"
                                required
                                value={orgData.name}
                                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
                            />
                            <input
                                type="email"
                                placeholder="Contact email"
                                className="input"
                                required
                                value={orgData.email}
                                onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
                            />
                            <select
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
                        </form>
                    )}
                </section>
            )}

            {/* Bottom tagline */}
            <footer className="home-footer animate-fade-in stagger-6">
                <p className="text-soft text-xs">
                    Built with care, launching in Barcelona. <Link to="/waitlist" className="home-footer__link">Join the waitlist →</Link>
                </p>
            </footer>
        </Layout>
    );
};

export default HomePage;
