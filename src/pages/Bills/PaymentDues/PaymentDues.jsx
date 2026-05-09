import React from 'react';
import './PaymentDues.css';

export default function PaymentDues({ balances = [], loading = true, onSelectCompany }) {
  if (loading) return <div className="pd-container"><p className="pd-loading">Loading...</p></div>;

  return (
    <div className="pd-container">
      <p className="pd-title">OUTSTANDING BALANCES</p>
      <div className="pd-list">
        {balances.length === 0 ? (
          <p className="pd-empty">No outstanding balances</p>
        ) : (
          balances.map((item) => (
            <div
              key={item.companyId}
              className="pd-card"
              onClick={() => onSelectCompany(item)}
              style={{ cursor: 'pointer' }}
            >
              <span className="pd-company">
                {item.companyName.length > 7
                  ? item.companyName.slice(0, 7) + '…'
                  : item.companyName}
              </span>
              <span className="pd-amount">
                ₹{item.totalDue.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}