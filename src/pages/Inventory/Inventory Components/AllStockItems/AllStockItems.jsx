import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './AllStockItems.css';

function getStockStatus(stock) {
  if (stock.remainingQty === 0) return 'out';
  if (stock.remainingQty > 0 && stock.remainingQty <= 5) return 'low';
  return 'in';
}

const capitalizeWords = (str) => 
  str.replace(/\b\w/g, (char) => char.toUpperCase());

export default function AllStockItems({ stocks, loading, error, onDelete, onEdit }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState(null);
  const [deleteTimer, setDeleteTimer] = useState(0);

  const navigate = useNavigate();

  useEffect(() => {
    if (deleteTimer > 0) {
      const timer = setTimeout(() => setDeleteTimer(deleteTimer - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [deleteTimer]);

  const handleSell = (stock) => {
    navigate('/sales', { state: { preselectStock: stock } });
  };

  const handleDeleteClick = (stockId) => {
    setSelectedStockId(stockId);
    setShowDeleteModal(true);
    setDeleteTimer(5);
  };

  const handleConfirmDelete = () => {
    if (selectedStockId) {
      onDelete(selectedStockId);
    }
    setShowDeleteModal(false);
    setSelectedStockId(null);
    setDeleteTimer(0);
  };

  const handleCancelDelete = () => {
    setShowDeleteModal(false);
    setSelectedStockId(null);
    setDeleteTimer(0);
  };

  if (loading) return <div className="all-stock-items">Loading...</div>;
  if (error) return <div className="all-stock-items error">{error}</div>;
  if (!stocks || stocks.length === 0)
    return <div className="all-stock-items empty">No stock items found.</div>;

  return (
    <div className="all-stock-items">
      {stocks.map((stock) => {
        const status = getStockStatus(stock);

        return (
          
          <div className="stock-card" key={stock.id}>
            
            {/* Header */}
            <div className="card-header">
              <h3>{capitalizeWords(stock.productName)}</h3>
              <span className={`badge ${status}`}>
                {status === 'in' && 'In Stock'}
                {status === 'low' && 'Low Stock'}
                {status === 'out' && 'Out of Stock'}
              </span>
            </div>

            

            {/* Stock Info */}
            <div className="stock-info">
              <div className="stock-row">
                <span>{stock.remainingQty} units</span>
                <span>Min: 10</span>
              </div>

              <div className="progress-bar">
                <div
                  className={`progress ${status}`}
                  style={{
                    width: `${Math.min((stock.remainingQty / 50) * 100, 100)}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Price */}
            <div className="price-row">
              <span>Sell <b>${stock.sellingPrice}</b></span>
              <span>Buy ${stock.buyingPrice || '—'}</span>
              <span>GST {stock.gst}%</span>
            </div>

            {/* Actions */}
            <div className="actions">
              <button onClick={() => onEdit && onEdit(stock)}>Edit</button>
              <button className="delete" onClick={() => handleDeleteClick(stock.id)}>Delete</button>
               <button className="sell" onClick={() => handleSell(stock)}>Sell</button>
            </div>
          </div>
        );
      })}

      {showDeleteModal && (
        <div className="stock-delete-modal-overlay">
          <div className="stock-modal-content">
            <h3>Are you sure you want to delete this item?</h3>
            <p>Delete button will be enabled in {deleteTimer} seconds.</p>
            <div className="stock-modal-actions">
              <button onClick={handleCancelDelete}>Cancel</button>
              <button disabled={deleteTimer > 0} onClick={handleConfirmDelete}>
                {deleteTimer > 0 ? `Delete (${deleteTimer}s)` : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}