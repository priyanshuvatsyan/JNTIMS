import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getProductHistory } from '../../../../Database/apis'; // adjust path to match your structure
import { FiChevronDown } from 'react-icons/fi'; // you already use react-icons elsewhere
import './AllStockItems.css';

function getStockStatus(stock) {
  if (stock.remainingQty === 0) return 'out';
  const threshold = (stock.totalUnits || 0) * 0.2;
  if (stock.remainingQty <= threshold) return 'low';
  return 'in';
}

const capitalizeWords = (str) => 
  str.replace(/\b\w/g, (char) => char.toUpperCase());

export default function AllStockItems({ stocks, loading, error, onDelete, onEdit }) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedStockId, setSelectedStockId] = useState(null);
  const [deleteTimer, setDeleteTimer] = useState(0);

  const [expandedId, setExpandedId] = useState(null);
const [historyCache, setHistoryCache] = useState({}); // { [stockId]: [historyEntries] }
const [loadingHistoryId, setLoadingHistoryId] = useState(null);

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

  const handleToggleExpand = async (stock) => {
  if (expandedId === stock.id) {
    setExpandedId(null);
    return;
  }
  setExpandedId(stock.id);

  if (!historyCache[stock.id]) {
    setLoadingHistoryId(stock.id);
    try {
      const history = await getProductHistory(stock.companyId, stock.productName);
      setHistoryCache(prev => ({ ...prev, [stock.id]: history }));
    } catch (err) {
      console.error('Failed to load product history:', err);
      setHistoryCache(prev => ({ ...prev, [stock.id]: [] }));
    } finally {
      setLoadingHistoryId(null);
    }
  }
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
  <div className="header-right">
    <span className={`badge ${status}`}>
      {status === 'in' && 'In Stock'}
      {status === 'low' && 'Low Stock'}
      {status === 'out' && 'Out of Stock'}
    </span>
    <button
      className={`expand-toggle ${expandedId === stock.id ? 'open' : ''}`}
      onClick={() => handleToggleExpand(stock)}
      aria-label="Show details"
    >
      <FiChevronDown size={16} />
    </button>
  </div>
</div>
            

            {/* Stock Info */}
            <div className="stock-info">
              <div className="stock-row">
                <span>{stock.remainingQty} units</span>
                {/* <span>Min: 10</span> */}
              </div>

              <div className="progress-bar">
                <div
                  className={`progress ${status}`}
                  style={{
                   width: `${Math.min((stock.remainingQty / (stock.totalUnits || stock.remainingQty)) * 100, 100)}%`
                  }}
                ></div>
              </div>
            </div>

            {/* Price */}
            <div className="price-row">
              <span>Sell <b>₹{stock.sellingPrice}</b></span>
              {/* <span>Buy <b>₹{stock.buyingPrice || '—'}</b></span> */}
              <span>GST {stock.gst}%</span>
            </div>

            {expandedId === stock.id && (
  <div className="stock-details-panel">
    <div className="detail-row">
      <span className="detail-label">Company</span>
      <span className="detail-value">{stock.companyName}</span>
    </div>

    <div className="history-section">
      <span className="detail-label">Restock History</span>

      {loadingHistoryId === stock.id && (
        <p className="history-loading">Loading history...</p>
      )}

      {loadingHistoryId !== stock.id && historyCache[stock.id]?.length === 0 && (
        <p className="history-empty">No previous arrivals yet.</p>
      )}

      {loadingHistoryId !== stock.id && historyCache[stock.id]?.length > 0 && (
        <div className="history-list">
          {historyCache[stock.id].map((entry) => (
            <div className="history-entry" key={entry.id}>
              <div className="history-entry-top">
                <span>
                  {entry.arrivalDate?.toDate
                    ? entry.arrivalDate.toDate().toLocaleDateString()
                    : new Date(entry.arrivalDate).toLocaleDateString()}
                </span>
                <span>{entry.boxes} boxes</span>
              </div>
              <div className="history-entry-bottom">
                <span>Unit (GST): ₹{Math.round(entry.unitPriceWithGst)}</span>
                <span>Sell: ₹{entry.sellingPrice}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  </div>
)}

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