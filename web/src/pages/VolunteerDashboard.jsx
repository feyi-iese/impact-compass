import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock, MapPin, Calendar, CalendarCheck, CheckCircle2, ChevronRight, BadgeCheck, Hourglass } from 'lucide-react';
import Layout from '../components/Layout';
import { getMyVolunteerSignupsRaw as getMyVolunteerSignups } from '../lib/supabase';
import { useAuth } from '../context/useAuth';
import { CAUSE_COLORS } from '../lib/seedData';
import './VolunteerDashboard.css';

const formatDate = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
};

const formatTime = (iso) => {
  if (!iso) return '';
  return new Date(iso).toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
  });
};

const formatDuration = (minutes) => {
  if (!minutes) return '';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

const VolunteerDashboard = () => {
  const { profile } = useAuth();
  const [signups, setSignups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [_error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('upcoming');

  const fetchMissions = async () => {
    setLoading(true);
    setError(null);
    try {
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Dashboard connection timed out')), 10000)
      );

      const data = await Promise.race([
        getMyVolunteerSignups(),
        timeoutPromise
      ]);

      setSignups(data || []);
    } catch (e) {
      console.error('Error fetching missions:', e);
      setError('Unable to load your missions. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMissions();
  }, []);

  const { upcoming, past } = useMemo(() => {
    const now = Date.now();
    const filtered = signups.filter((s) => s.status !== 'cancelled');
    
    return {
      upcoming: filtered.filter((s) => {
        const d = s.events?.date_time;
        if (!d) return true;
        return new Date(d).getTime() >= now;
      }).sort((a, b) => new Date(a.events?.date_time || 0) - new Date(b.events?.date_time || 0)),
      past: filtered.filter((s) => {
        const d = s.events?.date_time;
        if (!d) return false;
        return new Date(d).getTime() < now;
      }).sort((a, b) => new Date(b.events?.date_time || 0) - new Date(a.events?.date_time || 0)),
    };
  }, [signups]);

  // Compute achievement metrics from past missions
  const totalHoursVolunteered = useMemo(() => {
    const totalMinutes = past.reduce((sum, row) => {
      return sum + (row.events?.duration_minutes || 0);
    }, 0);
    if (totalMinutes === 0) return null; // omit when no data
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }, [past]);

  const currentMissions = activeTab === 'upcoming' ? upcoming : past;
  const isPastTab = activeTab === 'past';

  return (
    <Layout>
      <header className="animate-fade-in" style={{ marginBottom: 'var(--space-5)' }}>
        <span className="text-eyebrow text-accent">Volunteer Dashboard</span>
        <h1 className="font-serif" style={{ fontSize: '2.5rem', marginBottom: 'var(--space-1)' }}>My Compass</h1>
        <p className="text-muted text-sm">Tracking your social impact journey</p>
      </header>

      <div className="vol-dash__layout">
        {/* ── Main Column ── */}
        <div className="vol-dash__main">
          {/* Pill Tab Switcher */}
          <div className="vol-pill-tabs animate-fade-in stagger-1">
            <button 
              className={`vol-pill-tab ${activeTab === 'upcoming' ? 'vol-pill-tab--active' : ''}`}
              onClick={() => setActiveTab('upcoming')}
            >
              Upcoming Missions ({upcoming.length})
            </button>
            <button 
              className={`vol-pill-tab ${activeTab === 'past' ? 'vol-pill-tab--active' : ''}`}
              onClick={() => setActiveTab('past')}
            >
              Past Missions ({past.length})
            </button>
          </div>

          {/* Mission Cards */}
          <section className="animate-fade-in stagger-2">
            {loading ? (
              <div className="vol-dash__empty">
                <div className="detail-spinner" style={{ margin: '0 auto var(--space-3)', width: 24, height: 24 }} />
                <p className="text-sm text-muted">Consulting the compass...</p>
              </div>
            ) : currentMissions.length ? (
              <div className="vol-missions">
                {currentMissions.map((row) => {
                  const evt = row.events || {};
                  const causeColor = CAUSE_COLORS[evt.cause_domain] || { bg: 'rgba(100,100,100,0.08)', text: '#555' };
                  const durationStr = evt.duration_minutes ? formatDuration(evt.duration_minutes) : null;

                  return (
                    <Link
                      key={row.id}
                      to={`/opportunity/${row.event_id || evt.id}`}
                      className={`vol-mission-card ${isPastTab ? 'vol-mission-card--past' : ''}`}
                    >
                      {/* Top row: category + status */}
                      <div className="vol-mission-card__top">
                        {evt.cause_domain && (
                          <span
                            className="vol-mission-card__category"
                            style={{ background: causeColor.bg, color: causeColor.text }}
                          >
                            {evt.cause_domain}
                          </span>
                        )}
                        <span className={`vol-mission-card__status ${isPastTab ? 'vol-mission-card__status--completed' : ''}`}>
                          {isPastTab ? (
                            <><CheckCircle2 size={14} /> Completed</>
                          ) : (
                            <><CalendarCheck size={14} /> Signed up</>
                          )}
                        </span>
                      </div>

                      {/* Title */}
                      <h4 className="vol-mission-card__title">{evt.title}</h4>

                      {/* Org name */}
                      {evt.organizer_name && (
                        <div className="vol-mission-card__org">
                          <span>{evt.organizer_name}</span>
                          {evt.organizer_verified && (
                            <BadgeCheck size={13} className="vol-mission-card__org-verified" />
                          )}
                        </div>
                      )}

                      {/* Meta rows */}
                      <div className="vol-mission-card__meta">
                        <div className="vol-mission-card__meta-row">
                          <Clock size={14} />
                          <span>
                            {formatDate(evt.date_time)} · {formatTime(evt.date_time)}
                            {durationStr && ` · ${durationStr}`}
                          </span>
                        </div>
                        {evt.location_address && (
                          <div className="vol-mission-card__meta-row">
                            <MapPin size={14} />
                            <span>{evt.location_address}</span>
                          </div>
                        )}
                      </div>

                      {/* Pending confirmation badge */}
                      {isPastTab && row.status === 'registered' && (
                        <div style={{ marginTop: 'var(--space-3)', paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
                           <span className="vol-badge-pending">Awaiting NGO Confirmation</span>
                        </div>
                      )}
                    </Link>
                  );
                })}
                <div className="vol-missions__cta">
                  <Link to="/feed" className="btn btn-outline" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: '0.85rem' }}>
                    Find more missions <ChevronRight size={16} />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="vol-dash__empty card-warm">
                <p className="font-serif" style={{ fontSize: '1.1rem', marginBottom: 'var(--space-2)' }}>
                  {activeTab === 'upcoming' ? 'No upcoming missions' : 'No past missions yet'}
                </p>
                <p className="text-sm text-muted" style={{ marginBottom: 'var(--space-5)' }}>
                  {activeTab === 'upcoming' 
                    ? "Every big impact starts with a small step. Find your next mission today."
                    : "Your journey is just beginning. Let's make some memories!"}
                </p>
                {activeTab === 'upcoming' && (
                  <Link to="/feed" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                    Explore Feed <ChevronRight size={16} />
                  </Link>
                )}
              </div>
            )}
          </section>
        </div>

        {/* ── Desktop Sidebar ── */}
        <aside className="vol-dash__sidebar animate-fade-in stagger-3">
          {/* Achievement Stats */}
          <div className="vol-sidebar-stats">
            <div className="vol-stat-card">
              <span className="vol-stat-card__label">
                <CheckCircle2 size={14} /> Missions Completed
              </span>
              <p className="vol-stat-card__value">{past.length}</p>
            </div>
            {totalHoursVolunteered && (
              <div className="vol-stat-card">
                <span className="vol-stat-card__label">
                  <Hourglass size={14} /> Hours Volunteered
                </span>
                <p className="vol-stat-card__value">{totalHoursVolunteered}</p>
              </div>
            )}
          </div>

          {/* Profile Preferences */}
          <section className="card-elevated vol-dash__section" style={{ padding: 'var(--space-4)' }}>
            <h3 className="vol-dash__section-title">
              <CheckCircle2 size={16} className="text-primary" /> Profile Preferences
            </h3>
            <div className="vol-dash__profile-grid">
              <div className="vol-dash__profile-row">
                <span className="vol-dash__profile-label">Location</span>
                <span className="vol-dash__profile-value">{profile?.zip_code || 'Not set'}</span>
              </div>
              <div className="vol-dash__profile-row">
                <span className="vol-dash__profile-label">Impact Areas</span>
                <span className="vol-dash__profile-value">
                  {profile?.causes?.length ? (
                    <span className="vol-dash__causes">
                      {profile.causes.map((c) => (
                        <span key={c} className="vol-dash__cause-tag">{c}</span>
                      ))}
                    </span>
                  ) : 'Not set'}
                </span>
              </div>
            </div>
            <Link to="/onboarding" className="btn btn-outline" style={{ width: '100%', fontSize: '0.82rem' }}>
              Update Preferences
            </Link>
          </section>
        </aside>
      </div>

      <div style={{ height: 'var(--space-8)' }} />
    </Layout>
  );
};

export default VolunteerDashboard;
