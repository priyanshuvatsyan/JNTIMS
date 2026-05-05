import React from 'react'
import './BillsHeader.css'

export default function BillsHeader({
  totalPayable = 0,
  totalPaid = 0,
  pendingItems = 0,
  companiesCount = 0,
}) {
  const pending = totalPayable - totalPaid;

  return (
    <div className="bh-container">
      <h1 className="bh-title">Bills & Payments</h1>

      <div className="bh-grid">
        {/* Total Payable — large left card */}
        <div className="bh-card bh-card-payable">
          <span className="bh-card-label">Total Payable</span>
          <span className="bh-card-value">
            ₹{totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <span className="bh-card-sub">{companiesCount} companies</span>
        </div>

        {/* Right column */}
        <div className="bh-right-col">
          <div className="bh-card bh-card-paid">
            <span className="bh-card-label">Total Paid</span>
            <span className="bh-card-value">
              ₹{totalPaid.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
          </div>

          <div className="bh-card bh-card-pending">
            <span className="bh-card-label">Pending</span>
            <span className="bh-card-value bh-pending-value">
              {pendingItems} items
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}