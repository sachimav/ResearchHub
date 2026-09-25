import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';

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
  },
  {
    id: 'rh-2025-07',
    title: 'Natural Language Processing for Automated Legal Document Summarization in Tamil',
    faculty: 'Faculty of Applied Science',
    department: 'Computer Science',
    category: 'Artificial Intelligence',
    supervisor: 'Dr. T. Kartheepan',
    students: ['M. Ajanthan (2020/CSC/031)'],
    status: 'Ongoing',
    progress: 40,
    stage: 'Milestone 1: Literature Review',
    similarityScore: '2.8% (Novel)',
    tags: ['NLP', 'Legal AI', 'Tamil NLP', 'Transformers'],
    abstract: 'Develops a fine-tuned multilingual transformer model to automatically summarize and index Tamil-language court proceedings and legal briefs, addressing the digital backlog in Northern Province judiciary systems.',
    industryPartner: 'Legal Aid Commission Sri Lanka'
  },
  {
    id: 'rh-2025-08',
    title: 'Smart Irrigation Control System using Soil Moisture Sensors and Edge AI',
    faculty: 'Faculty of Technological Studies',
    department: 'Electro-technology',
    category: 'IoT & Robotics',
    supervisor: 'Prof. S. Ranganathan',
    students: ['K. Prasath (2021/TEC/023)', 'T. Suvetha (2021/TEC/041)'],
    status: 'Completed',
    progress: 100,
    stage: 'Archived & Published',
    similarityScore: '4.1% (Novel)',
    tags: ['IoT', 'Edge AI', 'Smart Farming', 'Water Conservation'],
    abstract: 'Implements a low-power edge computing system that dynamically regulates irrigation schedules based on real-time soil moisture telemetry, reducing water consumption by 43% in dry-zone paddy fields without yield degradation.',
    industryPartner: 'Department of Irrigation Sri Lanka'
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

export default function ShowcasePage() {
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
    <div className="showcase-page">
      {/* Page Header */}
      <div className="showcase-page-header">
        <div className="container showcase-header-inner">
          <Link to="/" className="back-btn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M19 12H5M12 5l-7 7 7 7" />
            </svg>
            Back to Home
          </Link>
          <div className="showcase-header-titles">
            <span className="section-tag">University of Vavuniya</span>
            <h1 className="showcase-page-title">Public Research Showcase</h1>
            <p className="showcase-page-sub">
              Browse verified, peer-reviewed research projects from all faculties. Explore breakthroughs,
              connect with research teams, and discover industry collaboration opportunities.
            </p>
          </div>
          <div className="showcase-header-stats">
            <div className="sh-stat">
              <span className="sh-num">{SAMPLE_PROJECTS.length}</span>
              <span className="sh-lbl">Published Projects</span>
            </div>
            <div className="sh-stat">
              <span className="sh-num">3</span>
              <span className="sh-lbl">Faculties</span>
            </div>
            <div className="sh-stat">
              <span className="sh-num">35+</span>
              <span className="sh-lbl">Industry Partners</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container showcase-page-body">
        {/* Search & Filter Controls */}
        <div className="showcase-controls">
          <div className="search-box-wrapper">
            <svg className="search-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8" />
              <path d="M21 21l-4.35-4.35" />
            </svg>
            <input
              type="text"
              id="showcaseSearch"
              className="showcase-search-input"
              placeholder="Search by topic, supervisor, student, or technology..."
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

        {/* Results Meta */}
        <div className="results-meta-row">
          <span className="results-count">
            Showing <strong>{filteredProjects.length}</strong> of {SAMPLE_PROJECTS.length} research projects
          </span>
          <span className="verified-badge">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#670047" strokeWidth="2.5">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            Peer-Reviewed &amp; University Senate Approved
          </span>
        </div>

        {/* Projects Grid */}
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

              <div className="progress-section">
                <div className="progress-label-row">
                  <span className="progress-stage">{project.stage}</span>
                  <span className="progress-percentage">{project.progress}%</span>
                </div>
                <div className="progress-track">
                  <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                </div>
              </div>

              <div className="project-tags-list">
                {project.tags.map((tag) => (
                  <span key={tag} className="tag-item">#{tag}</span>
                ))}
              </div>

              <div className="project-card-footer">
                <span className="novelty-tag">🔍 {project.similarityScore}</span>
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

        {filteredProjects.length === 0 && (
          <div className="empty-state-box glass-card">
            <div className="empty-icon">🔍</div>
            <h3>No research projects found</h3>
            <p>Try clearing your search filters or browsing a different domain.</p>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => { setSearchQuery(''); setSelectedCategory('All Domains'); }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

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

            <div className="modal-body" style={{ padding: '0 0 8px' }}>
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
                <h4>Research Abstract &amp; Methodology</h4>
                <p>{activeModalProject.abstract}</p>
              </div>

              <div className="modal-novelty-box">
                <div className="novelty-header">
                  <span>🛡️</span>
                  <strong>ResearchHub Originality Verification</strong>
                </div>
                <p>
                  Verified with ResearchHub Duplicate &amp; Similarity Detection Engine. Result:&nbsp;
                  <strong>{activeModalProject.similarityScore}</strong> across 1,200+ historical dissertations.
                </p>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => alert(`Inquiry sent for collaboration on ${activeModalProject.id}`)}
              >
                Request Collaboration Inquiry
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
  );
}
