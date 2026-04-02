import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { CalendarDays, Users, TrendingUp, PlusCircle } from 'lucide-react';
import Layout from '../components/Layout';
import {
  getMyOrganizationRaw as getMyOrganization,
  getOrganizerEventMetricsRaw as getOrganizerEventMetrics,
} from '../lib/supabase';
import { CAUSE_COLORS } from '../lib/seedData';
import './OrganizerDashboard.css';

const OrganizerDashboard = () => {
  const [org, setOrg] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming');

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [organization, metrics] = await Promise.all([
          getMyOrganization(),
          getOrganizerEventMetrics(),
        ]);
        if (cancelled) return;
        setOrg(organization);
        setEvents(metrics || []);
      } catch (e) {
        console.warn('Organizer dashboard load failed', e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    return {
      upcoming: events.filter(e => new Date(e.date_time).getTime() >= now)
        .sort((a, b) => new Date(a.date_time) - new Date(b.date_time)),
      past: events.filter(e => new Date(e.date_time).getTime() < now)
        .sort((a, b) => new Date(b.date_time) - new Date(a.date_time)),
    };
  }, [events]);

  // Compute aggregate stats
  const stats = useMemo(() => {
    const activeCount = upcoming.length;
    const totalSignups = events.reduce((sum, e) => sum + (e.signup_count || 0), 0);
    const totalCapacity = events.reduce((sum, e) => sum + (e.capacity || 0), 0);
    const fillRate = totalCapacity > 0 ? Math.round((totalSignups / totalCapacity) * 100) : 0;
    return { activeCount, totalSignups, fillRate };
  }, [events, upcoming]);

  const currentEvents = activeTab === 'upcoming' ? upcoming : past;
  const isPastTab = activeTab === 'past';

  return (
    <Layout>
      {/* Header */}
      <header className="org-dash__header animate-fade-in">
        <div className="org-dash__header-text">
          <span className="text-eyebrow text-accent">Organizer</span>
          <h1 className="font-serif" style={{ fontSize: '2.25rem' }}>Dashboard</h1>
        </div>
        <Link to="/dashboard/organizer/create" className="btn btn-primary" style={{ whiteSpace: 'nowrap' }}>
          <PlusCircle size={18} /> New Event
        </Link>
      </header>

      {/* Stats */}
      <div className="org-dash__stats animate-fade-in stagger-1">
        <div className="org-stat-card">
          <CalendarDays size={20} className="org-stat-card__icon" />
          <span className="org-stat-card__value">{stats.activeCount}</span>
          <span className="org-stat-card__label">Active</span>
        </div>
        <div className="org-stat-card">
          <Users size={20} className="org-stat-card__icon" />
          <span className="org-stat-card__value">{stats.totalSignups}</span>
          <span className="org-stat-card__label">Signed Up</span>
        </div>
        <div className="org-stat-card">
          <TrendingUp size={20} className="org-stat-card__icon" />
          <span className="org-stat-card__value">{stats.fillRate}%</span>
          <span className="org-stat-card__label">Fill Rate</span>
        </div>
      </div>

      <div className="org-dash__layout">
        {/* Main Column */}
        <div className="org-dash__main">
          {/* Section title */}
          <h2 className="font-serif" style={{ fontSize: '1.3rem', marginBottom: 'var(--space-4)' }}>Your Events</h2>

          {/* Pill Tabs */}
          <div className="org-pill-tabs animate-fade-in stagger-2">
            <button
              className={`org-pill-tab ${activeTab === 'upcoming' ? 'org-pill-tab--active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming ({upcoming.length})
            </button>
            <button
              className={`org-pill-tab ${activeTab === 'past' ? 'org-pill-tab--active' : ''}`}
              onClick={() => setActiveTab('past')}
            >
              Past ({past.length})
            </button>
          </div>

          {/* Event List */}
          <section className="animate-fade-in stagger-3">
            {loading ? (
              <div className="org-dash__empty">
                <div className="detail-spinner" style={{ margin: '0 auto var(--space-3)', width: 24, height: 24 }} />
                <p className="text-sm text-muted">Loading events...</p>
              </div>
            ) : currentEvents.length ? (
              <div className="org-events">
                {currentEvents.map((event) => {
                  const pct = event.capacity > 0
                    ? Math.round((event.signup_count / event.capacity) * 100)
                    : 0;
                  const causeColor = CAUSE_COLORS[event.cause_domain] || { bg: 'rgba(100,100,100,0.08)', text: '#555' };
                  const dateStr = new Date(event.date_time).toLocaleDateString('en-GB', {
                    weekday: 'short', day: 'numeric', month: 'short',
                  });
                  const spotsLow = (event.capacity - event.signup_count) <= 5 && event.signup_count > 0;

                  return (
                    <div key={event.id} className={`org-event-card ${isPastTab ? 'org-event-card--past' : ''}`}>
                      {/* Top: category + date */}
                      <div className="org-event-card__top">
                        <span
                          className="org-event-card__category"
                          style={{ background: causeColor.bg, color: causeColor.text }}
                        >
                          {event.cause_domain}
                        </span>
                        <span className="org-event-card__date">{dateStr}</span>
                      </div>

                      {/* Title */}
                      <h4 className="org-event-card__title">{event.title}</h4>

                      {/* Progress bar */}
                      <div className="org-event-card__progress">
                        <div className="org-event-card__track">
                          <div
                            className="org-event-card__fill"
                            style={{
                              width: `${pct}%`,
                              background: spotsLow ? 'var(--color-accent)' : 'var(--color-primary)',
                            }}
                          />
                        </div>
                        <span className="org-event-card__spots">
                          {event.signup_count}/{event.capacity} spots
                        </span>
                      </div>

                      {/* Bottom: signup count + edit */}
                      <div className="org-event-card__bottom">
                        <div>
                          <span className="org-event-card__signups">
                            {event.signup_count} volunteer{event.signup_count !== 1 ? 's' : ''} signed up
                          </span>
                          {spotsLow && !isPastTab && (
                            <>
                              {' · '}
                              <span className="org-event-card__urgency">
                                {event.capacity - event.signup_count} left
                              </span>
                            </>
                          )}
                        </div>
                        <Link
                          to={`/dashboard/organizer/edit/${event.id}`}
                          state={{ event }}
                          className="btn btn-outline btn-sm"
                        >
                          Edit
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="org-dash__empty card-warm">
                <p className="font-serif" style={{ fontSize: '1.1rem', marginBottom: 'var(--space-2)' }}>
                  {isPastTab ? 'No past events' : 'No upcoming events'}
                </p>
                <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-5)' }}>
                  {isPastTab
                    ? 'Events that have passed will show up here.'
                    : 'Create your first event to start attracting volunteers.'}
                </p>
                {!isPastTab && (
                  <Link to="/dashboard/organizer/create" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    <PlusCircle size={16} /> Create an event
                  </Link>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Desktop Sidebar */}
        {org && (
          <aside className="org-dash__sidebar animate-fade-in stagger-3">
            <div className="org-sidebar-profile">
              <p className="org-sidebar-profile__name">{org.name}</p>
              <p className="org-sidebar-profile__desc">{org.description || 'No description yet.'}</p>
              <div className="org-sidebar-profile__meta">
                {org.phone && <span>{org.phone}</span>}
                {org.contact_email && <span>{org.contact_email}</span>}
              </div>
            </div>
          </aside>
        )}
      </div>

      <div style={{ height: 'var(--space-8)' }} />
    </Layout>
  );
};

export default OrganizerDashboard;
