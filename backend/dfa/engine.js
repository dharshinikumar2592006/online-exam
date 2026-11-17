/**
 * Deterministic Finite Automaton (DFA) Execution Engine
 * Formal Implementation of M = (Q, Sigma, delta, q0, F)
 */

const { DFA_STATES, DFA_STATE_INFO, DFA_SYMBOLS, DFA_TRANSITIONS } = require('./states');

class DFAEngine {
  constructor() {
    this.states = Object.values(DFA_STATES);
    this.initialState = DFA_STATES.S0;
    this.acceptingStates = [DFA_STATES.S4, DFA_STATES.S5];
    this.trapStates = [DFA_STATES.S6];
    this.symbols = Object.values(DFA_SYMBOLS);
    this.transitions = DFA_TRANSITIONS;
  }

  /**
   * Check if a transition is valid according to transition function delta
   * @param {string} currentState 
   * @param {string} symbol 
   * @returns {boolean}
   */
  canTransition(currentState, symbol) {
    if (!currentState || !this.transitions[currentState]) {
      return false;
    }
    return Boolean(this.transitions[currentState][symbol]);
  }

  /**
   * Compute delta(currentState, symbol)
   * Throws an error with formal explanation if invalid
   * @param {string} currentState 
   * @param {string} symbol 
   * @returns {string} nextState
   */
  getNextState(currentState, symbol) {
    if (!this.states.includes(currentState)) {
      throw new Error(`DFA Error: Unknown state '${currentState}' in state set Q.`);
    }

    if (!this.symbols.includes(symbol)) {
      throw new Error(`DFA Error: Unknown symbol '${symbol}' in alphabet Sigma.`);
    }

    const stateTransitions = this.transitions[currentState];
    if (!stateTransitions || !stateTransitions[symbol]) {
      const allowedSymbols = stateTransitions ? Object.keys(stateTransitions) : [];
      const errorMsg = `DFA Violation: Invalid state transition! Cannot transition from state '${currentState}' (${DFA_STATE_INFO[currentState]?.id || '?'}) with input symbol '${symbol}'. Allowed transitions from '${currentState}': [${allowedSymbols.join(', ') || 'None - Terminal state'}].`;
      const err = new Error(errorMsg);
      err.code = 'INVALID_DFA_TRANSITION';
      err.currentState = currentState;
      err.attemptedSymbol = symbol;
      err.allowedSymbols = allowedSymbols;
      throw err;
    }

    return stateTransitions[symbol];
  }

  /**
   * Perform state transition and record in session document
   * @param {Object} session - Mongoose ExamSession document
   * @param {string} symbol - DFA symbol
   * @param {Object} metadata - Context info (IP, reason, score, etc.)
   * @returns {Object} { previousState, currentState, symbol, timestamp }
   */
  async executeTransition(session, symbol, metadata = {}) {
    const currentState = session.currentState || DFA_STATES.S0;
    const nextState = this.getNextState(currentState, symbol);
    const timestamp = new Date();

    const transitionRecord = {
      fromState: currentState,
      toState: nextState,
      symbol,
      timestamp,
      metadata: {
        ...metadata,
        reason: metadata.reason || `Transition via ${symbol}`,
        timeRemainingSeconds: metadata.timeRemainingSeconds !== undefined ? metadata.timeRemainingSeconds : null
      }
    };

    session.currentState = nextState;
    if (!session.dfaHistory) {
      session.dfaHistory = [];
    }
    session.dfaHistory.push(transitionRecord);

    // Update timestamps and flags on session based on state
    if (nextState === DFA_STATES.S3 && !session.startedAt) {
      session.startedAt = timestamp;
    }

    if (nextState === DFA_STATES.S4) {
      session.submittedAt = timestamp;
      session.submissionType = 'MANUAL';
    }

    if (nextState === DFA_STATES.S5) {
      session.submittedAt = timestamp;
      session.submissionType = 'AUTO';
    }

    if (nextState === DFA_STATES.S6) {
      session.isBlocked = true;
      if (metadata.violationReason) {
        session.violationLogs = session.violationLogs || [];
        session.violationLogs.push({
          timestamp,
          reason: metadata.violationReason
        });
      }
    }

    if (currentState === DFA_STATES.S6 && nextState === DFA_STATES.S1) {
      session.isBlocked = false;
    }

    await session.save();

    return {
      previousState: currentState,
      currentState: nextState,
      symbol,
      timestamp,
      session
    };
  }

  /**
   * Get all outgoing transitions from a given state
   * @param {string} state 
   * @returns {Array<{symbol: string, nextState: string, info: Object}>}
   */
  getAvailableTransitions(state) {
    const transitionsForState = this.transitions[state] || {};
    return Object.entries(transitionsForState).map(([sym, next]) => ({
      symbol: sym,
      nextState: next,
      nextStateInfo: DFA_STATE_INFO[next]
    }));
  }

  /**
   * Return formal mathematical specification of this DFA
   */
  getFormalSpecification() {
    return {
      name: 'Online Examination Deterministic Finite Automaton (OES-DFA)',
      formalTuple: 'M = (Q, Sigma, delta, q0, F)',
      states_Q: Object.values(DFA_STATE_INFO),
      alphabet_Sigma: Object.values(DFA_SYMBOLS),
      initialState_q0: DFA_STATES.S0,
      acceptingStates_F: this.acceptingStates,
      trapStates: this.trapStates,
      transitionMatrix: this.transitions
    };
  }
}

const engine = new DFAEngine();

module.exports = engine;
module.exports.DFAEngine = DFAEngine;
