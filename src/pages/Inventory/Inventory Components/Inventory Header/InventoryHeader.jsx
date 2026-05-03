import React from 'react';
import './InventoryHeader.css';

export default function InventoryHeader({ stockCount, totalUnits, inventoryValue }) {
  return (
    <div className="inventory-header">

      {/* Top Stats Row */}
      <div className="inventory-stats">
        <div className="stat-box">
          <p>Total Units</p>
          <h2>{totalUnits}</h2>
        </div>

        <div className="stat-box">
          <p>Inventory Value</p>
          <h2>₹{inventoryValue.toLocaleString('en-IN')}</h2>
        </div>

        <div className="stat-box">
          <p>Varities</p>
          <h2>{stockCount} </h2>
        </div>
      </div>



    </div>
  );
}