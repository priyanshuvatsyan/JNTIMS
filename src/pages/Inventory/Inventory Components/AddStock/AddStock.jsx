import React, { useState } from 'react';
import { FiPlus, FiPackage, FiCalendar } from 'react-icons/fi';
import { addCompany } from '../../../../Database/apis';

import './AddStock.css';


export default function AddStock() {
  const [showOptions, setShowOptions] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showDateDialog, setShowDateDialog] = useState(false);

  //add stock arrival date
  const [companyName, setCompanyName] = useState('');
  const [stockAmount, setStockAmount] = useState('');
  const [stockDate, setStockDate] = useState('');
  const [companies] = useState([
    'Tech Distributors Inc',
    'Global Supplies',
    'Alpha Traders',
  ]);

  //add stock data
  const [productName, setProductName] = useState('');
  const [boxes, setBoxes] = useState('');
  const [unitsPerBox, setUnitsPerBox] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [boxPriceWithoutGst, setBoxPriceWithoutGst] = useState('');
  const [gstPercentage, setGstPercentage] = useState('');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const resetForm = () => {
    setCompanyName('');
    setStockAmount('');
    setStockDate('');
    setProductName('');
    setBoxes('');
    setUnitsPerBox('');
    setSellingPrice('');
    setBoxPriceWithoutGst('');
    setGstPercentage('');
    setMessage('');
  };

  const totalUnits = boxes && unitsPerBox ? Number(boxes) * Number(unitsPerBox) : 0;
  const boxPrice = Number(boxPriceWithoutGst) || 0;
  const gstRate = Number(gstPercentage) || 0;
  const boxPriceWithGst = boxPrice * (1 + gstRate / 100);
  const perUnitPriceNoGst = Number(unitsPerBox) > 0 ? boxPrice / Number(unitsPerBox) : 0;
  const perUnitPriceWithGst = Number(unitsPerBox) > 0 ? boxPriceWithGst / Number(unitsPerBox) : 0;

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!companyName.trim()) {
      setMessage('Company name is required');
      return;
    }

    if (!productName.trim()) {
      setMessage('Product name is required');
      return;
    }

    if (!boxes || boxes <= 0) {
      setMessage('Number of boxes is required and must be greater than 0');
      return;
    }

    if (!unitsPerBox || unitsPerBox <= 0) {
      setMessage('Units per box is required and must be greater than 0');
      return;
    }

    if (!sellingPrice || sellingPrice <= 0) {
      setMessage('Selling price is required and must be greater than 0');
      return;
    }

    if (!boxPriceWithoutGst || boxPriceWithoutGst <= 0) {
      setMessage('Box price without GST is required and must be greater than 0');
      return;
    }

    if (!gstPercentage || gstPercentage < 0) {
      setMessage('GST percentage is required and must be 0 or greater');
      return;
    }

    if (!stockDate) {
      setMessage('Stock date is required');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      await addCompany({
        name: companyName,
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
          <div className="form-row">
            <div className="form-group">
              <label>Company *</label>
              <select
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={loading}
              >
                <option value="">Select</option>
                {companies.map((company) => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Stock Date *</label>
              <input
                type="date"
                value={stockDate}
                onChange={(e) => setStockDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row full">
            <div className="form-group">
              <label>Product Name *</label>
              <input
                type="text"
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                placeholder="e.g. Laptop"
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Number of Boxes *</label>
              <input
                type="number"
                value={boxes}
                onChange={(e) => setBoxes(e.target.value)}
                placeholder="1"
                disabled={loading}
              />
            </div>
            <div className="form-group">
              <label>Units Per Box *</label>
              <input
                type="number"
                value={unitsPerBox}
                onChange={(e) => setUnitsPerBox(e.target.value)}
                placeholder="1"
                disabled={loading}
              />
            </div>
          </div>


          <div className="form-row">
            <div className="form-group">
              <label>Box Price *</label>
              <input
                type="number"
                value={boxPriceWithoutGst}
                onChange={(e) => setBoxPriceWithoutGst(e.target.value)}
                placeholder="0"
                disabled={loading}
              />
            </div>
            <div className="form-group">

              <label>GST %</label>
              <input
                type="number"
                value={gstPercentage}
                onChange={(e) => setGstPercentage(e.target.value)}
                placeholder="18%"
                disabled={loading}
              />
            </div>
          </div>


          <div className="total-units-box">
            <div className="total-unit-item">
              <span>Total Units</span>
              <strong>{totalUnits}</strong>
            </div>
            <div className="total-unit-item">
              <span>Box + GST</span>
              <strong>₹{boxPriceWithGst.toFixed(2)}</strong>
            </div>
            <div className="total-unit-item">
              <span>Unit (No GST)</span>
              <strong>₹{perUnitPriceNoGst.toFixed(2)}</strong>
            </div>
            <div className="total-unit-item">
              <span>Unit (GST)</span>
              <strong>₹{perUnitPriceWithGst.toFixed(2)}</strong>
            </div>
          </div>

          <div className="form-row full">
            <div className="form-group">
              <label>Sell Price ($) *</label>
              <input
                type="number"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="0"
                disabled={loading}
              />
            </div>
          </div>

          {message && <p className="form-message error">{message}</p>}

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? 'Adding Stock...' : 'Add Stock'}
          </button>
        </form>
      </div>

      <div className={`bottom-sheet ${showDateDialog ? 'open' : ''}`}>
        <div className="drag-bar"></div>
        <h2>Add Date</h2>

        <form>

          <label>Company *</label>
              <select
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                disabled={loading}
              >
                <option value="">Select</option>
                {companies.map((company) => (
                  <option key={company} value={company}>{company}</option>
                ))}
              </select>

          <label>Select Date</label>
          <input type="date"
            value={stockDate}
            onChange={(e) => setStockDate(e.target.value)}
            disabled={loading}
          />

          <label>Stock Amount</label>
          <input
            type="number"
            value={stockAmount}
            onChange={(e) => setStockAmount(e.target.value)}
            placeholder="Enter stock amount"
            disabled={loading}
          />
          <button className="submit-btn" type="submit">
            Add Date
          </button>
        </form>
      </div>
    </>
  );
}
 
