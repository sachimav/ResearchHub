import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getSupervisorDashboard,
  reviewProposal,
  updateResearchProgress,
  manageMilestones,
  reviewDocument,
  addProjectFeedback,
  scheduleMeeting,
  respondMeetingRequest,
  createDeadline,
  deleteDeadline,
  updateAvailabilitySchedule,
  updateSupervisorProfile,
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from '../services/supervisorService';
import { getCurrentUser } from '../services/authService';

const STATUS_CONFIG = {
  draft: { label: 'Draft', color: 'badge-draft', icon: '📝' },
  pending: { label: 'Pending Review', color: 'badge-pending', icon: '⏳' },
  approved: { label: 'Approved', color: 'badge-approved', icon: '✨' },
  rejected: { label: 'Revision Required', color: 'badge-rejected', icon: '⚠️' },
  ongoing: { label: 'Active Study', color: 'badge-ongoing', icon: '🚀' },
  completed: { label: 'Thesis Completed', color: 'badge-completed', icon: '🎓' },
};

const DOC_STATUS_CONFIG = {
  pending: { label: 'Pending Review', class: 'doc-status-pending', icon: '⏳' },
  approved: { label: 'Approved', class: 'doc-status-approved', icon: '✓' },
  revision_requested: { label: 'Revisions Needed', class: 'doc-status-revision', icon: '✍' },
  rejected: { label: 'Rejected', class: 'doc-status-rejected', icon: '✕' },
};

