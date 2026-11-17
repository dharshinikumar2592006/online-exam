const test = require('node:test');
const assert = require('node:assert/strict');
const dfaEngine = require('../dfa/engine');
const { DFA_STATES, DFA_SYMBOLS, DFA_TRANSITIONS } = require('../dfa/states');

test('DFA Formal Specification Validation', () => {
  const spec = dfaEngine.getFormalSpecification();
  
  assert.equal(spec.initialState_q0, DFA_STATES.S0, 'Initial state must be S0 (NOT_LOGGED_IN)');
  assert.deepEqual(spec.acceptingStates_F, [DFA_STATES.S4, DFA_STATES.S5], 'Accepting states must be S4 and S5');
  assert.deepEqual(spec.trapStates, [DFA_STATES.S6], 'Trap state must be S6 (BLOCKED)');
  assert.equal(spec.states_Q.length, 7, 'Must have exactly 7 states (S0 through S6)');
});

test('Valid DFA Lifecycle: S0 -> S1 -> S2 -> S3 -> S4 (Manual Submission)', () => {
  let state = DFA_STATES.S0;

  // S0 -> S1 via LOGIN
  state = dfaEngine.getNextState(state, DFA_SYMBOLS.LOGIN);
  assert.equal(state, DFA_STATES.S1, 'S0 on LOGIN must reach S1 (AUTHENTICATED)');

  // S1 -> S2 via REQUEST_EXAM_ACCESS
  state = dfaEngine.getNextState(state, DFA_SYMBOLS.REQUEST_EXAM_ACCESS);
  assert.equal(state, DFA_STATES.S2, 'S1 on REQUEST_EXAM_ACCESS must reach S2 (EXAM_ACCESS_GRANTED)');

  // S2 -> S3 via START_EXAM
  state = dfaEngine.getNextState(state, DFA_SYMBOLS.START_EXAM);
  assert.equal(state, DFA_STATES.S3, 'S2 on START_EXAM must reach S3 (EXAM_IN_PROGRESS)');

  // S3 -> S3 via SAVE_ANSWER (self loop)
  const loopState = dfaEngine.getNextState(state, DFA_SYMBOLS.SAVE_ANSWER);
  assert.equal(loopState, DFA_STATES.S3, 'S3 on SAVE_ANSWER must remain in S3 (self-loop)');

  // S3 -> S4 via MANUAL_SUBMIT
  state = dfaEngine.getNextState(loopState, DFA_SYMBOLS.MANUAL_SUBMIT);
  assert.equal(state, DFA_STATES.S4, 'S3 on MANUAL_SUBMIT must reach S4 (SUBMITTED)');
  assert.ok(dfaEngine.acceptingStates.includes(state), 'S4 must be in accepting states F');
});

test('Valid DFA Timeout Lifecycle: S3 -> S5 (Automatic Submission on Expiry)', () => {
  const state = dfaEngine.getNextState(DFA_STATES.S3, DFA_SYMBOLS.TIME_EXPIRED);
  assert.equal(state, DFA_STATES.S5, 'S3 on TIME_EXPIRED must reach S5 (AUTO_SUBMITTED)');
  assert.ok(dfaEngine.acceptingStates.includes(state), 'S5 must be in accepting states F');
});

test('Security Violation & Admin Unblock: S3 -> S6 -> S1', () => {
  // S3 on VIOLATION_DETECTED -> S6 BLOCKED
  let state = dfaEngine.getNextState(DFA_STATES.S3, DFA_SYMBOLS.VIOLATION_DETECTED);
  assert.equal(state, DFA_STATES.S6, 'S3 on VIOLATION_DETECTED must enter S6 (BLOCKED)');

  // S6 is trap state; cannot submit or save answer
  assert.throws(() => {
    dfaEngine.getNextState(state, DFA_SYMBOLS.MANUAL_SUBMIT);
  }, /DFA Violation/, 'S6 must reject MANUAL_SUBMIT');

  assert.throws(() => {
    dfaEngine.getNextState(state, DFA_SYMBOLS.SAVE_ANSWER);
  }, /DFA Violation/, 'S6 must reject SAVE_ANSWER');

  // Admin unblock: S6 -> S1
  state = dfaEngine.getNextState(state, DFA_SYMBOLS.ADMIN_UNBLOCK);
  assert.equal(state, DFA_STATES.S1, 'S6 on ADMIN_UNBLOCK must transition to S1 (AUTHENTICATED)');
});

test('Rejection of Illegal State Transitions', () => {
  // Illegal jump: S1 directly to S4 (cannot submit without taking exam)
  assert.throws(() => {
    dfaEngine.getNextState(DFA_STATES.S1, DFA_SYMBOLS.MANUAL_SUBMIT);
  }, { code: 'INVALID_DFA_TRANSITION' });

  // Illegal jump: S0 (unauthenticated) cannot start exam
  assert.throws(() => {
    dfaEngine.getNextState(DFA_STATES.S0, DFA_SYMBOLS.START_EXAM);
  }, { code: 'INVALID_DFA_TRANSITION' });

  // Illegal jump: S1 cannot start exam without S2 access granted
  assert.throws(() => {
    dfaEngine.getNextState(DFA_STATES.S1, DFA_SYMBOLS.START_EXAM);
  }, { code: 'INVALID_DFA_TRANSITION' });

  // Terminal state S4 cannot record answers
  assert.throws(() => {
    dfaEngine.getNextState(DFA_STATES.S4, DFA_SYMBOLS.SAVE_ANSWER);
  }, { code: 'INVALID_DFA_TRANSITION' });

  // Terminal state S5 cannot be manually submitted
  assert.throws(() => {
    dfaEngine.getNextState(DFA_STATES.S5, DFA_SYMBOLS.MANUAL_SUBMIT);
  }, { code: 'INVALID_DFA_TRANSITION' });
});
