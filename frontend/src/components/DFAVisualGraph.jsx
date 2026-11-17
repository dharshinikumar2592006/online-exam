import React from 'react';

export const DFAVisualGraph = ({ currentState = 'NOT_LOGGED_IN', compact = false }) => {
  // State positions on a 800x260 SVG canvas
  const stateNodes = [
    { id: 'S0', name: 'NOT_LOGGED_IN', label: 'S0: Unauth', x: 60, y: 130, type: 'initial', color: '#64748b' },
    { id: 'S1', name: 'AUTHENTICATED', label: 'S1: Authed', x: 180, y: 130, type: 'normal', color: '#0284c7' },
    { id: 'S2', name: 'EXAM_ACCESS_GRANTED', label: 'S2: Granted', x: 310, y: 130, type: 'normal', color: '#0891b2' },
    { id: 'S3', name: 'EXAM_IN_PROGRESS', label: 'S3: In-Exam', x: 450, y: 130, type: 'active', color: '#eab308' },
    { id: 'S4', name: 'SUBMITTED', label: 'S4: Manual', x: 620, y: 70, type: 'accepting', color: '#10b981' },
    { id: 'S5', name: 'AUTO_SUBMITTED', label: 'S5: Auto', x: 620, y: 190, type: 'accepting', color: '#8b5cf6' },
    { id: 'S6', name: 'BLOCKED', label: 'S6: Blocked', x: 310, y: 225, type: 'trap', color: '#ef4444' }
  ];

  const transitions = [
    // Forward path
    { from: 'S0', to: 'S1', label: 'LOGIN', path: 'M 90 130 L 150 130' },
    { from: 'S1', to: 'S2', label: 'ACCESS', path: 'M 210 130 L 280 130' },
    { from: 'S2', to: 'S3', label: 'START', path: 'M 340 130 L 420 130' },
    // Accepting branch S3 -> S4
    { from: 'S3', to: 'S4', label: 'MANUAL_SUBMIT', path: 'M 475 110 Q 530 65 590 70' },
    // Accepting branch S3 -> S5
    { from: 'S3', to: 'S5', label: 'TIME_EXPIRED', path: 'M 475 150 Q 530 195 590 190' },
    // S3 -> S6 violation
    { from: 'S3', to: 'S6', label: 'VIOLATION', path: 'M 440 155 Q 390 220 340 225' },
    // S6 -> S1 admin unblock
    { from: 'S6', to: 'S1', label: 'UNBLOCK', path: 'M 285 215 Q 220 200 195 155' }
  ];

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '12px',
      border: '1px solid #e2e8f0',
      padding: compact ? '0.75rem' : '1.25rem',
      boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: '0.75rem',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: '700',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#1e40af',
            background: '#eff6ff',
            padding: '0.2rem 0.5rem',
            borderRadius: '4px'
          }}>
            Formal DFA Engine
          </span>
          <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#334155' }}>
            M = (Q, &Sigma;, &delta;, q&#8320;, F)
          </span>
        </div>
        <div style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Active State: <strong style={{ color: '#0f172a' }}>{currentState}</strong>
        </div>
      </div>

      <div style={{ width: '100%', overflowX: 'auto' }}>
        <svg
          viewBox="0 0 720 255"
          style={{ width: '100%', minWidth: compact ? '500px' : '650px', display: 'block' }}
        >
          <defs>
            <marker
              id="arrowhead"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 7 3.5, 0 7" fill="#94a3b8" />
            </marker>
            <marker
              id="arrowhead-active"
              markerWidth="7"
              markerHeight="7"
              refX="6"
              refY="3.5"
              orient="auto"
            >
              <polygon points="0 0, 7 3.5, 0 7" fill="#2563eb" />
            </marker>
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="#3b82f6" floodOpacity="0.6"/>
            </filter>
          </defs>

          {/* Self loop on S3 for SAVE_ANSWER */}
          <path
            d="M 438 105 C 438 65, 462 65, 462 105"
            fill="none"
            stroke={currentState === 'EXAM_IN_PROGRESS' ? '#2563eb' : '#cbd5e1'}
            strokeWidth={currentState === 'EXAM_IN_PROGRESS' ? '2.5' : '1.5'}
            markerEnd={currentState === 'EXAM_IN_PROGRESS' ? 'url(#arrowhead-active)' : 'url(#arrowhead)'}
          />
          <text x="450" y="58" textAnchor="middle" fontSize="9" fill="#64748b" fontWeight="600">
            SAVE_ANSWER &circlearrowright;
          </text>

          {/* Directed Transitions */}
          {transitions.map((t, i) => (
            <g key={i}>
              <path
                d={t.path}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="1.75"
                markerEnd="url(#arrowhead)"
              />
              {/* Optional label positioning could go here */}
            </g>
          ))}

          {/* Start indicator arrow pointing into S0 */}
          <line x1="15" y1="130" x2="35" y2="130" stroke="#64748b" strokeWidth="2" markerEnd="url(#arrowhead)" />
          <text x="15" y="122" fontSize="9" fontWeight="700" fill="#64748b">start</text>

          {/* States */}
          {stateNodes.map((node) => {
            const isActive = currentState === node.name || (currentState?.includes(node.id));
            const isAccepting = node.type === 'accepting';

            return (
              <g key={node.id} style={{ cursor: 'pointer' }}>
                {/* Outer pulsing ring for active state */}
                {isActive && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="29"
                    fill="none"
                    stroke={node.color}
                    strokeWidth="3"
                    strokeDasharray="4 2"
                    filter="url(#glow)"
                  >
                    <animateTransform
                      attributeName="transform"
                      type="rotate"
                      from={`0 ${node.x} ${node.y}`}
                      to={`360 ${node.x} ${node.y}`}
                      dur="8s"
                      repeatCount="indefinite"
                    />
                  </circle>
                )}

                {/* Double ring for accepting states */}
                {isAccepting && (
                  <circle
                    cx={node.x}
                    cy={node.y}
                    r="25"
                    fill="none"
                    stroke={isActive ? node.color : '#94a3b8'}
                    strokeWidth="1.5"
                  />
                )}

                {/* Main circle */}
                <circle
                  cx={node.x}
                  cy={node.y}
                  r="21"
                  fill={isActive ? node.color : '#ffffff'}
                  stroke={node.color}
                  strokeWidth={isActive ? '3' : '2'}
                  filter={isActive ? 'url(#glow)' : undefined}
                />

                {/* State Identifier text */}
                <text
                  cx={node.x}
                  cy={node.y}
                  x={node.x}
                  y={node.y + 4}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight="700"
                  fill={isActive ? '#ffffff' : node.color}
                >
                  {node.id}
                </text>

                {/* State Description below */}
                <text
                  x={node.x}
                  y={node.y + (node.id === 'S6' ? 24 : 33)}
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="600"
                  fill={isActive ? '#0f172a' : '#64748b'}
                >
                  {node.label.split(': ')[1]}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: '0.5rem',
        paddingTop: '0.5rem',
        borderTop: '1px dashed #e2e8f0',
        fontSize: '0.75rem',
        color: '#64748b',
        flexWrap: 'wrap',
        gap: '0.5rem'
      }}>
        <div>&bull; Single Ring: Transient State | &bull; Double Ring: Accepting State (F) | &bull; S6: Trap State</div>
        <div>Delta function &delta;(state, symbol) validated server-side</div>
      </div>
    </div>
  );
};

export default DFAVisualGraph;
