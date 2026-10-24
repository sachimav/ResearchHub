import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  getStudentDashboard,
  createResearchProposal,
  updateResearchProposal,
  updateMilestoneProgress,
  uploadResearchDocument,
  requestSupervisorMeeting,
  updateStudentProfile,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/studentService';
import { getCurrentUser } from '../services/authService';

const STATUS_CONFIG = {
  draft: { label: 'Draft Proposal', color: 'badge-draft', icon: '📝', bg: '#f1f5f9', text: '#475569' },
  pending: { label: 'Pending Approval', color: 'badge-pending', icon: '⏳', bg: '#fef3c7', text: '#92400e' },
  approved: { label: 'Approved', color: 'badge-approved', icon: '✨', bg: '#dcfce7', text: '#15803d' },
  rejected: { label: 'Revisions Requested', color: 'badge-rejected', icon: '⚠️', bg: '#fee2e2', text: '#b91c1c' },
  ongoing: { label: 'Active Study', color: 'badge-ongoing', icon: '🚀', bg: '#e0f2fe', text: '#0369a1' },
  completed: { label: 'Thesis Completed', color: 'badge-completed', icon: '🎓', bg: '#fdf4ff', text: '#86198f' },
};

const DOC_STATUS_CONFIG = {
  pending: { label: 'Under Review', class: 'doc-status-pending', icon: '⏳' },
  approved: { label: 'Approved', class: 'doc-status-approved', icon: '✓' },
  revision_requested: { label: 'Revision Needed', class: 'doc-status-revision', icon: '✍' },
  rejected: { label: 'Declined', class: 'doc-status-rejected', icon: '✕' },
};

