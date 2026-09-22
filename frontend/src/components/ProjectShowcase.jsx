import React, { useState, useMemo } from 'react';

const SAMPLE_PROJECTS = [
  {
    id: 'rh-2025-01',
    title: 'Deep Learning-Based Crop Disease Detection for Northern Sri Lanka Agriculture',
    faculty: 'Faculty of Applied Science',
    department: 'Physical Science (Computing)',
    category: 'Artificial Intelligence',
    supervisor: 'Dr. T. Kartheepan (Senior Lecturer)',
    students: ['S. Mithun (2020/ICT/042)', 'K. Diluxan (2020/ICT/019)'],
    status: 'Ongoing',
    progress: 75,
    stage: 'Milestone 3: Model Evaluation',
    similarityScore: '1.2% (High Novelty)',
    tags: ['Computer Vision', 'PyTorch', 'AgriTech', 'Mobile App'],
    abstract: 'This research develops a lightweight Convolutional Neural Network (CNN) architecture optimized for low-spec edge devices to identify foliar diseases in chili and paddy crops within the dry zone of Northern Sri Lanka. By training on locally curated multi-spectral datasets, the system achieves 96.4% diagnostic accuracy under variable outdoor lighting conditions.',
    industryPartner: 'AgriTech Lanka PLC'
  },
  {
    id: 'rh-2025-02',
    title: 'IoT-Enabled Smart Solar Grid Monitoring & Predictive Fault Diagnostics',
    faculty: 'Faculty of Technological Studies',
    department: 'Electro-technology',
    category: 'Renewable Energy',
    supervisor: 'Prof. S. Ranganathan',
    students: ['A. Kavitha (2021/BST/014)', 'M. Sahan (2021/BST/088)'],
    status: 'Ongoing',
    progress: 60,
    stage: 'Milestone 2: Prototype Testing',
    similarityScore: '0.8% (High Novelty)',
    tags: ['IoT', 'Solar PV', 'ESP32', 'Predictive Maintenance'],
    abstract: 'Investigates micro-inverter efficiency in high-ambient-temperature regions through real-time telemetry sensor networks. Employs LSTM recurrent networks to forecast module degradation and soiling loss 72 hours prior to significant yield drop.',
    industryPartner: 'Ceylon Solar Innovations'
  },
  {
    id: 'rh-2025-03',
    title: 'Blockchain-Based Secure Health Record Exchange with Zero-Knowledge Proofs',
    faculty: 'Faculty of Applied Science',
    department: 'Computer Science',
    category: 'Cybersecurity',
    supervisor: 'Dr. V. Nitharshan',
    students: ['R. Priyatharshan (2020/CSC/007)'],
    status: 'Completed',
    progress: 100,
    stage: 'Archived & Published',
    similarityScore: '2.4% (Novel)',
    tags: ['Blockchain', 'Ethereum', 'ZK-Snarks', 'Healthcare'],
    abstract: 'A privacy-preserving patient health information management system designed for inter-hospital transfers across regional health directorates. Implements zk-SNARKs to permit insurance claim validation without revealing sensitive diagnostic records.',
    industryPartner: 'HealthTech Global'
  },
  {
    id: 'rh-2025-04',
    title: 'Genomic Sequence Alignment Optimization using GPU-Accelerated Heuristics',
    faculty: 'Faculty of Applied Science',
    department: 'Biological Science',
    category: 'Bio-Informatics',
    supervisor: 'Dr. M. Jayasinghe',
    students: ['P. Thushani (2020/BIO/028)', 'D. Madhushan (2020/BIO/031)'],
    status: 'Ongoing',
    progress: 85,
    stage: 'Milestone 4: Paper Preparation',
    similarityScore: '1.9% (Novel)',
    tags: ['Bioinformatics', 'CUDA', 'Genomics', 'Algorithms'],
    abstract: 'Proposes a parallelized variation of the Smith-Waterman local alignment algorithm, cutting whole-genome analysis latency by 68% while maintaining sequence precision in tropical pathogen strain identification.',
    industryPartner: 'National Science Foundation Sri Lanka'
  },
  {
    id: 'rh-2025-05',
    title: 'AI Sentiment Engine for Tamil and Sinhala Code-Mixed E-Commerce Reviews',
    faculty: 'Faculty of Business Studies',
    department: 'Information Systems',
    category: 'Artificial Intelligence',
    supervisor: 'Dr. A. Fernando',
    students: ['V. Sivapalan (2021/BMS/055)'],
    status: 'Ongoing',
    progress: 50,
    stage: 'Milestone 2: Corpus Annotation',
    similarityScore: '3.1% (Novel)',
    tags: ['NLP', 'Tamil-Sinhala', 'BERT', 'Consumer Analytics'],
    abstract: 'Presents a transformer-based code-mixed multilingual sentiment analysis model specifically tuned for colloquial Sinhala and Tamil phrases found in Sri Lankan digital marketplace feedback and social commerce channels.',
    industryPartner: 'LankaCommerce Digital Labs'
  },
  {
    id: 'rh-2025-06',
    title: 'Autonomous Quadcopter Navigation for Wetland Conservation & Wildlife Tracking',
    faculty: 'Faculty of Technological Studies',
    department: 'Robotics & Automation',
    category: 'IoT & Robotics',
    supervisor: 'Dr. K. Balachandran',
    students: ['T. Gayan (2020/TEC/012)', 'N. Nivetha (2020/TEC/073)'],
    status: 'Completed',
    progress: 100,
    stage: 'Archived & Published',
    similarityScore: '0.5% (High Novelty)',
    tags: ['Drones', 'ROS2', 'SLAM', 'Ecology'],
    abstract: 'Deploys an autonomous drone platform equipped with thermal sensors and visual SLAM for non-invasive ecological monitoring of water birds and marsh habitats in Vavuniya reservoir basins.',
    industryPartner: 'Wildlife Conservation Department'
  }
];

