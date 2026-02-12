import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, MapPin, Users, BadgeCheck, Calendar, Share2, CheckCircle } from 'lucide-react';
import Layout from '../components/Layout';
import { SEED_OPPORTUNITIES, CAUSE_COLORS } from '../lib/seedData';
import './OpportunityDetail.css';

const OpportunityDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [rsvpStatus, setRsvpStatus] = useState('idle');

    const opp = SEED_OPPORTUNITIES.find(o => o.id === id);

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
        date_time, duration_minutes, location_address, spots_left, capacity, requirements
    } = opp;

    const date = new Date(date_time);
    const dateStr = date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const hours = Math.floor(duration_minutes / 60);
    const mins = duration_minutes % 60;
    const durationStr = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
    const causeColor = CAUSE_COLORS[cause_domain] || { bg: 'rgba(100,100,100,0.08)', text: '#555' };
    const spotsPct = ((capacity - spots_left) / capacity) * 100;

    const handleRSVP = async () => {
        setRsvpStatus('loading');
        setTimeout(() => { setRsvpStatus('confirmed'); }, 800);
    };

    const handleShare = async () => {
        const shareData = {
            title: `Join me: ${title}`,
            text: `Check out this volunteering opportunity: ${title}`,
            url: window.location.href
        };
        if (navigator.share) {
            try { await navigator.share(shareData); } catch (e) { /* cancelled */ }
        } else {
            navigator.clipboard.writeText(window.location.href);
            alert('Link copied!');
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
        <Layout>
            {/* Top nav */}
            <nav className="detail-nav animate-fade-in">
                <button onClick={() => navigate('/feed')} className="detail-back" aria-label="Go back">
                    <ArrowLeft size={18} />
                </button>
                <button onClick={handleShare} className="detail-share" aria-label="Share">
                    <Share2 size={18} />
                </button>
            </nav>

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
                    {organizer_verified && <BadgeCheck size={14} className="detail-org__check" />}
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
                    </div>
                ) : (
                    <div className="detail-cta__actions">
                        <button
                            className="btn btn-primary detail-cta__btn"
                            onClick={handleRSVP}
                            disabled={rsvpStatus === 'loading'}
                        >
                            {rsvpStatus === 'loading' ? (
                                <span className="detail-spinner" />
                            ) : (
                                "I'm interested"
                            )}
                        </button>
                    </div>
                )}
            </footer>
        </Layout>
    );
};

export default OpportunityDetail;
