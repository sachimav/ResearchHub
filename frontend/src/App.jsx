import React from 'react';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Hero from './components/Hero';
import StakeholderPortals from './components/StakeholderPortals';
import FeatureHighlights from './components/FeatureHighlights';
import Footer from './components/Footer';
import ShowcasePage from './pages/ShowcasePage';

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
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
