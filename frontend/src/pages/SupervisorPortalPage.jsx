import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import projectLogo from '../assets/logo.png';
import { getCurrentUser, logoutUser } from '../services/authService';

export default function SupervisorPortalPage() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      setCurrentUser({
        name: 'Dr. T. Kartheepan',
        email: 'supervisor@vau.ac.lk',
        role: 'supervisor'
      });
    } else {
      setCurrentUser(user);
    }
  }, []);

  const handleLogout = () => {
    logoutUser();
    navigate('/login');
  };

  const ASSIGNED_STUDENTS = [
    {
      id: 'std-1',
      studentName: 'S. Mithun & K. Diluxan',
      regNo: '2020/ICT/042, 019',
      projectTitle: 'Deep Learning-Based Crop Disease Detection for Northern Sri Lanka Agriculture',
      currentMilestone: 'Milestone 3: Model Evaluation',
      status: 'pending_review',
      submissionDate: 'Sep 28, 2026',
      progress: 75
    },
    {
      id: 'std-2',
      studentName: 'R. Priyatharshan',
      regNo: '2020/CSC/007',
      projectTitle: 'Blockchain-Based Secure Health Record Exchange with Zero-Knowledge Proofs',
      currentMilestone: 'Archived & Published',
      status: 'completed',
      submissionDate: 'Aug 30, 2026',
      progress: 100
    },
    {
      id: 'std-3',
      studentName: 'M. Sahan & A. Kavitha',
      regNo: '2021/BST/088, 014',
      projectTitle: 'IoT-Enabled Smart Solar Grid Monitoring & Predictive Fault Diagnostics',
      currentMilestone: 'Milestone 2: Prototype Testing',
      status: 'approved',
      submissionDate: 'Sep 15, 2026',
      progress: 60
    },
    {
      id: 'std-4',
      studentName: 'N. Fathima',
      regNo: '2021/ICT/056',
      projectTitle: 'Automated Tamil Handwritten Character Recognition Using Hybrid ViT',
      currentMilestone: 'Milestone 1: Proposal Submission',
      status: 'pending_review',
      submissionDate: 'Sep 30, 2026',
      progress: 25
    }
  ];

  const filteredProjects = ASSIGNED_STUDENTS.filter((item) => {
    if (filterStatus === 'all') return true;
    return item.status === filterStatus;
  });

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
              <span className="badge-pill badge-gold">Supervisor Portal</span>
            </div>
          </div>

          <div className="portal-user-actions">
            <div className="portal-user-profile">
              <div className="user-avatar-circle gold-circle">
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'F'}
              </div>
              <div className="user-meta">
                <span className="user-name">{currentUser?.name || 'Faculty Supervisor'}</span>
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

      {/* Main Content */}
      <main className="portal-main-content">
        <div className="container">
          {/* Welcome Banner */}
          <div className="portal-welcome-banner glass-card">
            <div className="welcome-text">
              <span className="welcome-tag">Faculty Advisory Dashboard • University of Vavuniya</span>
              <h1 className="welcome-title">
                Faculty Workspace, {currentUser?.name || 'Academic Supervisor'}
              </h1>
              <p className="welcome-subtitle">
                Review and evaluate student research proposals, grade milestone submissions, inspect novelty indexes, and record advisory meetings.
              </p>
            </div>
            <div className="welcome-quick-actions">
              <Link to="/showcase" className="btn btn-glass-light btn-sm">
                <span>View Research Showcase</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Supervisor Metrics */}
          <div className="portal-metrics-grid">
            <div className="portal-metric-card glass-card">
              <div className="metric-icon plum-bg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                </svg>
              </div>
              <div className="metric-info">
                <span className="metric-value">12</span>
                <span className="metric-label">Supervised Students</span>
              </div>
            </div>

            <div className="portal-metric-card glass-card">
              <div className="metric-icon gold-bg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <div className="metric-info">
                <span className="metric-value">2</span>
                <span className="metric-label">Pending Reviews</span>
              </div>
            </div>

            <div className="portal-metric-card glass-card">
              <div className="metric-icon emerald-bg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 14 14" />
                </svg>
              </div>
              <div className="metric-info">
                <span className="metric-value">3</span>
                <span className="metric-label">Upcoming Meetings</span>
              </div>
            </div>

            <div className="portal-metric-card glass-card">
              <div className="metric-icon cyan-bg">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2.2">
                  <circle cx="12" cy="8" r="7" />
                  <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
                </svg>
              </div>
              <div className="metric-info">
                <span className="metric-value">8</span>
                <span className="metric-label">Published Projects</span>
              </div>
            </div>
          </div>

          {/* Supervision Queue Table Card */}
          <div className="workspace-card glass-card">
            <div className="workspace-card-header flex-between">
              <div>
                <span className="badge-pill badge-plum">Supervised Cohort</span>
                <h2 className="workspace-section-title">Undergraduate Research Projects</h2>
              </div>

              {/* Status Filter Tabs */}
              <div className="table-filter-tabs">
                <button
                  type="button"
                  className={`filter-tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('all')}
                >
                  All ({ASSIGNED_STUDENTS.length})
                </button>
                <button
                  type="button"
                  className={`filter-tab-btn ${filterStatus === 'pending_review' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('pending_review')}
                >
                  Pending Review (2)
                </button>
                <button
                  type="button"
                  className={`filter-tab-btn ${filterStatus === 'approved' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('approved')}
                >
                  Approved
                </button>
                <button
                  type="button"
                  className={`filter-tab-btn ${filterStatus === 'completed' ? 'active' : ''}`}
                  onClick={() => setFilterStatus('completed')}
                >
                  Completed
                </button>
              </div>
            </div>

            {/* Table */}
            <div className="deliverables-table-wrap">
              <table className="deliverables-table">
                <thead>
                  <tr>
                    <th>Student(s) &amp; Reg No</th>
                    <th>Research Title</th>
                    <th>Current Milestone</th>
                    <th>Progress</th>
                    <th>Review Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProjects.map((proj) => (
                    <tr key={proj.id}>
                      <td>
                        <strong>{proj.studentName}</strong>
                        <span className="file-size">{proj.regNo}</span>
                      </td>
                      <td>
                        <span className="project-cell-title">{proj.projectTitle}</span>
                        <span className="file-size">Submitted: {proj.submissionDate}</span>
                      </td>
                      <td>
                        <span className="milestone-name">{proj.currentMilestone}</span>
                      </td>
                      <td>
                        <div className="mini-progress-wrap">
                          <span>{proj.progress}%</span>
                          <div className="mini-progress-bar">
                            <div className="mini-progress-fill" style={{ width: `${proj.progress}%` }}></div>
                          </div>
                        </div>
                      </td>
                      <td>
                        {proj.status === 'pending_review' && (
                          <span className="review-status pending">Pending Review</span>
                        )}
                        {proj.status === 'approved' && (
                          <span className="review-status approved">Approved</span>
                        )}
                        {proj.status === 'completed' && (
                          <span className="review-status completed">Archived</span>
                        )}
                      </td>
                      <td>
                        <div className="row-actions">
                          {proj.status === 'pending_review' ? (
                            <button type="button" className="btn btn-primary btn-sm">
                              Review
                            </button>
                          ) : (
                            <button type="button" className="table-action-btn">
                              View Details
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Schedule & Advisory Notes */}
          <div className="portal-workspace-grid" style={{ marginTop: '24px' }}>
            <div className="workspace-main-col">
              <div className="workspace-card glass-card">
                <div className="workspace-card-header">
                  <h3 className="workspace-card-title">Scheduled Advisory Sessions</h3>
                  <button type="button" className="btn btn-outline btn-sm">
                    + Schedule Meeting
                  </button>
                </div>
                <div className="meeting-schedule-list">
                  <div className="meeting-card">
                    <div className="meeting-date-box">
                      <span className="m-day">03</span>
                      <span className="m-month">OCT</span>
                    </div>
                    <div className="meeting-info">
                      <h4>Milestone 3 Progress Consultation - CNN Model Evaluation</h4>
                      <p>Attendees: S. Mithun, K. Diluxan • 2:30 PM - 3:15 PM • Computing Lab 2</p>
                    </div>
                    <span className="badge-pill badge-plum">Confirmed</span>
                  </div>

                  <div className="meeting-card">
                    <div className="meeting-date-box">
                      <span className="m-day">08</span>
                      <span className="m-month">OCT</span>
                    </div>
                    <div className="meeting-info">
                      <h4>Initial Proposal Review - Tamil Handwritten Character Recognition</h4>
                      <p>Attendee: N. Fathima • 11:00 AM - 11:30 AM • Office 204</p>
                    </div>
                    <span className="badge-pill badge-gold">Upcoming</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="workspace-side-col">
              <div className="workspace-card glass-card">
                <h3 className="workspace-card-title">Evaluation Guidelines</h3>
                <ul className="guidelines-list">
                  <li>
                    <strong>Rubric Weightage:</strong> Milestone 3 accounts for 25% of final continuous assessment.
                  </li>
                  <li>
                    <strong>Topic Novelty:</strong> Ensure student projects maintain &lt; 5% similarity with archived publications.
                  </li>
                  <li>
                    <strong>Industry Alignment:</strong> Flag high-performing projects for the Research Showcase page.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
