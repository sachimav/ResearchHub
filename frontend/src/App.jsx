import React from 'react';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StakeholderPortals from './components/StakeholderPortals';
import FeatureHighlights from './components/FeatureHighlights';
import Footer from './components/Footer';
import ShowcasePage from './pages/ShowcasePage';
import AuthPage from './pages/AuthPage';
import StudentPortalPage from './pages/StudentPortalPage';
import SupervisorPortalPage from './pages/SupervisorPortalPage';

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

/* ── Root app with router ──────────────────────────── */
function App() {
  return (
    <div className="researchhub-app">
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/showcase" element={<ShowcasePage />} />
          <Route path="/login" element={<AuthPage initialMode="login" />} />
          <Route path="/register" element={<AuthPage initialMode="register" />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/student-portal" element={<StudentPortalPage />} />
          <Route path="/supervisor-portal" element={<SupervisorPortalPage />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
