import React from 'react';
import { Link } from 'react-router-dom';
import heroGraphic from '../assets/research_hero.jpg';

export default function Hero() {
  return (
    <section id="overview" className="hero-section">
      <div className="hero-bg-shapes">
        <div className="glow-sphere sphere-1"></div>
        <div className="glow-sphere sphere-2"></div>
        <div className="glow-sphere sphere-3"></div>
      </div>

      <div className="container hero-container">
        {/* Left / Text Column */}
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-pill badge-plum">
              Centralized Academic Research Management System
            </span>
          </div>

          <h1 className="hero-title">
            Empowering <span className="highlight-text">University Research</span> and Innovation
          </h1>

          <p className="hero-description">
            ResearchHub connects students, faculty supervisors, administrators, and industry collaborators 
            at the <strong>University of Vavuniya</strong>. Effortlessly coordinate academic projects, eliminate 
            topic duplication, and showcase cutting-edge breakthroughs to the world.
          </p>

          <div className="hero-buttons">
            <Link to="/showcase" className="btn btn-primary">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <span>Explore Research Showcase</span>
            </Link>

            <a href="#features" className="btn btn-outline">
              <span>Check Topic Novelty</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>


        </div>

        {/* Right / Visual Column - Clean image without floating notifications */}
        <div className="hero-visual-wrapper">
          <div className="visual-card-glass">
            <div className="visual-image-container">
              <img 
                src={heroGraphic} 
                alt="ResearchHub Academic & Data Science Innovation Lab" 
                className="hero-image"
              />
              <div className="image-overlay-glow"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
