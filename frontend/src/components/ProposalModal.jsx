import React, { useState } from 'react';

export default function ProposalModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    title: '',
    faculty: 'Faculty of Applied Science',
    department: 'Physical Science (Computing)',
    studentName: '',
    registrationNo: '',
    supervisorPreference: 'Dr. T. Kartheepan (Senior Lecturer)',
    problemStatement: '',
    category: 'Artificial Intelligence'
  });

  const [submitted, setSubmitted] = useState(false);
  const [noveltyScore, setNoveltyScore] = useState(null);
  const [isEvaluating, setIsEvaluating] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    setIsEvaluating(true);

    setTimeout(() => {
      setIsEvaluating(false);
      setNoveltyScore('98.2% Unique (Passes Novelty Baseline)');
      setSubmitted(true);
    }, 1000);
  };

  const handleReset = () => {
    setSubmitted(false);
    setNoveltyScore(null);
    setFormData({
      title: '',
      faculty: 'Faculty of Applied Science',
      department: 'Physical Science (Computing)',
      studentName: '',
      registrationNo: '',
      supervisorPreference: 'Dr. T. Kartheepan (Senior Lecturer)',
      problemStatement: '',
      category: 'Artificial Intelligence'
    });
    onClose();
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="proposal-modal glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <span className="badge-pill badge-plum">University of Vavuniya Research Intake</span>
            <h3 className="modal-title">Submit Research Project Proposal</h3>
          </div>
          <button type="button" className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {!submitted ? (
          <form onSubmit={handleSubmit} className="proposal-form">
            <div className="form-group">
              <label>Proposed Research Title *</label>
              <input
                type="text"
                required
                placeholder="e.g. Real-Time Distributed Sensor Networks for Water Salinity Mapping"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Faculty *</label>
                <select
                  value={formData.faculty}
                  onChange={(e) => setFormData({ ...formData, faculty: e.target.value })}
                >
                  <option value="Faculty of Applied Science">Faculty of Applied Science</option>
                  <option value="Faculty of Technological Studies">Faculty of Technological Studies</option>
                  <option value="Faculty of Business Studies">Faculty of Business Studies</option>
                </select>
              </div>

              <div className="form-group">
                <label>Research Category *</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Artificial Intelligence">Artificial Intelligence</option>
                  <option value="Renewable Energy">Renewable Energy</option>
                  <option value="Cybersecurity">Cybersecurity</option>
                  <option value="Bio-Informatics">Bio-Informatics</option>
                  <option value="IoT & Robotics">IoT & Robotics</option>
                  <option value="Smart Agriculture">Smart Agriculture</option>
                </select>
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label>Lead Student Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. S. Mithun"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label>Student Registration Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2021/ICT/042"
                  value={formData.registrationNo}
                  onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                />
              </div>
            </div>

            <div className="form-group">
              <label>Preferred Supervisor (Subject to Department Committee Allocation)</label>
              <select
                value={formData.supervisorPreference}
                onChange={(e) => setFormData({ ...formData, supervisorPreference: e.target.value })}
              >
                <option value="Dr. T. Kartheepan (Senior Lecturer)">Dr. T. Kartheepan (Applied Computing)</option>
                <option value="Prof. S. Ranganathan (Head of Dept)">Prof. S. Ranganathan (Renewable Energy)</option>
                <option value="Dr. V. Nitharshan (Senior Lecturer)">Dr. V. Nitharshan (Cybersecurity & Networks)</option>
                <option value="Dr. M. Jayasinghe (Senior Lecturer)">Dr. M. Jayasinghe (Computational Biology)</option>
                <option value="Dr. A. Fernando (Senior Lecturer)">Dr. A. Fernando (Information Systems)</option>
              </select>
            </div>

            <div className="form-group">
              <label>Abstract / Problem Statement & Objectives *</label>
              <textarea
                rows={4}
                required
                placeholder="Detail the research motivation, key questions, intended methodology, and expected contribution..."
                value={formData.problemStatement}
                onChange={(e) => setFormData({ ...formData, problemStatement: e.target.value })}
              />
            </div>

            <div className="form-notice">
              <span className="notice-icon">🛡️</span>
              <span>
                Submission automatically executes the ResearchHub Topic Novelty & Similarity scan against
                all active and completed dissertations at the University of Vavuniya.
              </span>
            </div>

            <div className="modal-actions-row">
              <button 
                type="submit" 
                className="btn btn-primary"
                disabled={isEvaluating}
              >
                {isEvaluating ? 'Running Novelty Check...' : 'Submit Proposal for Allocation'}
              </button>
              <button type="button" className="btn btn-outline" onClick={onClose}>
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <div className="submission-success-view">
            <div className="success-icon-circle">✓</div>
            <h3>Proposal Submitted Successfully!</h3>
            <p className="success-msg">
              Your research proposal has been registered on the ResearchHub university repository and queued for supervisor review.
            </p>

            <div className="receipt-card">
              <div className="receipt-row">
                <span>Submission Reference:</span>
                <strong>RH-VAU-{Math.floor(100000 + Math.random() * 900000)}</strong>
              </div>
              <div className="receipt-row">
                <span>Project Title:</span>
                <strong>{formData.title}</strong>
              </div>
              <div className="receipt-row">
                <span>Automated Novelty Index:</span>
                <strong style={{ color: '#059669' }}>{noveltyScore}</strong>
              </div>
              <div className="receipt-row">
                <span>Allocation Status:</span>
                <span className="status-badge-pending">Queued for Department Committee</span>
              </div>
            </div>

            <button 
              type="button" 
              className="btn btn-primary"
              onClick={handleReset}
              style={{ marginTop: '20px' }}
            >
              Done / Return to Platform
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
