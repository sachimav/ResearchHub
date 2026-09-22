import React from 'react';

const STAGES = [
  {
    step: '01',
    title: 'Proposal & Topic Registration',
    duration: 'Weeks 1 - 3',
    description: 'Students submit structured research proposals and problem definitions. Automated similarity screening runs against past theses to prevent duplicate topics.',
    deliverable: 'Approved Proposal & Novelty Certificate',
    icon: '📝'
  },
  {
    step: '02',
    title: 'Supervisor Allocation',
    duration: 'Week 4',
    description: 'Department committees review and match faculty advisors based on research expertise, student preference rankings, and faculty workload capacity.',
    deliverable: 'Official Supervisory Agreement',
    icon: '👨‍🏫'
  },
  {
    step: '03',
    title: 'Literature Review & Ethics Clearance',
    duration: 'Weeks 5 - 8',
    description: 'Students submit critical literature reviews, methodology plans, and ethics committee clearance documentation for human/animal or data privacy experiments.',
    deliverable: 'Milestone 1 Sign-Off & Ethics Approval',
    icon: '⚖️'
  },
  {
    step: '04',
    title: 'Implementation & Progress Reviews',
    duration: 'Weeks 9 - 18',
    description: 'Iterative development, empirical experimentation, data analysis, and bi-weekly supervisor log submissions with milestone checkpoint evaluations.',
    deliverable: 'Mid-term Progress Defense & Working Prototype',
    icon: '⚡'
  },
  {
    step: '05',
    title: 'Thesis Manuscript Submission',
    duration: 'Weeks 19 - 22',
    description: 'Comprehensive dissertation draft submitted for plagiarism checking, supervisor feedback annotations, and external examiner evaluation.',
    deliverable: 'Plagiarism & Quality Clearance Certificate',
    icon: '📚'
  },
  {
    step: '06',
    title: 'Viva Voce Defense & Public Showcase',
    duration: 'Weeks 23 - 24',
    description: 'Oral examination before faculty panels. Following approval, the project is published on the ResearchHub Public Showcase for industry recruitment and citations.',
    deliverable: 'Final Grade & Public Showcase Profile',
    icon: '🎓'
  }
];

export default function WorkflowTimeline() {
  return (
    <section id="workflow" className="workflow-section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Academic Lifecycle</span>
          <h2 className="section-title">The Structured Research Journey</h2>
          <p className="section-subtitle">
            ResearchHub guides candidates and supervisors through a transparent, 6-phase governance
            pathway from initial concept submission to permanent archival and industry recognition.
          </p>
        </div>

        <div className="timeline-container">
          <div className="timeline-line"></div>
          
          <div className="timeline-steps-grid">
            {STAGES.map((stage, idx) => (
              <div key={stage.step} className="timeline-step-card glass-card">
                <div className="step-top-row">
                  <div className="step-number-bubble">{stage.step}</div>
                  <span className="step-duration">{stage.duration}</span>
                </div>

                <div className="step-icon-row">
                  <span className="stage-icon">{stage.icon}</span>
                  <h3 className="stage-title">{stage.title}</h3>
                </div>

                <p className="stage-desc">{stage.description}</p>

                <div className="stage-deliverable">
                  <span className="deliv-tag">Deliverable:</span>
                  <span className="deliv-name">{stage.deliverable}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Banner CTA */}
        <div className="workflow-bottom-banner">
          <div className="banner-left">
            <h3>University of Vavuniya Research Guidelines 2025/2026</h3>
            <p>Download standard proposal templates, formatting guidelines, and evaluation rubrics.</p>
          </div>
          <div className="banner-right">
            <button 
              type="button" 
              className="btn btn-gold"
              onClick={() => alert('Downloading University of Vavuniya Research Guidelines & Template Package (PDF/DOCX)')}
            >
              📥 Download Guidelines & Templates
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
