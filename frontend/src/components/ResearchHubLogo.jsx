import React from 'react';

export default function ResearchHubLogo({ className = '', fontSize = 26, lightMode = false }) {
  return (
    <div 
      className={`researchhub-brand-text ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center', cursor: 'pointer', userSelect: 'none' }}
    >
      <span 
        style={{ 
          fontFamily: 'var(--font-heading, "Outfit", sans-serif)',
          fontSize: `${fontSize}px`,
          fontWeight: 800,
          letterSpacing: '-0.6px',
          color: lightMode ? '#ffffff' : '#1e121d',
          lineHeight: 1
        }}
      >
        Research<span style={{ color: '#670047' }}>Hub</span>
      </span>
    </div>
  );
}
