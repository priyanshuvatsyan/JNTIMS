import React from 'react';
import { FiHome, FiBox, FiShoppingCart, FiBarChart2, FiFileText } from "react-icons/fi";
import { useNavigate, useLocation } from "react-router-dom"; 
import './Nav.css';

export default function Nav() {

  const navigate = useNavigate();       // 🔥 for navigation
  const location = useLocation();       // 🔥 to detect active route

  const navItems = [
    { name: "Home", icon: <FiHome />, path: "/" },
    { name: "Inventory", icon: <FiBox />, path: "/inventory" },
    { name: "Sales", icon: <FiShoppingCart />, path: "/sales" },
    { name: "Analytics", icon: <FiBarChart2 />, path: "/analytics" },
    { name: "Bills", icon: <FiFileText />, path: "/bills" },
  ];

  return (
    <div className="nav">
      {navItems.map((item) => (
        <div
          key={item.name}
          className={`nav-item ${location.pathname === item.path ? "active" : ""}`}
          onClick={() => navigate(item.path)}  
        >
          <div className="icon">{item.icon}</div>
          <p>{item.name}</p>
        </div>
      ))}
    </div>
  );
}