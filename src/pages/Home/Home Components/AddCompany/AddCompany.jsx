import React, { useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import './AddCompany.css';

export default function AddCompany() {

  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Floating Button */}
      <div className="addcompany-container">
        <div className="btn" onClick={() => setOpen(true)}>
          <FiPlus size={24} />
        </div>
      </div>

      {/* Overlay */}
      {open && <div className="overlay" onClick={() => setOpen(false)}></div>}

      {/* Bottom Sheet Form */}
      <div className={`bottom-sheet ${open ? 'open' : ''}`}>
        <div className="drag-bar"></div>
        <h2>Add Company</h2>

        <label>Company Name *</label>
        <input type="text" placeholder="e.g. Tech Distributors Inc" />

        <label>Phone (optional)</label>
        <input type="number" placeholder="+91-7876641135" />

        <button className="submit-btn">Add Company</button>
      </div>
    </>
  );
}