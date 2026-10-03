import { Link } from 'react-router-dom';

export default function ShowcasePage() {
  return (
    <div className="showcase-page">
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
              Published research projects will be listed here when they become available.
            </p>
          </div>
        </div>
      </div>

      <div className="container showcase-page-body">
        <div className="empty-state-box glass-card" style={{ padding: '64px 24px', textAlign: 'center', margin: '20px 0' }}>
          <div className="empty-icon" style={{ fontSize: '3rem', marginBottom: '16px' }}>🔬</div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 700, marginBottom: '8px', color: 'var(--text-heading)' }}>
            No Research Projects Published Yet
          </h3>
          <p style={{ maxWidth: '540px', margin: '0 auto 24px', color: 'var(--text-muted)', fontSize: '0.92rem', lineHeight: '1.6' }}>
            Check back later to explore published university research.
          </p>
          <Link to="/" className="btn btn-outline btn-sm">
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}
