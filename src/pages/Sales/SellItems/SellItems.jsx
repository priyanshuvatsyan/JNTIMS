import { useState, useEffect, useRef } from 'react';
import { searchStock, makeSale } from '../../../Database/apis';
import { FiSearch, FiShoppingCart, FiX, FiMinus, FiPlus } from 'react-icons/fi';
import './SellItems.css';

function getStockStatus(remainingQty) {
  if (remainingQty === 0) return 'out';
  if (remainingQty <= 5) return 'low';
  return 'in';
}

const capitalizeWords = (str) =>
  str.replace(/\b\w/g, (char) => char.toUpperCase());

const QUICK_QTYS = [1, 5, 10, 25];

export default function SellItems({ onSaleComplete, preselectStock  }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('');
  const [selling, setSelling] = useState(false);
  const [sellMessage, setSellMessage] = useState('');
  const debounceRef = useRef(null);

//handle preselectStock from inventory page if provided  
useEffect(() => {
    if (preselectStock) {
      setItems([preselectStock]); // show it in list
      handleSelectItem(preselectStock); // auto-expand it
      setLoading(false);
    }
  }, [preselectStock]);

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
  }, [searchTerm]);

  const handleSelectItem = (item) => {
    if (getStockStatus(item.remainingQty) === 'out') return;
    setSelectedItem(item);
    setQuantity(1);
    setCustomerName('');
    setSellMessage('');
  };

  const handleClose = () => {
    setSelectedItem(null);
    setQuantity(1);
    setCustomerName('');
    setSellMessage('');
  };

  const handleQtyChange = (val) => {
    const num = Math.max(1, Math.min(Number(val), selectedItem?.remainingQty || 1));
    setQuantity(num);
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
      // Update local item qty so list reflects immediately
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

  const subtotal = selectedItem
    ? (selectedItem.sellingPrice * quantity).toLocaleString('en-IN')
    : '0';

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
            const status = getStockStatus(item.remainingQty);
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
                    <button className="sell-close-btn" onClick={(e) => { e.stopPropagation(); handleClose(); }}>
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
                      <span className="sell-panel-each">₹{Number(item.sellingPrice).toLocaleString('en-IN')} each</span>
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
                        value={quantity}
                        min={1}
                        max={item.remainingQty}
                        onChange={(e) => handleQtyChange(e.target.value)}
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
                        <strong className="sell-subtotal-total">₹{subtotal}</strong>
                        <span className="sell-subtotal-label">Subtotal</span>
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