import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import MobileBottomNav from './MobileBottomNav';
import './Layout.css';

const Layout = ({ children, flush, backTo, backLabel }) => {
  const { isAuthenticated, isOrganizer, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={`layout ${flush ? 'layout--flush' : ''}`}>
      <a href="#main-content" className="skip-link">Skip to content</a>
      <nav className="layout-nav" aria-label="Main navigation">
        <div className="layout-nav__left">
          {backTo ? (
            <button
              className="layout-nav__back"
              onClick={() => navigate(backTo)}
              aria-label={backLabel || 'Go back'}
            >
              <ArrowLeft size={18} />
            </button>
          ) : (
            <Link to="/" className="layout-nav__logo">
              <div className="layout-nav__compass-icon">
                <Compass size={18} strokeWidth={2} />
              </div>
              <span className="layout-nav__brand">Impact Compass</span>
            </Link>
          )}
        </div>
        <div className={`layout-nav__right ${!isAuthenticated ? 'layout-nav__right--guest' : ''}`}>
          {isAuthenticated ? (
            <>
              <Link to="/feed" className="layout-nav__link">
                {isOrganizer ? 'Marketplace' : 'Discover'}
              </Link>
              <Link
                to="/dashboard"
                className="layout-nav__link"
              >
                Dashboard
              </Link>
              <Link
                to="/profile"
                className="layout-nav__link"
              >
                Profile
              </Link>
              <button
                type="button"
                onClick={logout}
                className="layout-nav__link layout-nav__link--btn"
              >
                Sign out
              </button>
            </>
          ) : (
            <Link to="/auth" className="layout-nav__link layout-nav__link--cta">
              Sign in
            </Link>
          )}
        </div>
      </nav>
      <main id="main-content" className="layout__inner">
        {children}
      </main>
      {isAuthenticated && <MobileBottomNav />}
    </div>
  );
};

export default Layout;
