import React from 'react';
import Nav from '../components/Nav';
import ResponsiveNav from '../components/ResponsiveNav';
import './styles/Home.css';
import { Outlet } from 'react-router-dom';

export default function Home() {
  return (
    <div className="home-container">
      <div className="nav">
        <Nav />
      </div>
      <div className="content">
        <Outlet /> {/* This changes based on the route */}
      </div>
      <ResponsiveNav />
    </div>
  );
}
