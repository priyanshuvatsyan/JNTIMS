import React, { useEffect, useState } from 'react';
import { FaRupeeSign, FaChartLine, FaBoxes, FaExclamationTriangle } from "react-icons/fa";
import { getAnalyticsStats, getBillsStats } from '../../../../Database/apis';
import './Crousal.css';

export default function Crousal() {
  const [stats, setStats] = useState({
    totalPayable: 0,
    totalRevenue: 0,
    totalStock: 0,
    lowStock: 0,
    outOfStock: 0,
  });

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [analytics, bills] = await Promise.all([
          getAnalyticsStats(1),
          getBillsStats(),
        ]);

        setStats({
          totalPayable: bills.totalPayable || 0,
          totalRevenue: analytics.totalRevenue || 0,
          totalStock: analytics.totalStock || 0,
          lowStock: analytics.lowStock || 0,
          outOfStock: analytics.outOfStock || 0,
        });
      } catch (error) {
        console.error('Failed to load carousel stats:', error);
      }
    };

    fetchStats();
  }, []);

  const formatCurrency = amount =>
    amount.toLocaleString('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 });

  return (
    <div className="crousal">

      <div className="greet">
        <p>Hello!</p>
        <h2>Manage Your Trade</h2>
        <p className="date">{currentDate}</p>
      </div>

      <div className="stock-container">

        <div className="info-card">
          <div className="info-left blue">
            <FaRupeeSign />
          </div>
          <div className="info-right">
            <p>Total Payable</p>
            <h3>{formatCurrency(stats.totalPayable)}</h3>
          </div>
        </div>

        <div className="info-card">
          <div className="info-left green">
            <FaChartLine />
          </div>
          <div className="info-right">
            <p>Monthly Revenue</p>
            <h3>{formatCurrency(stats.totalRevenue)}</h3>
          </div>
        </div>

        <div className="info-card">
          <div className="info-left purple">
            <FaBoxes />
          </div>
          <div className="info-right">
            <p>Total Items</p>
            <h3>{stats.totalStock.toLocaleString('en-IN')}</h3>
          </div>
        </div>

        <div className="info-card">
          <div className="info-left orange">
            <FaExclamationTriangle />
          </div>
          <div className="info-right">
            <p>Low / Out Stock</p>
            <h3>{`${stats.lowStock} / ${stats.outOfStock}`}</h3>
          </div>
        </div>

      </div>

    </div>
  );
}