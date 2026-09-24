import React from 'react';
import { Link } from 'react-router-dom';
import heroGraphic from '../assets/background_image.png';

export default function Hero() {
  return (
    <section 
      id="overview" 
      className="hero-section hero-section-fullbg"
      style={{ backgroundImage: `url(${heroGraphic})` }}
    >
      {/* Dark / Brand gradient overlay to guarantee text legibility */}
      <div className="hero-backdrop-overlay"></div>

      <div className="container hero-container hero-container-single">
        <div className="hero-content hero-content-centered">
          <div className="hero-badge animate-fade-in-up delay-1">
            <span className="badge-pill badge-hero-glass">
              Centralized Academic Research Management System
            </span>
          </div>

          <h1 className="hero-title hero-title-light animate-fade-in-up delay-2">
            Empowering <span className="highlight-text-light">University Research</span> and Innovation
          </h1>

          <p className="hero-description hero-description-light animate-fade-in-up delay-3">
            ResearchHub connects students, faculty supervisors, administrators, and industry collaborators 
            at the <strong>University of Vavuniya</strong>. Effortlessly coordinate academic projects, eliminate 
            topic duplication, and showcase cutting-edge breakthroughs to the world.
          </p>

          <div className="hero-buttons hero-buttons-centered animate-fade-in-up delay-4">
            <Link to="/showcase" className="btn btn-primary btn-glow">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8" />
                <path d="M21 21l-4.35-4.35" />
              </svg>
              <span>Explore Research Showcase</span>
            </Link>

            <a href="#features" className="btn btn-glass-light">
              <span>Check Topic Novelty</span>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}

