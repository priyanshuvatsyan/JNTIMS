import { useState, useEffect } from 'react';
import { getRecentSales } from '../../../Database/apis';
import { FiClock, FiTrendingUp, FiChevronUp } from 'react-icons/fi';
import './RecentSoldItems.css';

const capitalizeWords = (str = '') =>
  str.replace(/\b\w/g, (c) => c.toUpperCase());

function getTimeLabel(timestamp) {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  return `${diffDays}d ago`;
}

export default function RecentSoldItems() {
  const [expanded, setExpanded] = useState(false);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetched, setFetched] = useState(false);

  // Only fetch when expanded for first time
  useEffect(() => {
    if (expanded && !fetched) {
      fetchSales();
    }
  }, [expanded, fetched]);

  const fetchSales = async () => {
    setLoading(true);
    try {
      const data = await getRecentSales(30);
      setSales(data);
      setFetched(true);
    } catch (err) {
      console.error('Failed to fetch recent sales:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rsi-container ${expanded ? 'expanded' : ''}`}>

      {/* Trigger bar — always visible */}
      <div className="rsi-trigger" onClick={() => setExpanded(!expanded)}>
        <div className="rsi-trigger-left">
          <FiClock size={15} className="rsi-clock-icon" />
          <span>Recent Sales</span>
        </div>
        <FiChevronUp
          size={16}
          className={`rsi-chevron ${expanded ? 'up' : 'down'}`}
        />
      </div>

      {/* Expanded panel */}
      {expanded && (
        <div className="rsi-panel">
          {loading ? (
            <div className="rsi-state">Loading...</div>
          ) : sales.length === 0 ? (
            <div className="rsi-state">No sales yet</div>
          ) : (
            sales.map((sale) => (
              <div key={sale.id} className="rsi-row">
                <div className="rsi-row-left">
                  <div className="rsi-icon">
                    <FiTrendingUp size={14} />
                  </div>
                  <div className="rsi-info">
                    <span className="rsi-name">
                      {capitalizeWords(sale.productName)}
                    </span>
                    <span className="rsi-meta">
                      {sale.quantitySold} unit{sale.quantitySold > 1 ? 's' : ''}
                      {sale.customerName ? ` · ${sale.customerName}` : ''}
                    </span>
                  </div>
                </div>
                <div className="rsi-row-right">
                  <span className="rsi-revenue">
                    +₹{Number(sale.totalRevenue).toLocaleString('en-IN')}
                  </span>
                  <span className="rsi-time">
                    {getTimeLabel(sale.timestamp)}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}