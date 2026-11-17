import React from 'react';

const STATE_CONFIG = {
  NOT_LOGGED_IN: { id: 'S0', label: 'Not Logged In', class: 'badge-s0' },
  AUTHENTICATED: { id: 'S1', label: 'Authenticated', class: 'badge-s1' },
  EXAM_ACCESS_GRANTED: { id: 'S2', label: 'Access Granted', class: 'badge-s2' },
  EXAM_IN_PROGRESS: { id: 'S3', label: 'In Progress', class: 'badge-s3' },
  SUBMITTED: { id: 'S4', label: 'Submitted (Manual)', class: 'badge-s4' },
  AUTO_SUBMITTED: { id: 'S5', label: 'Auto-Submitted', class: 'badge-s5' },
  BLOCKED: { id: 'S6', label: 'Blocked', class: 'badge-s6' }
};

export const DFAStateBadge = ({ state, showId = true, className = '' }) => {
  const config = STATE_CONFIG[state] || {
    id: state?.startsWith('S') ? state : '?',
    label: state || 'Unknown',
    class: 'badge-s0'
  };

  return (
    <span className={`badge ${config.class} ${className}`} title={`Deterministic State: ${state}`}>
      {showId && <strong style={{ opacity: 0.85 }}>[{config.id}]</strong>}
      <span>{config.label}</span>
    </span>
  );
};

export default DFAStateBadge;
