import React, { useEffect } from 'react';
import './App.css';
import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StakeholderPortals from './components/StakeholderPortals';
import FeatureHighlights from './components/FeatureHighlights';
import Footer from './components/Footer';
import ShowcasePage from './pages/ShowcasePage';
import AuthPage from './pages/AuthPage';


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
  return (
    <div className="researchhub-app">
      <ScrollToTop />
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/showcase" element={<ShowcasePage />} />
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/register" element={<AuthPage initialMode="register" />} />
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
