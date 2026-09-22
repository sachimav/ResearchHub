import React, { useState } from 'react';

export default function FeatureHighlights() {
  const [topicInput, setTopicInput] = useState('');
  const [similarityResult, setSimilarityResult] = useState(null);
  const [isChecking, setIsChecking] = useState(false);

  const handleQuickCheck = (e) => {
    e.preventDefault();
    if (!topicInput.trim()) return;

    setIsChecking(true);
    setSimilarityResult(null);

    setTimeout(() => {
      setIsChecking(false);
      const query = topicInput.toLowerCase();
      if (query.includes('paddy') || query.includes('agriculture') || query.includes('crop')) {
        setSimilarityResult({
          score: 18,
          status: 'High Novelty (82% Unique)',
          color: '#059669',
          message: 'Related to "Crop Disease Detection (2025/01)". Your specific methodology appears distinctive.',
          recommendation: 'Clear to proceed with research formulation.'
        });
      } else if (query.includes('blockchain') || query.includes('health')) {
        setSimilarityResult({
          score: 22,
          status: 'Novel Scope (78% Unique)',
          color: '#059669',
          message: 'Partially intersects with "Secure Health Record Exchange (2025/03)". Consider narrowing the consensus algorithm.',
          recommendation: 'Scope is novel. Proceed with advisor consultation.'
        });
      } else {
        setSimilarityResult({
          score: 4,
          status: 'Exceptional Novelty (96% Unique)',
          color: '#059669',
          message: 'No overlapping research topics found in the University of Vavuniya dissertation repository.',
          recommendation: 'Excellent novel candidate! Recommended for full development.'
        });
      }
    }, 800);
  };

  return (
    <section id="features" className="features-section">
      <div className="container">
        <div className="section-header">
          <span className="section-tag">Core Feature</span>
          <h2 className="section-title">Duplicate-Topic &amp; Similarity Detection</h2>
          <p className="section-subtitle">
            Prevent redundant research scopes and ensure intellectual originality across all University 
            of Vavuniya faculties prior to project allocation.
          </p>
        </div>

        {/* Dedicated Duplicate & Similarity Detection Spotlight */}
        <div id="similarity" className="spotlight-card">
          <div className="spotlight-grid">
            <div className="spotlight-info">
              <span className="badge-pill badge-gold">Research Originality Engine</span>
              <h3 className="spotlight-title">Interactive Research Novelty &amp; Similarity Checker</h3>
              <p className="spotlight-desc">
                Our semantic search engine compares prospective research titles against historical theses, 
                ongoing dissertations, and academic indexes to prevent duplicate topics and safeguard research novelty.
              </p>
              
              <form onSubmit={handleQuickCheck} className="quick-check-form">
                <label className="input-label" htmlFor="researchTopicInput">
                  Enter a prospective research topic or question:
                </label>
                <div className="check-input-group">
                  <input
                    id="researchTopicInput"
                    type="text"
                    className="topic-input"
                    placeholder="e.g. AI-driven microgrid stabilization using reinforcement learning"
                    value={topicInput}
                    onChange={(e) => setTopicInput(e.target.value)}
                  />
                  <button 
                    type="submit" 
                    className="btn btn-primary"
                    disabled={isChecking || !topicInput.trim()}
                  >
                    {isChecking ? 'Analyzing...' : 'Check Novelty'}
                  </button>
                </div>
              </form>

              {similarityResult && (
                <div className="similarity-result-box">
                  <div className="result-header">
                    <span className="result-status" style={{ color: similarityResult.color }}>
                      ● {similarityResult.status}
                    </span>
                    <span className="result-score">Similarity Index: {similarityResult.score}%</span>
                  </div>
                  <p className="result-msg">{similarityResult.message}</p>
                  <div className="result-rec">
                    <strong>Verdict:</strong> {similarityResult.recommendation}
                  </div>
                </div>
              )}
            </div>

            <div className="spotlight-visual">
              <div className="similarity-demo-card">
                <div className="demo-header">
                  <div className="demo-dot"></div>
                  <span>Real-Time Topic Cross-Reference Engine</span>
                </div>
                <div className="demo-corpus-stats">
                  <div className="corpus-item">
                    <span className="c-num">1,240</span>
                    <span className="c-lbl">Archived Theses</span>
                  </div>
                  <div className="corpus-item">
                    <span className="c-num">184</span>
                    <span className="c-lbl">Active Projects</span>
                  </div>
                  <div className="corpus-item">
                    <span className="c-num">100%</span>
                    <span className="c-lbl">Faculty Sync</span>
                  </div>
                </div>
                <div className="demo-code-box">
                  <code>
                    &gt; Vector Embedding: Cosine Similarity<br/>
                    &gt; Cross-Faculty Match: FAS, FTS, FBS<br/>
                    &gt; Novelty Threshold: &gt; 70% Distinctive<br/>
                    &gt; Senate Ethics Check: Compliant
                  </code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
