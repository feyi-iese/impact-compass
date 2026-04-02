import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, CalendarDays, User, LayoutDashboard, Store } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import './MobileBottomNav.css';

const VOLUNTEER_TABS = [
  { label: 'Discover', icon: Compass, path: '/feed' },
  { label: 'My Events', icon: CalendarDays, path: '/dashboard' },
  { label: 'Profile', icon: User, path: '/profile' },
];

const ORGANIZER_TABS = [
  { label: 'Marketplace', icon: Store, path: '/feed' },
  { label: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
  { label: 'Profile', icon: User, path: '/profile' },
];

const MobileBottomNav = () => {
  const { pathname } = useLocation();
  const { isOrganizer } = useAuth();

  const tabs = isOrganizer ? ORGANIZER_TABS : VOLUNTEER_TABS;

  return (
    <nav className="mobile-bottom-nav" aria-label="Mobile navigation">
      {tabs.map((tab) => {
        const isActive =
          pathname === tab.path ||
          (tab.path === '/dashboard' && pathname.startsWith('/dashboard'));
        const TabIcon = tab.icon;

        return (
          <Link
            key={tab.path}
            to={tab.path}
            className={`mobile-bottom-nav__tab ${isActive ? 'mobile-bottom-nav__tab--active' : ''}`}
            aria-current={isActive ? 'page' : undefined}
          >
            <span className="mobile-bottom-nav__icon">
              <TabIcon size={22} />
            </span>
            <span className="mobile-bottom-nav__label">{tab.label}</span>
          </Link>
        );
      })}
    </nav>
  );
};

export default MobileBottomNav;
