import './QuickSalesHeader.css';

export default function QuickSalesHeader({ todaysSales = 0, unitsSold = 0, transactions = 0 }) {
  return (
    <div className="qsh-container">
      <h1 className="qsh-title">Quick Sell</h1>
      <div className="qsh-stats">
        <div className="qsh-stat-box">
          <span className="qsh-label">Today's Sales</span>
          <span className="qsh-value">₹{todaysSales.toLocaleString('en-IN')}</span>
        </div>
        <div className="qsh-stat-box">
          <span className="qsh-label">Units Sold</span>
          <span className="qsh-value">{unitsSold}</span>
        </div>
        <div className="qsh-stat-box">
          <span className="qsh-label">Transactions</span>
          <span className="qsh-value">{transactions}</span>
        </div>
      </div>
    </div>
  );
}