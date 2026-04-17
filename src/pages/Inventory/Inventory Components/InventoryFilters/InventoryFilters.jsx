import './InventoryFilters.css';
import React, { useState, useEffect } from 'react';
import { getCompanies } from '../../../../Database/apis';

export default function InventoryFilters() {

    const [companies, setCompanies] = useState([]);
    const [selectedCompany, setSelectedCompany] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

        useEffect(() => {
            fetchCompanies();
        }, []);
    
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

  return (
    <div className="InventoryFilters-container">
<div className="elementary">
  {loading ? (
    <p>Loading companies...</p>
  ) : error ? (
    <p>{error}</p>
  ) : (
    <select
      value={selectedCompany}
      onChange={(e) => setSelectedCompany(e.target.value)}
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
        <div className="secondary">

        </div>
    </div>
  );
}

