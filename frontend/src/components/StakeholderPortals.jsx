import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

const UNIVERSITY_STATS = [
  {
    id: 'conducted-research',
    value: '1,280+',
    label: 'Researches Conducted',
    detail: 'Completed academic theses, dissertations, and capstone projects across all faculties',
    badge: 'Verified Repository',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        <line x1="9" y1="7" x2="15" y2="7" />
        <line x1="9" y1="11" x2="13" y2="11" />
      </svg>
    ),
  },
  {
    id: 'active-studies',
    value: '186',
    label: 'Active Research Studies',
    detail: 'Undergraduate and postgraduate projects currently under development and supervision',
    badge: '2025/2026 Cycle',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
      </svg>
    ),
  },
  {
    id: 'supervisors-mentors',
    value: '78+',
    label: 'Academic Supervisors',
    detail: 'Faculty professors, senior lecturers, and industry mentors offering specialized guidance',
    badge: 'Expert Faculty',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
        <path d="M16 3.13a4 4 0 0 1 0 7.75" />
      </svg>
    ),
  },
  {
    id: 'publications-patents',
    value: '420+',
    label: 'Publications & Innovations',
    detail: 'Peer-reviewed research articles, international conference proceedings, and inventions',
    badge: 'Global Impact',
    icon: (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="7" />
        <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
      </svg>
    ),
  },
];

export default function StakeholderPortals() {
  const navigate = useNavigate();

  return (
    <section id="portals" className="portals-section">
      <div className="container">
        {/* Section Header */}
        <div className="section-header">
          <span className="section-tag">University Research Output &amp; Access</span>
          <h2 className="section-title">University Research Overview &amp; Portals</h2>
        </div>

        {/* Research Statistics Cards ("carts like number of researcs university did") */}
        <div className="stats-cards-grid">
          {UNIVERSITY_STATS.map((stat) => (
            <div key={stat.id} className="stat-card glass-card">

              <div className="stat-card-body">
                <div className="stat-card-value">{stat.value}</div>
                <h3 className="stat-card-title">{stat.label}</h3>
                <p className="stat-card-desc">{stat.detail}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Dual Entry Gateways with the Two Buttons */}
        <div className="portal-gateways-container">
          <div className="portal-gateways-header">
            <h3 className="gateways-heading">Get Started</h3>

          </div>

          <div className="portal-gateways-grid">
            {/* Enter as Student Card */}
            <div className="gateway-card glass-card">
              <div className="gateway-card-header">
                <div className="gateway-icon student-avatar">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                </div>
                <div>
                  <span className="badge-pill badge-plum">Student Portal</span>
                  <h4 className="gateway-role-title">Undergraduate &amp; Postgraduate</h4>
                </div>
              </div>

              <p className="gateway-role-desc">
                Submit research proposals, verify topic novelty against university archives, track milestone deadlines, and collaborate with your assigned mentor.
              </p>

              <ul className="gateway-feature-bullets">
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#670047" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Submit proposals and research documents</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#670047" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Track project progress and milestones.</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#670047" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Receive supervisor feedback.</span>
                </li>
              </ul>

              <button
                type="button"
                className="btn btn-primary btn-block gateway-btn"
                onClick={() => navigate('/login?role=student')}
              >
                <span>Enter as Student</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            {/* Enter as Supervisor Card */}
            <div className="gateway-card glass-card">
              <div className="gateway-card-header">
                <div className="gateway-icon supervisor-avatar">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </div>
                <div>
                  <span className="badge-pill badge-gold">Supervisor Portal</span>
                  <h4 className="gateway-role-title">Faculty Members &amp; Mentors</h4>
                </div>
              </div>

              <p className="gateway-role-desc">
                Review and approve student research submissions, evaluate milestones using faculty-standard rubrics, record advisory meeting logs, and submit marks.
              </p>

              <ul className="gateway-feature-bullets">
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Review research proposals.</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Monitor project progress.</span>
                </li>
                <li>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4af37" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Provide feedback.</span>
                </li>
              </ul>

              <button
                type="button"
                className="btn btn-outline btn-block gateway-btn gateway-btn-supervisor"
                onClick={() => navigate('/login?role=supervisor')}
              >
                <span>Enter as Supervisor</span>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
