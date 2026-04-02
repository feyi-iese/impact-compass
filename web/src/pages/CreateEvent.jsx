import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';
import {
  createEventRaw as createEvent,
  updateEventRaw as updateEvent,
  getOrganizerEventMetricsRaw as getOrganizerEventMetrics,
} from '../lib/supabase';
import './CreateEvent.css';

const EMPTY_EVENT = {
  title: '',
  description: '',
  cause_domain: 'Community Building',
  event_category: 'Direct Service',
  location_address: '',
  date: '',
  startTime: '',
  endTime: '',
  capacity: 10,
  frequency: 'one-time',
  requirements: '',
  skills_needed: '',
  contact_email: '',
  contact_phone: '',
};

const CAUSES = [
  'Climate Action', 'Social Justice', 'Education', 'Animal Welfare',
  'Health & Wellbeing', 'Community Building', 'Arts & Culture', 'Poverty Alleviation',
];

const CATEGORIES = [
  'Direct Service', 'Skill-based', 'Event Support', 'Manual Labor', 'Administrative', 'Mentoring',
];

const CreateEvent = () => {
  const navigate = useNavigate();
  const { eventId } = useParams();
  const location = useLocation();
  const isEditing = Boolean(eventId);
  const stateEvent = location.state?.event;

  const [eventData, setEventData] = useState(EMPTY_EVENT);
  const [status, setStatus] = useState('idle');
  const [loadingEvent, setLoadingEvent] = useState(false);

  // Fetch organizer defaults for new event
  useEffect(() => {
    if (isEditing) return;

    (async () => {
      try {
        const { getMyOrganizationRaw: getMyOrganization } = await import('../lib/supabase');
        const org = await getMyOrganization();
        if (org) {
          setEventData((prev) => ({
            ...prev,
            contact_email: org.contact_email || '',
            contact_phone: org.phone || '',
          }));
        }
      } catch (err) {
        console.warn('Failed to load org defaults', err);
      }
    })();
  }, [isEditing]);

  // Populate form for editing
  useEffect(() => {
    if (!isEditing) return;

    // Try route state first (instant), fallback to API fetch
    if (stateEvent) {
      populateForm(stateEvent);
      return;
    }

    // Fetch from API on refresh
    setLoadingEvent(true);
    (async () => {
      try {
        const metrics = await getOrganizerEventMetrics();
        const event = (metrics || []).find((e) => String(e.id) === String(eventId));
        if (event) {
          populateForm(event);
        } else {
          setStatus('not-found');
        }
      } catch {
        setStatus('error');
      } finally {
        setLoadingEvent(false);
      }
    })();
  }, [eventId, isEditing, stateEvent]);

  const populateForm = (event) => {
    const start = new Date(event.date_time);
    const end = event.end_time ? new Date(event.end_time) : null;
    setEventData({
      title: event.title || '',
      description: event.description || '',
      cause_domain: event.cause_domain || 'Community Building',
      event_category: event.event_category || 'Direct Service',
      location_address: event.location_address || '',
      date: start.toISOString().slice(0, 10),
      startTime: start.toISOString().slice(11, 16),
      endTime: end ? end.toISOString().slice(11, 16) : '',
      capacity: event.capacity || 10,
      frequency: event.frequency || 'one-time',
      requirements: event.requirements || '',
      skills_needed: Array.isArray(event.skills_needed) ? event.skills_needed.join(', ') : '',
      contact_email: event.contact_email || '',
      contact_phone: event.contact_phone || '',
    });
  };

  const eventPayload = useMemo(() => {
    if (!eventData.date || !eventData.startTime) return null;
    const start = new Date(`${eventData.date}T${eventData.startTime}`);
    const end = eventData.endTime
      ? new Date(`${eventData.date}T${eventData.endTime}`)
      : null;
    const durationMinutes = end
      ? Math.max(Math.round((end.getTime() - start.getTime()) / 60000), 30)
      : 60;

    return {
      title: eventData.title,
      description: eventData.description,
      cause_domain: eventData.cause_domain,
      event_category: eventData.event_category,
      location_address: eventData.location_address,
      date_time: start.toISOString(),
      end_time: end ? end.toISOString() : null,
      duration_minutes: durationMinutes,
      capacity: Number(eventData.capacity) || 1,
      frequency: eventData.frequency,
      requirements: eventData.requirements,
      skills_needed: eventData.skills_needed ? eventData.skills_needed.split(',').map(s => s.trim()).filter(Boolean) : [],
      contact_email: eventData.contact_email || null,
      contact_phone: eventData.contact_phone || null,
      status: 'active',
    };
  }, [eventData]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!eventPayload) return;
    setStatus('saving');
    try {
      if (isEditing) {
        await updateEvent(eventId, eventPayload);
      } else {
        await createEvent(eventPayload);
      }
      setStatus('saved');
      // Navigate back after brief success flash
      setTimeout(() => navigate('/dashboard/organizer'), 800);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const set = (key, value) => setEventData((prev) => ({ ...prev, [key]: value }));

  if (loadingEvent) {
    return (
      <Layout backTo="/dashboard/organizer" backLabel="Back to dashboard">
        <div className="vol-dash__empty">
          <div className="detail-spinner" style={{ margin: '0 auto var(--space-3)', width: 24, height: 24 }} />
          <p className="text-sm text-muted">Loading event...</p>
        </div>
      </Layout>
    );
  }

  if (status === 'not-found') {
    return (
      <Layout backTo="/dashboard/organizer" backLabel="Back to dashboard">
        <div className="vol-dash__empty">
          <p className="font-serif" style={{ fontSize: '1.1rem', marginBottom: 'var(--space-2)' }}>Event not found</p>
          <p className="text-sm text-muted">This event may have been deleted or you don't have access.</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout backTo="/dashboard/organizer" backLabel="Back to dashboard">
      <div className="create-event__header animate-fade-in">
        <h1 className="create-event__title">{isEditing ? 'Edit Event' : 'Create New Event'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="create-event__form animate-fade-in stagger-1">
        <div className="create-event__form-group">
          <label className="create-event__form-label" htmlFor="evt-title">Event name</label>
          <input id="evt-title" className="input" required placeholder="e.g. Beach Cleanup Day" value={eventData.title} onChange={(e) => set('title', e.target.value)} />
        </div>
        <div className="create-event__form-group">
          <label className="create-event__form-label" htmlFor="evt-desc">Description</label>
          <textarea id="evt-desc" className="input" required placeholder="What will volunteers do?" rows={3} value={eventData.description} onChange={(e) => set('description', e.target.value)} />
        </div>
        <div className="create-event__form-group">
          <label className="create-event__form-label" htmlFor="evt-location">Location</label>
          <input id="evt-location" className="input" required placeholder="Full address" value={eventData.location_address} onChange={(e) => set('location_address', e.target.value)} />
        </div>
        <div className="create-event__form-row">
          <div className="create-event__form-group">
            <label className="create-event__form-label" htmlFor="evt-cause">Cause area</label>
            <select id="evt-cause" className="input" value={eventData.cause_domain} onChange={(e) => set('cause_domain', e.target.value)}>
              {CAUSES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div className="create-event__form-group">
            <label className="create-event__form-label" htmlFor="evt-cat">Event type</label>
            <select id="evt-cat" className="input" value={eventData.event_category} onChange={(e) => set('event_category', e.target.value)}>
              {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div className="create-event__form-group">
          <label className="create-event__form-label">Date &amp; time</label>
          <div className="create-event__form-row--three">
            <input className="input" type="date" required aria-label="Date" value={eventData.date} onChange={(e) => set('date', e.target.value)} />
            <input className="input" type="time" required aria-label="Start time" value={eventData.startTime} onChange={(e) => set('startTime', e.target.value)} />
            <input className="input" type="time" aria-label="End time (optional)" value={eventData.endTime} onChange={(e) => set('endTime', e.target.value)} />
          </div>
          <span className="create-event__form-hint">End time is optional; defaults to 1 hour</span>
        </div>

        <div className="create-event__form-group">
          <label className="create-event__form-label" htmlFor="evt-capacity">Volunteers needed</label>
          <input id="evt-capacity" className="input" type="number" min="1" required value={eventData.capacity} onChange={(e) => set('capacity', e.target.value)} />
        </div>
        <div className="create-event__form-group">
          <label className="create-event__form-label" htmlFor="evt-freq">Frequency</label>
          <select id="evt-freq" className="input" value={eventData.frequency} onChange={(e) => set('frequency', e.target.value)}>
            <option value="one-time">One-time</option>
            <option value="weekly">Weekly</option>
            <option value="biweekly">Bi-weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
        <div className="create-event__form-group">
          <label className="create-event__form-label" htmlFor="evt-skills">Criteria for volunteers (skills needed)</label>
          <input id="evt-skills" className="input" placeholder="e.g. Photography, First Aid, Gardening" value={eventData.skills_needed} onChange={(e) => set('skills_needed', e.target.value)} />
          <span className="create-event__form-hint">Separate multiple skills with commas</span>
        </div>

        <div className="create-event__form-group">
          <label className="create-event__form-label" htmlFor="evt-reqs">What to bring</label>
          <textarea id="evt-reqs" className="input" placeholder="What should volunteers bring or know?" rows={2} value={eventData.requirements} onChange={(e) => set('requirements', e.target.value)} />
        </div>

        <div className="create-event__form-section">
          <h3 className="text-sm font-semibold" style={{ marginBottom: 'var(--space-2)' }}>Contact Details for this Mission</h3>
          <p className="text-xs text-soft" style={{ marginBottom: 'var(--space-3)' }}>
            Volunteers will use these details to contact the organizer for this specific event.
          </p>
          <div className="create-event__form-row">
            <div className="create-event__form-group">
              <label className="create-event__form-label" htmlFor="evt-contact-email">Inquiry Email</label>
              <input id="evt-contact-email" type="email" className="input" placeholder="coordinator@org.com" value={eventData.contact_email} onChange={(e) => set('contact_email', e.target.value)} />
            </div>
            <div className="create-event__form-group">
              <label className="create-event__form-label" htmlFor="evt-contact-phone">Inquiry Phone</label>
              <input id="evt-contact-phone" type="tel" className="input" placeholder="+34 ..." value={eventData.contact_phone} onChange={(e) => set('contact_phone', e.target.value)} />
            </div>
          </div>
        </div>

        <div className="create-event__form-group" style={{ opacity: 0.8 }}>
          <label className="create-event__form-label">Automatic Reminders</label>
          <div className="card-warm" style={{ padding: 'var(--space-3)', fontSize: '0.9rem' }}>
            A reminder will be sent to all volunteers <strong>24 hours before</strong> the mission starts.
          </div>
        </div>

        <div className="create-event__actions">
          <button className="btn btn-primary" type="submit" disabled={status === 'saving'}>
            {status === 'saving' ? 'Saving...' : isEditing ? 'Update event' : 'Create event'}
          </button>
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => navigate('/dashboard/organizer')}
          >
            Cancel
          </button>
        </div>

        {status === 'saved' && (
          <div className="create-event__status create-event__status--success" role="status">
            {isEditing ? 'Event updated successfully' : 'Event created successfully'}
          </div>
        )}
        {status === 'error' && (
          <div className="create-event__status create-event__status--error" role="alert">
            Something went wrong. Please try again.
          </div>
        )}
      </form>

      <div style={{ height: 'var(--space-8)' }} />
    </Layout>
  );
};

export default CreateEvent;
