import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Landing from './pages/Landing';
import { LoginPage, SignupPage } from './pages/Auth';
import Analyzer from './pages/Analyzer';
import Dashboard from './pages/Dashboard';
import History from './pages/History';
import Report from './pages/Report';
import Pricing from './pages/Pricing';
import About from './pages/About';

const App = () => (
  <AuthProvider>
    <div className="min-h-screen bg-[#080810]">
      <Navbar />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<About />} />
        <Route path="/analyzer" element={<Analyzer />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
        <Route path="/report/:id" element={<ProtectedRoute><Report /></ProtectedRoute>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  </AuthProvider>
);

export default App;
