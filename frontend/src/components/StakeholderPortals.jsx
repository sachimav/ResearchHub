import React, { useState } from 'react';

const PORTAL_DATA = [
  {
    id: 'students',
    role: 'Students',
    title: 'Student Research Portal',
    badge: 'Research & Collaboration',
    description: 'Designed to guide undergraduates and postgraduates through every stage of their academic research lifecycle.',
    features: [
      { title: 'Project Registration', desc: 'Register research topics, problem statements, and methodology drafts.' },
      { title: 'Duplicate-Topic Novelty Check', desc: 'Pre-screen research titles against university archives to ensure novelty.' },
      { title: 'Progress Tracking', desc: 'Track chapters, defense schedules, and milestones in a structured timeline.' },
      { title: 'Supervisor Feedback Hub', desc: 'Access annotated feedback, meeting notes, and rubric scores in one place.' }
    ],
    actionText: 'Enter Student Portal'
  },
  {
    id: 'supervisors',
    role: 'Supervisors & Mentors',
    title: 'Supervisor Review Portal',
    badge: 'Evaluation & Mentorship',
    description: 'Empower faculty members to efficiently supervise multiple student cohorts, evaluate progress, and publish breakthroughs.',
    features: [
      { title: 'Structured Evaluation Rubrics', desc: 'Review student research progress with standardized department rubrics.' },
      { title: 'Milestone Sign-Offs', desc: 'Sign off on literature reviews, methodology, empirical testing, and final manuscripts.' },
      { title: 'Supervisory Meeting Logs', desc: 'Record bilateral meeting summaries, action items, and student progress notes.' },
      { title: 'Defense & Evaluation Panels', desc: 'Submit final viva voce scores and committee evaluation notes securely.' }
    ],
    actionText: 'Enter Supervisor Portal'
  },
  {
    id: 'administrators',
    role: 'Administrators & Deans',
    title: 'Administrative Control Center',
    badge: 'Governance & Analytics',
    description: 'Complete institutional visibility across all faculties, departments, ethics reviews, supervisor allocations, and university metrics.',
    features: [
      { title: 'Supervisor Allocation Engine', desc: 'Match students with faculty supervisors based on research domain and workload capacity.' },
      { title: 'Timeline & Milestone Scheduling', desc: 'Set institutional academic windows, defense periods, and progress checkpoints.' },
      { title: 'Accreditation & Quality Reports', desc: 'Export comprehensive statistical reports for university senate and Ministry accreditation.' },
      { title: 'Ethics Committee Clearance', desc: 'Manage institutional ethics reviews and compliance certifications.' }
    ],
    actionText: 'Enter Admin Dashboard'
  },
  {
    id: 'industry',
    role: 'Industry & Public',
    title: 'Industry & Collaboration Portal',
    badge: 'Tech Transfer & Talent',
    description: 'Bridge academic rigor with corporate innovation. Discover cutting-edge university research, sponsor projects, and scout top talent.',
    features: [
      { title: 'Public Research Repository', desc: 'Browse non-confidential research deliverables, whitepapers, and prototype demos.' },
      { title: 'Internship & Talent Pipeline', desc: 'Directly connect with top-performing student researchers for internships and R&D roles.' },
      { title: 'R&D Grant Sponsorship', desc: 'Sponsor university research tracks and provide real-world problem statements.' },
      { title: 'Technology Transfer', desc: 'Explore commercializable intellectual property and collaborative pilot projects.' }
    ],
    actionText: 'Explore Collaboration Opportunities'
  }
];

export default function StakeholderPortals() {
  const [activeTab, setActiveTab] = useState(0);
  const current = PORTAL_DATA[activeTab];

  return (
    <section id="portals" className="portals-section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Role-Based Ecosystem</span>
          <h2 className="section-title">One Unified Platform for All Stakeholders</h2>
          <p className="section-subtitle">
            ResearchHub connects every participant in the university research lifecycle with dedicated,
            role-tailored tools and real-time synchronicity.
          </p>
        </div>

        {/* Tab Selection Buttons — no emojis */}
        <div className="portal-tabs-nav">
          {PORTAL_DATA.map((item, idx) => (
            <button
              key={item.id}
              type="button"
              className={`portal-tab-btn ${activeTab === idx ? 'active' : ''}`}
              onClick={() => setActiveTab(idx)}
            >
              <span className="tab-label">{item.role}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="portal-content-card glass-card">
          <div className="portal-grid">
            {/* Left Info Column */}
            <div className="portal-info-col">
              <div className="portal-badge-row">
                <span className="badge-pill badge-plum">{current.badge}</span>
                <span className="portal-id-tag">Role: {current.role}</span>
              </div>

              <h3 className="portal-headline">{current.title}</h3>
              <p className="portal-desc-text">{current.description}</p>

              <div className="portal-features-list">
                {current.features.map((feat, i) => (
                  <div key={i} className="portal-feature-item">
                    <div className="feature-check-icon">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#670047" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="feature-title">{feat.title}</h4>
                      <p className="feature-desc">{feat.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="portal-btn-row">
                <button type="button" className="btn btn-primary">
                  <span>{current.actionText}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
                <span className="sso-hint">Integrated with University of Vavuniya SSO</span>
              </div>
            </div>

            {/* Right: Minimal portal preview frame — no dummy metrics */}
            <div className="portal-preview-col">
              <div className="preview-dashboard-frame">
                <div className="frame-header">
                  <div className="dots-row">
                    <span className="dot red"></span>
                    <span className="dot yellow"></span>
                    <span className="dot green"></span>
                  </div>
                  <div className="frame-address-bar">
                    researchhub.vau.ac.lk/{current.id}
                  </div>
                </div>

                <div className="frame-body">
                  <div className="mock-user-bar">
                    <div className="mock-avatar-text">{current.role.charAt(0)}</div>
                    <div>
                      <div className="mock-user-name">{current.role} Portal</div>
                      <div className="mock-user-role">University of Vavuniya — ResearchHub</div>
                    </div>
                  </div>

                  {/* No dummy metrics — just a "awaiting data" placeholder */}
                  <div className="portal-awaiting-db">
                    <div className="awaiting-icon">
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="1.5">
                        <ellipse cx="12" cy="5" rx="9" ry="3"/>
                        <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/>
                        <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/>
                      </svg>
                    </div>
                    <p className="awaiting-text">Live data will appear here once the database is connected.</p>
                  </div>

                  <div className="mock-action-list">
                    <div className="mock-action-item">
                      <span className="action-tag active">Module</span>
                      <span className="action-name">Research Portfolio Management</span>
                    </div>
                    <div className="mock-action-item">
                      <span className="action-tag active">Module</span>
                      <span className="action-name">Ethics Review & Clearance</span>
                    </div>
                    <div className="mock-action-item">
                      <span className="action-tag active">Module</span>
                      <span className="action-name">Topic Similarity Cross-Reference</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
