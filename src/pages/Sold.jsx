import React from 'react';
import Nav from '../components/Nav';
import ResponsiveNav from '../components/ResponsiveNav';
import './styles/Home.css';
import './styles/Dashboard.css';
import AllStockItems from '../components/AllStockItems';

export default function Sold() {
  return (
    <div className="home-container">
      <div className="nav">
        <Nav />
      </div>
      <div className="content">
       <AllStockItems />
      </div>
      <ResponsiveNav />
    </div>

  )
}
