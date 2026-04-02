import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Users, BadgeCheck } from 'lucide-react';
import { CAUSE_COLORS } from '../lib/seedData';
import './OpportunityCard.css';

const OpportunityCard = ({ opportunity, index = 0, mode = 'volunteer' }) => {
    const navigate = useNavigate();
    const {
        id, title, cause_domain, organizer_name, organizer_verified,
        date_time, duration_minutes, location_address, spots_left, capacity
    } = opportunity;

    const date = new Date(date_time);
    const dateStr = date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    const timeStr = date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    const hours = Math.floor(duration_minutes / 60);
    const mins = duration_minutes % 60;
    const durationStr = mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;

    const causeColor = CAUSE_COLORS[cause_domain] || { bg: 'rgba(100,100,100,0.08)', text: '#555' };
    const spotsLow = spots_left <= 5;
    const spotsPct = ((capacity - spots_left) / capacity) * 100;
    const isOrganizerPreview = mode === 'organizer';

    return (
        <button
            className="opp-card animate-fade-in"
            style={{ animationDelay: `${index * 0.08}s` }}
            onClick={() => navigate(`/opportunity/${id}`)}
            aria-label={`View ${title}`}
        >
            {/* Top row */}
            <div className="opp-card__top">
                <span
                    className="badge"
                    style={{ background: causeColor.bg, color: causeColor.text }}
                >
                    {cause_domain}
                </span>
                <div className="opp-card__top-right">
                    {isOrganizerPreview && (
                        <span className="opp-card__context-badge">
                            Volunteer view
                        </span>
                    )}
                    {spotsLow && (
                        <span className="opp-card__urgency">
                            {spots_left} left
                        </span>
                    )}
                </div>
            </div>

            {/* Title */}
            <h3 className="opp-card__title">{title}</h3>

            {/* Organizer */}
            <div className="opp-card__org">
                <span>{organizer_name}</span>
                {organizer_verified && (
                    <BadgeCheck size={13} className="opp-card__verified" />
                )}
            </div>

            {/* Capacity bar */}
            <div className="opp-card__capacity">
                <div className="opp-card__capacity-track">
                    <div
                        className="opp-card__capacity-fill"
                        style={{ width: `${spotsPct}%`, background: spotsLow ? 'var(--color-accent)' : 'var(--color-primary)' }}
                    />
                </div>
                <span className="opp-card__capacity-label">{spots_left}/{capacity} spots</span>
            </div>

            {/* Meta */}
            <div className="opp-card__meta">
                <div className="opp-card__meta-item">
                    <Clock size={13} />
                    <span>{dateStr} · {timeStr} · {durationStr}</span>
                </div>
                <div className="opp-card__meta-item">
                    <MapPin size={13} />
                    <span>{location_address}</span>
                </div>
            </div>
        </button>
    );
};

export default OpportunityCard;
