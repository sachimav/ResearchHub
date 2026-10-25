import { useEffect } from 'react';
import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StakeholderPortals from './components/StakeholderPortals';
import FeatureHighlights from './components/FeatureHighlights';
import Footer from './components/Footer';
import ShowcasePage from './pages/ShowcasePage';
import ResearchDetailsPage from './pages/ResearchDetailsPage';
import AuthPage from './pages/AuthPage';
import StudentDashboard from './pages/StudentDashboard';
import SupervisorDashboard from './pages/SupervisorDashboard';
import ProtectedRoute from './components/ProtectedRoute';

function ScrollToTop() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
  }, [pathname, search]);

  return null;
}

/* ── Home landing page ─────────────────────────────── */
function HomePage() {
  return (
    <>
      <Hero />
      <StakeholderPortals />
      <FeatureHighlights />
    </>
  );
}

function App() {
  const location = useLocation();
  const authKey = location.pathname + location.search;
  return (
    <div className="researchhub-app">
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/showcase" element={<ShowcasePage />} />
          <Route path="/showcase/:researchId" element={<ProtectedRoute><ResearchDetailsPage /></ProtectedRoute>} />
          <Route path="/student/dashboard" element={<ProtectedRoute role="student"><StudentDashboard /></ProtectedRoute>} />
          <Route path="/supervisor/dashboard" element={<ProtectedRoute role="supervisor"><SupervisorDashboard /></ProtectedRoute>} />
          <Route path="/login" element={<AuthPage key={authKey} initialMode="login" />} />
          <Route path="/register" element={<AuthPage key={authKey} initialMode="register" />} />
          <Route path="/auth" element={<AuthPage key={authKey} />} />
          <Route path="*" element={<div className="container showcase-page-body"><h1>Page not found</h1><a href="/">Return home</a></div>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
