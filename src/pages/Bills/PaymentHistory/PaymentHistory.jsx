import { useState, useEffect } from 'react';
import { BsCash, BsBank, BsPhone, BsFileText } from 'react-icons/bs';
import { getPaymentHistory, deletePaymentRecord } from '../../../Database/apis';
import { FiCheckCircle, FiTrash2 } from 'react-icons/fi';
import './PaymentHistory.css';

const capitalizeWords = (str = '') =>
  str.replace(/\b\w/g, c => c.toUpperCase());

function getTimeLabel(timestamp) {
  if (!timestamp) return '';
  const date = timestamp?.toDate ? timestamp.toDate() : new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

const MODE_ICONS = {
  cash: { icon: <BsCash size={16} />, color: '#27ae60', bg: '#e8faf2' },
  bank: { icon: <BsBank size={16} />, color: '#4c6ef5', bg: '#eef1ff' },
  upi: { icon: <BsPhone size={16} />, color: '#9c27b0', bg: '#f3e5f5' },
  cheque: { icon: <BsFileText size={16} />, color: '#4c6ef5', bg: '#eef1ff' },
};

export default function PaymentHistory({ refreshKey }) {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  const [deletingId, setDeletingId] = useState(null);

  const handleDelete = async (paymentId) => {
    setDeletingId(paymentId);
    try {
      await deletePaymentRecord(paymentId);
      setPayments(prev => prev.filter(p => p.id !== paymentId));
    } catch (err) {
      console.error('Failed to delete payment:', err);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    setLoading(true);
    getPaymentHistory()
      .then(setPayments)
      .catch(err => console.error('Failed to fetch payment history:', err))
      .finally(() => setLoading(false));
  }, [refreshKey]); 

  return (
    <div className="ph-container">
      <p className="ph-title">Payment History</p>

      {loading ? (
        <div className="ph-state">Loading...</div>
      ) : payments.length === 0 ? (
        <div className="ph-state">No payments recorded yet</div>
      ) : (
        <div className="ph-list">
          {payments.map((p) => {
            const mode = MODE_ICONS[p.paymentMode] || MODE_ICONS.cash;
            return (
              <div key={p.id} className="ph-row">

                {/* Icon */}
                <div className="ph-icon" style={{ background: mode.bg, color: mode.color }}>
                  {mode.icon}
                </div>

                {/* Info */}
                <div className="ph-info">
                  <span className="ph-name">{capitalizeWords(p.companyName)}</span>
                  <div className="ph-meta">
                    <span className="ph-tag" style={{ color: mode.color, background: mode.bg }}>
                      {p.paymentMode?.charAt(0).toUpperCase() + p.paymentMode?.slice(1)}
                    </span>
                    <span className="ph-date">{getTimeLabel(p.createdAt)}</span>
                    {p.checkNumber && (
                      <span className="ph-check">#{p.checkNumber}</span>
                    )}
                  </div>
                  {p.chequeDueDate && (
                    <span className="ph-cheque-due">
                      Due {new Date(p.chequeDueDate?.toDate?.() || p.chequeDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                    </span>
                  )}
                  {p.note && (
                    <span className="ph-note">"{p.note}"</span>
                  )}
                </div>

                {/* Amount + status */}
                <div className="ph-right">
                  <span className="ph-amount">
                    ₹{Number(p.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                  </span>
                  {/* <span className="ph-status paid">
    <FiCheckCircle size={11} /> Paid
  </span> */}
                  <button
                    className="ph-delete-btn"
                    onClick={() => handleDelete(p.id)}
                    disabled={deletingId === p.id}
                  >
                    <FiTrash2 size={12} />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}