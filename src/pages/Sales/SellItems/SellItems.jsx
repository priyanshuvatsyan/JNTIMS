import { useState, useEffect, useRef } from 'react';
import { searchStock, makeSale } from '../../../Database/apis';
import { FiSearch, FiShoppingCart, FiX, FiMinus, FiPlus } from 'react-icons/fi';
import './SellItems.css';

function getStockStatus(stock) {
  if (stock.remainingQty === 0) return 'out';
  const threshold = (stock.totalUnits || 0) * 0.2;
  if (stock.remainingQty <= threshold) return 'low';
  return 'in';
}

const capitalizeWords = (str) =>
  str.replace(/\b\w/g, (char) => char.toUpperCase());

const QUICK_QTYS = [1, 5, 10, 25];

export default function SellItems({ onSaleComplete, preselectStock, refreshKey }) {
  const [searchTerm, setSearchTerm]       = useState('');
  const [items, setItems]                 = useState([]);
  const [loading, setLoading]             = useState(true);
  const [selectedItem, setSelectedItem]   = useState(null);
  const [quantity, setQuantity]           = useState(1);
  const [quantityInput, setQuantityInput] = useState('1');
  const [customerName, setCustomerName]   = useState('');
  const [selling, setSelling]             = useState(false);
  const [sellMessage, setSellMessage]     = useState('');
  const [subtotalEditing, setSubtotalEditing] = useState(false);
  const [subtotalInput, setSubtotalInput]     = useState('');
  const debounceRef = useRef(null);

  // Handle preselectStock from inventory page
  useEffect(() => {
    if (preselectStock) {
      setItems([preselectStock]);
      handleSelectItem(preselectStock);
      setLoading(false);
    }
  }, [preselectStock]);

  // Search with debounce — refetch on refreshKey too
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const results = await searchStock(searchTerm);
        setItems(results);
      } catch (err) {
        console.error('Failed to search stock:', err);
      } finally {
        setLoading(false);
      }
    }, 350);
    return () => clearTimeout(debounceRef.current);
  }, [searchTerm, refreshKey]);

  const handleSelectItem = (item) => {
    if (getStockStatus(item) === 'out') return;
    setSelectedItem(item);
    setQuantity(1);
    setQuantityInput('1');
    setCustomerName('');
    setSellMessage('');
    setSubtotalEditing(false);
    setSubtotalInput('');
  };

  const handleClose = () => {
    setSelectedItem(null);
    setQuantity(1);
    setQuantityInput('1');
    setCustomerName('');
    setSellMessage('');
    setSubtotalEditing(false);
    setSubtotalInput('');
  };

  const handleQtyChange = (val) => {
    setQuantityInput(String(val));
    const num = Number(val);
    if (!isNaN(num) && num >= 1 && num <= (selectedItem?.remainingQty || 1)) {
      setQuantity(num);
    }
  };

  const handleSell = async () => {
    if (!selectedItem) return;
    setSelling(true);
    setSellMessage('');
    try {
      await makeSale({
        stockId: selectedItem.id,
        quantitySold: quantity,
        customerName,
      });
      setSellMessage('success');
      setItems(prev =>
        prev.map(i =>
          i.id === selectedItem.id
            ? { ...i, remainingQty: i.remainingQty - quantity }
            : i
        )
      );
      setTimeout(() => handleClose(), 1500);
    } catch (err) {
      setSellMessage(err.message || 'Sale failed. Try again.');
    } finally {
      setSelling(false);
      if (onSaleComplete) onSaleComplete();
    }
  };

  return (
    <div className="sell-items-container">

      {/* Search Bar */}
      <div className="sell-search-bar">
        <FiSearch size={15} className="sell-search-icon" />
        <input
          type="text"
          placeholder="Search items to sell..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="sell-search-input"
        />
      </div>

      {/* Items List */}
      <div className="sell-items-list">
        {loading ? (
          <div className="sell-state-msg">Searching...</div>
        ) : items.length === 0 ? (
          <div className="sell-state-msg">No items found</div>
        ) : (
          items.map((item) => {
            const status = getStockStatus(item);
            const isOut = status === 'out';
            const isSelected = selectedItem?.id === item.id;

            return (
              <div key={item.id} className={`sell-item-wrapper ${isSelected ? 'expanded' : ''}`}>

                {/* Row */}
                <div
                  className={`sell-item-row ${isOut ? 'disabled' : ''} ${isSelected ? 'active' : ''}`}
                  onClick={() => isSelected ? handleClose() : handleSelectItem(item)}
                >
                  <div className="sell-item-left">
                    <div className={`sell-item-icon ${isOut ? 'out' : ''}`}>
                      <FiShoppingCart size={15} />
                    </div>
                    <div className="sell-item-info">
                      <span className={`sell-item-name ${isOut ? 'muted' : ''}`}>
                        {capitalizeWords(item.productName)}
                      </span>
                      <span className="sell-item-details">
                        {item.companyName} · {item.arrivalDate?.toDate
                          ? item.arrivalDate.toDate().toLocaleDateString('en-IN')
                          : new Date(item.arrivalDate).toLocaleDateString('en-IN')}
                      </span>
                    </div>
                  </div>
                  <div className="sell-item-right">
                    <span className={`sell-item-price ${isOut ? 'muted' : ''}`}>
                      ₹{Number(item.sellingPrice).toLocaleString('en-IN')}
                    </span>
                    <span className={`sell-item-qty ${status}`}>
                      {item.remainingQty} left
                    </span>
                  </div>
                  {isSelected && (
                    <button
                      className="sell-close-btn"
                      onClick={(e) => { e.stopPropagation(); handleClose(); }}
                    >
                      <FiX size={16} />
                    </button>
                  )}
                </div>

                {/* Expanded Panel */}
                {isSelected && (
                  <div className="sell-panel">

                    {/* Product meta */}
                    <div className="sell-panel-meta">
                      <span className="sell-panel-units">{item.remainingQty} units</span>
                      <span className="sell-panel-each">
                        ₹{Number(item.sellingPrice).toLocaleString('en-IN')} each
                      </span>
                    </div>

                    {/* Quantity */}
                    <div className="sell-qty-label">Quantity</div>
                    <div className="sell-qty-row">
                      <button
                        className="sell-qty-btn"
                        onClick={() => handleQtyChange(quantity - 1)}
                        disabled={quantity <= 1}
                      >
                        <FiMinus size={14} />
                      </button>
                      <input
                        className="sell-qty-input"
                        type="number"
                        value={quantityInput}
                        min={1}
                        max={item.remainingQty}
                        onChange={(e) => handleQtyChange(e.target.value)}
                        onBlur={() => {
                          if (!quantity || quantity < 1) {
                            setQuantity(1);
                            setQuantityInput('1');
                          }
                        }}
                      />
                      <button
                        className="sell-qty-btn"
                        onClick={() => handleQtyChange(quantity + 1)}
                        disabled={quantity >= item.remainingQty}
                      >
                        <FiPlus size={14} />
                      </button>
                    </div>

                    {/* Quick qty presets */}
                    <div className="sell-quick-qtys">
                      {QUICK_QTYS.map((q) => (
                        <button
                          key={q}
                          className={`sell-quick-qty-btn ${quantity === q ? 'active' : ''}`}
                          onClick={() => handleQtyChange(q)}
                          disabled={q > item.remainingQty}
                        >
                          {q}
                        </button>
                      ))}
                    </div>

                    {/* Buyer name */}
                    <div className="sell-qty-label">Buyer Name (optional)</div>
                    <input
                      className="sell-buyer-input"
                      type="text"
                      placeholder="e.g. Raj Electronics"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                    />

                    {/* Subtotal + sell btn */}
                    <div className="sell-footer">
                      <div className="sell-subtotal">
                        <span className="sell-subtotal-calc">
                          {quantity} × ₹{Number(item.sellingPrice).toLocaleString('en-IN')}
                        </span>

                        {subtotalEditing ? (
                          <input
                            className="sell-subtotal-edit-input"
                            type="number"
                            value={subtotalInput}
                            autoFocus
                            onChange={(e) => {
                              setSubtotalInput(e.target.value);
                              const newSubtotal = Number(e.target.value);
                              if (newSubtotal > 0 && item.sellingPrice > 0) {
                                const newQty = Math.round(newSubtotal / item.sellingPrice);
                                const clamped = Math.max(1, Math.min(newQty, item.remainingQty));
                                setQuantity(clamped);
                                setQuantityInput(String(clamped));
                              }
                            }}
                            onBlur={() => setSubtotalEditing(false)}
                          />
                        ) : (
                          <strong
                            className="sell-subtotal-total"
                            onClick={() => {
                              setSubtotalEditing(true);
                              setSubtotalInput(String(item.sellingPrice * quantity));
                            }}
                            style={{ cursor: 'pointer', textDecoration: 'underline dotted' }}
                            title="Tap to edit subtotal"
                          >
                            ₹{(item.sellingPrice * quantity).toLocaleString('en-IN')}
                          </strong>
                        )}

                        <span className="sell-subtotal-label">Subtotal · tap to edit</span>
                      </div>

                      <button
                        className={`sell-btn ${selling ? 'loading' : ''} ${sellMessage === 'success' ? 'success' : ''}`}
                        onClick={handleSell}
                        disabled={selling || sellMessage === 'success'}
                      >
                        {sellMessage === 'success'
                          ? '✓ Sold'
                          : selling
                          ? 'Processing...'
                          : <><FiShoppingCart size={15} /> Sell</>}
                      </button>
                    </div>

                    {/* Error message */}
                    {sellMessage && sellMessage !== 'success' && (
                      <p className="sell-error">{sellMessage}</p>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}