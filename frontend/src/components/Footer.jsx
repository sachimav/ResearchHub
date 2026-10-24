import uovLogo from '../assets/logo.png';
import ResearchHubLogo from './ResearchHubLogo';

export default function Footer() {
  return (
    <footer className="footer-wrapper">
      <div className="main-footer-body">
        <div className="container footer-grid">
          {/* Column 1: Dual Logos and Institutional Info */}
          <div className="footer-col brand-col">
            <div className="footer-logos-dual">
              <img src={uovLogo} alt="University of Vavuniya" className="footer-uov-logo" />
              <div className="footer-logo-divider"></div>
              <ResearchHubLogo fontSize={24} lightMode={true} />
            </div>

            <div className="footer-contact-details">
              <div className="contact-item">
                <span className="contact-icon">📍</span>
                <span>Pambaimadu, Vavuniya, Northern Province, Sri Lanka</span>
              </div>
              <div className="contact-item">
                <span className="contact-icon">🌐</span>
                <a href="https://www.vau.ac.lk" target="_blank" rel="noopener noreferrer">
                  www.vau.ac.lk
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal & Accreditation Bar */}
        <div className="container footer-bottom-bar">
          <div className="footer-bottom-left">
            <span>© {new Date().getFullYear()} University of Vavuniya, Sri Lanka. All Rights Reserved.</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
