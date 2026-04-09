import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, Users, BadgeCheck, Calendar, Share2, Send } from 'lucide-react';
import Layout from '../components/Layout';
import {
    cancelSignupRaw as cancelSignup,
    fetchOpportunityByIdRaw as fetchOpportunityById,
    getEventSignupCountRaw as getEventSignupCount,
    getMySignupForEventRaw as getMySignupForEvent,
    signupForEventRaw as signupForEvent,
} from '../lib/supabase';
import { SEED_OPPORTUNITIES, CAUSE_COLORS } from '../lib/seedData';
import { useAuth } from '../context/useAuth';
import Toast from '../components/Toast';
import { getMapsUrl } from '../lib/locationUtils';
import './OpportunityDetail.css';

const OpportunityDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const { isAuthenticated } = useAuth();
    const [rsvpStatus, setRsvpStatus] = useState('idle');
    const [opp, setOpp] = useState(null);
    const [loading, setLoading] = useState(true);
    const [checkingStatus, setCheckingStatus] = useState(false);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            try {
                // Fetch the event itself FIRST
                console.log('OpportunityDetail: Fetching event data for ID:', id);
                const fromDb = await fetchOpportunityById(id).catch(err => {
                    console.error('Core fetch failed:', err);
                    return null;
                });
                
                if (cancelled) return;

                if (fromDb) {
                    setOpp({ ...fromDb, spots_left: fromDb.capacity }); 
                    setLoading(false); // SHOW THE PAGE NOW

                    // Background checks for RSVP and Count
                    setCheckingStatus(true);
                    try {
                        const timeoutPromise = new Promise((_, reject) => 
                            setTimeout(() => reject(new Error('Background check timeout')), 3000)
                        );
                        
                        const [count, mine] = await Promise.race([
                            Promise.all([
                                getEventSignupCount(fromDb.id).catch(() => 0),
                                getMySignupForEvent(fromDb.id).catch(() => null),
                            ]),
                            timeoutPromise
                        ]);

                        if (cancelled) return;
                        setOpp(prev => ({ 
                            ...prev, 
                            spots_left: Math.max(prev.capacity - count, 0)
                        }));
                        if (mine?.status === 'registered') setRsvpStatus('confirmed');
                    } catch (e) {
                         console.warn('Background check timed out or failed', e.message);
                         // Fallback: Ensure button is clickable even if we can't verify 'already joined' status
                    } finally {
                        if (!cancelled) setCheckingStatus(false);
                    }
                } else {
                    const fallback = SEED_OPPORTUNITIES.find(o => o.id === id);
                    console.log('No DB event found, using fallback:', !!fallback);
                    setOpp(fallback ?? null);
                    setLoading(false);
                }
            } catch (err) {
                console.error('Fatal load error:', err);
                if (!cancelled) {
                    setOpp(SEED_OPPORTUNITIES.find(o => o.id === id) ?? null);
                    setLoading(false);
                }
            }
        })();
        return () => { cancelled = true; };
    }, [id]);

    if (loading) {
        return (
            <Layout>
                <div className="detail-empty animate-scale-in">
                    <p className="text-muted">Loading…</p>
                </div>
            </Layout>
        );
    }

    if (!opp) {
        return (
            <Layout>
                <div className="detail-empty animate-scale-in">
                    <h2>Opportunity not found</h2>
                    <p className="text-muted" style={{ margin: 'var(--space-3) 0 var(--space-6)' }}>
                        This event may have been removed.
                    </p>
                    <button className="btn btn-outline" onClick={() => navigate('/feed')}>
                        ← Back to feed
                    </button>
                </div>
            </Layout>
        );
    }

    const {
        title, description, cause_domain, organizer_name, organizer_verified,
        date_time, duration_minutes, location_address, spots_left, capacity, requirements,
        contact_phone, contact_email, contact_website
    } = opp;

    const date = new Date(date_time);
    const dateStr = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const hours = Math.floor(duration_minutes / 60);
    const mins = duration_minutes % 60;
    const durationStr = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    const causeColor = CAUSE_COLORS[cause_domain] || { bg: 'rgba(100,100,100,0.08)', text: '#555' };
    const spotsPct = ((capacity - spots_left) / capacity) * 100;
    const mapsUrl = getMapsUrl(location_address);

    const handleRSVP = async () => {
        if (!isAuthenticated) {
            navigate('/auth', { state: { from: `/opportunity/${id}` } });
            return;
        }
        const previousSpotsLeft = spots_left;
        setRsvpStatus('loading');
        setOpp((prev) => {
            if (!prev) return prev;
            return { ...prev, spots_left: Math.max(prev.spots_left - 1, 0) };
        });
        try {
            await signupForEvent(id);
            const count = await getEventSignupCount(id).catch(() => capacity - spots_left);
            setOpp((prev) => ({ ...prev, spots_left: Math.max(prev.capacity - count, 0) }));
            setRsvpStatus('confirmed');
        } catch (error) {
            console.error(error);
            setOpp((prev) => (prev ? { ...prev, spots_left: previousSpotsLeft } : prev));
            setRsvpStatus('idle');
        }
    };

    const handleCancelSignup = async () => {
        const previousSpotsLeft = spots_left;
        setOpp((prev) => {
            if (!prev) return prev;
            return { ...prev, spots_left: Math.min(prev.spots_left + 1, prev.capacity) };
        });
        try {
            await cancelSignup(id);
            const count = await getEventSignupCount(id).catch(() => capacity - spots_left);
            setOpp((prev) => ({ ...prev, spots_left: Math.max(prev.capacity - count, 0) }));
            setRsvpStatus('idle');
        } catch (error) {
            console.error(error);
            setOpp((prev) => (prev ? { ...prev, spots_left: previousSpotsLeft } : prev));
        }
    };

    const handleShare = async () => {
        const shareData = {
            title: `Join me: ${title}`,
            text: `Check out this volunteering opportunity: ${title}`,
            url: window.location.href
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch { /* cancelled */ }
        } else {
            navigator.clipboard.writeText(window.location.href);
            setToast('Link copied to clipboard');
        }
    };

    const generateICS = () => {
        const endDate = new Date(date.getTime() + duration_minutes * 60000);
        const fmt = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
        const ics = [
            'BEGIN:VCALENDAR', 'VERSION:2.0', 'BEGIN:VEVENT',
            `DTSTART:${fmt(date)}`, `DTEND:${fmt(endDate)}`,
            `SUMMARY:${title}`, `LOCATION:${location_address}`,
            `DESCRIPTION:${description.substring(0, 200)}`,
            'END:VEVENT', 'END:VCALENDAR'
        ].join('\r\n');
        const blob = new Blob([ics], { type: 'text/calendar' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `${title.replace(/\s+/g, '_')}.ics`;
        link.click();
    };

    return (
        <Layout backTo="/feed" backLabel="Back to feed">
            {/* Share button */}
            <div className="detail-share-row animate-fade-in">
                <button onClick={handleShare} className="detail-share" aria-label="Share">
                    <Share2 size={18} />
                </button>
            </div>

            {/* Content */}
            <article className="detail-content">
                {/* Badge */}
                <span
                    className="badge animate-fade-in stagger-1"
                    style={{ background: causeColor.bg, color: causeColor.text }}
                >
                    {cause_domain}
                </span>

                {/* Title */}
                <h1 className="detail-title animate-fade-in stagger-2">{title}</h1>

                {/* Organizer */}
                <div className="detail-org animate-fade-in stagger-2">
                    <span>By {organizer_name}</span>
                    {organizer_verified ? (
                        <BadgeCheck size={14} className="detail-org__check" />
                    ) : null}
                </div>

                {/* Quick info */}
                <div className="detail-info card-warm animate-fade-in stagger-3">
                    <div className="detail-info__item">
                        <Calendar size={15} />
                        <div>
                            <strong>{dateStr}</strong>
                            <span className="text-muted text-sm">{timeStr} · {durationStr}</span>
                        </div>
                    </div>
                    <div className="detail-info__item">
                        <MapPin size={15} />
                        <div>
                            <strong>{location_address}</strong>
                            <a
                                href={mapsUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="detail-map-link"
                            >
                                Open in Maps
                            </a>
                        </div>
                    </div>
                    <div className="detail-info__item">
                        <Users size={15} />
                        <div>
                            <div className="detail-capacity">
                                <div className="detail-capacity__track">
                                    <div
                                        className="detail-capacity__fill"
                                        style={{ width: `${spotsPct}%`, background: spots_left <= 5 ? 'var(--color-accent)' : 'var(--color-primary)' }}
                                    />
                                </div>
                                <strong>{spots_left} spots left</strong>
                            </div>
                            <span className="text-muted text-sm">{capacity - spots_left} of {capacity} signed up</span>
                        </div>
                    </div>
                </div>

                {/* Description */}
                <section className="detail-section animate-fade-in stagger-4">
                    <h2 className="detail-section__heading">About</h2>
                    <p className="detail-section__body">{description}</p>
                </section>

                {/* Requirements */}
                {requirements && (
                    <section className="detail-section animate-fade-in stagger-5">
                        <h2 className="detail-section__heading">What to bring</h2>
                        <p className="detail-section__body">{requirements}</p>
                    </section>
                )}

                {/* Contact Info (for Imported Events) */}
                {(contact_email || contact_phone || contact_website) && (
                    <section className="detail-section animate-fade-in stagger-6">
                        <h2 className="detail-section__heading">Contact & Inquiries</h2>
                        <div className="detail-contact-list card-elevated" style={{ padding: 'var(--space-4)', marginTop: 'var(--space-2)' }}>
                            {contact_email && (
                                <div className="detail-info__item" style={{ marginBottom: 'var(--space-3)' }}>
                                    <Send size={15} />
                                    <a href={`mailto:${contact_email}`} className="link">{contact_email}</a>
                                </div>
                            )}
                            {contact_phone && (
                                <div className="detail-info__item" style={{ marginBottom: 'var(--space-3)' }}>
                                    <Users size={15} />
                                    <a href={`tel:${contact_phone}`} className="link">{contact_phone}</a>
                                </div>
                            )}
                            {contact_website && (
                                <div className="detail-info__item">
                                    <Share2 size={15} />
                                    <a href={contact_website.startsWith('http') ? contact_website : `https://${contact_website}`} target="_blank" rel="noopener noreferrer" className="link">Visit Website</a>
                                </div>
                            )}
                        </div>
                    </section>
                )}
            </article>

            {/* Sticky CTA */}
            <footer className="detail-cta">
                {rsvpStatus === 'confirmed' ? (
                    <div className="detail-cta__confirmed animate-scale-in">
                        {/* Confetti burst */}
                        <div className="confetti-container">
                            {[...Array(12)].map((_, i) => (
                                <span key={i} className={`confetti-particle confetti-particle--${i}`} />
                            ))}
                        </div>
                        <div className="detail-cta__check">
                            {/* Animated checkmark SVG */}
                            <svg className="check-draw" viewBox="0 0 52 52" width="28" height="28">
                                <circle className="check-draw__circle" cx="26" cy="26" r="24" fill="none" strokeWidth="2" />
                                <path className="check-draw__tick" fill="none" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
                            </svg>
                        </div>
                        <div>
                            <strong>You're in!</strong>
                            <p className="text-muted text-sm">We'll remind you the day before.</p>
                        </div>
                        <button className="btn btn-outline" onClick={generateICS} style={{ marginLeft: 'auto' }}>
                            <Calendar size={15} /> Add to Cal
                        </button>
                        <button
                            className="btn btn-ghost"
                            onClick={() => {
                                if (window.confirm('Are you sure you want to cancel your signup?')) {
                                    handleCancelSignup();
                                }
                            }}
                        >
                            Cancel signup
                        </button>
                    </div>
                ) : (
                    <div className="detail-cta__actions">
                        <button
                            className="btn btn-primary detail-cta__btn"
                            onClick={handleRSVP}
                            disabled={rsvpStatus === 'loading' || checkingStatus}
                        >
                            {rsvpStatus === 'loading' ? (
                                <span className="detail-spinner" />
                            ) : checkingStatus ? (
                                "Checking status..."
                            ) : (
                                "I'm interested"
                            )}
                        </button>
                    </div>
                )}
            </footer>

            {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        </Layout>
    );
};

export default OpportunityDetail;
