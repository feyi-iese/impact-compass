import React from 'react';
import { Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import LandingPage from './pages/LandingPage';
import OnboardingQuiz from './pages/OnboardingQuiz';
import ActionFeed from './pages/ActionFeed';
import OpportunityDetail from './pages/OpportunityDetail';

function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/waitlist" element={<LandingPage />} />
      <Route path="/onboarding" element={<OnboardingQuiz />} />
      <Route path="/feed" element={<ActionFeed />} />
      <Route path="/opportunity/:id" element={<OpportunityDetail />} />
    </Routes>
  );
}

export default App;
