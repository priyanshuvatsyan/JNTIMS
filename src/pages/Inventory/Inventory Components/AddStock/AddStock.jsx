import React, { useState, useEffect } from 'react';
import { FiPlus, FiPackage, FiCalendar } from 'react-icons/fi';
import { 
  getCompanies, 
  addStockArrivalDate, 
  getStockArrivalDate_basedOnCompany,
  addStock,
  updateStock
} from '../../../../Database/apis';

import './AddStock.css';


export default function AddStock({ editStock = null, onEditClose }) {
  const [showOptions, setShowOptions] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [showDateDialog, setShowDateDialog] = useState(false);

  // Companies & Stock Arrival Dates from Firebase
  const [companies, setCompanies] = useState([]);
  const [stockDates, setStockDates] = useState([]);
  const [companiesLoading, setCompaniesLoading] = useState(false);

  // Add stock arrival date dialog state
  const [dateCompanyName, setDateCompanyName] = useState('');
  const [arrivalDate, setArrivalDate] = useState('');
  const [dateAmount, setDateAmount] = useState('');

  // Add stock dialog state
  const [companyName, setCompanyName] = useState('');
  const [stockDateId, setStockDateId] = useState('');
  const [productName, setProductName] = useState('');
  const [boxes, setBoxes] = useState('');
  const [unitsPerBox, setUnitsPerBox] = useState('');
  const [sellingPrice, setSellingPrice] = useState('');
  const [boxPriceInput, setBoxPriceInput] = useState(''); // raw input from user
  const [priceMode, setPriceMode] = useState('without');  // 'without' | 'with'
  const GST_PERCENTAGE = 5;

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  // Fetch companies on mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  // Pre-fill form when editStock is set
  useEffect(() => {
    if (editStock) {
      setCompanyName(editStock.companyId || '');
      setStockDateId(editStock.entryId || '');
      setProductName(editStock.productName || '');
      setBoxes(editStock.boxes || '');
      setUnitsPerBox(editStock.unitsPerBox || '');
      setSellingPrice(editStock.sellingPrice || '');
      setBoxPriceInput(editStock.boxPriceWithoutGst || '');
      setPriceMode('without');
      if (editStock.companyId) {
        fetchStockDates(editStock.companyId);
      }
      setShowStockDialog(true);
    }
  }, [editStock]);

  const fetchCompanies = async () => {
    try {
      setCompaniesLoading(true);
      const companiesList = await getCompanies();
      setCompanies(companiesList);

      if (!editStock) {
        const lastCompanyId = localStorage.getItem('lastCompanyId');
        const lastStockDateId = localStorage.getItem('lastStockDateId');
        if (lastCompanyId) {
          setCompanyName(lastCompanyId);
          fetchStockDates(lastCompanyId);
        }
        if (lastStockDateId) {
          setStockDateId(lastStockDateId);
        }
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
      setMessage('Failed to load companies');
    } finally {
      setCompaniesLoading(false);
    }
  };

  const fetchStockDates = async (companyId) => {
    try {
      if (companyId) {
        const dates = await getStockArrivalDate_basedOnCompany(companyId);
        setStockDates(dates);
      } else {
        setStockDates([]);
      }
    } catch (error) {
      console.error('Error fetching stock dates:', error);
      setMessage('Failed to load stock dates');
      setStockDates([]);
    }
  };

  const handleCompanySelect = (e) => {
    const selectedId = e.target.value;
    setCompanyName(selectedId);
    setStockDateId('');
    localStorage.setItem('lastCompanyId', selectedId);
    const selectedCompany = companies.find(c => c.id === selectedId);
    if (selectedCompany) fetchStockDates(selectedCompany.id);
  };

  const resetStockForm = () => {
    const lastCompanyId = localStorage.getItem('lastCompanyId');
    const lastStockDateId = localStorage.getItem('lastStockDateId');

    setCompanyName(lastCompanyId || '');
    setStockDateId(lastStockDateId || '');
    if (lastCompanyId) fetchStockDates(lastCompanyId);

    setProductName('');
    setBoxes('');
    setUnitsPerBox('');
    setSellingPrice('');
    setBoxPriceInput('');
    setPriceMode('without');
    setMessage('');
  };

  const resetDateForm = () => {
    setDateCompanyName('');
    setArrivalDate('');
    setDateAmount('');
    setMessage('');
  };

  // UI Calculations (display only)
  const totalUnits = boxes && unitsPerBox ? Number(boxes) * Number(unitsPerBox) : 0;

  // Derive boxPriceWithoutGst based on mode
  const boxPriceWithoutGst = priceMode === 'with'
    ? Number(boxPriceInput) / (1 + GST_PERCENTAGE / 100)
    : Number(boxPriceInput);

  const boxPrice = boxPriceWithoutGst || 0;
  const boxPriceWithGst = boxPrice * (1 + GST_PERCENTAGE / 100);
  const perUnitPriceNoGst = Number(unitsPerBox) > 0 ? boxPrice / Number(unitsPerBox) : 0;
  const perUnitPriceWithGst = Number(unitsPerBox) > 0 ? boxPriceWithGst / Number(unitsPerBox) : 0;

  // Handle Adding Stock Arrival Date
  const handleAddDate = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!dateCompanyName.trim()) { setMessage('Company is required'); return; }
    if (!arrivalDate) { setMessage('Arrival date is required'); return; }
    if (!dateAmount || dateAmount <= 0) { setMessage('Amount must be greater than 0'); return; }

    setLoading(true);
    try {
      const selectedCompany = companies.find(c => c.id === dateCompanyName);
      if (!selectedCompany) throw new Error('Company not found');

      await addStockArrivalDate({
        companyId: selectedCompany.id,
        amount: Number(dateAmount),
        arrivalDate: arrivalDate
      });

      setMessage('Stock arrival date added successfully!');
      resetDateForm();
      await fetchStockDates(selectedCompany.id);

      setTimeout(() => {
        setShowDateDialog(false);
        setMessage('');
      }, 2000);
    } catch (error) {
      console.error('Failed to add stock arrival date:', error);
      setMessage(error.message || 'Failed to add stock arrival date. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Adding / Updating Stock
  const handleAddStock = async (event) => {
    event.preventDefault();
    setMessage('');

    if (!companyName.trim()) { setMessage('Company is required'); return; }
    if (!stockDateId.trim()) { setMessage('Stock arrival date is required'); return; }
    if (!productName.trim()) { setMessage('Product name is required'); return; }
    if (!boxes || boxes <= 0) { setMessage('Number of boxes must be greater than 0'); return; }
    if (!unitsPerBox || unitsPerBox <= 0) { setMessage('Units per box must be greater than 0'); return; }
    if (!boxPriceInput || boxPriceWithoutGst <= 0) { setMessage('Box price must be greater than 0'); return; }
    if (!sellingPrice || sellingPrice <= 0) { setMessage('Selling price must be greater than 0'); return; }

    setLoading(true);
    try {
      const payload = {
        companyId: companyName,
        entryId: stockDateId,
        productName: productName.trim().toLowerCase(),
        boxes: Number(boxes),
        unitsPerBox: Number(unitsPerBox),
        boxPriceWithoutGst: boxPriceWithoutGst, // always derived correctly
        boxPriceWithGst,
        unitPriceWithoutGst: perUnitPriceNoGst,
        unitPriceWithGst: perUnitPriceWithGst,
        sellingPrice: Number(sellingPrice),
        gst: GST_PERCENTAGE,
      };

      if (editStock) {
        await updateStock(editStock.id, payload);
        setMessage('Stock updated successfully!');
      } else {
        await addStock(payload);
        setMessage('Stock added successfully!');
      }

      resetStockForm();
      setTimeout(() => {
        setShowStockDialog(false);
        setMessage('');
        if (onEditClose) onEditClose();
      }, 2000);
    } catch (error) {
      console.error('Failed to save stock:', error);
      setMessage(error.message || 'Failed to save stock. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const closeAll = () => {
    setShowOptions(false);
    setShowStockDialog(false);
    setShowDateDialog(false);
    resetStockForm();
    resetDateForm();
    if (onEditClose) onEditClose();
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

      {/* ── Add / Edit Stock Sheet ── */}
      <div className={`bottom-sheet ${showStockDialog ? 'open' : ''}`}>
        <div className="drag-bar"></div>
        <h2>{editStock ? 'Edit Stock' : 'Add Stock'}</h2>

        <form onSubmit={handleAddStock}>
          <div className="form-row">
            <div className="form-group">
              <label>Company *</label>
              <select
                value={companyName}
                onChange={handleCompanySelect}
                disabled={loading || companiesLoading}
              >
                <option value="">
                  {companiesLoading ? 'Loading companies...' : companies.length === 0 ? 'No companies available' : 'Select Company'}
                </option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Stock Date *</label>
              <div className="stock-date-wrapper">
                <select
                  value={stockDateId}
                  onChange={(e) => {
                    setStockDateId(e.target.value);
                    localStorage.setItem('lastStockDateId', e.target.value);
                  }}
                  disabled={loading || !companyName}
                >
                  <option value="">
                    {!companyName
                      ? 'Select Company First'
                      : stockDates.length === 0
                      ? 'No Dates - Add using Calendar'
                      : 'Select Date'}
                  </option>
                  {stockDates.map((date) => (
                    <option key={date.id} value={date.id}>
                      {date.arrivalDate instanceof Date
                        ? date.arrivalDate.toLocaleDateString()
                        : new Date(date.arrivalDate).toLocaleDateString()}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="add-date-icon-btn"
                  onClick={() => {
                    setShowStockDialog(false);
                    setShowDateDialog(true);
                  }}
                  title="Add new dates"
                  disabled={!companyName}
                >
                  <FiCalendar size={18} />
                </button>
              </div>
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

          {/* Price mode toggle */}
          <div className="price-mode-toggle">
            <button
              type="button"
              className={`price-mode-btn ${priceMode === 'without' ? 'active' : ''}`}
              onClick={() => { setPriceMode('without'); setBoxPriceInput(''); }}
            >
              Price without GST
            </button>
            <button
              type="button"
              className={`price-mode-btn ${priceMode === 'with' ? 'active' : ''}`}
              onClick={() => { setPriceMode('with'); setBoxPriceInput(''); }}
            >
              Price + GST
            </button>
          </div>

          <div className="form-row">
  <div className="form-group">
    <label>
      {priceMode === 'without' ? 'Box Price (without GST) *' : 'Box Price (with GST) *'}
    </label>
    <input
      type="number"
      value={boxPriceInput}
      onChange={(e) => setBoxPriceInput(e.target.value)}
      placeholder="0"
      disabled={loading}
    />
  </div>

  {/* Only show GST field when price+GST mode is selected */}
  {priceMode === 'with' && (
    <div className="form-group">
      <label>GST %</label>
      <input type="text" value={`${GST_PERCENTAGE}%`} disabled />
    </div>
  )}
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
              <label>Selling Price (₹) *</label>
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
            {loading
              ? (editStock ? 'Updating...' : 'Adding Stock...')
              : (editStock ? 'Update Stock' : 'Add Stock')}
          </button>
        </form>
      </div>

      {/* ── Add Stock Arrival Date Sheet ── */}
      <div className={`bottom-sheet ${showDateDialog ? 'open' : ''}`}>
        <div className="drag-bar"></div>
        <h2>Add Stock Arrival Date</h2>

        <form onSubmit={handleAddDate}>
          <div className="form-row full">
            <div className="form-group">
              <label>Company *</label>
              <select
                value={dateCompanyName}
                onChange={(e) => setDateCompanyName(e.target.value)}
                disabled={loading || companiesLoading}
              >
                <option value="">Select Company</option>
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>{company.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row full">
            <div className="form-group">
              <label>Arrival Date *</label>
              <input
                type="date"
                value={arrivalDate}
                onChange={(e) => setArrivalDate(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          <div className="form-row full">
            <div className="form-group">
              <label>Amount *</label>
              <input
                type="number"
                value={dateAmount}
                onChange={(e) => setDateAmount(e.target.value)}
                placeholder="Enter amount"
                disabled={loading}
              />
            </div>
          </div>

          {message && <p className="form-message error">{message}</p>}

          <button className="submit-btn" type="submit" disabled={loading}>
            {loading ? 'Adding Date...' : 'Add Date'}
          </button>
        </form>
      </div>
    </>
  );
}