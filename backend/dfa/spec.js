/**
 * DFA Specification and Visual Graph Data
 * Useful for frontend rendering (visual graph, transition tables)
 */

const { DFA_STATES, DFA_STATE_INFO, DFA_SYMBOLS, DFA_TRANSITIONS } = require('./states');

const DFA_SPEC = {
  tuple: {
    Q: [
      { id: 'S0', name: DFA_STATES.S0, label: 'Not Logged In', type: 'initial' },
      { id: 'S1', name: DFA_STATES.S1, label: 'Authenticated', type: 'normal' },
      { id: 'S2', name: DFA_STATES.S2, label: 'Exam Access Granted', type: 'normal' },
      { id: 'S3', name: DFA_STATES.S3, label: 'Exam In Progress', type: 'active' },
      { id: 'S4', name: DFA_STATES.S4, label: 'Submitted (Manual)', type: 'accepting' },
      { id: 'S5', name: DFA_STATES.S5, label: 'Auto-Submitted (Timeout)', type: 'accepting' },
      { id: 'S6', name: DFA_STATES.S6, label: 'Blocked (Violation/Trap)', type: 'trap' }
    ],
    Sigma: [
      'LOGIN',
      'LOGOUT',
      'REQUEST_EXAM_ACCESS',
      'START_EXAM',
      'SAVE_ANSWER',
      'MANUAL_SUBMIT',
      'TIME_EXPIRED',
      'VIOLATION_DETECTED',
      'ADMIN_BLOCK',
      'ADMIN_UNBLOCK'
    ],
    q0: DFA_STATES.S0,
    F: [DFA_STATES.S4, DFA_STATES.S5],
    transitions: [
      { from: 'S0', to: 'S1', symbol: 'LOGIN', label: 'Valid credentials' },
      { from: 'S1', to: 'S0', symbol: 'LOGOUT', label: 'User signs out' },
      { from: 'S1', to: 'S2', symbol: 'REQUEST_EXAM_ACCESS', label: 'Student opens exam & verifies rules' },
      { from: 'S1', to: 'S6', symbol: 'ADMIN_BLOCK', label: 'Admin restricts user' },
      { from: 'S2', to: 'S3', symbol: 'START_EXAM', label: 'Timer begins, questions loaded' },
      { from: 'S2', to: 'S0', symbol: 'LOGOUT', label: 'User exits before starting' },
      { from: 'S2', to: 'S6', symbol: 'VIOLATION_DETECTED', label: 'Early security breach' },
      { from: 'S2', to: 'S6', symbol: 'ADMIN_BLOCK', label: 'Admin locks exam session' },
      { from: 'S3', to: 'S3', symbol: 'SAVE_ANSWER', label: 'Self-loop: Answer recorded' },
      { from: 'S3', to: 'S4', symbol: 'MANUAL_SUBMIT', label: 'Student clicks Submit' },
      { from: 'S3', to: 'S5', symbol: 'TIME_EXPIRED', label: 'Exam duration elapsed' },
      { from: 'S3', to: 'S6', symbol: 'VIOLATION_DETECTED', label: 'Excessive tab switches / breach' },
      { from: 'S3', to: 'S6', symbol: 'ADMIN_BLOCK', label: 'Admin emergency session lock' },
      { from: 'S6', to: 'S1', symbol: 'ADMIN_UNBLOCK', label: 'Admin restores access' }
    ]
  }
};

module.exports = DFA_SPEC;
