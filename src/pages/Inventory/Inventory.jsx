
import React, { useEffect, useState } from 'react';
import './Inventory.css';
import InventoryHeader from './Inventory Components/Inventory Header/InventoryHeader';
import SearchStock from './Inventory Components/SearchStock/SearchStock';
import InventoryFilters from './Inventory Components/InventoryFilters/InventoryFilters';
import AddStock from './Inventory Components/AddStock/AddStock.jsx';
import AllStockItems from './Inventory Components/AllStockItems/AllStockItems.jsx';
import { getStocksByFilters } from '../../Database/apis';

export default function Inventory() {
  const [searchStockTerm, setSearchStockTerm] = useState('');
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedStockDate, setSelectedStockDate] = useState('');
  const [stockStatus, setStockStatus] = useState('');
  const [stocks, setStocks] = useState([]);
  const [stocksLoading, setStocksLoading] = useState(true);
  const [stocksError, setStocksError] = useState(null);

  useEffect(() => {
    const fetchStocks = async () => {
      setStocksLoading(true);
      setStocksError(null);

      try {
        const filters = {};

        if (selectedCompany) {
          filters.companyId = selectedCompany;
        }

        if (selectedStockDate) {
          filters.entryId = selectedStockDate;
        }

        const rawStocks = await getStocksByFilters(filters);

        const statusFilteredStocks = rawStocks.filter((stock) => {
          if (!stockStatus) return true;
          if (stockStatus === 'in') return stock.remainingQty > 0;
          if (stockStatus === 'out') return stock.remainingQty === 0;
          if (stockStatus === 'low') return stock.remainingQty > 0 && stock.remainingQty <= 5;
          return true;
        });

        const searchTerm = searchStockTerm.trim().toLowerCase();
        const finalStocks = searchTerm
          ? statusFilteredStocks.filter((stock) =>
              stock.productName?.toLowerCase().includes(searchTerm)
            )
          : statusFilteredStocks;

        setStocks(finalStocks);
      } catch (error) {
        console.error('Failed to fetch stocks:', error);
        setStocksError('Failed to load stock records.');
        setStocks([]);
      } finally {
        setStocksLoading(false);
      }
    };

    fetchStocks();
  }, [selectedCompany, selectedStockDate, stockStatus, searchStockTerm]);

  const handleCompanyChange = (companyId) => {
    setSelectedCompany(companyId);
    setSelectedStockDate('');
  };

  return (
    <div className="inventory-container">
      <InventoryHeader />
      <SearchStock setSearchStockTerm={setSearchStockTerm} />
      <InventoryFilters
        selectedCompany={selectedCompany}
        selectedStockDate={selectedStockDate}
        stockStatus={stockStatus}
        onCompanyChange={handleCompanyChange}
        onStockDateChange={setSelectedStockDate}
        onStockStatusChange={setStockStatus}
      />

      <AllStockItems stocks={stocks} loading={stocksLoading} error={stocksError} />

      <AddStock />
    </div>
  );
}

