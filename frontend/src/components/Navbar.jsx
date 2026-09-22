import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import uovLogo from '../assets/logo.png';
import ResearchHubLogo from './ResearchHubLogo';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <header className={`navbar-wrapper ${scrolled ? 'scrolled' : ''}`}>
      {/* Main Navbar with Dual Logos - No Top Institution Bar */}
      <nav className="main-navbar">
        <div className="container navbar-inner">
          {/* Left Side: University of Vavuniya Official Logo */}
          <div className="nav-left-brand">
            <Link to="/" className="uov-logo-link" title="University of Vavuniya, Sri Lanka">
              <img 
                src={uovLogo} 
                alt="University of Vavuniya, Sri Lanka" 
                className="uov-official-logo"
              />
            </Link>
          </div>

          {/* Center: Overview, Features, Research Showcase, About Us */}
          <div className="nav-center-links">
            <a href="#overview" className="nav-link">Overview</a>
            <a href="#features" className="nav-link">Features</a>
            <Link to="/showcase" className="nav-link">Research Showcase</Link>
            <Link to="/about" className="nav-link">About Us</Link>
          </div>

          {/* Right Side: ResearchHub Text-Only Logo & Portal Login */}
          <div className="nav-right-brand">
            <div className="researchhub-header-brand" title="ResearchHub Platform">
              <Link to="/"><ResearchHubLogo fontSize={28} /></Link>
            </div>

            <div className="nav-actions">
              <a href="#portals" className="btn btn-outline btn-sm login-btn">
                <span>Portal Login</span>
              </a>
            </div>

            {/* Mobile Hamburger Button */}
            <button 
              type="button" 
              className="mobile-toggle"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                {mobileMenuOpen ? (
                  <path d="M18 6L6 18M6 6l12 12" />
                ) : (
                  <path d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="mobile-drawer">
          <div className="mobile-drawer-inner">
            <div className="mobile-brand-row">
              <img src={uovLogo} alt="University of Vavuniya" className="mobile-uov-logo" />
              <ResearchHubLogo fontSize={22} />
            </div>
            <div className="mobile-links">
              <a href="#overview" onClick={() => setMobileMenuOpen(false)}>Overview</a>
              <a href="#features" onClick={() => setMobileMenuOpen(false)}>Features</a>
              <Link to="/showcase" onClick={() => setMobileMenuOpen(false)}>Research Showcase</Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
            </div>
            <div className="mobile-actions">
              <a 
                href="#portals" 
                className="btn btn-outline" 
                style={{ width: '100%', textAlign: 'center' }}
                onClick={() => setMobileMenuOpen(false)}
              >
                Access Portal Login
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
