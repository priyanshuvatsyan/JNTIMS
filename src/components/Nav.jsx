import React from 'react';
import { Link } from 'react-router-dom';
import './styles/Nav.css';

export default function Nav() {
  return (
    <nav className="sidebar">
      <div className="logo">
        <img src="jnt logo.png" alt="Logo" />
      </div>
      <ul className="nav-links">
        <li><Link to="/">Home</Link></li>
        <li><Link to="/dashboard">Dashboard</Link></li>
        <li><Link to="/bills">Bills</Link></li>
      </ul>
    </nav>
  );
}
