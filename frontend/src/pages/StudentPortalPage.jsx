import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import projectLogo from '../assets/logo.png';
import { getCurrentUser, logoutUser } from '../services/authService';

export default function StudentPortalPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      // Not logged in or logged out
      setCurrentUser({
        name: 'Student Researcher',
        email: 'student@vau.ac.lk',
        role: 'student'
      });
    } else {
      setCurrentUser(user);
    }
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  return (
    <div className="portal-page-wrapper">
      {/* Portal Top Bar */}
      <header className="portal-header">
        <div className="container portal-header-inner">
          <div className="portal-brand">
            <Link to="/" className="portal-logo-link" title="ResearchHub Home">
              <img src={projectLogo} alt="ResearchHub Logo" className="portal-logo" />
            </Link>
            <div className="portal-title-badge">
              <span className="badge-pill badge-plum">Student Portal</span>
            </div>
          </div>

          <div className="portal-user-actions">
            <div className="portal-user-profile">
              <div className="user-avatar-circle">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'S'}
              </div>
              <div className="user-meta">
                <span className="user-name">{currentUser?.name || 'Student Researcher'}</span>
                <span className="user-email">{currentUser?.email}</span>
              </div>
            </div>

            <button
              type="button"
              className="btn btn-outline btn-sm logout-btn"
              onClick={handleLogout}
              title="Sign Out"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Portal Body */}
      <main className="portal-main-content">
        <div className="container">
          {/* Welcome Banner */}
          <div className="portal-welcome-banner glass-card">
            <div className="welcome-text">
              <span className="welcome-tag">Academic Research Workspace • 2025/2026</span>
              <h1 className="welcome-title">
                Welcome back, {currentUser?.name || 'Student Researcher'}!
              </h1>
              <p className="welcome-subtitle">
                Manage your undergraduate research lifecycle, upload milestone documentation, track supervisor reviews, and verify project originality.
              </p>
            </div>
            <div className="welcome-quick-actions">
              <Link to="/showcase" className="btn btn-glass-light btn-sm">
                <span>View Public Showcase</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Quick Metrics */}
          <div className="portal-metrics-grid">
            <div className="portal-metric-card glass-card">
              <div className="metric-icon plum-bg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="metric-info">
                <span className="metric-value">Active</span>
                <span className="metric-label">Research Status</span>
              </div>
            </div>

            <div className="portal-metric-card glass-card">
              <div className="metric-icon gold-bg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </svg>
              </div>
              <div className="metric-info">
                <span className="metric-value">Milestone 3</span>
                <span className="metric-label">Current Stage</span>
              </div>
            </div>

            <div className="portal-metric-card glass-card">
              <div className="metric-icon emerald-bg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2">
                  <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                  <polyline points="22 4 12 14.01 9 11.01" />
                </svg>
              </div>
              <div className="metric-info">
                <span className="metric-value">75%</span>
                <span className="metric-label">Overall Completion</span>
              </div>
            </div>

            <div className="portal-metric-card glass-card">
              <div className="metric-icon cyan-bg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <div className="metric-info">
                <span className="metric-value">Assigned</span>
                <span className="metric-label">Dr. T. Kartheepan</span>
              </div>
            </div>
          </div>

          {/* Detailed Workspace Grid */}
          <div className="portal-workspace-grid">
            {/* Left Column: Active Project Details & Milestones */}
            <div className="workspace-main-col">
              {/* Project Card */}
              <div className="workspace-card glass-card">
                <div className="workspace-card-header">
                  <div>
                    <span className="badge-pill badge-plum">Current Research Project</span>
                    <h2 className="workspace-section-title">
                      Deep Learning-Based Crop Disease Detection for Northern Sri Lanka Agriculture
                    </h2>
                  </div>
                  <span className="status-pill status-ongoing">Ongoing</span>
                </div>

                <p className="project-abstract-snippet">
                  This research develops a lightweight Convolutional Neural Network (CNN) architecture optimized for low-spec edge devices to identify foliar diseases in chili and paddy crops within the dry zone of Northern Sri Lanka.
                </p>

                {/* Progress bar */}
                <div className="progress-section">
                  <div className="progress-header">
                    <span>Research Progress</span>
                    <strong>75% Completed</strong>
                  </div>
                  <div className="progress-track">
                    <div className="progress-fill" style={{ width: '75%' }}></div>
                  </div>
                </div>

                {/* Milestone Stepper */}
                <div className="portal-milestone-stepper">
                  <div className="milestone-step done">
                    <div className="step-circle">✓</div>
                    <div className="step-details">
                      <span className="step-title">Topic Proposal</span>
                      <span className="step-status">Approved</span>
                    </div>
                  </div>

                  <div className="milestone-step done">
                    <div className="step-circle">✓</div>
                    <div className="step-details">
                      <span className="step-title">Literature Review</span>
                      <span className="step-status">Approved</span>
                    </div>
                  </div>

                  <div className="milestone-step active">
                    <div className="step-circle">3</div>
                    <div className="step-details">
                      <span className="step-title">Prototype &amp; Testing</span>
                      <span className="step-status">In Progress (Due Oct 25)</span>
                    </div>
                  </div>

                  <div className="milestone-step pending">
                    <div className="step-circle">4</div>
                    <div className="step-details">
                      <span className="step-title">Final Thesis &amp; Viva</span>
                      <span className="step-status">Pending</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submissions & Deliverables */}
              <div className="workspace-card glass-card">
                <div className="workspace-card-header">
                  <h3 className="workspace-card-title">Recent Submissions &amp; Documents</h3>
                  <button type="button" className="btn btn-primary btn-sm">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Upload Document</span>
                  </button>
                </div>

                <div className="deliverables-table-wrap">
                  <table className="deliverables-table">
                    <thead>
                      <tr>
                        <th>Document</th>
                        <th>Milestone</th>
                        <th>Submission Date</th>
                        <th>Supervisor Review</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <td>
                          <strong>Crop_Disease_CNN_Draft_v2.pdf</strong>
                          <span className="file-size">4.2 MB • PDF</span>
                        </td>
                        <td>Milestone 3 Draft</td>
                        <td>Sep 28, 2026</td>
                        <td>
                          <span className="review-status pending">Pending Review</span>
                        </td>
                        <td>
                          <button type="button" className="table-action-btn">Download</button>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Literature_Review_Final.pdf</strong>
                          <span className="file-size">2.8 MB • PDF</span>
                        </td>
                        <td>Milestone 2</td>
                        <td>Aug 14, 2026</td>
                        <td>
                          <span className="review-status approved">Grade: 88/100 (A)</span>
                        </td>
                        <td>
                          <button type="button" className="table-action-btn">Download</button>
                        </td>
                      </tr>
                      <tr>
                        <td>
                          <strong>Research_Proposal_Form.pdf</strong>
                          <span className="file-size">1.1 MB • PDF</span>
                        </td>
                        <td>Milestone 1</td>
                        <td>Jul 02, 2026</td>
                        <td>
                          <span className="review-status approved">Accepted</span>
                        </td>
                        <td>
                          <button type="button" className="table-action-btn">Download</button>
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right Column: Supervisor Guidance & Communication */}
            <div className="workspace-side-col">
              {/* Assigned Supervisor Card */}
              <div className="workspace-card glass-card">
                <div className="supervisor-profile-card">
                  <div className="supervisor-avatar-lg">👨‍🏫</div>
                  <div className="supervisor-info">
                    <span className="badge-pill badge-gold">Assigned Mentor</span>
                    <h3 className="supervisor-name">Dr. T. Kartheepan</h3>
                    <p className="supervisor-role">Senior Lecturer in Computer Science</p>
                    <p className="supervisor-fac">Faculty of Applied Science, UoV</p>
                  </div>
                </div>

                <div className="supervisor-contact-list">
                  <div className="contact-row">
                    <span className="contact-label">Email:</span>
                    <span className="contact-val">t.kartheepan@vau.ac.lk</span>
                  </div>
                  <div className="contact-row">
                    <span className="contact-label">Office:</span>
                    <span className="contact-val">Department of Computing, Room 204</span>
                  </div>
                  <div className="contact-row">
                    <span className="contact-label">Office Hours:</span>
                    <span className="contact-val">Tuesday &amp; Thursday 2:00 PM - 4:00 PM</span>
                  </div>
                </div>

                <div className="card-btn-action">
                  <button type="button" className="btn btn-outline btn-block">
                    <span>Request Advisory Meeting</span>
                  </button>
                </div>
              </div>

              {/* Feedback & Feedback Log */}
              <div className="workspace-card glass-card">
                <h3 className="workspace-card-title">Supervisor Feedback Notes</h3>
                <div className="feedback-list">
                  <div className="feedback-item">
                    <div className="feedback-meta">
                      <span className="feedback-date">Sep 20, 2026</span>
                      <span className="badge-pill badge-plum">Feedback</span>
                    </div>
                    <p className="feedback-comment">
                      "Good dataset split on the paddy leaf dataset. Ensure edge-case illumination variance is accounted for during model inference benchmarking."
                    </p>
                    <span className="feedback-by">— Dr. T. Kartheepan</span>
                  </div>

                  <div className="feedback-item">
                    <div className="feedback-meta">
                      <span className="feedback-date">Aug 18, 2026</span>
                      <span className="badge-pill badge-plum">Milestone 2</span>
                    </div>
                    <p className="feedback-comment">
                      "Literature review has been thoroughly documented. Approved to begin prototype architecture construction."
                    </p>
                    <span className="feedback-by">— Dr. T. Kartheepan</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
