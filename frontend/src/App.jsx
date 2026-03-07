import React, { useState, useCallback } from 'react';
import SplashScreen from './components/Splash/SplashScreen';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ExpenseProvider } from './context/ExpenseContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import ExpensesPage from './pages/ExpensesPage';
import AboutPage from './pages/AboutPage';
import Layout from './components/Layout/Layout';

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: 'var(--bg-primary)'
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, border: '3px solid var(--border)',
          borderTopColor: 'var(--accent-gold)', borderRadius: '50%',
          animation: 'spin 0.8s linear infinite', margin: '0 auto 16px'
        }} />
        <p style={{ color: 'var(--text-secondary)', fontFamily: 'var(--font-body)' }}>Loading...</p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return children;
};

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/dashboard" replace />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="/login" element={<PublicRoute><LoginPage /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><RegisterPage /></PublicRoute>} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="expenses" element={<ExpensesPage />} />
        <Route path="about" element={<AboutPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  const [splashDone, setSplashDone] = useState(false);
  const handleSplashFinish = useCallback(() => setSplashDone(true), []);
  return (
    <>
      {!splashDone && <SplashScreen onFinish={handleSplashFinish} />}
      <AuthProvider>
        <ExpenseProvider>
          <BrowserRouter>
            <AppRoutes />
            <Toaster
              position="top-right"
              toastOptions={{
                style: {
                  background: 'var(--bg-elevated)',
                  color: 'var(--text-primary)',
                  border: '1px solid var(--border)',
                  fontFamily: 'var(--font-body)',
                  fontSize: '14px',
                },
                success: { iconTheme: { primary: '#4ade80', secondary: 'var(--bg-elevated)' } },
                error: { iconTheme: { primary: '#f87171', secondary: 'var(--bg-elevated)' } },
              }}
            />
          </BrowserRouter>
        </ExpenseProvider>
      </AuthProvider>
    </>
  );
}
