import React from 'react';
import { Link } from 'react-router-dom';
import { MdHome, MdDashboard, MdReceiptLong } from 'react-icons/md';
import './styles/Nav.css';

export default function ResponsiveNav() {
  return (
    <div className="responsive-nav">
      <ul className="nav-links-responsive">
        <li><Link to="/"><MdHome color="black" size={26} /></Link></li>
        <li><Link to="/dashboard"><MdDashboard color="black" size={26} /></Link></li>
        <li><Link to="/bills"><MdReceiptLong color="black" size={26} /></Link></li>
      </ul>
    </div>
  );
}
