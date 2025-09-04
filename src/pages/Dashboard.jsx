import React from 'react';
import Nav from '../components/Nav';
import ResponsiveNav from '../components/ResponsiveNav';
import './styles/Home.css';
import './styles/Dashboard.css';
import MonthlyReport from './../components/DashBoard/MonthlyReport.jsx';

export default function Dashboard() {
  return (
    <div className='coming-soon' >
    <MonthlyReport />
    </div>
  )
}
