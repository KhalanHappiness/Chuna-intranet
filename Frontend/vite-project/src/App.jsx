import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import AdminDashboard from './components/AdminDashboard';
import SharedLinkView from './components/SharedLinkView';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    if (token && userData) {
      setIsAuthenticated(true);
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  const handleLogin = (token, userData) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setIsAuthenticated(true);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsAuthenticated(false);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/login" 
          element={isAuthenticated ? <Navigate to={user?.role === 'super_admin' ? '/admin' : '/dashboard'} /> : <Login onLogin={handleLogin} />} 
        />
        
        <Route path="/share/:token" element={<SharedLinkView />} />

        {/* Protected Routes */}
        <Route 
          path="/dashboard" 
          element={
            isAuthenticated && user?.role !== 'super_admin' ? 
            <Dashboard onLogout={handleLogout} user={user} /> : 
            <Navigate to="/login" />
          } 
        />

        <Route 
          path="/admin" 
          element={
            isAuthenticated && user?.role === 'super_admin' ? 
            <AdminDashboard onLogout={handleLogout} user={user} /> : 
            <Navigate to="/login" />
          } 
        />

        {/* Default Route */}
        <Route 
          path="/" 
          element={
            <Navigate to={
              isAuthenticated ? 
                (user?.role === 'super_admin' ? '/admin' : '/dashboard') : 
                '/login'
            } />
          } 
        />
      </Routes>
    </Router>
  );
}

export default App;