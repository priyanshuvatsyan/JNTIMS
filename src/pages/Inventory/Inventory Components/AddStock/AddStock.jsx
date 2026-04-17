import React, { useState } from 'react';
import { FiPlus, FiPackage, FiCalendar } from 'react-icons/fi';
import { addCompany } from '../../../../Database/apis';

import './AddStock.css';


export default function AddStock() {
  const [showOptions, setShowOptions] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showDateDialog, setShowDateDialog] = useState(false);
  const [companyName, setCompanyName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const resetForm = () => {
    setCompanyName('');
    setPhone('');
    setMessage('');
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!companyName.trim()) {
      setMessage('Company name is required');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await addCompany({
        name: companyName,
        phone,
      });

      resetForm();
      setShowStockDialog(false);
      setMessage('Company added successfully');
    } catch (error) {
      console.error('Failed to add company:', error);
      setMessage('Failed to add company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeAll = () => {
    setShowOptions(false);
    setShowStockDialog(false);
    setShowDateDialog(false);
    resetForm();
  };

  return (
    <>
      <div className="addcompany-container">
        <div className={`btn ${showOptions ? 'open' : ''}`} onClick={() => setShowOptions(!showOptions)}>
          <FiPlus size={24} />
        </div>
      </div>

      <div className={`options-menu ${showOptions ? 'open' : ''}`}>
        <button className="option-btn" onClick={() => { setShowOptions(false); setShowDateDialog(true); }}>
          <FiCalendar size={17} />
        </button>
        <button className="option-btn" onClick={() => { setShowOptions(false); setShowStockDialog(true); }}>
          <FiPackage size={17} />
        </button>
      </div>

      {(showStockDialog || showDateDialog) && <div className="overlay" onClick={closeAll}></div>}

      <div className={`bottom-sheet ${showStockDialog ? 'open' : ''}`}>
        <div className="drag-bar"></div>
        <h2>Add Stock</h2>

        <form onSubmit={handleSubmit}>
          <label>Company Name *</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Tech Distributors Inc"
            disabled={loading}
          />

          <label>Phone (optional)</label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+91-7876641135"
            disabled={loading}
          />

          {message && <p className="form-message">{message}</p>}

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Stock'}
          </button>
        </form>
      </div>

      <div className={`bottom-sheet ${showDateDialog ? 'open' : ''}`}>
        <div className="drag-bar"></div>
        <h2>Add Date</h2>

        <form>
          <label>Select Date</label>
          <input type="date" />

          <button className="submit-btn" type="submit">
            Add Date
          </button>
        </form>
      </div>
    </>
  );
}

