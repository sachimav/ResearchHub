import React from 'react';
import uovLogo from '../assets/logo.png';
import ResearchHubLogo from './ResearchHubLogo';

export default function Footer() {
  return (
    <footer className="footer-wrapper">
      {/* Main Institutional Footer - Next Academic Cycle CTA Removed */}
      <div className="main-footer-body">
        <div className="container footer-grid">
          {/* Column 1: Dual Logos and Institutional Info */}
          <div className="footer-col brand-col">
            <div className="footer-logos-dual">
              <img 
                src={uovLogo} 
                alt="University of Vavuniya" 
                className="footer-uov-logo" 
              />
              <div className="footer-logo-divider"></div>
              <ResearchHubLogo fontSize={24} lightMode={true} />
            </div>

            <p className="footer-institution-desc">
              ResearchHub is the official centralized University Research Project Management System 
              at the <strong>University of Vavuniya, Sri Lanka</strong>. Dedicated to academic governance, 
              preventing research duplication, and showcasing faculty and student breakthroughs.
            </p>

            <div className="footer-contact-details">
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <span>Pambaimadu, Vavuniya, Northern Province, Sri Lanka</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">📧</span>
                <span>research@vau.ac.lk | info@vau.ac.lk</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">🌐</span>
                <a href="https://www.vau.ac.lk" target="_blank" rel="noopener noreferrer">
                  www.vau.ac.lk
                </a>
              </div>
            </div>
          </div>

          {/* Column 2: Faculties & Departments */}
          <div className="footer-col">
            <h4 className="footer-col-title">Faculties</h4>
            <ul className="footer-links-list">
              <li><a href="#showcase">Faculty of Applied Science</a></li>
              <li><a href="#showcase">Faculty of Technological Studies</a></li>
              <li><a href="#showcase">Faculty of Business Studies</a></li>
              <li><a href="#showcase">Department of Physical Science</a></li>
              <li><a href="#showcase">Department of Bio-Science</a></li>
              <li><a href="#showcase">Department of Information Systems</a></li>
            </ul>
          </div>

          {/* Column 3: Platform Navigation */}
          <div className="footer-col">
            <h4 className="footer-col-title">Quick Navigation</h4>
            <ul className="footer-links-list">
              <li><a href="#overview">Overview &amp; Statistics</a></li>
              <li><a href="#features">Duplicate-Topic Detection</a></li>
              <li><a href="#showcase">Research Project Showcase</a></li>
              <li><a href="#portals">Role-Based Portals</a></li>
              <li><a href="https://www.vau.ac.lk" target="_blank" rel="noopener noreferrer">University of Vavuniya Official</a></li>
            </ul>
          </div>

          {/* Column 4: Research Ethics & Portals */}
          <div className="footer-col">
            <h4 className="footer-col-title">Portals &amp; Governance</h4>
            <ul className="footer-links-list">
              <li><a href="#portals">Student Dissertation Portal</a></li>
              <li><a href="#portals">Faculty Supervisor Console</a></li>
              <li><a href="#portals">Dean &amp; Administrator Hub</a></li>
              <li><a href="#showcase">Public Research Showcase</a></li>
              <li><a href="#features">Novelty &amp; Similarity Checker</a></li>
            </ul>
          </div>
        </div>

        {/* Bottom Legal & Accreditation Bar */}
        <div className="container footer-bottom-bar">
          <div className="footer-bottom-left">
            <span>© {new Date().getFullYear()} University of Vavuniya, Sri Lanka. All Rights Reserved.</span>
            <span className="bottom-dot">•</span>
            <span>Accredited by University Grants Commission (UGC) Sri Lanka</span>
          </div>
          <div className="footer-bottom-right">
            <a href="#overview">Privacy Policy</a>
            <span className="bottom-dot">•</span>
            <a href="#overview">Terms of Academic Use</a>
            <span className="bottom-dot">•</span>
            <a href="#overview">Research Ethics Code</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
