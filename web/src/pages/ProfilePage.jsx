import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { User, Settings, LogOut, CheckCircle2, Hourglass, Calendar, Users } from 'lucide-react';
import Layout from '../components/Layout';
import { useAuth } from '../context/useAuth';
import { 
  getMyVolunteerSignupsRaw as getMyVolunteerSignups,
  getOrganizerEventMetricsRaw as getOrganizerEventMetrics,
  getMyOrganizationRaw as getMyOrganization
} from '../lib/supabase';
import './ProfilePage.css';

const ProfilePage = () => {
  const { profile, logout, isOrganizer } = useAuth();
  const [pastMissions, setPastMissions] = useState([]);
  const [org, setOrg] = useState(null);
  const [organizerStats, setOrganizerStats] = useState({ active: 0, signups: 0, fillRate: 0 });

  useEffect(() => {
    (async () => {
      try {
        if (isOrganizer) {
          const [organization, events] = await Promise.all([
            getMyOrganization(),
            getOrganizerEventMetrics(),
          ]);
          setOrg(organization);
          
          const now = Date.now();
          const upcoming = (events || []).filter(e => new Date(e.date_time).getTime() >= now);
          const totalSignups = (events || []).reduce((sum, e) => sum + (e.signup_count || 0), 0);
          const totalCapacity = (events || []).reduce((sum, e) => sum + (e.capacity || 0), 0);
          const fillRate = totalCapacity > 0 ? Math.round((totalSignups / totalCapacity) * 100) : 0;
          
          setOrganizerStats({
            active: upcoming.length,
            signups: totalSignups,
            fillRate: fillRate
          });
        } else {
          const data = await getMyVolunteerSignups();
          const now = Date.now();
          const past = (data || []).filter(
            (s) => s.status !== 'cancelled' && s.events?.date_time && new Date(s.events.date_time).getTime() < now
          );
          setPastMissions(past);
        }
      } catch {
        // Stats will default to empty/0
      }
    })();
  }, [isOrganizer]);

  const totalHoursVolunteered = useMemo(() => {
    const totalMinutes = pastMissions.reduce((sum, row) => {
      return sum + (row.events?.duration_minutes || 0);
    }, 0);
    if (totalMinutes === 0) return null;
    const h = Math.floor(totalMinutes / 60);
    const m = totalMinutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  }, [pastMissions]);

  const location = profile?.zip_code || profile?.city || null;
  const displayName = profile?.display_name?.trim() || null;
  const roleLabel = profile?.role === 'organizer' ? 'Organizer' : 'Volunteer';

  return (
    <Layout>
      <div className="profile-page animate-fade-in">
        <h1 className="profile-page__title">Profile</h1>

        {/* User card */}
        <div className="profile-page__user-card">
          <div className="profile-page__avatar">
            <User size={26} strokeWidth={1.5} />
          </div>
          <div className="profile-page__user-info">
            <span className="profile-page__user-name">{displayName || roleLabel}</span>
            {displayName && (
              <span className="profile-page__user-role">{roleLabel}</span>
            )}
            {location && (
              <span className="profile-page__user-location">
                Barcelona, {location}
              </span>
            )}
          </div>
        </div>

        {/* Impact Stats */}
        <div className="profile-page__stats">
          {isOrganizer ? (
            <>
              <div className="profile-page__stat">
                <span className="profile-page__stat-label">
                  <Calendar size={14} /> Active Events
                </span>
                <span className="profile-page__stat-value">{organizerStats.active}</span>
              </div>
              <div className="profile-page__stat">
                <span className="profile-page__stat-label">
                  <Users size={14} /> Total Signups
                </span>
                <span className="profile-page__stat-value">{organizerStats.signups}</span>
              </div>
            </>
          ) : (
            <>
              <div className="profile-page__stat">
                <span className="profile-page__stat-label">
                  <CheckCircle2 size={14} /> Missions Completed
                </span>
                <span className="profile-page__stat-value">{pastMissions.length}</span>
              </div>
              {totalHoursVolunteered && (
                <div className="profile-page__stat">
                  <span className="profile-page__stat-label">
                    <Hourglass size={14} /> Hours Volunteered
                  </span>
                  <span className="profile-page__stat-value">{totalHoursVolunteered}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Preferences / Org Info summary */}
        <div className="profile-page__preferences">
          <h3 className="profile-page__preferences-title">
            <CheckCircle2 size={16} /> {isOrganizer ? 'Organization Info' : 'Preferences'}
          </h3>
          <div className="profile-page__pref-grid">
            {isOrganizer ? (
              <>
                <div className="profile-page__pref-row">
                  <span className="profile-page__pref-label">Org Name</span>
                  <span className="profile-page__pref-value">{org?.name || 'Not set'}</span>
                </div>
                <div className="profile-page__pref-row">
                  <span className="profile-page__pref-label">Contact Email</span>
                  <span className="profile-page__pref-value">{org?.contact_email || 'Not set'}</span>
                </div>
                <div className="profile-page__pref-row">
                  <span className="profile-page__pref-label">Phone</span>
                  <span className="profile-page__pref-value">{org?.phone || 'Not set'}</span>
                </div>
                <div className="profile-page__pref-row">
                  <span className="profile-page__pref-label">Focus Areas</span>
                  <span className="profile-page__pref-value">
                    {org?.focus_areas?.length ? (
                      <span className="profile-page__causes">
                        {org.focus_areas.map((area) => (
                          <span key={area} className="profile-page__cause-tag">{area}</span>
                        ))}
                      </span>
                    ) : 'Not set'}
                  </span>
                </div>
              </>
            ) : (
              <>
                <div className="profile-page__pref-row">
                  <span className="profile-page__pref-label">Name</span>
                  <span className="profile-page__pref-value">{displayName || 'Not set'}</span>
                </div>
                <div className="profile-page__pref-row">
                  <span className="profile-page__pref-label">Location</span>
                  <span className="profile-page__pref-value">{profile?.zip_code || 'Not set'}</span>
                </div>
                <div className="profile-page__pref-row">
                  <span className="profile-page__pref-label">Impact Areas</span>
                  <span className="profile-page__pref-value">
                    {profile?.causes?.length ? (
                      <span className="profile-page__causes">
                        {profile.causes.map((c) => (
                          <span key={c} className="profile-page__cause-tag">{c}</span>
                        ))}
                      </span>
                    ) : 'Not set'}
                  </span>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="profile-page__actions">
          <Link to={isOrganizer ? '/profile/organizer/edit' : '/onboarding'} className="profile-page__action">
            <span>{isOrganizer ? 'Update Organization' : 'Edit preferences'}</span>
            <span className="profile-page__action-icon">
              <Settings size={18} />
            </span>
          </Link>

          <button
            type="button"
            className="profile-page__action profile-page__action--danger"
            onClick={logout}
          >
            <span>Log out</span>
            <span className="profile-page__action-icon">
              <LogOut size={18} />
            </span>
          </button>
        </div>
      </div>
    </Layout>
  );
};

export default ProfilePage;
