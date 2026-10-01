import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser } from '../services/authService';

export default function ShowcasePage() {
  const navigate = useNavigate();


  const [projects, setProjects] = useState(() => {
    try {
      const stored = localStorage.getItem('researchhub_public_projects');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch (e) {
      console.error('Error loading stored projects:', e);
    }
    return [];
  });

  const [selectedCategory, setSelectedCategory] = useState('All Domains');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeModalProject, setActiveModalProject] = useState(null);

  useEffect(() => {
    const handleStorage = () => {
      try {
        const stored = localStorage.getItem('researchhub_public_projects');
        if (stored) {
          const parsed = JSON.parse(stored);
          if (Array.isArray(parsed)) setProjects(parsed);
        } else {
          setProjects([]);
        }
      } catch (e) {
        console.error('Error updating projects:', e);
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);


  const categories = useMemo(() => {
    const cats = new Set(projects.map((p) => p.category).filter(Boolean));
    return ['All Domains', ...Array.from(cats)];
  }, [projects]);

  const handleViewAbstract = (project) => {
    const user = getCurrentUser();
    if (!user) {
      navigate('/login?redirect=/showcase&message=login_required');
      return;
    }
    setActiveModalProject(project);
  };

  // Filter projects dynamically based on user input
  const filteredProjects = useMemo(() => {
    return projects.filter((proj) => {
      const matchCategory =
        selectedCategory === 'All Domains' || proj.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const studentsStr = Array.isArray(proj.students)
        ? proj.students.join(' ')
        : proj.students || '';
      const tagsStr = Array.isArray(proj.tags) ? proj.tags.join(' ') : proj.tags || '';

      const matchSearch =
        !q ||
        (proj.title && proj.title.toLowerCase().includes(q)) ||
        (proj.supervisor && proj.supervisor.toLowerCase().includes(q)) ||
        studentsStr.toLowerCase().includes(q) ||
        tagsStr.toLowerCase().includes(q) ||
        (proj.abstract && proj.abstract.toLowerCase().includes(q));

      return matchCategory && matchSearch;
    });
  }, [projects, selectedCategory, searchQuery]);

  return (
    <div className="showcase-page">
      {/* Page Header - Static Stats Removed */}
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
            <h1 className="showcase-page-title">Research Showcase</h1>
            <p className="showcase-page-sub">
              Browse verified, peer-reviewed research projects from university departments. Explore breakthroughs,
              connect with research teams, and discover industry collaboration opportunities.
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container showcase-page-body">
        {/* Search & Filter Controls (Rendered when projects exist or for searching) */}
        {projects.length > 0 && (
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

            {/* Dynamic Category Pills */}
            {categories.length > 1 && (
              <div className="category-pills-list">
                {categories.map((cat) => (
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
            )}
          </div>
        )}

        {/* Dynamic Results Count Meta */}
        {projects.length > 0 && (
          <div className="results-meta-row">
            <span className="results-count">
              Showing <strong>{filteredProjects.length}</strong> of {projects.length} research projects
            </span>
            <span className="verified-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#670047" strokeWidth="2.5">
                <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
              </svg>
              Peer-Reviewed &amp; University Senate Approved
            </span>
          </div>
        )}

        {/* Dynamic Projects Grid */}
        {filteredProjects.length > 0 && (
          <div className="projects-grid">
            {filteredProjects.map((project) => {
              const studentsText = Array.isArray(project.students)
                ? project.students.join(', ')
                : project.students || 'Research Scholar';

              const tagsList = Array.isArray(project.tags)
                ? project.tags
                : typeof project.tags === 'string'
                  ? project.tags.split(',').map((t) => t.trim())
                  : [];

              return (
                <div key={project.id || project._id} className="project-card glass-card">
                  <div className="project-card-header">
                    <span className="project-cat-badge">{project.category || 'General'}</span>
                    <span className={`project-status-pill ${(project.status || 'ongoing').toLowerCase()}`}>
                      {project.status === 'Completed' ? '✓ Completed' : '⚡ Ongoing'}
                    </span>
                  </div>

                  <h3 className="project-card-title">{project.title}</h3>

                  {(project.faculty || project.department) && (
                    <div className="project-meta-faculty">
                      <span className="meta-icon">🏛️</span>
                      <span>{project.faculty || project.department}</span>
                    </div>
                  )}

                  <div className="project-people-info">
                    {project.supervisor && (
                      <div className="people-row">
                        <span className="people-label">Supervisor:</span>
                        <span className="people-val">{project.supervisor}</span>
                      </div>
                    )}
                    <div className="people-row">
                      <span className="people-label">Students:</span>
                      <span className="people-val">{studentsText}</span>
                    </div>
                  </div>

                  {project.progress !== undefined && (
                    <div className="progress-section">
                      <div className="progress-label-row">
                        <span className="progress-stage">{project.stage || 'Research Progress'}</span>
                        <span className="progress-percentage">{project.progress}%</span>
                      </div>
                      <div className="progress-track">
                        <div className="progress-fill" style={{ width: `${project.progress}%` }} />
                      </div>
                    </div>
                  )}

                  {tagsList.length > 0 && (
                    <div className="project-tags-list">
                      {tagsList.map((tag) => (
                        <span key={tag} className="tag-item">#{tag}</span>
                      ))}
                    </div>
                  )}

                  <div className="project-card-footer">
                    {project.similarityScore && (
                      <span className="novelty-tag">🔍 {project.similarityScore}</span>
                    )}
                    <button
                      type="button"
                      className="btn-details"
                      onClick={() => handleViewAbstract(project)}
                    >
                      <span>View Abstract</span>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M5 12h14M12 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Empty State: No projects in system yet */}
        {projects.length === 0 && (
          <div className="empty-state-box glass-card" style={{ padding: '64px 24px', textAlign: 'center', margin: '20px 0' }}>
            <div className="empty-icon" style={{ fontSize: '3rem', marginBottom: '16px' }}>🔬</div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-heading)' }}>
              No Research Projects Published Yet
            </h3>
            <p style={{ maxWidth: '540px', margin: '0 auto 24px', color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6' }}>
              research projects will appear here
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link to="/" className="btn btn-outline btn-sm">
                Return to Home
              </Link>
            </div>
          </div>
        )}

        {/* Empty State: Projects exist but search/filter returns zero */}
        {projects.length > 0 && filteredProjects.length === 0 && (
          <div className="empty-state-box glass-card" style={{ padding: '48px 24px', textAlign: 'center', margin: '20px 0' }}>
            <div className="empty-icon">🔍</div>
            <h3>No matching research projects found</h3>
            <p>Try clearing your search filters or searching for different keywords.</p>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => { setSearchQuery(''); setSelectedCategory('All Domains'); }}
              style={{ marginTop: '12px' }}
            >
              Clear Filters
            </button>
          </div>
        )}
      </div>

      {/* Dynamic Project Detail Modal */}
      {activeModalProject && (
        <div className="modal-overlay" onClick={() => setActiveModalProject(null)}>
          <div className="project-modal glass-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <span className="badge-pill badge-plum">{activeModalProject.category || 'General'}</span>
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
                {activeModalProject.department && (
                  <div className="modal-meta-item">
                    <span className="meta-label">Department</span>
                    <span className="meta-value">{activeModalProject.department}</span>
                  </div>
                )}
                {activeModalProject.supervisor && (
                  <div className="modal-meta-item">
                    <span className="meta-label">Primary Supervisor</span>
                    <span className="meta-value">{activeModalProject.supervisor}</span>
                  </div>
                )}
                {activeModalProject.students && (
                  <div className="modal-meta-item">
                    <span className="meta-label">Research Scholars</span>
                    <span className="meta-value">
                      {Array.isArray(activeModalProject.students)
                        ? activeModalProject.students.join(', ')
                        : activeModalProject.students}
                    </span>
                  </div>
                )}
                {activeModalProject.industryPartner && (
                  <div className="modal-meta-item">
                    <span className="meta-label">Industry / Grant Partner</span>
                    <span className="meta-value" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                      🏢 {activeModalProject.industryPartner}
                    </span>
                  </div>
                )}
              </div>

              {activeModalProject.abstract && (
                <div className="modal-abstract-section">
                  <h4>Research Abstract &amp; Methodology</h4>
                  <p>{activeModalProject.abstract}</p>
                </div>
              )}

              {activeModalProject.similarityScore && (
                <div className="modal-novelty-box">
                  <div className="novelty-header">
                    <span>🛡️</span>
                    <strong>ResearchHub Originality Verification</strong>
                  </div>
                  <p>
                    Verified with ResearchHub Duplicate &amp; Similarity Detection Engine. Result:&nbsp;
                    <strong>{activeModalProject.similarityScore}</strong> across historical dissertations.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
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
