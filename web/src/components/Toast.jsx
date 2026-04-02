import React, { useEffect, useState } from 'react';

const Toast = ({ message, duration = 2500, onDone }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      setTimeout(() => onDone?.(), 300);
    }, duration);
    return () => clearTimeout(t);
  }, [duration, onDone]);

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 'max(24px, env(safe-area-inset-bottom))',
        left: '50%',
        transform: `translateX(-50%) translateY(${visible ? '0' : '16px'})`,
        background: 'var(--color-text-main)',
        color: '#fff',
        fontSize: '0.85rem',
        fontFamily: 'var(--font-body)',
        padding: '10px 20px',
        borderRadius: 'var(--radius-full)',
        boxShadow: 'var(--shadow-lg)',
        opacity: visible ? 1 : 0,
        transition: 'all 0.3s var(--ease-out-expo)',
        zIndex: 10001,
        pointerEvents: 'none',
        whiteSpace: 'nowrap',
      }}
    >
      {message}
    </div>
  );
};

export default Toast;