export default function SupervisorDashboard() {
  const navigate = useNavigate();
  const [currentUser] = useState(getCurrentUser());
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  // Modals state
  const [selectedProject, setSelectedProject] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [showDocReviewModal, setShowDocReviewModal] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState(null);
  const [showMeetingModal, setShowMeetingModal] = useState(false);
  const [showDeadlineModal, setShowDeadlineModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [reviewForm, setReviewForm] = useState({ status: 'approved', remarks: '' });
  const [progressForm, setProgressForm] = useState({ progressPercentage: 50, status: 'ongoing', isPublic: false });
  const [docReviewForm, setDocReviewForm] = useState({ status: 'approved', feedback: '' });
  const [feedbackText, setFeedbackText] = useState('');
  const [meetingForm, setMeetingForm] = useState({
    researchId: '',
    meetingDate: '',
    meetingLink: '',
    location: 'Faculty Consultation Room',
    notes: '',
  });
  const [deadlineForm, setDeadlineForm] = useState({
    batchId: '',
    title: '',
    description: '',
    deadlineType: 'progress_report',
    dueDate: '',
  });
  const [milestoneForm, setMilestoneForm] = useState({
    title: '',
    description: '',
    dueDate: '',
  });
  const [profileForm, setProfileForm] = useState({
    name: '',
    phone: '',
    designation: '',
    expertise: '',
  });
  const [availabilitySlots, setAvailabilitySlots] = useState([]);

  const applyData = useCallback((data) => {
    setDashboardData(data);
    if (data.supervisor) {
      setProfileForm({
        name: data.supervisor.userId?.name || '',
        phone: data.supervisor.userId?.phone || '',
        designation: data.supervisor.designation || '',
        expertise: Array.isArray(data.supervisor.expertise)
          ? data.supervisor.expertise.join(', ')
          : data.supervisor.expertise || '',
      });
      setAvailabilitySlots(data.supervisor.availability || []);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setError('');
      const data = await getSupervisorDashboard();
      applyData(data);
    } catch (err) {
      setError(err.message || 'Failed to load supervisor dashboard.');
    }
  }, [applyData]);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'supervisor') {
      navigate('/login?role=supervisor');
      return;
    }
    let isCurrent = true;
    getSupervisorDashboard()
      .then((data) => {
        if (!isCurrent) return;
        applyData(data);
        setLoading(false);
      })
      .catch((err) => {
        if (!isCurrent) return;
        setError(err.message || 'Failed to load supervisor dashboard.');
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

  const handleProposalReview = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      setSubmitting(true);
      await reviewProposal(selectedProject._id, reviewForm);
      notify(`Proposal marked as ${reviewForm.status}. Student notified.`);
      setShowReviewModal(false);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to review proposal.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleProgressUpdate = async (e) => {
    e.preventDefault();
    if (!selectedProject) return;
    try {
      setSubmitting(true);
      await updateResearchProgress(selectedProject._id, {
        progressPercentage: Number(progressForm.progressPercentage),
        status: progressForm.status,
        isPublic: progressForm.isPublic,
      });
      notify('Student research progress and showcase status updated.');
      setShowProgressModal(false);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update progress.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMilestone = async (e) => {
    e.preventDefault();
    if (!selectedProject || !milestoneForm.title.trim()) return;
    try {
      setSubmitting(true);
      await manageMilestones(selectedProject._id, {
        action: 'add',
        title: milestoneForm.title,
        description: milestoneForm.description,
        dueDate: milestoneForm.dueDate,
      });
      notify('Milestone added to research plan.');
      setMilestoneForm({ title: '', description: '', dueDate: '' });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to add milestone.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggleMilestone = async (project, milestoneId, currentStatus) => {
    const nextStatus = currentStatus === 'completed' ? 'in_progress' : 'completed';
    try {
      await manageMilestones(project._id, {
        action: 'update',
        milestoneId,
        status: nextStatus,
      });
      notify(`Milestone updated to ${nextStatus}.`);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to toggle milestone.');
    }
  };

  const handleDocReview = async (e) => {
    e.preventDefault();
    if (!selectedDoc) return;
    try {
      setSubmitting(true);
      await reviewDocument(selectedDoc._id, docReviewForm);
      notify(`Document marked as ${docReviewForm.status}.`);
      setShowDocReviewModal(false);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to review document.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddFeedback = async (e) => {
    e.preventDefault();
    if (!selectedProject || !feedbackText.trim()) return;
    try {
      setSubmitting(true);
      await addProjectFeedback(selectedProject._id, feedbackText);
      notify('Feedback recorded and notification sent to student.');
      setFeedbackText('');
      setShowFeedbackModal(false);
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to submit feedback.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleMeeting = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await scheduleMeeting(meetingForm);
      notify('Meeting scheduled and student notified.');
      setShowMeetingModal(false);
      setMeetingForm({
        researchId: '',
        meetingDate: '',
        meetingLink: '',
        location: 'Faculty Consultation Room',
        notes: '',
      });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to schedule meeting.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRespondMeeting = async (meetingId, status) => {
    const meetLink = prompt(
      status === 'scheduled'
        ? 'Enter online meeting link or location note (optional):'
        : 'Enter reason for declining meeting (optional):'
    );
    try {
      await respondMeetingRequest(meetingId, {
        status,
        meetingLink: status === 'scheduled' ? meetLink || '' : '',
        notes: meetLink || '',
      });
      notify(status === 'scheduled' ? 'Meeting request accepted.' : 'Meeting request declined.');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to respond to meeting request.');
    }
  };

  const handleCreateDeadline = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await createDeadline(deadlineForm);
      notify('Deadline announced to all batch students.');
      setShowDeadlineModal(false);
      setDeadlineForm({
        batchId: '',
        title: '',
        description: '',
        deadlineType: 'progress_report',
        dueDate: '',
      });
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to create deadline.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteDeadline = async (id) => {
    if (!confirm('Are you sure you want to delete this deadline?')) return;
    try {
      await deleteDeadline(id);
      notify('Deadline removed.');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to delete deadline.');
    }
  };

  const handleSaveAvailability = async () => {
    try {
      await updateAvailabilitySchedule(availabilitySlots);
      notify('Consultation availability hours updated.');
      await loadData();
    } catch (err) {
      alert(err.message || 'Failed to update availability.');
    }
  };

  const handleProfileSave = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      await updateSupervisorProfile(profileForm);
      notify('Supervisor profile updated successfully.');
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
        <p>Loading supervisor console &amp; candidate records...</p>
      </div>
    );
  }

  const {
    supervisor,
    assignedProjects = [],
    documents = [],
    deadlines = [],
    meetings = [],
    notifications = [],
    stats = {},
  } = dashboardData || {};

  const pendingProposals = assignedProjects.filter((p) => p.status === 'pending');
  const pendingDocs = documents.filter((d) => d.status === 'pending');
  const meetingRequests = meetings.filter((m) => m.status === 'requested');
  const scheduledMeetings = meetings.filter((m) => m.status === 'scheduled');
  const totalQueueCount = pendingProposals.length + pendingDocs.length + meetingRequests.length;

  // Batches available for deadlines
  const batches = [
    ...new Map(
      assignedProjects
        .filter((p) => p.batchId)
        .map((p) => [p.batchId._id, p.batchId])
    ).values(),
  ];

  // Radial calculation for supervisor activity / progress rate
  const activeCount = assignedProjects.filter((p) => p.status === 'ongoing' || p.status === 'completed').length;
  const supervisorPct = assignedProjects.length > 0 ? Math.round((activeCount / assignedProjects.length) * 100) : 100;
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (supervisorPct / 100) * circumference;

  return (
    <div className="modern-dashboard-layout">
      {/* ================= HERO CANOPY ================= */}
      <header className="hero-canopy supervisor-canopy">
        <div className="container hero-canopy-inner">
          <div className="hero-profile-cell">
            <div className="hero-avatar-wrapper">
              <div className="hero-avatar-gradient supervisor-avatar">
                <span>{supervisor?.userId?.name?.charAt(0) || 'D'}</span>
              </div>
              <span className="online-beacon" title="Account Active"></span>
            </div>

            <div className="hero-meta-block">
              <h1 className="hero-user-name">{supervisor?.userId?.name}</h1>
              <p className="hero-affiliation-line">
                {supervisor?.designation || 'Academic Staff'} · {supervisor?.departmentId?.name || 'Faculty of Applied Science'}
                <span className="batch-pill-subtle">{supervisor?.userId?.email}</span>
              </p>
            </div>
          </div>

          {/* Right Hero Radial Metric */}
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
                    stroke="url(#supervisorProgressGradient)"
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
                    <linearGradient id="supervisorProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#d4af37" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="ring-center-content">
                  <span className="ring-percentage">{supervisorPct}%</span>
                  <span className="ring-label">Active</span>
                </div>
              </div>
              <div className="ring-summary-text">
                <strong>{assignedProjects.length} Supervised</strong>
                <span>{totalQueueCount > 0 ? `${totalQueueCount} in Review Queue` : 'All Queue Clear'}</span>
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

      {/* Main Container & Left-Side Vertical Tabs Layout */}
      <div className="container dashboard-body">
        <div className="dashboard-vertical-layout">
          {/* Left Vertical Tabs Sidebar */}
          <aside className="dashboard-vertical-sidebar" aria-label="Supervisor navigation">
            <div className="sidebar-sticky-panel glass-card">
              <div className="sidebar-header-badge">
                <span className="sidebar-tag">
                  <span>🏛</span> FACULTY SUPERVISOR
                </span>
              </div>
              <nav className="vertical-tabs-nav" aria-label="Supervisor navigation">
                <button
                  type="button"
                  className={`vertical-tab-item ${activeTab === 'overview' ? 'active' : ''}`}
                  onClick={() => setActiveTab('overview')}
                >
                  <span className="nav-icon">📊</span>
                  <span className="nav-text">Queue &amp; Overview</span>
                  {totalQueueCount > 0 && <span className="pill-counter alert-counter">{totalQueueCount}</span>}
                </button>
                <button
                  type="button"
                  className={`vertical-tab-item ${activeTab === 'students' ? 'active' : ''}`}
                  onClick={() => setActiveTab('students')}
                >
                  <span className="nav-icon">👨‍🎓</span>
                  <span className="nav-text">Supervised Researchers</span>
                  <span className="pill-counter">{assignedProjects.length}</span>
                </button>
                <button
                  type="button"
                  className={`vertical-tab-item ${activeTab === 'proposals' ? 'active' : ''}`}
                  onClick={() => setActiveTab('proposals')}
                >
                  <span className="nav-icon">📝</span>
                  <span className="nav-text">Proposals</span>
                  {pendingProposals.length > 0 && <span className="pill-counter alert-counter">{pendingProposals.length}</span>}
                </button>
                <button
                  type="button"
                  className={`vertical-tab-item ${activeTab === 'documents' ? 'active' : ''}`}
                  onClick={() => setActiveTab('documents')}
                >
                  <span className="nav-icon">📂</span>
                  <span className="nav-text">Deliverables</span>
                  {pendingDocs.length > 0 && <span className="pill-counter alert-counter">{pendingDocs.length}</span>}
                </button>
                <button
                  type="button"
                  className={`vertical-tab-item ${activeTab === 'meetings' ? 'active' : ''}`}
                  onClick={() => setActiveTab('meetings')}
                >
                  <span className="nav-icon">🗓</span>
                  <span className="nav-text">Consultations &amp; Hours</span>
                  {meetingRequests.length > 0 && <span className="pill-counter alert-counter">{meetingRequests.length}</span>}
                </button>
                <button
                  type="button"
                  className={`vertical-tab-item ${activeTab === 'deadlines' ? 'active' : ''}`}
                  onClick={() => setActiveTab('deadlines')}
                >
                  <span className="nav-icon">⏰</span>
                  <span className="nav-text">Deadlines</span>
                  <span className="pill-counter">{deadlines.length}</span>
                </button>
                <button
                  type="button"
                  className={`vertical-tab-item ${activeTab === 'reports' ? 'active' : ''}`}
                  onClick={() => setActiveTab('reports')}
                >
                  <span className="nav-icon">📈</span>
                  <span className="nav-text">Analytics</span>
                </button>
                <button
                  type="button"
                  className={`vertical-tab-item ${activeTab === 'notifications' ? 'active' : ''}`}
                  onClick={() => setActiveTab('notifications')}
                >
                  <span className="nav-icon">🔔</span>
                  <span className="nav-text">Alerts</span>
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
                  onClick={() => setShowDeadlineModal(true)}
                >
                  <span className="sidebar-action-icon">⏰</span>
                  <span>Post Deadline</span>
                </button>
                <button
                  type="button"
                  className="sidebar-action-btn"
                  onClick={() => setShowMeetingModal(true)}
                >
                  <span className="sidebar-action-icon">🗓</span>
                  <span>Set Availability</span>
                </button>
                <button
                  type="button"
                  className="sidebar-action-btn"
                  onClick={() => setShowProfileModal(true)}
                >
                  <span className="sidebar-action-icon">⚙</span>
                  <span>Profile Settings</span>
                </button>
              </div>
            </div>
          </aside>

          {/* Main Right Stage */}
          <main className="dashboard-vertical-content">
            {/* Urgent Action Bar if items pending */}
            {totalQueueCount > 0 && (
              <div className="action-required-banner glass-card animate-pulse-gentle">
                <div className="action-banner-icon">⚡</div>
                <div className="action-banner-text">
                  <strong>Action Required in Queue:</strong> You have{' '}
                  {pendingProposals.length > 0 && `${pendingProposals.length} proposal(s) awaiting approval, `}
                  {pendingDocs.length > 0 && `${pendingDocs.length} deliverable(s) to evaluate, `}
                  {meetingRequests.length > 0 && `${meetingRequests.length} consultation request(s) to respond to.`}
                </div>
                <button
                  type="button"
                  className="btn-glow-primary btn-sm"
                  onClick={() => setActiveTab('overview')}
                >
                  Review Queue Now ➔
                </button>
              </div>
            )}

        {/* ================= TAB 1: OVERVIEW & ACTION QUEUE ================= */}
        {activeTab === 'overview' && (
          <div className="tab-stage animate-fade-in">
            {/* Top Stat Metric Cards Grid */}
            <div className="metrics-triad-grid">
              <div className="metric-glow-card glass-card">
                <div className="metric-card-header">
                  <span className="metric-title-chip">Supervised Candidates</span>
                  <div className="metric-icon-bubble bubble-purple">👨‍🎓</div>
                </div>
                <div className="metric-primary-data">
                  <span className="metric-large-number">{stats.totalStudents || assignedProjects.length}</span>
                </div>
                <p className="metric-helper-text">
                  {stats.activeProjects || assignedProjects.filter((p) => p.status === 'ongoing').length} active investigations
                </p>
              </div>

              <div className="metric-glow-card glass-card">
                <div className="metric-card-header">
                  <span className="metric-title-chip">Proposals to Review</span>
                  <div className="metric-icon-bubble bubble-gold">📝</div>
                </div>
                <div className="metric-primary-data">
                  <span className="metric-large-number">{pendingProposals.length}</span>
                </div>
                <p className="metric-helper-text">
                  {pendingProposals.length === 0 ? 'All proposals vetted' : 'Formal approval required'}
                </p>
              </div>

              <div className="metric-glow-card glass-card">
                <div className="metric-card-header">
                  <span className="metric-title-chip">Deliverables Pending</span>
                  <div className="metric-icon-bubble bubble-rose">📂</div>
                </div>
                <div className="metric-primary-data">
                  <span className="metric-large-number">{pendingDocs.length}</span>
                </div>
                <p className="metric-helper-text">
                  Progress reports &amp; drafts to evaluate
                </p>
              </div>

              <div className="metric-glow-card glass-card">
                <div className="metric-card-header">
                  <span className="metric-title-chip">Consultation Requests</span>
                  <div className="metric-icon-bubble bubble-emerald">🗓</div>
                </div>
                <div className="metric-primary-data">
                  <span className="metric-large-number">{meetingRequests.length}</span>
                </div>
                <p className="metric-helper-text">
                  {scheduledMeetings.length} scheduled office meetings
                </p>
              </div>
            </div>

            {/* Pending Review Queue Card */}
            <div className="modern-panel-card glass-card">
              <div className="panel-header-row">
                <div className="panel-title-group">
                  <span className="panel-eyebrow">Direct Action Items</span>
                  <h3 className="panel-headline">⚡ Priority Review Queue</h3>
                  <p className="panel-subtext">
                    Proposals, thesis drafts, and appointment requests submitted by your research candidates.
                  </p>
                </div>
              </div>

              {pendingProposals.length === 0 && pendingDocs.length === 0 && meetingRequests.length === 0 ? (
                <div className="empty-hero-card glass-card">
                  <div className="empty-hero-icon">✨</div>
                  <h3>All Review Queues Clear!</h3>
                  <p>There are no pending student proposals, deliverables, or meeting appointments requiring your evaluation.</p>
                </div>
              ) : (
                <div className="action-queue-list">
                  {/* Proposals to Review */}
                  {pendingProposals.map((p) => (
                    <div key={p._id} className="queue-card-item proposal-item glass-card-interactive">
                      <div className="queue-badge-pill proposal">Proposal</div>
                      <div className="queue-details">
                        <h4>{p.title}</h4>
                        <p className="queue-meta-line">
                          Candidate: <strong>{p.studentId?.userId?.name}</strong> ({p.studentId?.regNo} · Cohort {p.batchId?.batchName || p.academicYear})
                        </p>
                        <p className="snippet">{p.description?.slice(0, 160)}...</p>
                      </div>
                      <div className="queue-action-btns">
                        <button
                          type="button"
                          className="btn-glow-primary btn-sm"
                          onClick={() => {
                            setSelectedProject(p);
                            setReviewForm({ status: 'approved', remarks: '' });
                            setShowReviewModal(true);
                          }}
                        >
                          Review &amp; Approve ✍
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Documents to Review */}
                  {pendingDocs.map((doc) => (
                    <div key={doc._id} className="queue-card-item doc-item glass-card-interactive">
                      <div className="queue-badge-pill document">Deliverable</div>
                      <div className="queue-details">
                        <h4>{doc.title}</h4>
                        <p className="queue-meta-line">
                          Type: <strong>{doc.documentType?.replace('_', ' ').toUpperCase()}</strong> · Submitted by {doc.uploadedBy?.name}
                        </p>
                        <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="doc-link-peek">
                          Open Deliverable ↗
                        </a>
                      </div>
                      <div className="queue-action-btns">
                        <button
                          type="button"
                          className="btn-glow-primary btn-sm"
                          onClick={() => {
                            setSelectedDoc(doc);
                            setDocReviewForm({ status: 'approved', feedback: '' });
                            setShowDocReviewModal(true);
                          }}
                        >
                          Evaluate Document ✍
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Meeting Requests */}
                  {meetingRequests.map((m) => (
                    <div key={m._id} className="queue-card-item meeting-item glass-card-interactive">
                      <div className="queue-badge-pill meeting">Appointment</div>
                      <div className="queue-details">
                        <h4>Appointment Requested by {m.studentId?.userId?.name}</h4>
                        <p className="queue-meta-line">
                          Proposed Date: <strong>{new Date(m.meetingDate).toLocaleString()}</strong>
                        </p>
                        {m.notes && <p className="snippet">Agenda: {m.notes}</p>}
                      </div>
                      <div className="queue-action-btns">
                        <button
                          type="button"
                          className="btn-glow-primary btn-sm"
                          onClick={() => handleRespondMeeting(m._id, 'scheduled')}
                        >
                          Accept ✓
                        </button>
                        <button
                          type="button"
                          className="btn-glow-outline btn-sm"
                          onClick={() => handleRespondMeeting(m._id, 'rejected')}
                        >
                          Decline
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 2: SUPERVISED CANDIDATES ================= */}
        {activeTab === 'students' && (
          <div className="tab-stage animate-fade-in">
            <div className="modern-panel-card glass-card">
              <div className="panel-header-row">
                <div className="panel-title-group">
                  <span className="panel-eyebrow">Academic Roster</span>
                  <h2 className="panel-headline">Supervised Candidates &amp; Research Projects</h2>
                  <p className="panel-subtext">
                    Track candidate milestones, adjust completion percentages, give written feedback, and control public university showcase visibility.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-glow-primary"
                  onClick={() => setShowMeetingModal(true)}
                >
                  🗓 Schedule Consultation
                </button>
              </div>

              {assignedProjects.length === 0 ? (
                <div className="empty-hero-card glass-card">
                  <div className="empty-hero-icon">👥</div>
                  <h3>No Candidates Assigned Currently</h3>
                  <p>When students submit research proposals choosing your academic profile, their study cards will appear here.</p>
                </div>
              ) : (
                <div className="projects-admin-grid">
                  {assignedProjects.map((proj) => {
                    const statusObj = STATUS_CONFIG[proj.status] || STATUS_CONFIG.draft;
                    const completedMCount = (proj.milestones || []).filter((m) => m.status === 'completed').length;
                    return (
                      <div key={proj._id} className="project-admin-card glass-card-interactive">
                        <div className="project-admin-card-header">
                          <span className="topic-badge">
                            <span className="sparkle">✦</span> {proj.topic || 'Undergraduate Capstone'}
                          </span>
                          <span className={`status-badge-elevated ${statusObj.color}`}>
                            {statusObj.icon} {statusObj.label}
                          </span>
                        </div>

                        <h3 className="project-title-link">{proj.title}</h3>
                        <p className="project-desc-clamp">{proj.description}</p>

                        <div className="student-profile-strip">
                          <div className="mini-avatar">{proj.studentId?.userId?.name?.charAt(0) || 'S'}</div>
                          <div className="mini-student-meta">
                            <strong>{proj.studentId?.userId?.name}</strong>
                            <span>{proj.studentId?.regNo} · Cohort {proj.batchId?.batchName || proj.academicYear}</span>
                            <span>{proj.studentId?.userId?.email}</span>
                          </div>
                        </div>

                        <div className="progress-section-row">
                          <div className="progress-labels">
                            <span>Investigation Progress</span>
                            <strong>{proj.progressPercentage || 0}%</strong>
                          </div>
                          <div className="sleek-progress-track">
                            <div
                              className="sleek-progress-bar"
                              style={{ width: `${proj.progressPercentage || 0}%` }}
                            ></div>
                          </div>
                          <div className="milestone-counter-sub">
                            Milestones achieved: <strong>{completedMCount} of {proj.milestones?.length || 0}</strong>
                          </div>
                        </div>

                        <div className="public-showcase-indicator">
                          <span>Showcase Publication:</span>
                          <strong className={proj.isPublic ? 'text-emerald' : 'text-muted'}>
                            {proj.isPublic ? '🌐 Visible on University Portal' : '🔒 Internal Campus Repository'}
                          </strong>
                        </div>

                        <div className="project-card-btn-row">
                          <button
                            type="button"
                            className="btn-glow-outline btn-sm"
                            onClick={() => {
                              setSelectedProject(proj);
                              setProgressForm({
                                progressPercentage: proj.progressPercentage || 0,
                                status: proj.status,
                                isPublic: proj.isPublic || false,
                              });
                              setShowProgressModal(true);
                            }}
                          >
                            ⚙ Progress &amp; Milestones
                          </button>
                          <button
                            type="button"
                            className="btn-glow-primary btn-sm"
                            onClick={() => {
                              setSelectedProject(proj);
                              setShowFeedbackModal(true);
                            }}
                          >
                            💬 Send Feedback
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: PROPOSAL REVIEWS ================= */}
        {activeTab === 'proposals' && (
          <div className="tab-stage animate-fade-in">
            <div className="modern-panel-card glass-card">
              <div className="panel-header-row">
                <div className="panel-title-group">
                  <span className="panel-eyebrow">Formal Review Gate</span>
                  <h2 className="panel-headline">Research Proposal Evaluation Queue</h2>
                  <p className="panel-subtext">
                    Scrutinize research problem statements, methodologies, and proposed scopes before candidates proceed.
                  </p>
                </div>
              </div>

              {pendingProposals.length === 0 ? (
                <div className="empty-hero-card glass-card">
                  <div className="empty-hero-icon">✅</div>
                  <h3>No Proposals Awaiting Approval</h3>
                  <p>All student research proposals under your academic supervision have been evaluated.</p>
                </div>
              ) : (
                <div className="proposals-review-list">
                  {pendingProposals.map((proj) => (
                    <div key={proj._id} className="proposal-review-box glass-card-interactive">
                      <div className="proposal-box-header">
                        <div>
                          <span className="topic-badge">
                            <span className="sparkle">✦</span> {proj.topic || 'Proposal'}
                          </span>
                          <h3>{proj.title}</h3>
                          <p className="student-ref">
                            Candidate: <strong>{proj.studentId?.userId?.name}</strong> ({proj.studentId?.regNo} · Cohort {proj.batchId?.batchName || proj.academicYear})
                          </p>
                        </div>
                        <span className="status-badge-elevated badge-pending">⏳ Pending Review</span>
                      </div>

                      <div className="abstract-block">
                        <h4>Problem Formulation &amp; Abstract:</h4>
                        <p>{proj.description}</p>
                      </div>

                      <div className="proposal-decision-btns">
                        <button
                          type="button"
                          className="btn-glow-primary"
                          onClick={() => {
                            setSelectedProject(proj);
                            setReviewForm({ status: 'approved', remarks: '' });
                            setShowReviewModal(true);
                          }}
                        >
                          Approve Proposal ✓
                        </button>
                        <button
                          type="button"
                          className="btn-glow-outline"
                          onClick={() => {
                            setSelectedProject(proj);
                            setReviewForm({ status: 'rejected', remarks: '' });
                            setShowReviewModal(true);
                          }}
                        >
                          Request Revisions ✍
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 4: DELIVERABLE EVALUATIONS ================= */}
        {activeTab === 'documents' && (
          <div className="tab-stage animate-fade-in">
            <div className="modern-panel-card glass-card">
              <div className="panel-header-row">
                <div className="panel-title-group">
                  <span className="panel-eyebrow">Academic Submissions</span>
                  <h2 className="panel-headline">Student Deliverables &amp; Reports Evaluation</h2>
                  <p className="panel-subtext">
                    Inspect submitted drafts, progress reports, and thesis dissertations with written recommendations.
                  </p>
                </div>
              </div>

              {documents.length === 0 ? (
                <div className="empty-hero-card glass-card">
                  <div className="empty-hero-icon">📄</div>
                  <h3>No Deliverables Uploaded Yet</h3>
                  <p>When candidates upload documents or dissertation drafts, they will appear in this review ledger.</p>
                </div>
              ) : (
                <div className="modern-table-card">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Deliverable Title</th>
                        <th>Type</th>
                        <th>Candidate</th>
                        <th>Evaluation Status</th>
                        <th>File Attachment</th>
                        <th>Supervisor Remarks</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {documents.map((doc) => {
                        const docStatus = DOC_STATUS_CONFIG[doc.status || 'pending'] || DOC_STATUS_CONFIG.pending;
                        return (
                          <tr key={doc._id}>
                            <td>
                              <strong>{doc.title}</strong>
                            </td>
                            <td>
                              <span className="doc-type-pill">
                                {doc.documentType?.replace('_', ' ').toUpperCase()}
                              </span>
                            </td>
                            <td>{doc.uploadedBy?.name}</td>
                            <td>
                              <span className={`doc-status-badge ${docStatus.class}`}>
                                {docStatus.icon} {docStatus.label}
                              </span>
                            </td>
                            <td>
                              <a
                                href={doc.fileUrl}
                                target="_blank"
                                rel="noreferrer"
                                className="doc-link-peek"
                              >
                                View File ↗
                              </a>
                            </td>
                            <td>
                              <span className="feedback-text-snippet">{doc.feedback || '—'}</span>
                            </td>
                            <td>
                              <button
                                type="button"
                                className="btn-glow-primary btn-sm"
                                onClick={() => {
                                  setSelectedDoc(doc);
                                  setDocReviewForm({
                                    status: doc.status || 'approved',
                                    feedback: doc.feedback || '',
                                  });
                                  setShowDocReviewModal(true);
                                }}
                              >
                                Evaluate ✍
                              </button>
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

        {/* ================= TAB 5: CONSULTATIONS & OFFICE HOURS ================= */}
        {activeTab === 'meetings' && (
          <div className="tab-stage animate-fade-in">
            <div className="dashboard-grid-two">
              {/* Scheduled Sessions & Requests */}
              <div className="modern-panel-card glass-card">
                <div className="panel-header-row">
                  <div>
                    <h3 className="panel-headline">🗓 Consultation Sessions</h3>
                    <p className="panel-subtext">Requested and confirmed meetings with your candidates.</p>
                  </div>
                  <button
                    type="button"
                    className="btn-glow-primary btn-sm"
                    onClick={() => setShowMeetingModal(true)}
                  >
                    + Schedule Session
                  </button>
                </div>

                {meetings.length === 0 ? (
                  <p className="empty-muted">No scheduled meetings or pending appointments.</p>
                ) : (
                  <div className="meetings-list">
                    {meetings.map((m) => (
                      <div key={m._id} className="meeting-card-item glass-card-interactive">
                        <div className="meeting-date-badge">
                          <span className="day">
                            {new Date(m.meetingDate).toLocaleDateString(undefined, { weekday: 'short' })}
                          </span>
                          <span className="date">{new Date(m.meetingDate).getDate()}</span>
                          <span className="month">
                            {new Date(m.meetingDate).toLocaleDateString(undefined, { month: 'short' })}
                          </span>
                        </div>
                        <div className="meeting-info">
                          <strong>Candidate: {m.studentId?.userId?.name}</strong>
                          <span className="meeting-time">
                            🕒 {new Date(m.meetingDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <span className={`meeting-status-tag status-${m.status}`}>{m.status.toUpperCase()}</span>
                          {m.notes && <p className="meeting-notes-text">Agenda: {m.notes}</p>}
                          {m.location && <p className="meeting-loc">📍 {m.location}</p>}
                          {m.meetingLink && (
                            <a href={m.meetingLink} target="_blank" rel="noreferrer" className="meeting-link-btn">
                              Join Meeting 🔗
                            </a>
                          )}

                          {m.status === 'requested' && (
                            <div className="meeting-resp-row">
                              <button
                                type="button"
                                className="btn-glow-primary btn-sm"
                                onClick={() => handleRespondMeeting(m._id, 'scheduled')}
                              >
                                Accept ✓
                              </button>
                              <button
                                type="button"
                                className="btn-glow-outline btn-sm"
                                onClick={() => handleRespondMeeting(m._id, 'rejected')}
                              >
                                Decline ✕
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Consultation Availability Management */}
              <div className="modern-panel-card glass-card">
                <h3 className="panel-headline">⏰ Weekly Office Hours</h3>
                <p className="panel-subtext">
                  Set regular hours when students can visit your faculty office or book appointments.
                </p>

                <div className="availability-manager" style={{ marginTop: '16px' }}>
                  {availabilitySlots.map((slot, index) => (
                    <div key={index} className="availability-slot-row">
                      <select
                        value={slot.day}
                        onChange={(e) => {
                          const updated = [...availabilitySlots];
                          updated[index].day = e.target.value;
                          setAvailabilitySlots(updated);
                        }}
                      >
                        {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'].map((day) => (
                          <option key={day} value={day}>
                            {day}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => {
                          const updated = [...availabilitySlots];
                          updated[index].startTime = e.target.value;
                          setAvailabilitySlots(updated);
                        }}
                      />
                      <span>to</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => {
                          const updated = [...availabilitySlots];
                          updated[index].endTime = e.target.value;
                          setAvailabilitySlots(updated);
                        }}
                      />
                      <button
                        type="button"
                        className="delete-slot-btn"
                        onClick={() => {
                          setAvailabilitySlots(availabilitySlots.filter((_, i) => i !== index));
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}

                  <div className="availability-btn-row">
                    <button
                      type="button"
                      className="btn-glow-outline btn-sm"
                      onClick={() => {
                        setAvailabilitySlots([
                          ...availabilitySlots,
                          { day: 'Monday', startTime: '09:00', endTime: '11:00' },
                        ]);
                      }}
                    >
                      + Add Time Slot
                    </button>
                    <button
                      type="button"
                      className="btn-glow-primary btn-sm"
                      onClick={handleSaveAvailability}
                    >
                      Save Office Hours
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 6: ACADEMIC DEADLINES ================= */}
        {activeTab === 'deadlines' && (
          <div className="tab-stage animate-fade-in">
            <div className="modern-panel-card glass-card">
              <div className="panel-header-row">
                <div className="panel-title-group">
                  <span className="panel-eyebrow">Cohort Milestones</span>
                  <h2 className="panel-headline">Batch Deadlines &amp; Research Timelines</h2>
                  <p className="panel-subtext">
                    Post mandatory submission deadlines for proposals, progress reports, and thesis dissertations.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-glow-primary"
                  onClick={() => setShowDeadlineModal(true)}
                >
                  + Announce Deadline
                </button>
              </div>

              {deadlines.length === 0 ? (
                <div className="empty-hero-card glass-card">
                  <div className="empty-hero-icon">⏰</div>
                  <h3>No Academic Deadlines Active</h3>
                  <p>Announce submission targets so your candidate batches maintain academic schedule discipline.</p>
                </div>
              ) : (
                <div className="timeline-deadline-list">
                  {deadlines.map((d) => (
                    <div key={d._id} className="deadline-item glass-card-interactive">
                      <div className="deadline-icon-pill">📌</div>
                      <div className="deadline-details">
                        <div className="deadline-title-top">
                          <h4>{d.title}</h4>
                          <span className="deadline-type-badge">
                            {d.deadlineType?.replace('_', ' ').toUpperCase()}
                          </span>
                        </div>
                        <span className="deadline-due">
                          📅 Due Date: {new Date(d.dueDate).toLocaleDateString()} · Target Batch:{' '}
                          {d.batchId?.batchName || d.batchId?.academicYear || 'All Batches'}
                        </span>
                        {d.description && <p className="deadline-desc">{d.description}</p>}
                      </div>
                      <button
                        type="button"
                        className="btn-glow-outline btn-sm delete-btn-accent"
                        onClick={() => handleDeleteDeadline(d._id)}
                      >
                        Remove 🗑
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 7: PROGRESS ANALYTICS ================= */}
        {activeTab === 'reports' && (
          <div className="tab-stage animate-fade-in">
            <div className="modern-panel-card glass-card">
              <div className="panel-header-row">
                <div className="panel-title-group">
                  <span className="panel-eyebrow">Faculty Analytics</span>
                  <h2 className="panel-headline">Research Progress Analytics &amp; Reports</h2>
                  <p className="panel-subtext">
                    Comprehensive performance distribution of all candidates across stages and milestones.
                  </p>
                </div>
              </div>

              <div className="metrics-triad-grid" style={{ marginTop: '20px' }}>
                <div className="metric-glow-card glass-card">
                  <span className="metric-title-chip">Mean Cohort Progress</span>
                  <div className="metric-primary-data">
                    <span className="metric-large-number">
                      {assignedProjects.length > 0
                        ? Math.round(
                            assignedProjects.reduce((acc, p) => acc + (p.progressPercentage || 0), 0) /
                              assignedProjects.length
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <p className="metric-helper-text">Average progress across candidates</p>
                </div>

                <div className="metric-glow-card glass-card">
                  <span className="metric-title-chip">Completed Defenses</span>
                  <div className="metric-primary-data">
                    <span className="metric-large-number">
                      {assignedProjects.filter((p) => p.status === 'completed').length}
                    </span>
                  </div>
                  <p className="metric-helper-text">Ready for viva defense</p>
                </div>

                <div className="metric-glow-card glass-card">
                  <span className="metric-title-chip">Ongoing Supervisions</span>
                  <div className="metric-primary-data">
                    <span className="metric-large-number">
                      {assignedProjects.filter((p) => p.status === 'ongoing').length}
                    </span>
                  </div>
                  <p className="metric-helper-text">Active experimentation &amp; write-up</p>
                </div>
              </div>

              <div className="modern-table-card" style={{ marginTop: '30px' }}>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Investigation Title</th>
                      <th>Cohort</th>
                      <th>Status</th>
                      <th>Progress %</th>
                      <th>Milestones Completed</th>
                      <th>Deliverables</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assignedProjects.map((p) => {
                      const completedMCount = (p.milestones || []).filter((m) => m.status === 'completed').length;
                      const projDocs = documents.filter((d) => String(d.researchId) === String(p._id));
                      return (
                        <tr key={p._id}>
                          <td>
                            <strong>{p.studentId?.userId?.name}</strong>
                            <div className="sub-text-xs">{p.studentId?.regNo}</div>
                          </td>
                          <td>{p.title}</td>
                          <td>{p.batchId?.batchName}</td>
                          <td>
                            <span className={`status-badge-elevated ${STATUS_CONFIG[p.status]?.color || 'badge-draft'}`}>
                              {STATUS_CONFIG[p.status]?.label || p.status}
                            </span>
                          </td>
                          <td>
                            <strong>{p.progressPercentage || 0}%</strong>
                          </td>
                          <td>
                            {completedMCount} / {p.milestones?.length || 0}
                          </td>
                          <td>{projDocs.length}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 8: NOTIFICATIONS ================= */}
        {activeTab === 'notifications' && (
          <div className="tab-stage animate-fade-in">
            <div className="modern-panel-card glass-card">
              <div className="panel-header-row">
                <div className="panel-title-group">
                  <span className="panel-eyebrow">Faculty Alerts</span>
                  <h2 className="panel-headline">Supervisor Notification Center</h2>
                  <p className="panel-subtext">
                    Instant updates on proposal submissions, deliverable uploads, and student appointment requests.
                  </p>
                </div>
                <button
                  type="button"
                  className="btn-glow-outline btn-sm"
                  onClick={handleMarkAllNotifications}
                >
                  ✓ Mark All as Read
                </button>
              </div>

              <div className="notifications-feed">
                {notifications.length === 0 ? (
                  <p className="empty-muted">No notifications right now.</p>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n._id}
                      className={`notification-item-card glass-card-interactive ${n.isRead ? 'read' : 'unread'}`}
                      onClick={() => !n.isRead && handleMarkNotification(n._id)}
                    >
                      <div className="notif-icon">
                        {n.type === 'proposal' ? '📝' : n.type === 'meeting' ? '🗓' : '🔔'}
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

      {/* ================= MODAL: PROPOSAL REVIEW ================= */}
      {showReviewModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowReviewModal(false)}>
          <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Evaluate Research Proposal</h3>
              <button type="button" className="close-btn" onClick={() => setShowReviewModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleProposalReview} className="modal-form">
              <p>
                Candidate: <strong>{selectedProject.studentId?.userId?.name}</strong> ({selectedProject.studentId?.regNo})
              </p>
              <h4>{selectedProject.title}</h4>

              <div className="form-group">
                <label>Evaluation Decision *</label>
                <select
                  value={reviewForm.status}
                  onChange={(e) => setReviewForm({ ...reviewForm, status: e.target.value })}
                >
                  <option value="approved">Approve Proposal (Advance to Ongoing Research)</option>
                  <option value="rejected">Request Revisions / Resubmission</option>
                </select>
              </div>

              <div className="form-group">
                <label>Reviewer Remarks &amp; Recommendations</label>
                <textarea
                  rows="5"
                  placeholder="Provide constructive feedback, required changes, or approval comments..."
                  value={reviewForm.remarks}
                  onChange={(e) => setReviewForm({ ...reviewForm, remarks: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-glow-outline" onClick={() => setShowReviewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-glow-primary" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Confirm Decision & Notify Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: UPDATE PROGRESS & MILESTONES ================= */}
      {showProgressModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowProgressModal(false)}>
          <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Manage Project Progress &amp; Milestones</h3>
              <button type="button" className="close-btn" onClick={() => setShowProgressModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleProgressUpdate} className="modal-form">
              <h4>{selectedProject.title}</h4>

              <div className="form-group">
                <label>Project Status</label>
                <select
                  value={progressForm.status}
                  onChange={(e) => setProgressForm({ ...progressForm, status: e.target.value })}
                >
                  <option value="approved">Approved</option>
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                </select>
              </div>

              <div className="form-group">
                <label>Overall Completion Percentage ({progressForm.progressPercentage}%)</label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={progressForm.progressPercentage}
                  onChange={(e) => setProgressForm({ ...progressForm, progressPercentage: Number(e.target.value) })}
                />
              </div>

              <div className="form-group checkbox-group">
                <label>
                  <input
                    type="checkbox"
                    checked={progressForm.isPublic}
                    onChange={(e) => setProgressForm({ ...progressForm, isPublic: e.target.checked })}
                  />
                  <span>Publish to University Research Showcase (Visible to Public &amp; Industry)</span>
                </label>
              </div>

              <div className="milestone-sub-section">
                <h5>Research Milestones</h5>
                <div className="milestone-mini-list">
                  {(selectedProject.milestones || []).map((m) => (
                    <div key={m._id} className="milestone-mini-item">
                      <span>{m.title}</span>
                      <button
                        type="button"
                        className={`btn-sm ${m.status === 'completed' ? 'btn-glow-outline' : 'btn-glow-primary'}`}
                        onClick={() => handleToggleMilestone(selectedProject, m._id, m.status)}
                      >
                        {m.status === 'completed' ? '✓ Completed' : 'Mark Done'}
                      </button>
                    </div>
                  ))}
                </div>

                {/* Add milestone inline */}
                <div className="add-milestone-inline">
                  <input
                    type="text"
                    placeholder="New milestone title..."
                    value={milestoneForm.title}
                    onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
                  />
                  <button type="button" className="btn-glow-outline btn-sm" onClick={handleAddMilestone}>
                    + Add
                  </button>
                </div>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-glow-outline" onClick={() => setShowProgressModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-glow-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Progress Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: DOCUMENT EVALUATION ================= */}
      {showDocReviewModal && selectedDoc && (
        <div className="modal-overlay" onClick={() => setShowDocReviewModal(false)}>
          <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Evaluate Document Deliverable</h3>
              <button type="button" className="close-btn" onClick={() => setShowDocReviewModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleDocReview} className="modal-form">
              <h4>{selectedDoc.title}</h4>
              <p>Type: {selectedDoc.documentType}</p>
              <a href={selectedDoc.fileUrl} target="_blank" rel="noreferrer" className="doc-link-peek">
                Open Document in New Tab ↗
              </a>

              <div className="form-group" style={{ marginTop: '16px' }}>
                <label>Review Decision *</label>
                <select
                  value={docReviewForm.status}
                  onChange={(e) => setDocReviewForm({ ...docReviewForm, status: e.target.value })}
                >
                  <option value="approved">Approved</option>
                  <option value="revision_requested">Revision Requested</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              <div className="form-group">
                <label>Supervisor Feedback Remarks</label>
                <textarea
                  rows="4"
                  placeholder="Specific chapter edits, format corrections, or remarks..."
                  value={docReviewForm.feedback}
                  onChange={(e) => setDocReviewForm({ ...docReviewForm, feedback: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-glow-outline" onClick={() => setShowDocReviewModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-glow-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Document Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SEND FEEDBACK ================= */}
      {showFeedbackModal && selectedProject && (
        <div className="modal-overlay" onClick={() => setShowFeedbackModal(false)}>
          <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Provide Research Feedback &amp; Guidance</h3>
              <button type="button" className="close-btn" onClick={() => setShowFeedbackModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleAddFeedback} className="modal-form">
              <h4>{selectedProject.title}</h4>
              <p>Candidate: {selectedProject.studentId?.userId?.name}</p>

              <div className="form-group">
                <label>Feedback Message / Guidance Recommendation *</label>
                <textarea
                  rows="6"
                  required
                  placeholder="Provide recommendations on research methodology, data analysis, or next deliverables..."
                  value={feedbackText}
                  onChange={(e) => setFeedbackText(e.target.value)}
                ></textarea>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-glow-outline" onClick={() => setShowFeedbackModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-glow-primary" disabled={submitting}>
                  {submitting ? 'Sending...' : 'Send Feedback to Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SCHEDULE MEETING ================= */}
      {showMeetingModal && (
        <div className="modal-overlay" onClick={() => setShowMeetingModal(false)}>
          <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Schedule Research Consultation Session</h3>
              <button type="button" className="close-btn" onClick={() => setShowMeetingModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleScheduleMeeting} className="modal-form">
              <div className="form-group">
                <label>Select Student Research Study *</label>
                <select
                  required
                  value={meetingForm.researchId}
                  onChange={(e) => setMeetingForm({ ...meetingForm, researchId: e.target.value })}
                >
                  <option value="">-- Choose Student Project --</option>
                  {assignedProjects.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.studentId?.userId?.name} – {p.title}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Meeting Date &amp; Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={meetingForm.meetingDate}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meetingDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Meeting Link (Google Meet / MS Teams)</label>
                <input
                  type="url"
                  placeholder="https://meet.google.com/..."
                  value={meetingForm.meetingLink}
                  onChange={(e) => setMeetingForm({ ...meetingForm, meetingLink: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Meeting Location / Office Room</label>
                <input
                  type="text"
                  placeholder="e.g. Faculty Consultation Room 108"
                  value={meetingForm.location}
                  onChange={(e) => setMeetingForm({ ...meetingForm, location: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Agenda / Discussion Points</label>
                <textarea
                  rows="3"
                  placeholder="Progress review, thesis draft discussion..."
                  value={meetingForm.notes}
                  onChange={(e) => setMeetingForm({ ...meetingForm, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-glow-outline" onClick={() => setShowMeetingModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-glow-primary" disabled={submitting}>
                  {submitting ? 'Scheduling...' : 'Schedule & Notify Candidate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: POST DEADLINE ================= */}
      {showDeadlineModal && (
        <div className="modal-overlay" onClick={() => setShowDeadlineModal(false)}>
          <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Post Academic Deadline</h3>
              <button type="button" className="close-btn" onClick={() => setShowDeadlineModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleCreateDeadline} className="modal-form">
              <div className="form-group">
                <label>Target Academic Batch *</label>
                <select
                  required
                  value={deadlineForm.batchId}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, batchId: e.target.value })}
                >
                  <option value="">-- Choose Batch --</option>
                  {batches.map((b) => (
                    <option key={b._id} value={b._id}>
                      {b.batchName || b.academicYear}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>Deadline Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chapter 4 Methodology & Implementation Draft"
                  value={deadlineForm.title}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Deadline Deliverable Type *</label>
                <select
                  value={deadlineForm.deadlineType}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, deadlineType: e.target.value })}
                >
                  <option value="proposal">Research Proposal</option>
                  <option value="progress_report">Progress Report</option>
                  <option value="final_report">Final Thesis Dissertation</option>
                  <option value="presentation">Oral Presentation / Viva</option>
                  <option value="other">Other Deliverable</option>
                </select>
              </div>

              <div className="form-group">
                <label>Submission Due Date &amp; Time *</label>
                <input
                  type="datetime-local"
                  required
                  value={deadlineForm.dueDate}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, dueDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Description &amp; Guidelines</label>
                <textarea
                  rows="3"
                  placeholder="Submission instructions, expected page count, similarity threshold..."
                  value={deadlineForm.description}
                  onChange={(e) => setDeadlineForm({ ...deadlineForm, description: e.target.value })}
                ></textarea>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-glow-outline" onClick={() => setShowDeadlineModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-glow-primary" disabled={submitting}>
                  {submitting ? 'Announcing...' : 'Announce Deadline to Batch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= MODAL: SUPERVISOR PROFILE ================= */}
      {showProfileModal && (
        <div className="modal-overlay" onClick={() => setShowProfileModal(false)}>
          <div className="modal-card glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Supervisor Profile &amp; Specializations</h3>
              <button type="button" className="close-btn" onClick={() => setShowProfileModal(false)}>
                ×
              </button>
            </div>
            <form onSubmit={handleProfileSave} className="modal-form">
              <div className="form-group">
                <label>Academic Name</label>
                <input
                  type="text"
                  required
                  value={profileForm.name}
                  onChange={(e) => setProfileForm({ ...profileForm, name: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Designation / Academic Rank</label>
                <input
                  type="text"
                  value={profileForm.designation}
                  onChange={(e) => setProfileForm({ ...profileForm, designation: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Contact Phone</label>
                <input
                  type="text"
                  value={profileForm.phone}
                  onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Specializations / Research Expertise (comma-separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Deep Learning, Distributed Systems, IoT, Cybersecurity"
                  value={profileForm.expertise}
                  onChange={(e) => setProfileForm({ ...profileForm, expertise: e.target.value })}
                />
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
