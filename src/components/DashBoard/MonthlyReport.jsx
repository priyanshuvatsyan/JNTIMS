import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase"; // adjust path if needed

export default function MonthlyReport() {
  const [stats, setStats] = useState({});
  const [allSales, setAllSales] = useState([]);
  const [showSalesDetails, setShowSalesDetails] = useState(false);
  const [stockStats, setStockStats] = useState({
    totalVarieties: 0,
    totalUnits: 0,
    totalSoldThisMonth: 0,
    stockItems: []
  });

  // Function that counts total available stock and varieties
  const calculateStockStats = async (monthlyStats) => {
    let totalUnits = 0;
    let totalVarieties = 0;
    let totalSoldThisMonth = 0;
    const stockItems = [];

    // Get current month
    const now = new Date();
    const currentMonth = now.toISOString().slice(0, 7); // "YYYY-MM"

    // Get company names for display
    const companiesSnapshot = await getDocs(collection(db, "companies"));
    const companyMap = {};
    companiesSnapshot.docs.forEach(doc => {
      companyMap[doc.id] = doc.data().name;
    });

    // Count total available stock from all items
    for (const companyDoc of companiesSnapshot.docs) {
      const companyId = companyDoc.id;
      const companyName = companyMap[companyId];
      const datesRef = collection(db, `companies/${companyId}/arrivalDates`);
      const datesSnapshot = await getDocs(datesRef);

      for (const dateDoc of datesSnapshot.docs) {
        const dateId = dateDoc.id;
        const itemsRef = collection(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems`);
        const itemsSnapshot = await getDocs(itemsRef);

        itemsSnapshot.docs.forEach(itemDoc => {
          const item = itemDoc.data();
          const remaining = (item.units || 0) - (item.sold || 0);
          
          // Only count if there's stock remaining
          if (remaining > 0) {
            totalVarieties += 1;
            totalUnits += remaining;
            stockItems.push({
              companyName,
              itemName: item.name,
              remaining
            });
          }
        });
      }
    }

    // Count total sold this month from sales collection
    if (monthlyStats[currentMonth]) {
      const salesSnapshot = await getDocs(collection(db, "sales"));
      salesSnapshot.docs.forEach(saleDoc => {
        const sale = saleDoc.data();
        const saleMonth = sale.date.slice(0, 7);
        if (saleMonth === currentMonth) {
          totalSoldThisMonth += sale.unitsSold || 0;
        }
      });
    }

    return { totalVarieties, totalUnits, totalSoldThisMonth, stockItems };
  };
  const calculateMonthlyRevenueProfit = async () => {
    const monthlyStats = {};
    const salesList = [];

    // Get all company names for lookup
    const companiesSnapshot = await getDocs(collection(db, "companies"));
    const companyMap = {};
    companiesSnapshot.docs.forEach(doc => {
      companyMap[doc.id] = doc.data().name;
    });

    // Query the global sales collection
    const salesSnapshot = await getDocs(collection(db, "sales"));

    salesSnapshot.docs.forEach(saleDoc => {
      const sale = saleDoc.data();
      
      // ✅ Skip sales if company is deleted
      if (!companyMap[sale.companyId]) {
        return; // Skip this sale
      }

      const monthKey = sale.date.slice(0, 7); // "YYYY-MM"

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { revenue: 0, profit: 0 };
      }
      monthlyStats[monthKey].revenue += sale.revenue || 0;
      monthlyStats[monthKey].profit += sale.profit || 0;

      // Add to all sales list
      salesList.push({
        companyName: companyMap[sale.companyId],
        itemName: sale.itemName,
        date: sale.date,
        unitsSold: sale.unitsSold,
        revenue: sale.revenue,
        profit: sale.profit,
        timestamp: sale.timestamp
      });
    });

    return { monthlyStats, salesList };
  };

  useEffect(() => {
    const fetchStats = async () => {
      const result = await calculateMonthlyRevenueProfit();
      setStats(result.monthlyStats);
      setAllSales(result.salesList);
      
      // Calculate stock statistics
      const stockData = await calculateStockStats(result.monthlyStats);
      setStockStats(stockData);
    };
    fetchStats();
  }, []);

  return (
    <div style={{ padding: "1rem" }}>
      <h2>📊 Monthly Revenue & Profit</h2>
      {Object.entries(stats).map(([month, { revenue, profit }]) => (
        <div key={month} style={{ margin: "0.5rem 0" }}>
          <strong>{month}</strong> → Revenue: ₹{revenue}, Profit: ₹{profit}
        </div>
      ))}

      {/* Stock Statistics */}
      <div className="stock_statistics" >
        <h3>Stock Statistics</h3>
        <p><strong>Stock Varieties Available:</strong> {stockStats.totalVarieties}</p>
        <p><strong>Total Units in Stock:</strong> {stockStats.totalUnits}</p>
        <p><strong>Total Items Sold This Month:</strong> {stockStats.totalSoldThisMonth} units</p>
        
        {/* Stock Breakdown */}
        {stockStats.stockItems.length > 0 && (
          <div style={{ marginTop: "1rem", backgroundColor: "#fff", padding: "0.8rem", borderRadius: "6px" }}>
            <h4>Stock Breakdown:</h4>
            <ul style={{ listStyle: "none", padding: 0 }}>
              {stockStats.stockItems.map((item, index) => (
                <li key={index} style={{ padding: "0.4rem 0", borderBottom: "1px solid #eee" }}>
                  <strong>{item.itemName}</strong> ({item.companyName}) - {item.remaining} units
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Toggle Button for Sales Details */}
      <button
        onClick={() => setShowSalesDetails(!showSalesDetails)}
        style={{
          padding: "0.6rem 1.2rem",
          backgroundColor: showSalesDetails ? "#ff6b6b" : "#4CAF50",
          color: "white",
          border: "none",
          borderRadius: "6px",
          cursor: "pointer",
          fontSize: "1rem",
          fontWeight: "bold",
          marginBottom: "1rem"
        }}
      >
        {showSalesDetails ? "Hide Sales Details" : "Show Sales Details"}
      </button>

      {/* Sales Details - Conditional Render */}
      {showSalesDetails && (
        <div>
          <h2>All Sales Details</h2>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {allSales.length === 0 ? (
              <p style={{ textAlign: "center", color: "#999" }}>No sales records found</p>
            ) : (
              allSales.map((sale, index) => (
                <div key={index} style={{ border: "1px solid #ccc", padding: "0.5rem", margin: "0.5rem 0" }}>
                  <p><strong>Company:</strong> {sale.companyName}</p>
                  <p><strong>Item:</strong> {sale.itemName}</p>
                  <p><strong>Date:</strong> {sale.date}</p>
                  <p><strong>Units Sold:</strong> {sale.unitsSold}</p>
                  <p><strong>Revenue:</strong> ₹{sale.revenue}</p>
                  <p><strong>Profit:</strong> ₹{sale.profit}</p>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
