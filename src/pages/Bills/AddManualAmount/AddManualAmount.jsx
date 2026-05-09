import { useState, useEffect } from 'react';
import { getCompanies, addManualDue } from '../../../Database/apis';
import { FiX } from 'react-icons/fi';
import './AddManualAmount.css';

export default function AddManualAmount({ onClose, onSuccess }) {
  const [companies, setCompanies] = useState([]);
  const [companyId, setCompanyId] = useState('');
  const [amount, setAmount]       = useState('');
  const [note, setNote]           = useState('');
  const [loading, setLoading]     = useState(false);
  const [error, setError]         = useState('');

  useEffect(() => {
    getCompanies()
      .then(setCompanies)
      .catch(() => setError('Failed to load companies'));
  }, []);

  const isValid = companyId && Number(amount) > 0;

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      await addManualDue({
        companyId,
        amount: Number(amount),
        note,
      });
      onSuccess();
    } catch (err) {
      setError(err.message || 'Failed to add due. Try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ama-overlay" onClick={onClose}>
      <div className="ama-sheet" onClick={e => e.stopPropagation()}>
        <div className="ama-drag-bar" />

        <div className="ama-header">
          <span className="ama-title">Add Manual Due</span>
          <button className="ama-close" onClick={onClose}><FiX size={18} /></button>
        </div>

        <div className="ama-body">

          {/* Company */}
          <div className="ama-field">
            <label className="ama-label">Company <span className="ama-req">*</span></label>
            <select
              className="ama-select"
              value={companyId}
              onChange={e => setCompanyId(e.target.value)}
            >
              <option value="">Select company...</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          {/* Amount */}
          <div className="ama-field">
            <label className="ama-label">Amount <span className="ama-req">*</span></label>
            <div className="ama-amount-wrapper">
              <span className="ama-currency">₹</span>
              <input
                type="number"
                className="ama-input ama-input-amount"
                placeholder="0.00"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Note */}
          <div className="ama-field">
            <label className="ama-label">Note <span className="ama-opt">(optional)</span></label>
            <input
              type="text"
              className="ama-input"
              placeholder="Any remarks..."
              value={note}
              onChange={e => setNote(e.target.value)}
            />
          </div>

          {error && <p className="ama-error">{error}</p>}
        </div>

        <div className="ama-footer">
          <button
            className={`ama-submit ${!isValid ? 'disabled' : ''}`}
            disabled={!isValid || loading}
            onClick={handleSubmit}
          >
            {loading ? 'Adding...' : 'Add Due'}
          </button>
        </div>
      </div>
    </div>
  );
}