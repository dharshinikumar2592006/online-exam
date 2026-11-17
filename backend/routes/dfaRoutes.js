const express = require('express');
const router = express.Router();
const DFA_SPEC = require('../dfa/spec');
const dfaEngine = require('../dfa/engine');
const { DFA_STATES, DFA_STATE_INFO, DFA_SYMBOLS, DFA_TRANSITIONS } = require('../dfa/states');

// @desc Get formal specification of the Deterministic Finite Automaton
// @route GET /api/dfa/spec
router.get('/spec', (req, res) => {
  return res.json({
    success: true,
    data: {
      name: 'Deterministic Finite Automaton for Online Examination Lifecycle',
      formalTuple: 'M = (Q, Sigma, delta, q0, F)',
      description: 'Formal DFA controlling security, authorization, timekeeping, and submission lifecycle of online examination sessions.',
      states: DFA_STATE_INFO,
      alphabet: DFA_SYMBOLS,
      transitionMatrix: DFA_TRANSITIONS,
      initialState: DFA_STATES.S0,
      acceptingStates: [DFA_STATES.S4, DFA_STATES.S5],
      trapStates: [DFA_STATES.S6],
      graphData: DFA_SPEC.tuple
    }
  });
});

module.exports = router;
