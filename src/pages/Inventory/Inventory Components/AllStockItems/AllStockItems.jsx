import React from 'react';
import './AllStockItems.css';

function getStockStatusLabel(stock) {
  if (stock.remainingQty === 0) return 'Out of Stock';
  if (stock.remainingQty > 0 && stock.remainingQty <= 5) return 'Low Stock';
  if (stock.remainingQty > 0) return 'In Stock';
  return 'Unknown';
}

export default function AllStockItems({ stocks, loading, error }) {
  if (loading) {
    return <div className="all-stock-items">Loading stock records...</div>;
  }

  if (error) {
    return <div className="all-stock-items error">{error}</div>;
  }

  if (!stocks || stocks.length === 0) {
    return <div className="all-stock-items empty">No stock items found.</div>;
  }

  return (
    <div className="all-stock-items">
      <table className="stock-table">
        <thead>
          <tr>
            <th>Product</th>
            <th>Company</th>
            <th>Entry</th>
            <th>Boxes</th>
            <th>Units/Box</th>
            <th>Remaining</th>
            <th>Price</th>
            <th>GST</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {stocks.map((stock) => (
            <tr key={stock.id}>
              <td>{stock.productName || '—'}</td>
              <td>{stock.companyId || '—'}</td>
              <td>{stock.entryId || '—'}</td>
              <td>{stock.boxes ?? '—'}</td>
              <td>{stock.unitsPerBox ?? '—'}</td>
              <td>{stock.remainingQty ?? '—'}</td>
              <td>{stock.sellingPrice ?? '—'}</td>
              <td>{stock.gst ?? '—'}%</td>
              <td>{getStockStatusLabel(stock)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
