import { useState, useEffect } from 'react';
import { getRecentSales, restoreSale, getSaleDates } from '../../../Database/apis';
import { FiClock, FiTrendingUp, FiChevronUp, FiRotateCcw } from 'react-icons/fi';
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

export default function RecentSoldItems({ refreshKey, onSaleRestored }) {
  const [expanded, setExpanded] = useState(false);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoringId, setRestoringId] = useState(null);
  const [filterType, setFilterType] = useState('latest'); // 'latest' | 'date' | 'range'
  const [date, setDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState(30);
  const [saleDates, setSaleDates] = useState([]);

  useEffect(() => {
    if (expanded) {
      fetchSales();
    }
  }, [expanded, refreshKey]); // refetches when expanded OR refreshKey changes

  useEffect(() => {
    if (expanded) fetchSaleDates();
  }, [expanded]);

  const fetchSaleDates = async () => {
    try {
      const dates = await getSaleDates();
      // latest first
      setSaleDates(dates.reverse());
    } catch (err) {
      console.error('Failed to fetch sale dates:', err);
    }
  };

  const formatDisplay = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    const dd = String(d.getDate()).padStart(2, '0');
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const fetchSales = async () => {
    setLoading(true);
    try {
      const filters = {};
      if (filterType === 'date' && date) filters.date = date;
      if (filterType === 'range') {
        if (startDate) filters.startDate = startDate;
        if (endDate) filters.endDate = endDate;
      }
      const data = await getRecentSales(limit, filters);
      setSales(data);
    } catch (err) {
      console.error('Failed to fetch recent sales:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (saleId) => {
    setRestoringId(saleId);
    try {
      await restoreSale(saleId);
      setSales(prev => prev.filter(s => s.id !== saleId));
      if (onSaleRestored) onSaleRestored();
    } catch (err) {
      console.error('Failed to restore sale:', err);
    } finally {
      setRestoringId(null);
    }
  };

  return (
    <div className={`rsi-container ${expanded ? 'expanded' : ''}`}>
      <div className="rsi-trigger" onClick={() => setExpanded(!expanded)}>
        <div className="rsi-trigger-left">
          <FiClock size={15} className="rsi-clock-icon" />
          <span>Recent Sales</span>
        </div>
        <FiChevronUp size={16} className={`rsi-chevron ${expanded ? 'up' : 'down'}`} />
      </div>

      {expanded && (
        <div className="rsi-panel">
            <div className="rsi-filters">
              <div className="rsi-filter-row">
                <label>
                  <input type="radio" name="rsi-filter" value="latest" checked={filterType==='latest'} onChange={()=>setFilterType('latest')} /> Latest
                </label>
                <label>
                  <input type="radio" name="rsi-filter" value="date" checked={filterType==='date'} onChange={()=>setFilterType('date')} /> By Date
                </label>
                <label>
                  <input type="radio" name="rsi-filter" value="range" checked={filterType==='range'} onChange={()=>setFilterType('range')} /> Date Range
                </label>
              </div>

              {filterType === 'date' && (
                <div className="rsi-filter-row">
                  <select value={date} onChange={e=>setDate(e.target.value)}>
                    <option value="">Select date</option>
                    {saleDates.map(d => (
                      <option key={d} value={d}>{formatDisplay(d)}</option>
                    ))}
                  </select>
                </div>
              )}

              {filterType === 'range' && (
                <div className="rsi-filter-row">
                  <select value={startDate} onChange={e=>setStartDate(e.target.value)}>
                    <option value="">Start</option>
                    {saleDates.map(d => (
                      <option key={d} value={d}>{formatDisplay(d)}</option>
                    ))}
                  </select>
                  <span className="rsi-range-sep">to</span>
                  <select value={endDate} onChange={e=>setEndDate(e.target.value)}>
                    <option value="">End</option>
                    {saleDates.map(d => (
                      <option key={d} value={d}>{formatDisplay(d)}</option>
                    ))}
                  </select>
                </div>
              )}

              <div className="rsi-filter-row">
                <label>Limit:</label>
                <select value={limit} onChange={e=>setLimit(Number(e.target.value))}>
                  <option value={10}>10</option>
                  <option value={30}>30</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                </select>
                <button onClick={fetchSales} className="rsi-apply-btn">Apply</button>
                <button onClick={() => { setFilterType('latest'); setDate(''); setStartDate(''); setEndDate(''); setLimit(30); fetchSales(); }} className="rsi-clear-btn">Clear</button>
              </div>
            </div>
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
                    <span className="rsi-name">{capitalizeWords(sale.productName)}</span>
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
                  <span className="rsi-time">{getTimeLabel(sale.timestamp)}</span>
                  <button
                    className="rsi-restore-btn"
                    onClick={() => handleRestore(sale.id)}
                    disabled={restoringId === sale.id}
                    title="Restore sale"
                  >
                    <FiRotateCcw size={12} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}