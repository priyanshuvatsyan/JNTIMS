import React from 'react';
import './InventoryHeader.css';

export default function InventoryHeader() {
  return (
    <div className="inventory-header">

      {/* Top Stats Row */}
      <div className="inventory-stats">
        <div className="stat-box">
          <p>Total Units</p>
          <h2>132</h2>
        </div>

        <div className="stat-box">
          <p>Inventory Value</p>
          <h2>₹74,338</h2>
        </div>

        <div className="stat-box">
          <p>Varities</p>
          <h2>8</h2>
        </div>
      </div>



    </div>
  );
}