const CATEGORIES = [
  'All Domains',
  'Artificial Intelligence',
  'Renewable Energy',
  'Cybersecurity',
  'Bio-Informatics',
  'IoT & Robotics'
];

export default function ProjectShowcase() {
  const [selectedCategory, setSelectedCategory] = useState('All Domains');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalProject, setActiveModalProject] = useState(null);

  const filteredProjects = useMemo(() => {
    return SAMPLE_PROJECTS.filter((proj) => {
      const matchCategory =
        selectedCategory === 'All Domains' || proj.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        proj.title.toLowerCase().includes(q) ||
        proj.supervisor.toLowerCase().includes(q) ||
        proj.students.some((s) => s.toLowerCase().includes(q)) ||
        proj.tags.some((t) => t.toLowerCase().includes(q)) ||
        proj.abstract.toLowerCase().includes(q);
      return matchCategory && matchSearch;
    });
  }, [selectedCategory, searchQuery]);

  return (
    <section id="showcase" className="showcase-section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Public Repository & Showcase</span>
          <h2 className="section-title">Explore Groundbreaking University Research</h2>
          <p className="section-subtitle">
            Browse live and defended research projects from the University of Vavuniya. Reducing topic
            duplication, celebrating student achievements, and fostering industry partnerships.
          </p>
        </div>

        {/* Search & Filter Controls */}
        <div className="showcase-controls">
          <div className="search-box-wrapper">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              className="showcase-search-input"
              placeholder="Search by research topic, supervisor, student, or technology..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button 
                type="button" 
                className="clear-search-btn"
                onClick={() => setSearchQuery('')}
              >
                ✕
              </button>
            )}
          </div>

          {/* Category Filter Pills */}
          <div className="category-pills-list">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`category-pill-btn ${selectedCategory === cat ? 'active' : ''}`}
                onClick={() => setSelectedCategory(cat)}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Results Counter */}
        <div className="results-meta-row">
          <span className="results-count">
            Showing <strong>{filteredProjects.length}</strong> of {SAMPLE_PROJECTS.length} research projects
          </span>
          <span className="verified-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#670047" strokeWidth="2.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Peer-Reviewed & University Senate Approved
          </span>
        </div>

        {/* Project Cards Grid */}
        <div className="projects-grid">
          {filteredProjects.map((project) => (
            <div key={project.id} className="project-card glass-card">
              <div className="project-card-header">
                <span className="project-cat-badge">{project.category}</span>
                <span className={`project-status-pill ${project.status.toLowerCase()}`}>
                  {project.status === 'Completed' ? '✓ Completed' : '⚡ Ongoing'}
                </span>
              </div>

              <h3 className="project-card-title">{project.title}</h3>

              <div className="project-meta-faculty">
                <span className="meta-icon">🏛️</span>
                <span>{project.faculty}</span>
              </div>

              <div className="project-people-info">
                <div className="people-row">
                  <span className="people-label">Supervisor:</span>
                  <span className="people-val">{project.supervisor}</span>
                </div>
                <div className="people-row">
                  <span className="people-label">Students:</span>
                  <span className="people-val">{project.students.join(', ')}</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="progress-section">
                <div className="progress-label-row">
                  <span className="progress-stage">{project.stage}</span>
                  <span className="progress-percentage">{project.progress}%</span>
                </div>
                <div className="progress-track">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${project.progress}%` }}
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="project-tags-list">
                {project.tags.map((tag) => (
                  <span key={tag} className="tag-item">#{tag}</span>
                ))}
              </div>

              {/* Action */}
              <div className="project-card-footer">
                <span className="novelty-tag">
                  🔍 {project.similarityScore}
                </span>
                <button
                  type="button"
                  className="btn-details"
                  onClick={() => setActiveModalProject(project)}
                >
                  <span>View Abstract</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {filteredProjects.length === 0 && (
          <div className="empty-state-box glass-card">
            <div className="empty-icon">🔍</div>
            <h3>No research projects found</h3>
            <p>Try clearing your search filters or searching for terms like "AI", "Crop", "Energy", or "IoT".</p>
            <button 
              type="button" 
              className="btn btn-outline btn-sm"
              onClick={() => { setSearchQuery(''); setSelectedCategory('All Domains'); }}
            >
              Reset Filters
            </button>
          </div>
        )}

        {/* Project Detail Modal */}
        {activeModalProject && (
          <div className="modal-overlay" onClick={() => setActiveModalProject(null)}>
            <div className="project-modal glass-card" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <div>
                  <span className="badge-pill badge-plum">{activeModalProject.category}</span>
                  <h3 className="modal-title">{activeModalProject.title}</h3>
                </div>
                <button 
                  type="button" 
                  className="modal-close-btn"
                  onClick={() => setActiveModalProject(null)}
                >
                  ✕
                </button>
              </div>

              <div className="modal-body">
                <div className="modal-meta-grid">
                  <div className="modal-meta-item">
                    <span className="meta-label">Department</span>
                    <span className="meta-value">{activeModalProject.department}</span>
                  </div>
                  <div className="modal-meta-item">
                    <span className="meta-label">Primary Supervisor</span>
                    <span className="meta-value">{activeModalProject.supervisor}</span>
                  </div>
                  <div className="modal-meta-item">
                    <span className="meta-label">Research Scholars</span>
                    <span className="meta-value">{activeModalProject.students.join(', ')}</span>
                  </div>
                  <div className="modal-meta-item">
                    <span className="meta-label">Industry / Grant Partner</span>
                    <span className="meta-value" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      🏢 {activeModalProject.industryPartner}
                    </span>
                  </div>
                </div>

                <div className="modal-abstract-section">
                  <h4>Research Abstract & Methodology</h4>
                  <p>{activeModalProject.abstract}</p>
                </div>

                <div className="modal-novelty-box">
                  <div className="novelty-header">
                    <span className="novelty-icon">🛡️</span>
                    <strong>ResearchHub Originality Verification</strong>
                  </div>
                  <p>
                    Verified with ResearchHub Duplicate & Similarity Detection Engine. Result: 
                    <strong> {activeModalProject.similarityScore}</strong> across the university repository of 1,200+ historical dissertations.
                  </p>
                </div>
              </div>

              <div className="modal-footer">
                <button 
                  type="button" 
                  className="btn btn-primary"
                  onClick={() => alert(`Inquiry sent to ${activeModalProject.supervisor} regarding collaboration on ${activeModalProject.id}`)}
                >
                  Request Collaboration / Internship Inquiry
                </button>
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => setActiveModalProject(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
