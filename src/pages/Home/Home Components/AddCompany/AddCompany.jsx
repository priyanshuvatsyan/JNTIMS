import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import './AddCompany.css';
import { addCompany } from '../../../../Database/apis';

export default function AddCompany() {

  
  const [open, setOpen] = useState(false);
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
      setOpen(false);
      setMessage('Company added successfully');
    } catch (error) {
      console.error('Failed to add company:', error);
      setMessage('Failed to add company. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="addcompany-container">
        <div className="btn" onClick={() => setOpen(true)}>
          <FiPlus size={24} />
        </div>
      </div>

      {open && <div className="overlay" onClick={() => setOpen(false)}></div>}

      <div className={`bottom-sheet ${open ? 'open' : ''}`}>
        <div className="drag-bar"></div>
        <h2>Add Company</h2>

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
            {loading ? 'Adding...' : 'Add Company'}
          </button>
        </form>
      </div>
    </>
  );
}