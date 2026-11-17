import React from 'react';

export const Footer = () => {
  return (
    <footer style={{
      backgroundColor: '#ffffff',
      borderTop: '1px solid #e2e8f0',
      padding: '1.5rem',
      textAlign: 'center',
      fontSize: '0.825rem',
      color: '#64748b',
      marginTop: 'auto'
    }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
        <div>
          <strong>AutoExam</strong> &mdash; Online Examination System Powered by Deterministic Finite Automata (DFA)
        </div>
        <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: '0.75rem' }}>
          States: S0 &rarr; S1 &rarr; S2 &rarr; S3 &rarr; [S4 | S5] (Accepting) | S6 (Trap)
        </div>
      </div>
    </footer>
  );
};

export default Footer;
