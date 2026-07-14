import React from 'react';
import { FiBell, FiMoon, FiSun } from 'react-icons/fi';
import { useAppTheme } from '../../../../context/AppContext';
import './Header.css';

export default function Header() {
  const { theme, toggleTheme } = useAppTheme();

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
      </div>
    </div>
  );
}