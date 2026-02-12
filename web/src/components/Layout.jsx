import React from 'react';
import './Layout.css';

const Layout = ({ children, flush }) => {
  return (
    <div className={`layout ${flush ? 'layout--flush' : ''}`}>
      <div className="layout__inner">
        {children}
      </div>
    </div>
  );
};

export default Layout;
