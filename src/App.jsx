import { useState, useEffect } from 'react';
import './App.css';
import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home/Home';
import Inventory from './pages/Inventory/Inventory';
import Sales from './pages/Sales/Sales';
import Analytics from './pages/Analytics/Analytics';
import Bills from './pages/Bills/Bills';
import Nav from './components/Nav/Nav';
import Header from './pages/Home/Home Components/Header/Header';

// Adjust path depending on where you saved Login.jsx
import Login from './pages/Login/Login'; 

function App() {
  // Check if testing mode is false (which means we are in production)
  // This uses the mapping we previously created in vite.config.js
  const isProduction = import.meta.env.TESTING === "false";

  // Check if user has already unlocked the app in this browser tab
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('jntims_auth') === 'true';
  });

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    sessionStorage.setItem('jntims_auth', 'true');
  };

  // If in production and NOT authenticated, render ONLY the login screen
  if (isProduction && !isAuthenticated) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  // Otherwise, render the standard App Shell
  return (
    <div className="app-shell">
      <Header />
      <main className="app-main">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/inventory" element={<Inventory />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/bills" element={<Bills />} />
        </Routes>
      </main>
      <Nav />
    </div>
  );
}

export default App;