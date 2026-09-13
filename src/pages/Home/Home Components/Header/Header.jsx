import React from 'react';
import { FiBell, FiMoon, FiSun, FiLogOut } from 'react-icons/fi';
import { useAppTheme } from '../../../../context/AppContext';
import './Header.css';

export default function Header() {
  const { theme, toggleTheme } = useAppTheme();

  const handleLogout = () => {
    // Clear the authentication state from sessionStorage
    sessionStorage.removeItem('jntims_auth');
    // Reload the page to force App.jsx to re-evaluate the auth state and show the Login screen
    window.location.reload(); 
  };

  return (
    <div className="header">
      <div className="left">
        <img src="/jnt logo.png" alt="logo" />

        <div className="title">
          <h3>JNTIMS</h3>
          <p>Inventory Management</p>
        </div>
      </div>

      <div className="header-actions">
        <button className="theme-toggle" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === 'dark' ? <FiSun size={18} /> : <FiMoon size={18} />}
        </button>
        
        <div className="notification">
          <FiBell className="bell-icon" />
          <span className="dot"></span>
        </div>

        <button className="logout-btn" onClick={handleLogout} aria-label="Logout" title="Lock App">
          <FiLogOut size={18} />
        </button>
      </div>
    </div>
  );
}