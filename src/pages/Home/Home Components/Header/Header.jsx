import React from 'react';
import { FiBell } from "react-icons/fi";
import './Header.css';

export default function Header() {
  return (
    <div className="header">

      {/* Left Section */}
      <div className="left">
        <img src="/jnt logo.png" alt="logo" />

        <div className="title">
          <h3>JNTIMS</h3>
          <p>Inventory Management</p>
        </div>
      </div>

      {/* Right Section */}
      <div className="notification">
        <FiBell className="bell-icon" />
        <span className="dot"></span>
      </div>


    </div>
  );
}