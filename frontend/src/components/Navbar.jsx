import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import uovLogo from '../assets/logo.png';
import { getCurrentUser, logoutUser, onAuthStateChanged } from '../services/authService';

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState(getCurrentUser());
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = onAuthStateChanged((user) => {
      setCurrentUser(user);
    });
    return unsubscribe;
  }, []);

  const handleNavClick = (sectionId, e) => {
    if (e) e.preventDefault();
    setMobileMenuOpen(false);

    if (location.pathname === '/') {
      const el = document.getElementById(sectionId);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      } else {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } else {
      navigate('/');
      // Once navigated to home, scroll to the targeted section
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 100);
    }
  };

  const handleLogout = () => {
    logoutUser();
    navigate('/');
  };

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
            <a 
              href="#overview" 
              className="nav-link"
              onClick={(e) => handleNavClick('overview', e)}
            >
              Overview
            </a>
            <a 
              href="#features" 
              className="nav-link"
              onClick={(e) => handleNavClick('features', e)}
            >
              Features
            </a>
            <Link to="/showcase" className="nav-link">Research Showcase</Link>
            <Link to="/about" className="nav-link">About Us</Link>
          </div>

          {/* Right Side: Login & Mobile Menu Toggle */}
          <div className="nav-right-brand">
            <div className="nav-actions">
              {currentUser ? (
                <div className="nav-user-logged">
                  <div
                    className="nav-user-chip"
                    title={`Logged in as ${currentUser.name}`}
                  >
                    <span className="user-chip-icon">
                      {currentUser.role === 'student' ? '🎓' : currentUser.role === 'supervisor' ? '👨‍🏫' : '👥'}
                    </span>
                    <span className="user-chip-name">{currentUser.name}</span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-outline btn-sm logout-nav-btn"
                    onClick={handleLogout}
                    title="Sign Out"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  id="navbar-login-btn"
                  className="btn btn-outline btn-sm login-btn"
                >
                  <span>Login</span>
                </Link>
              )}
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
            </div>
            <div className="mobile-links">
              <a 
                href="#overview" 
                onClick={(e) => handleNavClick('overview', e)}
              >
                Overview
              </a>
              <a 
                href="#features" 
                onClick={(e) => handleNavClick('features', e)}
              >
                Features
              </a>
              <Link to="/showcase" onClick={() => setMobileMenuOpen(false)}>Research Showcase</Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)}>About Us</Link>
            </div>
            <div className="mobile-actions">
              {currentUser ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%' }}>
                  <Link
                    to={getPortalRoute(currentUser.role)}
                    className="btn btn-primary"
                    style={{ width: '100%', textAlign: 'center' }}
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Go to Portal ({currentUser.name})
                  </Link>
                  <button
                    type="button"
                    className="btn btn-outline"
                    style={{ width: '100%', textAlign: 'center' }}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      handleLogout();
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="btn btn-outline"
                  style={{ width: '100%', textAlign: 'center' }}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Login
                </Link>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