export default function StudentDashboard() {
  const navigate = useNavigate();
  const [currentUser] = useState(getCurrentUser());
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [showProposalModal, setShowProposalModal] = useState(false);
  const [showDocModal, setShowDocModal] = useState(false);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [proposalForm, setProposalForm] = useState({
    title: '',
    description: '',
    topic: '',
    supervisorId: '',
    submit: false,
  });

  const [docForm, setDocForm] = useState({
    title: '',
    fileUrl: '',
    documentType: 'progress_report',
    visibility: 'private',
  });

  const [meetingForm, setMeetingForm] = useState({
    supervisorId: '',
    meetingDate: '',
    notes: '',
    location: 'Faculty Office / Video Call',
  });

  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    program: '',
  });

  const applyData = useCallback((data) => {
    setDashboardData(data);
    if (data.student) {
      setProfileForm({
        name: data.student.userId?.name || '',
        phone: data.student.userId?.phone || '',
        program: data.student.program || '',
      });
    }
    if (data.research) {
      setProposalForm({
        title: data.research.title || '',
        description: data.research.description || '',
        topic: data.research.topic || '',
        supervisorId: data.research.supervisorId?._id || '',
        submit: false,
      });
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const data = await getStudentDashboard();
      applyData(data);
    } catch (err) {
      setError(err.message || 'Failed to load dashboard data.');
    }
  }, [applyData]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'student') {
      navigate('/login?role=student');
      return;
    }
    let isCurrent = true;
    getStudentDashboard()
      .then((data) => {
        if (!isCurrent) return;
        applyData(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isCurrent) return;
        setError(err.message || 'Failed to load dashboard data.');
        setLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [currentUser, navigate, applyData]);

  const notify = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 4500);
  };

  const handleProposalSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      if (dashboardData?.research) {
        await updateResearchProposal(dashboardData.research._id, proposalForm);
        notify(proposalForm.submit ? 'Research proposal submitted for supervisor review!' : 'Proposal updated.');
      } else {
        await createResearchProposal(proposalForm);
        notify(proposalForm.submit ? 'Research proposal registered and submitted for review!' : 'Proposal draft saved.');
      }
      setShowProposalModal(false);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to save proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMilestoneToggle = async (milestone) => {
    if (!dashboardData?.research) return;
    const nextStatus =
      milestone.status === 'completed'
        ? 'in_progress'
        : milestone.status === 'in_progress'
        ? 'completed'
        : 'in_progress';

    try {
      await updateMilestoneProgress(dashboardData.research._id, milestone._id, nextStatus);
      notify(`Milestone marked as ${nextStatus.replace('_', ' ')}.`);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update milestone.');
    }
  };

  const handleDocumentUpload = async (e) => {
    e.preventDefault();
    if (!dashboardData?.research) {
      alert('Please create and submit a research project first.');
      return;
    }
    try {
      setSubmitting(true);
      await uploadResearchDocument(dashboardData.research._id, docForm);
      notify('Document uploaded successfully for supervisor review.');
      setDocForm({
        title: '',
        fileUrl: '',
        documentType: 'progress_report',
        visibility: 'private',
      });
      setShowDocModal(false);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to upload document.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMeetingRequest = async (e) => {
    e.preventDefault();
    const supId = meetingForm.supervisorId || dashboardData?.research?.supervisorId?._id;
    if (!supId) {
      alert('Please select a supervisor for this meeting.');
      return;
    }
    if (!dashboardData?.research) {
      alert('You need a registered research project to schedule meetings.');
      return;
    }

    try {
      setSubmitting(true);
      await requestSupervisorMeeting({
        ...meetingForm,
        supervisorId: supId,
        researchId: dashboardData.research._id,
      });
      notify('Meeting request submitted to your supervisor.');
      setShowMeetingModal(false);
      setMeetingForm({
        supervisorId: '',
        meetingDate: '',
        notes: '',
        location: 'Faculty Office / Video Call',
      });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to request meeting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await updateStudentProfile(profileForm);
      notify('Student profile updated successfully.');
      setShowProfileModal(false);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update profile.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleMarkNotification = async (id) => {
    try {
      await markNotificationAsRead(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllNotifications = async () => {
    try {
      await markAllNotificationsAsRead();
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="portal-loading-container">
        <div className="portal-spinner"></div>
        <p className="loading-text">Loading student research workspace...</p>
      </div>
    );
  }

  const {
    student,
    research,
    documents = [],
    feedback = [],
    deadlines = [],
    meetings = [],
    supervisors = [],
    notifications = [],
  } = dashboardData || {};

  const currentSupervisor = research?.supervisorId;
  const milestones = research?.milestones || [];
  const completedMilestones = milestones.filter((m) => m.status === 'completed').length;
  const progressPct = research?.progressPercentage || 0;
  const statusInfo = STATUS_CONFIG[research?.status || 'draft'] || STATUS_CONFIG.draft;

  // Calculate SVG circular progress values
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPct / 100) * circumference;

  return (
    <div className="modern-dashboard-layout">
      {/* Dynamic Background Glow Elements */}
      <div className="ambient-glow glow-top-left" aria-hidden="true"></div>
      <div className="ambient-glow glow-top-right" aria-hidden="true"></div>

      {/* Hero Canopy Header */}
      <header className="hero-canopy">
        <div className="container hero-canopy-inner">
          <div className="hero-profile-cell">
            <div className="hero-avatar-wrapper">
              <div className="hero-avatar-gradient">
                <span>{student?.userId?.name?.charAt(0) || 'S'}</span>
              </div>
              <span className="online-beacon" title="Account Active"></span>
            </div>

            <div className="hero-meta-block">
              <h1 className="hero-user-name">{student?.userId?.name}</h1>
              <p className="hero-affiliation-line">
                {student?.departmentId?.name} · {student?.program}
              </p>
            </div>
          </div>

          {/* Right Hero Radial Progress */}
          <div className="hero-controls-cell">
            <div className="progress-ring-card glass-card-interactive">
              <div className="ring-container">
                <svg className="progress-ring" width="104" height="104">
                  <circle
                    className="progress-ring-bg"
                    stroke="rgba(255, 255, 255, 0.15)"
                    strokeWidth="8"
                    fill="transparent"
                    r={radius}
                    cx="52"
                    cy="52"
                  />
                  <circle
                    className="progress-ring-fill"
                    stroke="url(#progressGradient)"
                    strokeWidth="8"
                    strokeDasharray={`${circumference} ${circumference}`}
                    style={{ strokeDashoffset }}
                    strokeLinecap="round"
                    fill="transparent"
                    r={radius}
                    cx="52"
                    cy="52"
                  />
                  <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4af37" />
                      <stop offset="100%" stopColor="#ec4899" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="ring-center-content">
                  <span className="ring-percentage">{progressPct}%</span>
                  <span className="ring-label">Progress</span>
                </div>
              </div>
              <div className="ring-summary-text">
                <strong>{completedMilestones} of {milestones.length}</strong>
                <span>Milestones Done</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Floating Status Notification Alerts */}
      {successMsg && (
        <div className="container toast-container animate-slide-down">
          <div className="modern-toast success-toast">
            <div className="toast-icon">✓</div>
            <div className="toast-message">{successMsg}</div>
          </div>
        </div>
      )}

      {error && (
        <div className="container toast-container animate-slide-down">
          <div className="modern-toast error-toast">
            <div className="toast-icon">⚠</div>
            <div className="toast-message">{error}</div>
          </div>
        </div>
      )}

      {/* Dashboard Body with Left Side Vertical Navigation */}
      <div className="container dashboard-body">
        <div className="dashboard-vertical-layout">
          {/* Left Vertical Tabs Sidebar */}
          <aside className="dashboard-vertical-sidebar" aria-label="Student Navigation">
            <div className="sidebar-sticky-panel glass-card">
              <div className="sidebar-header-badge">
                <span className="sidebar-tag">
                  <span>🎓</span> STUDENT WORKSPACE
                </span>
              </div>
              <nav className="vertical-tabs-nav" aria-label="Dashboard sections">
                <button
                  type="button"
                  className={`vertical-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <span className="nav-icon">📊</span>
                  <span className="nav-text">Overview</span>
                </button>
                <button
                  type="button"
                  className={`vertical-tab-item ${activeTab === 'milestones' ? 'active' : ''}`}
                  onClick={() => setActiveTab('milestones')}
                >
                  <span className="nav-icon">🎯</span>
                  <span className="nav-text">Milestones</span>
                  <span className="pill-counter">{completedMilestones}/{milestones.length}</span>
                </button>
                <button
                  type="button"
                  className={`vertical-tab-item ${activeTab === 'documents' ? 'active' : ''}`}
                  onClick={() => setActiveTab('documents')}
                >
                  <span className="nav-icon">📂</span>
                  <span className="nav-text">Deliverables</span>
                  <span className="pill-counter">{documents.length}</span>
                </button>
                <button
                  type="button"
                  className={`vertical-tab-item ${activeTab === 'supervisor' ? 'active' : ''}`}
                  onClick={() => setActiveTab('supervisor')}
                >
                  <span className="nav-icon">👨‍🏫</span>
                  <span className="nav-text">Supervisor &amp; Feedback</span>
                  {feedback.length > 0 && <span className="pill-counter">{feedback.length}</span>}
                </button>
                <button
                  type="button"
                  className={`vertical-tab-item ${activeTab === 'meetings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('meetings')}
                >
                  <span className="nav-icon">🗓</span>
                  <span className="nav-text">Meetings &amp; Deadlines</span>
                  {meetings.length > 0 && <span className="pill-counter">{meetings.length}</span>}
                </button>
                <button
                  type="button"
                  className={`vertical-tab-item ${activeTab === 'notifications' ? 'active' : ''}`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <span className="nav-icon">🔔</span>
                  <span className="nav-text">Updates</span>
                  {dashboardData?.unreadNotifications > 0 && (
                    <span className="pill-counter alert-counter">{dashboardData.unreadNotifications}</span>
                  )}
                </button>
              </nav>

              {/* Sidebar Quick Shortcuts */}
              <div className="sidebar-quick-actions">
                <span className="sidebar-sub-label">QUICK SHORTCUTS</span>
                <button
                  type="button"
                  className="sidebar-action-btn"
                  onClick={() => {
                    setProposalForm({
                      title: research?.title || '',
                      description: research?.description || '',
                      topic: research?.topic || '',
                      supervisorId: currentSupervisor?._id || '',
                      submit: false,
                    });
                    setShowProposalModal(true);
                  }}
                >
                  <span className="sidebar-action-icon">➕</span>
                  <span>{research ? 'Edit Proposal' : 'Propose Research'}</span>
                </button>
                <button
                  type="button"
                  className="sidebar-action-btn"
                  onClick={() => setShowDocModal(true)}
                >
                  <span className="sidebar-action-icon">📤</span>
                  <span>Upload Deliverable</span>
                </button>
                <button
                  type="button"
                  className="sidebar-action-btn"
                  onClick={() => setShowMeetingModal(true)}
                >
                  <span className="sidebar-action-icon">🤝</span>
                  <span>Request Meeting</span>
                </button>
                <button
                  type="button"
                  className="sidebar-action-btn"
                  onClick={() => setShowProfileModal(true)}
                >
                  <span className="sidebar-action-icon">⚙</span>
                  <span>Settings</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Right Stage */}
          <main className="dashboard-vertical-content">

        {/* ================= TAB 1: OVERVIEW ================= */}
        {activeTab === 'overview' && (
          <div className="tab-stage animate-fade-in">
            {/* Top Stat Metric Cards */}
            <div className="metrics-triad-grid">
              <div className="metric-glow-card glass-card">
                <div className="metric-card-header">
                  <span className="metric-title-chip">Project</span>
                  <div className="metric-icon-bubble bubble-purple">🎓</div>
                </div>
                <div className="metric-primary-data">
                  <span className={`status-badge-elevated ${statusInfo.color}`}>
                    {statusInfo.icon} {statusInfo.label}
                  </span>
                </div>
                <p className="metric-helper-text">
                  Academic Cycle: <strong>{research?.academicYear || 'Not Registered'}</strong>
                </p>
              </div>

              <div className="metric-glow-card glass-card">
                <div className="metric-card-header">
                  <span className="metric-title-chip">Research Progress</span>
                  <div className="metric-icon-bubble bubble-gold">⚡</div>
                </div>
                <div className="metric-primary-data">
                  <span className="metric-large-number">{progressPct}%</span>
                </div>
                <div className="sleek-progress-track">
                  <div className="sleek-progress-bar" style={{ width: `${progressPct}%` }}></div>
                </div>
              </div>

              <div className="metric-glow-card glass-card">
                <div className="metric-card-header">
                  <span className="metric-title-chip">Milestone Targets</span>
                  <div className="metric-icon-bubble bubble-emerald">🎯</div>
                </div>
                <div className="metric-primary-data">
                  <span className="metric-large-number">{completedMilestones} <small>/ {milestones.length}</small></span>
                </div>
                <p className="metric-helper-text">
                  {milestones.length - completedMilestones} tasks awaiting completion
                </p>
              </div>

              <div className="metric-glow-card glass-card">
                <div className="metric-card-header">
                  <span className="metric-title-chip">Faculty Supervisor</span>
                  <div className="metric-icon-bubble bubble-blue">👨‍🏫</div>
                </div>
                <div className="metric-primary-data">
                  <span className="metric-supervisor-name">
                    {currentSupervisor?.userId?.name || 'Pending Allocation'}
                  </span>
                </div>
                <p className="metric-helper-text">
                  {currentSupervisor?.designation || 'Choose supervisor in proposal form'}
                </p>
              </div>
            </div>

            {/* Quick Action Toolbar */}
            <div className="quick-actions-toolbar glass-card">
              <span className="toolbar-label">⚡ Direct Actions:</span>
              <div className="toolbar-btn-group">
                <button
                  type="button"
                  className="btn-toolbar-item"
                  onClick={() => {
                    setProposalForm({
                      title: research?.title || '',
                      description: research?.description || '',
                      topic: research?.topic || '',
                      supervisorId: currentSupervisor?._id || '',
                      submit: false,
                    });
                    setShowProposalModal(true);
                  }}
                >
                  <span className="btn-icon">{research ? '✏' : '➕'}</span>
                  <span>{research ? 'Edit Proposal' : 'Propose Research'}</span>
                </button>
                <button
                  type="button"
                  className="btn-toolbar-item"
                  onClick={() => setShowMeetingModal(true)}
                >
                  <span className="btn-icon">🤝</span>
                  <span>Request Meeting</span>
                </button>
                <button
                  type="button"
                  className="btn-toolbar-item"
                  onClick={() => setShowDocModal(true)}
                >
                  <span className="btn-icon">📤</span>
                  <span>Upload Deliverable</span>
                </button>
                <button
                  type="button"
                  className="btn-toolbar-item"
                  onClick={() => setShowProfileModal(true)}
                >
                  <span className="btn-icon">⚙</span>
                  <span>Profile Settings</span>
                </button>
              </div>
            </div>

            {/* Featured Active Research Study Card */}
            {research ? (
              <div className="study-spotlight-card glass-card">
                <div className="study-spotlight-header">
                  <div className="spotlight-title-group">
                    <span className="topic-badge">
                      <span className="sparkle">✦</span> {research.topic || 'Undergraduate Capstone Research'}
                    </span>
                    <h2 className="study-title">{research.title}</h2>
                    <div className="study-meta-tags">
                      <span className="meta-tag">Cohort: <strong>{research.batchId?.batchName}</strong></span>
                      <span className="meta-tag">Academic Year: <strong>{research.academicYear}</strong></span>
                      <span className="meta-tag">
                        Showcase: <strong>{research.isPublic ? '🌐 Published Publicly' : '🔒 Internal Campus Repository'}</strong>
                      </span>
                    </div>
                  </div>

                  <div className="spotlight-actions">
                    {['draft', 'rejected'].includes(research.status) && (
                      <button
                        type="button"
                        className="btn-glow-primary"
                        onClick={() => {
                          setProposalForm({
                            title: research.title,
                            description: research.description,
                            topic: research.topic || '',
                            supervisorId: currentSupervisor?._id || '',
                            submit: true,
                          });
                          setShowProposalModal(true);
                        }}
                      >
                        🚀 Submit for Review
                      </button>
                    )}
                    {research.isPublic && (
                      <Link to={`/showcase/${research._id}`} className="btn-glow-outline">
                        Showcase View ↗
                      </Link>
                    )}
                  </div>
                </div>

                <div className="study-abstract-container">
                  <h4 className="abstract-heading">
                    <span className="abstract-icon">📖</span> Research Problem Statement &amp; Abstract
                  </h4>
                  <p className="abstract-text">{research.description}</p>
                </div>

                {/* Supervisor Feedback Banner */}
                {feedback.length > 0 && (
                  <div className="spotlight-feedback-ribbon">
                    <div className="feedback-ribbon-badge">Latest Supervisor Recommendation</div>
                    <p className="feedback-ribbon-quote">"{feedback[0].message}"</p>
                    <div className="feedback-ribbon-author">
                      — {feedback[0].userId?.name} · {new Date(feedback[0].createdAt).toLocaleDateString()}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="empty-hero-card glass-card">
                <div className="empty-hero-icon">🔬</div>
                <h3>No Research Proposal Registered Yet</h3>
                <p>
                  Register your research proposal, specify your problem domain, and select your
                  faculty supervisor to begin tracking milestones.
                </p>
                <button
                  type="button"
                  className="btn-glow-primary"
                  onClick={() => setShowProposalModal(true)}
                >
                  ➕ Create &amp; Submit Research Proposal
                </button>
              </div>
            )}

            {/* Two Column Grid: Upcoming Deadlines & Consultations */}
            <div className="split-dashboard-grid">
              <div className="split-panel glass-card">
                <div className="panel-header-row">
                  <div className="panel-title-with-icon">
                    <span className="icon-badge">📅</span>
                    <h3>Academic Deliverable Deadlines</h3>
                  </div>
                </div>

                {deadlines.length === 0 ? (
                  <p className="empty-panel-text">No upcoming deadlines posted for your batch.</p>
                ) : (
                  <div className="deadline-timeline-stack">
                    {deadlines.slice(0, 4).map((d) => {
                      const daysLeft = Math.ceil((new Date(d.dueDate) - new Date()) / (1000 * 60 * 60 * 24));
                      const isUrgent = daysLeft <= 7;
                      return (
                        <div key={d._id} className="deadline-ticket">
                          <div className={`countdown-chip ${isUrgent ? 'urgent' : ''}`}>
                            <span className="days-num">{daysLeft > 0 ? daysLeft : 0}</span>
                            <span className="days-label">{daysLeft === 1 ? 'day left' : 'days left'}</span>
                          </div>
                          <div className="deadline-ticket-body">
                            <h4>{d.title}</h4>
                            <span className="ticket-date">Due: {new Date(d.dueDate).toLocaleDateString()}</span>
                            {d.description && <p className="ticket-desc">{d.description}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="split-panel glass-card">
                <div className="panel-header-row">
                  <div className="panel-title-with-icon">
                    <span className="icon-badge">🤝</span>
                    <h3>Supervisor Consultations</h3>
                  </div>
                  <button
                    type="button"
                    className="btn-sm-primary"
                    onClick={() => setShowMeetingModal(true)}
                  >
                    + Request Meeting
                  </button>
                </div>

                {meetings.length === 0 ? (
                  <p className="empty-panel-text">No consultation sessions currently booked.</p>
                ) : (
                  <div className="meetings-ticket-stack">
                    {meetings.slice(0, 3).map((m) => (
                      <div key={m._id} className="meeting-ticket-card">
                        <div className="ticket-calendar-badge">
                          <span className="cal-day">{new Date(m.meetingDate).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                          <span className="cal-num">{new Date(m.meetingDate).getDate()}</span>
                          <span className="cal-month">{new Date(m.meetingDate).toLocaleDateString(undefined, { month: 'short' })}</span>
                        </div>
                        <div className="ticket-meeting-content">
                          <div className="meeting-title-row">
                            <strong>{m.supervisorId?.userId?.name || 'Faculty Supervisor'}</strong>
                            <span className={`meeting-pill-status pill-${m.status}`}>{m.status}</span>
                          </div>
                          <span className="meeting-clock-time">
                            Time: {new Date(m.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {m.location && <p className="meeting-location-snippet">📍 {m.location}</p>}
                          {m.meetingLink && (
                            <a href={m.meetingLink} target="_blank" rel="noreferrer" className="inline-meet-link">
                              Join Meeting Link ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 2: MILESTONES & PROGRESS ================= */}
        {activeTab === 'milestones' && (
          <div className="tab-stage animate-fade-in">
            <div className="glass-card section-card">
              <div className="section-header-flex">
                <div>
                  <h2 className="section-title-bold">Research Milestones</h2>
                </div>
                <div className="overall-score-pill">
                  <span className="score-num">{progressPct}%</span>
                  <span className="score-label">Project Completed</span>
                </div>
              </div>

              {milestones.length === 0 ? (
                <p className="empty-panel-text">No milestone pipeline registered for this research.</p>
              ) : (
                <div className="milestones-timeline-pipeline">
                  {milestones.map((m, idx) => (
                    <div key={m._id || idx} className={`pipeline-node-card ${m.status}`}>
                      <div className="pipeline-stepper-col">
                        <div className="stepper-disc">
                          {m.status === 'completed' ? '✓' : idx + 1}
                        </div>
                        {idx < milestones.length - 1 && <div className="stepper-connecting-line"></div>}
                      </div>

                      <div className="pipeline-card-body glass-card">
                        <div className="pipeline-card-top">
                          <div className="pipeline-title-group">
                            <h4>{m.title}</h4>
                            <span className={`status-pill-small ${m.status}`}>{m.status.replace('_', ' ')}</span>
                          </div>
                          <button
                            type="button"
                            className={`btn-step-toggle ${m.status === 'completed' ? 'btn-reopen' : 'btn-complete'}`}
                            onClick={() => handleMilestoneToggle(m)}
                          >
                            {m.status === 'completed' ? '↩ Reopen Task' : '✓ Mark Completed'}
                          </button>
                        </div>

                        {m.description && <p className="pipeline-desc">{m.description}</p>}

                        <div className="pipeline-card-meta">
                          {m.dueDate && (
                            <span className="meta-chip">
                              📅 Target: {new Date(m.dueDate).toLocaleDateString()}
                            </span>
                          )}
                          {m.completedAt && (
                            <span className="meta-chip chip-success">
                              ✓ Completed on {new Date(m.completedAt).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: DOCUMENTS & DELIVERABLES ================= */}
        {activeTab === 'documents' && (
          <div className="tab-stage animate-fade-in">
            <div className="glass-card section-card">
              <div className="section-header-flex">
                <div>
                  <span className="section-pill">Document Repository</span>
                  <h2 className="section-title-bold">Research Deliverables &amp; Approval Status</h2>
                  <p className="section-subtext">
                    Submit proposals, interim reports, and thesis drafts for faculty review and evaluation.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-glow-primary"
                  onClick={() => setShowDocModal(true)}
                  disabled={!research}
                >
                  📤 Upload Deliverable
                </button>
              </div>

              {!research && (
                <div className="alert-banner-error">
                  Please register your research proposal before uploading documents.
                </div>
              )}

              {documents.length === 0 ? (
                <div className="empty-hero-card">
                  <div className="empty-hero-icon">📄</div>
                  <h4>No deliverables uploaded yet</h4>
                  <p>Upload your proposal or interim chapters for supervisor review and feedback.</p>
                </div>
              ) : (
                <div className="table-responsive-wrapper">
                  <table className="modern-glass-table">
                    <thead>
                      <tr>
                        <th>Deliverable Name</th>
                        <th>Type</th>
                        <th>Approval Review</th>
                        <th>Visibility</th>
                        <th>Supervisor Remarks</th>
                        <th>Upload Date</th>
                        <th>File Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => {
                        const docStatus = DOC_STATUS_CONFIG[doc.status || 'pending'] || DOC_STATUS_CONFIG.pending;
                        return (
                          <tr key={doc._id}>
                            <td className="doc-primary-cell">
                              <span className="doc-icon-tag">📄</span>
                              <strong>{doc.title}</strong>
                            </td>
                            <td>
                              <span className="type-badge-pill">
                                {doc.documentType?.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td>
                              <span className={`doc-review-chip ${docStatus.class}`}>
                                <span className="chip-symbol">{docStatus.icon}</span> {docStatus.label}
                              </span>
                            </td>
                            <td>
                              <span className="visibility-indicator">
                                {doc.visibility === 'public' ? '🌐 Public' : '🔒 Private'}
                              </span>
                            </td>
                            <td>
                              <span className="supervisor-comment-preview">
                                {doc.feedback || '—'}
                              </span>
                            </td>
                            <td>{new Date(doc.createdAt).toLocaleDateString()}</td>
                            <td>
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="table-link-btn"
                              >
                                View File ↗
                              </a>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: SUPERVISOR & FEEDBACK ================= */}
        {activeTab === 'supervisor' && (
          <div className="tab-stage animate-fade-in">
            <div className="split-dashboard-grid">
              {/* Supervisor Profile Card */}
              <div className="glass-card supervisor-profile-showcase">
                <div className="card-top-accent"></div>
                <div className="sup-showcase-header">
                  <div className="sup-avatar-large">
                    {currentSupervisor?.userId?.name?.charAt(0) || 'D'}
                  </div>
                  <div>
                    <h3 className="sup-name">{currentSupervisor?.userId?.name || 'Supervisor Unassigned'}</h3>
                    <span className="sup-rank-badge">{currentSupervisor?.designation || 'Faculty Member'}</span>
                    <p className="sup-dept-text">{currentSupervisor?.departmentId?.name}</p>
                  </div>
                </div>

                {currentSupervisor ? (
                  <div className="sup-details-body">
                    <div className="sup-contact-group">
                      <div className="sup-contact-row">
                        <span className="contact-icon">✉</span>
                        <a href={`mailto:${currentSupervisor.userId?.email}`}>
                          {currentSupervisor.userId?.email}
                        </a>
                      </div>
                      {currentSupervisor.userId?.phone && (
                        <div className="sup-contact-row">
                          <span className="contact-icon">📞</span>
                          <span>{currentSupervisor.userId?.phone}</span>
                        </div>
                      )}
                    </div>

                    {currentSupervisor.expertise?.length > 0 && (
                      <div className="sup-expertise-block">
                        <span className="block-label">Specializations &amp; Focus:</span>
                        <div className="expertise-chip-cloud">
                          {currentSupervisor.expertise.map((exp, idx) => (
                            <span key={idx} className="expertise-pill">
                              {exp}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentSupervisor.availability?.length > 0 && (
                      <div className="sup-hours-block">
                        <span className="block-label">Weekly Consultation Schedule:</span>
                        <div className="hours-grid">
                          {currentSupervisor.availability.map((slot, idx) => (
                            <div key={idx} className="hour-chip">
                              <strong>{slot.day}</strong>
                              <span>{slot.startTime} – {slot.endTime}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <button
                      type="button"
                      className="btn-glow-primary btn-full-width"
                      style={{ marginTop: '20px' }}
                      onClick={() => setShowMeetingModal(true)}
                    >
                      🗓 Schedule Advisory Consultation
                    </button>
                  </div>
                ) : (
                  <div className="empty-panel-text" style={{ textAlign: 'center', padding: '30px' }}>
                    <p>No faculty supervisor has been assigned to your research yet.</p>
                    <button
                      type="button"
                      className="btn-glow-outline"
                      onClick={() => setShowProposalModal(true)}
                    >
                      Choose Supervisor in Proposal Form
                    </button>
                  </div>
                )}
              </div>

              {/* Feedbacks Log Stream */}
              <div className="glass-card feedback-stream-card">
                <div className="panel-header-row">
                  <div className="panel-title-with-icon">
                    <span className="icon-badge">💬</span>
                    <h3>Supervisor Guidance Stream</h3>
                  </div>
                </div>

                {feedback.length === 0 ? (
                  <p className="empty-panel-text">
                    No supervisor recommendations logged yet. As your supervisor reviews your chapters,
                    their guidance will appear here.
                  </p>
                ) : (
                  <div className="feedback-cards-scroll">
                    {feedback.map((fb) => (
                      <div key={fb._id} className="feedback-entry-card">
                        <div className="feedback-entry-header">
                          <div className="entry-author-block">
                            <div className="author-dot"></div>
                            <strong>{fb.userId?.name || 'Supervisor'}</strong>
                          </div>
                          <span className="entry-time">{new Date(fb.createdAt).toLocaleString()}</span>
                        </div>
                        <p className="entry-comment-text">{fb.message}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 5: MEETINGS & DEADLINES ================= */}
        {activeTab === 'meetings' && (
          <div className="tab-stage animate-fade-in">
            <div className="split-dashboard-grid">
              <div className="glass-card section-card">
                <div className="panel-header-row">
                  <div>
                    <span className="section-pill">Advisory Schedule</span>
                    <h3 className="section-title-bold">Consultation Sessions</h3>
                  </div>
                  <button
                    type="button"
                    className="btn-sm-primary"
                    onClick={() => setShowMeetingModal(true)}
                  >
                    + Book Session
                  </button>
                </div>

                {meetings.length === 0 ? (
                  <p className="empty-panel-text">No consultation sessions booked yet.</p>
                ) : (
                  <div className="meetings-ticket-stack">
                    {meetings.map((m) => (
                      <div key={m._id} className="meeting-ticket-card">
                        <div className="ticket-calendar-badge">
                          <span className="cal-day">{new Date(m.meetingDate).toLocaleDateString(undefined, { weekday: 'short' })}</span>
                          <span className="cal-num">{new Date(m.meetingDate).getDate()}</span>
                          <span className="cal-month">{new Date(m.meetingDate).toLocaleDateString(undefined, { month: 'short' })}</span>
                        </div>
                        <div className="ticket-meeting-content">
                          <div className="meeting-title-row">
                            <strong>{m.supervisorId?.userId?.name || 'Faculty Supervisor'}</strong>
                            <span className={`meeting-pill-status pill-${m.status}`}>{m.status}</span>
                          </div>
                          <span className="meeting-clock-time">
                            Time: {new Date(m.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {m.location && <p className="meeting-location-snippet">📍 {m.location}</p>}
                          {m.notes && <p className="meeting-agenda-snippet">Agenda: {m.notes}</p>}
                          {m.meetingLink && (
                            <a href={m.meetingLink} target="_blank" rel="noreferrer" className="inline-meet-link">
                              Join Meeting Link ↗
                            </a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="glass-card section-card">
                <div className="panel-header-row">
                  <div>
                    <span className="section-pill">Academic Schedule</span>
                    <h3 className="section-title-bold">Batch Deadlines</h3>
                  </div>
                </div>

                {deadlines.length === 0 ? (
                  <p className="empty-panel-text">No batch deadlines posted.</p>
                ) : (
                  <div className="deadline-timeline-stack">
                    {deadlines.map((d) => (
                      <div key={d._id} className="deadline-ticket">
                        <div className="countdown-chip">
                          <span className="days-label">Due Date</span>
                          <span className="days-num" style={{ fontSize: '1rem' }}>
                            {new Date(d.dueDate).toLocaleDateString()}
                          </span>
                        </div>
                        <div className="deadline-ticket-body">
                          <h4>{d.title}</h4>
                          <span className="type-badge-pill">
                            {d.deadlineType?.replace('_', ' ').toUpperCase()}
                          </span>
                          {d.description && <p className="ticket-desc">{d.description}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: NOTIFICATIONS ================= */}
        {activeTab === 'notifications' && (
          <div className="tab-stage animate-fade-in">
            <div className="glass-card section-card">
              <div className="section-header-flex">
                <div>
                  <span className="section-pill">Notification Center</span>
                  <h2 className="section-title-bold">Updates &amp; Alerts</h2>
                  <p className="section-subtext">
                    Stay informed on supervisor feedback, proposal review decisions, and deadline reminders.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-glow-outline"
                  onClick={handleMarkAllNotifications}
                >
                  ✓ Mark All Read
                </button>
              </div>

              <div className="notifications-feed">
                {notifications.length === 0 ? (
                  <p className="empty-panel-text">All caught up! No notifications right now.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`notification-item-card glass-card-interactive ${n.isRead ? 'read' : 'unread'}`}
                      onClick={() => !n.isRead && handleMarkNotification(n._id)}
                    >
                      <div className="notif-icon">
                        {n.type === 'approval' ? '🎉' : n.type === 'rejection' ? '⚠️' : n.type === 'meeting' ? '🗓' : n.type === 'deadline' ? '⏰' : '🔔'}
                      </div>
                      <div className="notif-content">
                        <div className="notif-title-row">
                          <h4>{n.title}</h4>
                          <span className="notif-time">{new Date(n.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p>{n.message}</p>
                      </div>
                      {!n.isRead && <span className="unread-dot"></span>}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
          </main>
        </div>
      </div>

      {/* ================= MODAL 1: PROPOSAL SUBMISSION / EDIT ================= */}
      {showProposalModal && (
        <div className="modal-overlay" onClick={() => setShowProposalModal(false)}>
          <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>
                {research ? '✏ Edit Research Proposal' : '➕ Propose New Research'}
              </h3>
              <button
                type="button"
                className="close-btn"
                onClick={() => setShowProposalModal(false)}
              >
                ×
              </button>
            </div>
            <form onSubmit={handleProposalSubmit} className="modal-form">
              <div className="form-group">
                <label>Research Project Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI-Powered Early Detection of Agricultural Crop Diseases"
                  value={proposalForm.title}
                  onChange={(e) => setProposalForm({ ...proposalForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Research Topic &amp; Specialization Area</label>
                <input
                  type="text"
                  placeholder="e.g. Machine Learning, Cloud Systems, Network Security"
                  value={proposalForm.topic}
                  onChange={(e) => setProposalForm({ ...proposalForm, topic: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Select Faculty Supervisor *</label>
                <select
                  value={proposalForm.supervisorId}
                  onChange={(e) => setProposalForm({ ...proposalForm, supervisorId: e.target.value })}
                >
                  <option value="">-- Choose Faculty Supervisor --</option>
                  {supervisors.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.userId?.name} ({s.designation} · {s.departmentId?.name})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Problem Statement &amp; Abstract Formulation *</label>
                <textarea
                  rows="6"
                  required
                  placeholder="Formulate your primary research problem, aims, objectives, and proposed methodologies..."
                  value={proposalForm.description}
                  onChange={(e) => setProposalForm({ ...proposalForm, description: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-actions-row">
                <button
                  type="button"
                  className="btn-glow-outline"
                  onClick={() => setShowProposalModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-glow-outline"
                  onClick={() => setProposalForm((prev) => ({ ...prev, submit: false }))}
                  disabled={submitting}
                >
                  Save as Draft
                </button>
                <button
                  type="submit"
                  className="btn-glow-primary"
                  onClick={() => setProposalForm((prev) => ({ ...prev, submit: true }))}
                  disabled={submitting}
                >
                  {submitting ? 'Submitting...' : '🚀 Submit for Approval'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 2: DOCUMENT UPLOAD ================= */}
      {showDocModal && (
        <div className="modal-overlay" onClick={() => setShowDocModal(false)}>
          <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📤 Upload Deliverable / Report</h3>
              <button type="button" className="close-btn" onClick={() => setShowDocModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleDocumentUpload} className="modal-form">
              <div className="form-group">
                <label>Document Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Interim Chapter 3 Methodology Report"
                  value={docForm.title}
                  onChange={(e) => setDocForm({ ...docForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Deliverable Type *</label>
                <select
                  value={docForm.documentType}
                  onChange={(e) => setDocForm({ ...docForm, documentType: e.target.value })}
                >
                  <option value="proposal">Research Proposal</option>
                  <option value="progress_report">Interim Progress Report</option>
                  <option value="final_report">Final Thesis Dissertation</option>
                  <option value="report">Technical Report</option>
                  <option value="other">Other Deliverable</option>
                </select>
              </div>

              <div className="form-group">
                <label>File URL / Cloud Drive Document Link *</label>
                <input
                  type="url"
                  required
                  placeholder="https://drive.google.com/... or https://..."
                  value={docForm.fileUrl}
                  onChange={(e) => setDocForm({ ...docForm, fileUrl: e.target.value })}
                />
                <small className="field-hint">
                  Provide an accessible Google Drive, OneDrive, or public PDF link.
                </small>
              </div>

              <div className="form-group">
                <label>Visibility</label>
                <select
                  value={docForm.visibility}
                  onChange={(e) => setDocForm({ ...docForm, visibility: e.target.value })}
                >
                  <option value="private">Private (Supervisor &amp; Reviewers only)</option>
                  <option value="public">Public (Showcased on University Repository)</option>
                </select>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-glow-outline" onClick={() => setShowDocModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-glow-primary" disabled={submitting}>
                  {submitting ? 'Uploading...' : 'Upload for Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 3: MEETING REQUEST ================= */}
      {showMeetingModal && (
        <div className="modal-overlay" onClick={() => setShowMeetingModal(false)}>
          <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>🤝 Book Advisory Consultation</h3>
              <button type="button" className="close-btn" onClick={() => setShowMeetingModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleMeetingRequest} className="modal-form">
              <div className="form-group">
                <label>Select Supervisor *</label>
                <select
                  value={meetingForm.supervisorId || currentSupervisor?._id || ''}
                  onChange={(e) => setMeetingForm({ ...meetingForm, supervisorId: e.target.value })}
                  required
                >
                  <option value="">-- Choose Supervisor --</option>
                  {supervisors.map((s) => (
                    <option key={s._id} value={s._id}>
                      {s.userId?.name} ({s.designation})
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Proposed Date &amp; Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={meetingForm.meetingDate}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Location / Mode</label>
                <input
                  type="text"
                  placeholder="e.g. Faculty Room 204 or Google Meet / Teams"
                  value={meetingForm.location}
                  onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Agenda &amp; Discussion Topics</label>
                <textarea
                  rows="4"
                  placeholder="State the primary questions or chapters you wish to review..."
                  value={meetingForm.notes}
                  onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-glow-outline" onClick={() => setShowMeetingModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-glow-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Send Consultation Request'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL 4: STUDENT PROFILE / SETTINGS ================= */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>⚙ Student Researcher Settings</h3>
              <button type="button" className="close-btn" onClick={() => setShowProfileModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleProfileUpdate} className="modal-form">
              <div className="form-group">
                <label>Full Academic Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Registration Number (ID)</label>
                <input type="text" disabled value={student?.regNo || ''} />
              </div>

              <div className="form-group">
                <label>Degree Program</label>
                <input
                  type="text"
                  value={profileForm.program}
                  onChange={(e) => setProfileForm({ ...profileForm, program: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="text"
                  placeholder="+94 7X XXX XXXX"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Department</label>
                <input type="text" disabled value={student?.departmentId?.name || ''} />
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-glow-outline" onClick={() => setShowProfileModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-glow-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
