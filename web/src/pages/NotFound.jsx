import React from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';

const NotFound = () => (
  <Layout>
    <div style={{ textAlign: 'center', padding: 'var(--space-16) 0' }}>
      <p className="text-eyebrow" style={{ marginBottom: 'var(--space-3)' }}>404</p>
      <h1 style={{ marginBottom: 'var(--space-3)' }}>Page not found</h1>
      <p className="text-muted" style={{ marginBottom: 'var(--space-6)' }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link to="/" className="btn btn-primary">Back to home</Link>
    </div>
  </Layout>
);

export default NotFound;
