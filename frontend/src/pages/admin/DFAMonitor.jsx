import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { DFAVisualGraph } from '../../components/DFAVisualGraph';
import { DFAStateBadge } from '../../components/DFAStateBadge';
import { Shield, Cpu, RefreshCw, Layers, CheckCircle2, ArrowRight } from 'lucide-react';

export const DFAMonitor = () => {
  const [spec, setSpec] = useState(null);
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeStateTab, setActiveStateTab] = useState('ALL');

  const fetchData = async () => {
    setLoading(true);
    try {
      const [specRes, overviewRes] = await Promise.all([
        api.getDfaSpec(),
        api.getAdminOverview()
      ]);
      setSpec(specRes.data);
      setOverview(overviewRes);
    } catch (err) {
      console.error('Failed to load DFA monitor data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#64748b' }}>
        Loading formal Deterministic Finite Automaton specifications...
      </div>
    );
  }

  const dfaDist = overview?.stats?.dfaStateDistribution || {};
  const states = spec?.states || {};
  const transitions = spec?.graphData?.transitions || [];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#2563eb', fontSize: '0.85rem', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
            <Cpu size={16} />
            <span>Formal Language & Automata Theory</span>
          </div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: '#0f172a' }}>
            Deterministic Finite Automaton (DFA) Engine
          </h1>
          <p style={{ color: '#64748b', fontSize: '0.925rem' }}>
            Live mathematical state tracking, transitions verification, and security guarantees
          </p>
        </div>

        <button onClick={fetchData} className="btn btn-outline btn-sm">
          <RefreshCw size={15} />
          <span>Sync Automaton</span>
        </button>
      </div>

      {/* Formal 5-Tuple Definition Card */}
      <div className="card" style={{ background: '#f8fafc', border: '1.5px solid #bfdbfe' }}>
        <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#1e40af', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <Layers size={18} />
          <span>Formal 5-Tuple Specification: M = (Q, &Sigma;, &delta;, q&#8320;, F)</span>
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1.25rem', fontSize: '0.875rem' }}>
          <div>
            <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
              Q = Finite Set of States (7 States)
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', color: '#475569', fontSize: '0.825rem', background: '#ffffff', padding: '0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              {'{ S0: NOT_LOGGED_IN, S1: AUTHENTICATED, S2: EXAM_ACCESS_GRANTED, S3: EXAM_IN_PROGRESS, S4: SUBMITTED, S5: AUTO_SUBMITTED, S6: BLOCKED }'}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
              &Sigma; = Input Alphabet (10 Symbols)
            </div>
            <div style={{ fontFamily: 'JetBrains Mono, monospace', color: '#475569', fontSize: '0.825rem', background: '#ffffff', padding: '0.6rem', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
              {'{ LOGIN, LOGOUT, REQUEST_EXAM_ACCESS, START_EXAM, SAVE_ANSWER, MANUAL_SUBMIT, TIME_EXPIRED, VIOLATION_DETECTED, ADMIN_BLOCK, ADMIN_UNBLOCK }'}
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
              q&#8320; = Initial State
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span className="badge badge-s0">[S0] NOT_LOGGED_IN</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Default start state upon connection</span>
            </div>
          </div>

          <div>
            <div style={{ fontWeight: 700, color: '#334155', marginBottom: '0.25rem' }}>
              F = Set of Accepting Final States
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-s4">[S4] SUBMITTED</span>
              <span className="badge badge-s5">[S5] AUTO_SUBMITTED</span>
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>Double ring in state diagram</span>
            </div>
          </div>
        </div>
      </div>

      {/* Visual State Machine Diagram */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
          Interactive Automaton State Diagram
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
          Directed transitions with automated server-side verification:
        </p>

        <DFAVisualGraph currentState="EXAM_IN_PROGRESS" />
      </div>

      {/* Complete Transition Matrix Table */}
      <div className="card">
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
          Transition Function Matrix &delta;(State, Symbol) &rarr; State
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#64748b', marginBottom: '1.25rem' }}>
          All mapped transitions in the deterministic state transition table. Any unspecified (state, symbol) pair is strictly rejected:
        </p>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>From State</th>
                <th>Input Symbol (&Sigma;)</th>
                <th>Target State</th>
                <th>Semantics / Description</th>
              </tr>
            </thead>
            <tbody>
              {transitions.map((t, idx) => (
                <tr key={idx}>
                  <td>
                    <span className={`badge badge-${t.from.toLowerCase()}`}>
                      [{t.from}] {states[t.from]?.name || t.from}
                    </span>
                  </td>
                  <td>
                    <code style={{ color: '#1e40af', fontWeight: 700 }}>{t.symbol}</code>
                  </td>
                  <td>
                    <span className={`badge badge-${t.to.toLowerCase()}`}>
                      [{t.to}] {states[t.to]?.name || t.to}
                    </span>
                  </td>
                  <td style={{ fontSize: '0.875rem', color: '#475569' }}>
                    {t.label}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DFAMonitor;
