import React from 'react';
import { FaRupeeSign, FaChartLine, FaBoxes, FaExclamationTriangle } from "react-icons/fa";
import './Crousal.css';

export default function Crousal() {

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

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
            <h3>₹ 1,00,000</h3>
          </div>
        </div>

        <div className="info-card">
          <div className="info-left green">
            <FaChartLine />
          </div>
          <div className="info-right">
            <p>Monthly Revenue</p>
            <h3>₹ 2,00,000</h3>
          </div>
        </div>

        <div className="info-card">
          <div className="info-left purple">
            <FaBoxes />
          </div>
          <div className="info-right">
            <p>Total Items</p>
            <h3>1000</h3>
          </div>
        </div>

        <div className="info-card">
          <div className="info-left orange">
            <FaExclamationTriangle />
          </div>
          <div className="info-right">
            <p>Low / Out Stock</p>
            <h3>2 / 3</h3>
          </div>
        </div>

      </div>

    </div>
  );
}