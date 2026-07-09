import { useState } from 'react';
import { makePayment, settleCompanyBalance } from '../../../Database/apis';
import { FiX, FiDelete } from 'react-icons/fi';
import { BsCash, BsFileText } from 'react-icons/bs';
import './RecordPayment.css';

const PAYMENT_MODES = [
  { id: 'cheque', label: 'Cheque', icon: <BsFileText size={16} /> },
  { id: 'cash', label: 'Cash', icon: <BsCash size={16} /> },
];

function getTodayStr() {
  return new Date().toISOString().split('T')[0];
}

function formatDisplayDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-IN', { weekday: 'short', day: '2-digit', month: 'long', year: 'numeric' });
}

export default function RecordPayment({ balances = [], selectedCompany, onClose, onSuccess }) {
  const today = getTodayStr();

  const [companyId, setCompanyId] = useState(selectedCompany?.companyId || '');
  const [amountStr, setAmountStr] = useState('0');
  const [dateMode, setDateMode] = useState('today');
  const [customDate, setCustomDate] = useState(today);
  const [paymentMode, setPaymentMode] = useState('cheque');
  const [checkNumber, setCheckNumber] = useState(() => {
  const last = localStorage.getItem('lastChequeNumber');
  if (!last || isNaN(last)) return '';
  return String(Number(last) + 1);
});
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [settling, setSettling] = useState(false);
  const [error, setError] = useState('');
  const [showSettleConfirm, setShowSettleConfirm] = useState(false);
  const [settleTimer, setSettleTimer] = useState(5);
  const [chequeDueDate, setChequeDueDate] = useState('');

  const selectedBalance = balances.find(b => b.companyId === companyId);
  const amount = parseFloat(amountStr) || 0;
  const paymentDate = dateMode === 'today' ? today : customDate;

  const isValid =
    companyId &&
    amount > 0 &&
    paymentDate &&
    (paymentMode !== 'cheque' || checkNumber.trim());

  const handleNumpad = (val) => {
    setAmountStr(prev => {
      if (val === '⌫') return prev.length > 1 ? prev.slice(0, -1) : '0';
      if (val === '.' && prev.includes('.')) return prev;
      if (prev === '0' && val !== '.') return val;
      return prev + val;
    });
  };

  const handleFillDue = () => {
    if (selectedBalance?.totalDue) {
      setAmountStr(String(selectedBalance.totalDue));
    }
  };

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      await makePayment({
        companyId,
        amount,
        paymentDate,
        checkNumber: paymentMode === 'cheque' ? checkNumber : null,
        chequeDueDate: paymentMode === 'cheque' && chequeDueDate ? chequeDueDate : null, 
        note,
        paymentMode,
      });
      if (paymentMode === 'cheque' && checkNumber.trim()) {
  localStorage.setItem('lastChequeNumber', checkNumber.trim()); 
}
      onSuccess();
    } catch (err) {
      setError(err.message || 'Payment failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  const openSettleConfirm = () => {
    if (!companyId) { setError('Select a company first'); return; }
    setShowSettleConfirm(true);
    setSettleTimer(5);
    const interval = setInterval(() => {
      setSettleTimer(prev => {
        if (prev <= 1) { clearInterval(interval); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const handleSettle = async () => {
    setShowSettleConfirm(false);
    setSettling(true);
    setError('');
    try {
      await settleCompanyBalance(companyId);
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to settle. Try again.');
    } finally {
      setSettling(false);
    }

    

    
  };

  return (
    <div className="rp-overlay" onClick={onClose}>
      <div className="rp-sheet" onClick={e => e.stopPropagation()}>
        <div className="rp-drag-bar" />

        <div className="rp-header">
          <span className="rp-title">Record Payment</span>
          <button className="rp-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        <div className="rp-body">

          {/* Company selector */}
          <div className="rp-field">
            <div className="rp-field-top">
              <label className="rp-label">Company / Payable To</label>
            </div>
            <select
              className="rp-select"
              value={companyId}
              onChange={e => { setCompanyId(e.target.value); setAmountStr('0'); }}
            >
              <option value="">Select company...</option>
              {balances.map(b => (
                <option key={b.companyId} value={b.companyId}>
                  {b.companyName} — Due: ₹{b.totalDue.toLocaleString('en-IN')}
                </option>
              ))}
            </select>
          </div>

          {/* Payment date */}
          <div className="rp-field">
            <div className="rp-field-top">
              <label className="rp-label">Payment Date</label>
              <div className="rp-date-toggle">
                <button
                  className={`rp-toggle-btn ${dateMode === 'today' ? 'active' : ''}`}
                  onClick={() => setDateMode('today')}
                >Today</button>
                <button
                  className={`rp-toggle-btn ${dateMode === 'custom' ? 'active' : ''}`}
                  onClick={() => setDateMode('custom')}
                >Custom</button>
              </div>
            </div>
            {dateMode === 'today' ? (
              <div className="rp-date-display">
                <span className="rp-date-text">{formatDisplayDate(today)}</span>
                <span className="rp-date-badge">Today</span>
              </div>
            ) : (
              <input
                type="date"
                className="rp-date-input"
                value={customDate}
                onChange={e => setCustomDate(e.target.value)}
                max={today}
              />
            )}
          </div>

          {/* Amount numpad */}
          <div className="rp-amount-section">
            <span className="rp-amount-label">AMOUNT</span>
            <span className="rp-amount-display">
              ₹{parseFloat(amountStr || 0).toLocaleString('en-IN', { minimumFractionDigits: amountStr.includes('.') ? 2 : 0 })}
            </span>
            {selectedBalance && (
              <div className="rp-due-row">
                <span className="rp-amount-due">
                  Due: ₹{selectedBalance.totalDue.toLocaleString('en-IN')}
                </span>
                <button className="rp-fill-btn" onClick={handleFillDue}>
                  Fill Due
                </button>
              </div>
            )}
          </div>

          <div className="rp-numpad">
            {['7', '8', '9', '4', '5', '6', '1', '2', '3', '.', '0', '⌫'].map(key => (
              <button
                key={key}
                className={`rp-key ${key === '⌫' ? 'rp-key-del' : ''}`}
                onClick={() => handleNumpad(key)}
              >
                {key === '⌫' ? <FiDelete size={18} /> : key}
              </button>
            ))}
          </div>

          {/* Payment method */}
          <div className="rp-field">
            <label className="rp-label">Payment Method</label>
            <div className="rp-methods">
              {PAYMENT_MODES.map(m => (
                <button
                  key={m.id}
                  className={`rp-method-btn ${paymentMode === m.id ? 'active' : ''}`}
                  onClick={() => setPaymentMode(m.id)}
                >
                  {m.icon}
                  <span>{m.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Cheque number */}
          {paymentMode === 'cheque' && (
            <div className="rp-field">
              <label className="rp-label">Cheque Number <span className="rp-required">*</span></label>
              <input
                type="text"
                className="rp-input"
                placeholder="e.g. 004521"
                value={checkNumber}
                onChange={e => setCheckNumber(e.target.value)}
              />
            </div>
          )}
          
          {paymentMode === 'cheque' && (
            <div className="rp-field">
              <label className="rp-label">Cheque Due Date <span className="rp-optional">(optional)</span></label>
              <input
                type="date"
                className="rp-date-input"
                value={chequeDueDate}
                onChange={e => setChequeDueDate(e.target.value)}
                min={today}
              />
            </div>
          )}

          {/* Note */}
          <div className="rp-field">
            <label className="rp-label">Note <span className="rp-optional">(optional)</span></label>
            <input
              type="text"
              className="rp-input"
              placeholder="Invoice ref, remarks..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {/* Settle button */}
          <button
            className="rp-settle-btn"
            onClick={openSettleConfirm}
            disabled={!companyId || settling}
          >
            {settling ? 'Settling...' : '✓ Mark as Settled'}
          </button>

          {error && <p className="rp-error">{error}</p>}
        </div>

        {/* Settle confirm modal — outside rp-body */}
        {showSettleConfirm && (
          <div className="rp-confirm-overlay" onClick={() => setShowSettleConfirm(false)}>
            <div className="rp-confirm-box" onClick={e => e.stopPropagation()}>
              <h3 className="rp-confirm-title">Mark as Settled?</h3>
              <p className="rp-confirm-msg">
                This will mark all pending dues for <b>{selectedBalance?.companyName}</b> as paid.
                This action cannot be undone.
              </p>
              <div className="rp-confirm-actions">
                <button className="rp-confirm-cancel" onClick={() => setShowSettleConfirm(false)}>
                  Cancel
                </button>
                <button
                  className="rp-confirm-ok"
                  disabled={settleTimer > 0}
                  onClick={handleSettle}
                >
                  {settleTimer > 0 ? `Confirm (${settleTimer}s)` : 'Confirm'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="rp-footer">
          <button
            className={`rp-submit ${!isValid ? 'disabled' : ''}`}
            disabled={!isValid || loading}
            onClick={handleSubmit}
          >
            {loading ? 'Processing...' : `Record Payment · ₹${amount.toLocaleString('en-IN')}`}
          </button>
        </div>

      </div>
    </div>
  );
}