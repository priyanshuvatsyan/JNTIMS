import './InventoryFilters.css';
import React, { useState, useEffect } from 'react';
import { FiPackage } from 'react-icons/fi';
import {
  getCompanies,
  getStockArrivalDate_basedOnCompany,
  getAllStockArrivalDates,
} from '../../../../Database/apis';

export default function InventoryFilters({
  selectedCompany,
  selectedStockDate,
  stockStatus,
  onCompanyChange,
  onStockDateChange,
  onStockStatusChange,
  onDatesModalChange,
}) {
  const [companies, setCompanies] = useState([]);
  const [stockDates, setStockDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDatesModal, setShowDatesModal] = useState(false);
  const [allArrivalDates, setAllArrivalDates] = useState([]);
  const [modalQuery, setModalQuery] = useState('');

  useEffect(() => {
    fetchCompanies();
  }, []);

  useEffect(() => {
    fetchStockDates(selectedCompany);
  }, [selectedCompany]);

  const fetchCompanies = async () => {
    try {
      setLoading(true);
      const data = await getCompanies();
      setCompanies(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch companies:', err);
      setError('Failed to load companies');
    } finally {
      setLoading(false);
    }
  };

  const fetchStockDates = async (companyId) => {
    try {
      if (companyId) {
        const dates = await getStockArrivalDate_basedOnCompany(companyId);
        setStockDates(dates);
      } else {
        setStockDates([]);
      }
    } catch (error) {
      console.error('Error fetching stock dates:', error);
      setStockDates([]);
    }
  };

  const fetchAllArrivalDates = async () => {
    try {
      setLoading(true);
      const [dates, companies] = await Promise.all([
        getAllStockArrivalDates(),
        getCompanies(),
      ]);
      const companiesMap = {};
      companies.forEach(c => { companiesMap[c.id] = c.name; });

      const enriched = dates.map(d => ({
        ...d,
        companyName: companiesMap[d.companyId] || 'Unknown',
        arrivalDateDisplay: d.arrivalDate instanceof Date ? d.arrivalDate.toLocaleDateString() : new Date(d.arrivalDate).toLocaleDateString(),
      }));
      setAllArrivalDates(enriched);
      setShowDatesModal(true);
    } catch (err) {
      console.error('Failed to fetch all arrival dates:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof onDatesModalChange === 'function') onDatesModalChange(showDatesModal);
  }, [showDatesModal, onDatesModalChange]);

  return (
    <div className="InventoryFilters-container">
      <div className="elementary">
        <div className="company-filter">
          {loading ? (
            <p>Loading companies...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <select
              value={selectedCompany}
              onChange={(e) => onCompanyChange(e.target.value)}
              className="company-dropdown"
            >
              <option value="">All Companies</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.name}
                </option>
              ))}
            </select>
          )}
        </div>

        <div className="date-filter">
          {loading ? (
            <p>Loading companies...</p>
          ) : error ? (
            <p>{error}</p>
          ) : (
            <select
              value={selectedStockDate}
              onChange={(e) => onStockDateChange(e.target.value)}
              className="company-dropdown"
            >
              <option value="">All Stock Arrivals</option>
              {stockDates.map((date) => (
                <option key={date.id} value={date.id}>
                  {date.arrivalDate instanceof Date
                    ? date.arrivalDate.toLocaleDateString()
                    : new Date(date.arrivalDate).toLocaleDateString()}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="secondary">
        <div className="stock-filter">
          <label className="stock-option">
            <input
              type="radio"
              value=""
              checked={stockStatus === ''}
              onChange={(e) => onStockStatusChange(e.target.value)}
            />
            <span>All</span>
          </label>

          <label className="stock-option">
            <input
              type="radio"
              value="in"
              checked={stockStatus === 'in'}
              onChange={(e) => onStockStatusChange(e.target.value)}
            />
            <span>In Stock</span>
          </label>

          <label className="stock-option">
            <input
              type="radio"
              value="out"
              checked={stockStatus === 'out'}
              onChange={(e) => onStockStatusChange(e.target.value)}
            />
            <span>Out of Stock</span>
          </label>

          <label className="stock-option">
            <input
              type="radio"
              value="low"
              checked={stockStatus === 'low'}
              onChange={(e) => onStockStatusChange(e.target.value)}
            />
            <span>Low Stock</span>
          </label>
        </div>
      </div>
      <div className="dates-control">
        <button className="view-dates-btn primary" onClick={fetchAllArrivalDates} aria-label="View all arrival dates">
          <FiPackage className="btn-icon" size={16} />
          <span className="btn-text">View All Arrival Dates</span>
        </button>
      </div>
      {showDatesModal && (
        <div className="arrival-dates-modal" role="dialog" aria-modal="true">
          <div className="arrival-dates-panel">
            <div className="drag-handle" />
            <div className="arrival-dates-header">
              <h3>All Arrival Dates</h3>
              <button className="close-btn" onClick={()=>setShowDatesModal(false)}>×</button>
            </div>
            <div className="arrival-dates-list">
              <div className="arrival-search">
                <input
                  type="search"
                  placeholder="Search company or amount..."
                  value={modalQuery}
                  onChange={e=>setModalQuery(e.target.value)}
                />
                <div className="arrival-count">{allArrivalDates.length} entries</div>
              </div>

              {allArrivalDates.filter(ad => {
                if (!modalQuery) return true;
                const q = modalQuery.toLowerCase();
                return (ad.companyName || '').toLowerCase().includes(q) || String(ad.amount).includes(q) || (ad.arrivalDateDisplay||'').toLowerCase().includes(q);
              }).length === 0 ? (
                <div className="empty">No arrival entries match.</div>
              ) : (
                allArrivalDates.filter(ad => {
                  if (!modalQuery) return true;
                  const q = modalQuery.toLowerCase();
                  return (ad.companyName || '').toLowerCase().includes(q) || String(ad.amount).includes(q) || (ad.arrivalDateDisplay||'').toLowerCase().includes(q);
                }).map(ad => (
                  <button key={ad.id} className="arrival-row" onClick={() => { onStockDateChange(ad.id); setShowDatesModal(false); }}>
                    <div className="arrival-left">
                      <div className="arrival-date">{ad.arrivalDateDisplay}</div>
                      <div className="arrival-company">{ad.companyName}</div>
                    </div>
                    <div className="arrival-right">
                      {ad.isPaid !== undefined && (
                        <div className={`arrival-status ${ad.isPaid ? 'paid' : 'pending'}`}>{ad.isPaid ? 'Received' : 'Pending'}</div>
                      )}
                      <div className="arrival-amount">₹{Number(ad.amount).toLocaleString('en-IN')}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

