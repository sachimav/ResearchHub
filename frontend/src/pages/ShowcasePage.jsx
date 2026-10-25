import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getPublicResearch } from '../services/publicService';
import { getCurrentUser } from '../services/session';

const statusLabels = {
  ongoing: 'Ongoing',
  completed: 'Completed',
};

export default function ShowcasePage() {
  const [research, setResearch] = useState([]);
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    let current = true;
    const loadResearch = async () => {
      setLoading(true);
      setError('');
      try {
        const data = await getPublicResearch({ query, status, page });
        if (current) {
          setResearch(data.research || []);
          setPagination(data.pagination);
        }
      } catch (loadError) {
        if (current) setError(loadError.message);
      } finally {
        if (current) setLoading(false);
      }
    };

    const timeoutId = window.setTimeout(loadResearch, 250);
    return () => { current = false; window.clearTimeout(timeoutId); };
  }, [query, status, page]);

  return (
    <div className="showcase-page">
      <div className="showcase-page-header">
        <div className="container showcase-header-inner">
          <Link to="/" className="back-btn">← Back to Home</Link>
          <div className="showcase-header-titles">
            <span className="section-tag">University of Vavuniya</span>
            <h1 className="showcase-page-title">Research Showcase</h1>
            <p className="showcase-page-sub">
              Explore completed and ongoing research projects from the university.
            </p>
          </div>
        </div>
      </div>

      <div className="container showcase-page-body">
        <div className="showcase-controls">
          <div className="search-box-wrapper">
            <span className="search-icon" aria-hidden="true">⌕</span>
            <input
              className="showcase-search-input"
              type="search"
              value={query}
              onChange={(event) => { setQuery(event.target.value); setPage(1); }}
              placeholder="Search by title, topic, description, or academic year"
              aria-label="Search research"
            />
            {query && (
              <button className="clear-search-btn" type="button" onClick={() => { setQuery(''); setPage(1); }}>
                ×
              </button>
            )}
          </div>
          <div className="category-pills-list" aria-label="Research status">
            <button className={`category-pill-btn ${!status ? 'active' : ''}`} type="button" onClick={() => { setStatus(''); setPage(1); }}>
              All research
            </button>
            {Object.entries(statusLabels).map(([value, label]) => (
              <button
                className={`category-pill-btn ${status === value ? 'active' : ''}`}
                type="button"
                onClick={() => { setStatus(value); setPage(1); }}
                key={value}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="results-meta-row">
          <span>{loading ? 'Loading research...' : `${pagination?.total ?? research.length} research projects`}</span>
          <span className="verified-badge">● Public university research</span>
        </div>

        {error && <p role="alert">{error}</p>}
        {!loading && !error && research.length === 0 && (
          <div className="empty-state-box glass-card" style={{ padding: '64px 24px', textAlign: 'center', margin: '20px 0' }}>
            <div className="empty-icon" style={{ fontSize: '3rem', marginBottom: '16px' }}>🔬</div>
            <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-heading)' }}>
              No research projects found
            </h3>
            <p style={{ color: 'var(--text-muted)' }}>Try a different search term or status.</p>
          </div>
        )}

        <div className="projects-grid">
          {research.map((project) => (
            <article className="project-card glass-card" key={project._id}>
              <div>
                <div className="project-card-header">
                  <span className="project-cat-badge">{project.topic || 'Research project'}</span>
                  <span className={`project-status-pill ${project.status === 'completed' ? 'completed' : 'ongoing'}`}>
                    {project.status === 'completed' ? 'Completed' : 'Ongoing'}
                  </span>
                </div>
                <h2 className="project-card-title">{project.title}</h2>
                <p className="project-meta-faculty">
                  {project.supervisorId?.userId?.name
                    ? `Supervisor: ${project.supervisorId.userId.name}`
                    : 'University research project'}
                </p>
                <p className="feature-small-desc">{project.description}</p>
                <div className="project-people-info">
                  <div className="people-row">
                    <span className="people-label">Researcher</span>
                    <span className="people-val">{project.studentId?.userId?.name || 'University researcher'}</span>
                  </div>
                  <div className="people-row">
                    <span className="people-label">Academic year</span>
                    <span className="people-val">{project.academicYear}</span>
                  </div>
                </div>
              </div>
              <div className="project-card-footer">
                <span>{project.progressPercentage || 0}% progress</span>
                <Link
                  className="btn btn-primary btn-sm"
                  to={getCurrentUser()
                    ? `/showcase/${project._id}`
                    : `/login?redirect=${encodeURIComponent(`/showcase/${project._id}`)}`}
                >
                  View full research
                </Link>
              </div>
            </article>
          ))}
        </div>
        {pagination?.pages > 1 && !error && (
          <nav className="results-meta-row" aria-label="Research pages">
            <button className="btn btn-primary btn-sm" disabled={loading || page === 1} onClick={() => setPage(page - 1)}>Previous</button>
            <span>Page {page} of {pagination.pages}</span>
            <button className="btn btn-primary btn-sm" disabled={loading || page >= pagination.pages} onClick={() => setPage(page + 1)}>Next</button>
          </nav>
        )}
      </div>
    </div>
  );
}
