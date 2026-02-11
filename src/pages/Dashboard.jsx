import React from 'react';
import Nav from '../components/Nav';
import ResponsiveNav from '../components/ResponsiveNav';
import './styles/Home.css';
import './styles/Dashboard.css';
import AllStockItems from '../components/AllStockItems';
import MonthlyReport from '../components/DashBoard/MonthlyReport';
import MonthlySales from '../components/DashBoard/MonthlySales';

export default function Dashboard() {
  return (
    <div className='dashboard' >
      <MonthlyReport />
      <MonthlySales />
    </div>
  )
}
