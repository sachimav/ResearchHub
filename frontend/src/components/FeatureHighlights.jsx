import React from 'react';

const FEATURES_DATA = [
  {
    id: 'project-proposal',
    title: 'Research project and proposal management',
    description: 'Submit, review, and track research proposals, problem statements, and methodology drafts with faculty approvals.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
        <line x1="16" y1="13" x2="8" y2="13" />
        <line x1="16" y1="17" x2="8" y2="17" />
      </svg>
    )
  },
  {
    id: 'supervisor-allocation',
    title: 'Supervisor allocation and management',
    description: 'Match and assign students to qualified faculty supervisors based on research domain and mentorship capacity.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    )
  },
  {
    id: 'document-submission',
    title: 'Research document submission and management',
    description: 'Centralized repository to securely submit, organize, and archive thesis chapters and ethical clearances.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
    )
  },
  {
    id: 'progress-milestone',
    title: 'Project progress and milestone tracking',
    description: 'Track semester milestones, viva defense dates, chapter sign-offs, and progress in a real-time timeline.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    )
  },
  {
    id: 'supervisor-feedback',
    title: 'Supervisor feedback and communication',
    description: 'Direct advisory communication, annotated review remarks, meeting logs, and rubric assessments.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
      </svg>
    )
  },
  {
    id: 'deadline-notifications',
    title: 'Deadline and project notifications',
    description: 'Automated alerts and reminders for approaching submission deadlines, defense panels, and reviews.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
    )
  },
  {
    id: 'similarity-detection',
    title: 'Research similarity / duplicate-topic detection',
    description: 'Cross-reference proposed topics against past university dissertations to ensure research originality.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="11" cy="11" r="8" />
        <path d="M21 21l-4.35-4.35" />
      </svg>
    )
  }
];

export default function FeatureHighlights() {
  return (
    <section id="features" className="features-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-tag">Key Features</span>
          <h2 className="section-title">Core Research Features</h2>
          <p className="section-subtitle">
            Essential tools for students and supervisors to manage university research efficiently.
          </p>
        </div>

        {/* Small Feature Cards Grid */}
        <div className="features-small-grid">
          {FEATURES_DATA.map((feat) => (
            <div key={feat.id} className="feature-small-card">
              <div className="feature-small-icon">
                {feat.icon}
              </div>
              <h3 className="feature-small-title">{feat.title}</h3>
              <p className="feature-small-desc">{feat.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
