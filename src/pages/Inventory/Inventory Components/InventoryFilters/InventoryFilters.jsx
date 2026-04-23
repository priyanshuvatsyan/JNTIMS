import './InventoryFilters.css';
import React, { useState, useEffect } from 'react';
import {
  getCompanies,
  getStockArrivalDate_basedOnCompany,
} from '../../../../Database/apis';

export default function InventoryFilters({
  selectedCompany,
  selectedStockDate,
  stockStatus,
  onCompanyChange,
  onStockDateChange,
  onStockStatusChange,
}) {
  const [companies, setCompanies] = useState([]);
  const [stockDates, setStockDates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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
    </div>
  );
}

