/**
 * Deterministic Finite Automaton (DFA) States and Symbols Definition
 * Online Examination System
 */

const DFA_STATES = {
  S0: 'NOT_LOGGED_IN',
  S1: 'AUTHENTICATED',
  S2: 'EXAM_ACCESS_GRANTED',
  S3: 'EXAM_IN_PROGRESS',
  S4: 'SUBMITTED',
  S5: 'AUTO_SUBMITTED',
  S6: 'BLOCKED'
};

const DFA_STATE_INFO = {
  [DFA_STATES.S0]: {
    id: 'S0',
    name: 'NOT_LOGGED_IN',
    label: 'Not Logged In',
    type: 'INITIAL',
    description: 'User is unauthenticated or has logged out.',
    color: '#64748b' // Slate
  },
  [DFA_STATES.S1]: {
    id: 'S1',
    name: 'AUTHENTICATED',
    label: 'Authenticated',
    type: 'NORMAL',
    description: 'User credentials verified with valid JWT token.',
    color: '#0284c7' // Light blue / Ocean
  },
  [DFA_STATES.S2]: {
    id: 'S2',
    name: 'EXAM_ACCESS_GRANTED',
    label: 'Exam Access Granted',
    type: 'NORMAL',
    description: 'Exam prerequisites verified, instructions presented, ready to commence.',
    color: '#0891b2' // Cyan
  },
  [DFA_STATES.S3]: {
    id: 'S3',
    name: 'EXAM_IN_PROGRESS',
    label: 'Exam In Progress',
    type: 'ACTIVE',
    description: 'Active examination session. Questions displayed, timer running, answers recorded.',
    color: '#eab308' // Amber
  },
  [DFA_STATES.S4]: {
    id: 'S4',
    name: 'SUBMITTED',
    label: 'Submitted (Manual)',
    type: 'ACCEPTING',
    description: 'Exam voluntarily submitted by student before timeout.',
    color: '#10b981' // Emerald
  },
  [DFA_STATES.S5]: {
    id: 'S5',
    name: 'AUTO_SUBMITTED',
    label: 'Auto-Submitted (Timeout)',
    type: 'ACCEPTING',
    description: 'Exam automatically submitted upon timer expiration.',
    color: '#8b5cf6' // Purple
  },
  [DFA_STATES.S6]: {
    id: 'S6',
    name: 'BLOCKED',
    label: 'Blocked',
    type: 'TRAP',
    description: 'Security breach, violation (excessive tab switches), or administrative block.',
    color: '#ef4444' // Rose / Red
  }
};

const DFA_SYMBOLS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  REQUEST_EXAM_ACCESS: 'REQUEST_EXAM_ACCESS',
  START_EXAM: 'START_EXAM',
  SAVE_ANSWER: 'SAVE_ANSWER',
  MANUAL_SUBMIT: 'MANUAL_SUBMIT',
  TIME_EXPIRED: 'TIME_EXPIRED',
  VIOLATION_DETECTED: 'VIOLATION_DETECTED',
  ADMIN_BLOCK: 'ADMIN_BLOCK',
  ADMIN_UNBLOCK: 'ADMIN_UNBLOCK'
};

// Transition table: delta(current_state, symbol) => next_state
const DFA_TRANSITIONS = {
  [DFA_STATES.S0]: {
    [DFA_SYMBOLS.LOGIN]: DFA_STATES.S1
  },
  [DFA_STATES.S1]: {
    [DFA_SYMBOLS.LOGOUT]: DFA_STATES.S0,
    [DFA_SYMBOLS.REQUEST_EXAM_ACCESS]: DFA_STATES.S2,
    [DFA_SYMBOLS.ADMIN_BLOCK]: DFA_STATES.S6
  },
  [DFA_STATES.S2]: {
    [DFA_SYMBOLS.START_EXAM]: DFA_STATES.S3,
    [DFA_SYMBOLS.LOGOUT]: DFA_STATES.S0,
    [DFA_SYMBOLS.VIOLATION_DETECTED]: DFA_STATES.S6,
    [DFA_SYMBOLS.ADMIN_BLOCK]: DFA_STATES.S6
  },
  [DFA_STATES.S3]: {
    [DFA_SYMBOLS.SAVE_ANSWER]: DFA_STATES.S3, // Self-loop during exam
    [DFA_SYMBOLS.MANUAL_SUBMIT]: DFA_STATES.S4,
    [DFA_SYMBOLS.TIME_EXPIRED]: DFA_STATES.S5,
    [DFA_SYMBOLS.VIOLATION_DETECTED]: DFA_STATES.S6,
    [DFA_SYMBOLS.ADMIN_BLOCK]: DFA_STATES.S6
  },
  [DFA_STATES.S4]: {
    // S4 is an accepting final state for an exam session
  },
  [DFA_STATES.S5]: {
    // S5 is an accepting final state for an exam session
  },
  [DFA_STATES.S6]: {
    // Trap state: can only be unblocked by an explicit administrator action
    [DFA_SYMBOLS.ADMIN_UNBLOCK]: DFA_STATES.S1
  }
};

module.exports = {
  DFA_STATES,
  DFA_STATE_INFO,
  DFA_SYMBOLS,
  DFA_TRANSITIONS
};
