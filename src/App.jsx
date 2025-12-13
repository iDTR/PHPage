import React, { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import UserManagement from './pages/UserManagement';
import MoldSystem from './pages/MoldSystem'; 
import Layout from './components/Layout';
import { getSession, clearSession } from './utils/storage';
import History from './pages/History';

function App() {
  const [user, setUser] = useState(null);
  const [currentView, setCurrentView] = useState('dashboard');

  useEffect(() => {
    const session = getSession();
    if (session) setUser(session);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
  };

  // Renderizado condicional
  if (!user) {
    return <Login onLoginSuccess={handleLogin} />;
  }

  return (
    <Layout 
      user={user} 
      onLogout={handleLogout} 
      currentView={currentView}
      setView={setCurrentView}
    >
      {/* VISTAS */}
      {currentView === 'dashboard' && <Dashboard />}
      {currentView === 'users' && <UserManagement />}
      {currentView === 'molds' && <MoldSystem />}
      {currentView === 'history' && <History />}
    </Layout>
  );
}

export default App;