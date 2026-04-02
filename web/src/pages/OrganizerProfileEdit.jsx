import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, Check, Globe, Mail, Phone, Info } from 'lucide-react';
import Layout from '../components/Layout';
import { getMyOrganizationRaw as getMyOrganization, updateMyOrganizationRaw as updateMyOrganization } from '../lib/supabase';
import './OrganizerProfileEdit.css';

const CAUSES = [
  'Climate Action', 'Social Justice', 'Education', 'Animal Welfare',
  'Health & Wellbeing', 'Community Building', 'Arts & Culture', 'Poverty Alleviation',
];

const OrganizerProfileEdit = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [status, setStatus] = useState('idle');

  const [formData, setFormData] = useState({
    name: '',
    contactEmail: '',
    phone: '',
    description: '',
    focusAreas: [],
  });

  useEffect(() => {
    (async () => {
      try {
        const org = await getMyOrganization();
        if (org) {
          setFormData({
            name: org.name || '',
            contactEmail: org.contact_email || '',
            phone: org.phone || '',
            description: org.description || '',
            focusAreas: org.focus_areas || [],
          });
        }
      } catch (err) {
        console.error('Failed to load organization', err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const toggleFocusArea = (area) => {
    setFormData((prev) => {
      const exists = prev.focusAreas.includes(area);
      if (exists) {
        return { ...prev, focusAreas: prev.focusAreas.filter((a) => a !== area) };
      }
      return { ...prev, focusAreas: [...prev.focusAreas, area] };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setStatus('idle');
    try {
      await updateMyOrganization(formData);
      setStatus('success');
      setTimeout(() => navigate('/profile'), 1000);
    } catch (err) {
      console.error('Update failed', err);
      setStatus('error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout backTo="/profile" backLabel="Back to Profile">
        <div className="org-edit-loading">
          <div className="detail-spinner" />
          <p>Loading organization details...</p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout backTo="/profile" backLabel="Back to Profile">
      <div className="org-edit animate-fade-in">
        <header className="org-edit__header">
          <h1 className="font-serif">Organization Profile</h1>
          <p className="text-muted text-sm">Set your organization's global defaults for all events.</p>
        </header>

        <form onSubmit={handleSubmit} className="org-edit__form card-warm staggered-fade-in">
          <div className="org-edit__field">
            <label htmlFor="org-name">Organization Name</label>
            <div className="input-with-icon">
              <Globe size={16} />
              <input
                id="org-name"
                type="text"
                className="input"
                required
                placeholder="e.g. Barcelona Green Alliance"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          <div className="org-edit__row">
            <div className="org-edit__field">
              <label htmlFor="org-email">
                Public Contact Email <Info size={12} title="Volunteers will use this to reach out to you." />
              </label>
              <div className="input-with-icon">
                <Mail size={16} />
                <input
                  id="org-email"
                  type="email"
                  className="input"
                  required
                  placeholder="contact@organization.org"
                  value={formData.contactEmail}
                  onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                />
              </div>
            </div>
            <div className="org-edit__field">
              <label htmlFor="org-phone">Public Phone</label>
              <div className="input-with-icon">
                <Phone size={16} />
                <input
                  id="org-phone"
                  type="tel"
                  className="input"
                  placeholder="+34 ..."
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
            </div>
          </div>

          <div className="org-edit__field">
            <label htmlFor="org-desc">Organization Description</label>
            <textarea
              id="org-desc"
              className="input"
              rows={4}
              placeholder="What is your mission? What should volunteers know about you?"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="org-edit__field">
            <label>General Focus Areas</label>
            <div className="org-edit__causes">
              {CAUSES.map((cause) => {
                const isActive = formData.focusAreas.includes(cause);
                return (
                  <button
                    key={cause}
                    type="button"
                    className={`org-edit__cause-btn ${isActive ? 'org-edit__cause-btn--active' : ''}`}
                    onClick={() => toggleFocusArea(cause)}
                  >
                    {isActive && <Check size={12} />}
                    {cause}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="org-edit__actions">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving...' : <><Save size={16} /> Save Organization</>}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate('/profile')}
              disabled={saving}
            >
              Cancel
            </button>
          </div>

          {status === 'success' && (
            <div className="org-edit__status org-edit__status--success">
              Organization profile updated!
            </div>
          )}
          {status === 'error' && (
            <div className="org-edit__status org-edit__status--error">
              Could not save changes. Please try again.
            </div>
          )}
        </form>
      </div>
      <div style={{ height: 'var(--space-12)' }} />
    </Layout>
  );
};

export default OrganizerProfileEdit;
