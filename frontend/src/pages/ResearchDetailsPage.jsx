import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { getPublicResearchDetails } from '../services/publicService';

export default function ResearchDetailsPage() {
  const { researchId } = useParams();
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let current = true;
    getPublicResearchDetails(researchId)
      .then((result) => { if (current) setData({ ...result, researchId }); })
      .catch((loadError) => { if (current) setError({ researchId, message: loadError.message }); });
    return () => { current = false; };
  }, [researchId]);

  if (error?.researchId === researchId) return <div className="container showcase-page-body"><p role="alert">{error.message}</p></div>;
  if (!data || data.researchId !== researchId) return <div className="container showcase-page-body"><p>Loading research...</p></div>;

  const { research, documents } = data;
  return (
    <div className="showcase-page">
      <div className="container showcase-page-body">
        <Link to="/showcase" className="back-btn">← Back to Research Showcase</Link>
        <span className="section-tag">{research.status === 'completed' ? 'Completed' : 'Ongoing'}</span>
        <h1 className="showcase-page-title" style={{ color: 'var(--text-heading)' }}>{research.title}</h1>
        <p className="project-meta-faculty">
          {research.studentId?.userId?.name || 'University researcher'} · {research.academicYear}
        </p>
        <p className="feature-small-desc" style={{ whiteSpace: 'pre-wrap', maxWidth: '800px' }}>{research.description}</p>
        {research.topic && <p><strong>Topic:</strong> {research.topic}</p>}
        <h2>Public research documents</h2>
        {documents.length === 0 ? (
          <p>No public documents are available for this research yet.</p>
        ) : (
          <ul>
            {documents.map((document) => (
              <li key={document._id}>
                <a href={document.fileUrl} target="_blank" rel="noreferrer">
                  {document.title} ({document.documentType})
                </a>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
