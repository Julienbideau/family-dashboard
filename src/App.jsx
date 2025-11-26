import React from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginScreen from './components/LoginScreen';
import Dashboard from './components/Dashboard';
import NetatmoCallback from './components/NetatmoCallback';

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth();

  // Gérer la route du callback Netatmo
  if (window.location.pathname === '/netatmo-callback') {
    return <NetatmoCallback />;
  }

  if (isLoading) {
    return (
      <div className="app-loading">
        <div className="loader">
          <div className="spinner"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? <Dashboard /> : <LoginScreen />;
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;