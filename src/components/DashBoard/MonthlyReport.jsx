import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase"; // adjust path if needed

export default function MonthlyReport() {
  const [stats, setStats] = useState({});
  const [allSales, setAllSales] = useState([]);

  // Function that calculates monthly revenue + profit from item sales arrays
  const calculateMonthlyRevenueProfit = async () => {
    const companiesSnapshot = await getDocs(collection(db, "companies"));
    const monthlyStats = {};
    const salesList = [];

    for (const companyDoc of companiesSnapshot.docs) {
      const companyId = companyDoc.id;
      const companyName = companyDoc.data().name;
      const datesRef = collection(db, `companies/${companyId}/arrivalDates`);
      const datesSnapshot = await getDocs(datesRef);

      for (const dateDoc of datesSnapshot.docs) {
        const dateId = dateDoc.id;
        const itemsRef = collection(db, `companies/${companyId}/arrivalDates/${dateId}/stockItems`);
        const itemsSnapshot = await getDocs(itemsRef);

        for (const itemDoc of itemsSnapshot.docs) {
          const item = itemDoc.data();
          const itemName = item.name;
          if (item.sales) {
            item.sales.forEach(sale => {
              const monthKey = sale.date.slice(0, 7); // "YYYY-MM"
              if (!monthlyStats[monthKey]) {
                monthlyStats[monthKey] = { revenue: 0, profit: 0 };
              }
              monthlyStats[monthKey].revenue += sale.revenue || 0;
              monthlyStats[monthKey].profit += sale.profit || 0;

              // Add to all sales list
              salesList.push({
                companyName,
                itemName,
                date: sale.date,
                unitsSold: sale.unitsSold,
                revenue: sale.revenue,
                profit: sale.profit,
                timestamp: sale.timestamp
              });
            });
          }
        }
      }
    }

    return { monthlyStats, salesList };
  };

  useEffect(() => {
    const fetchStats = async () => {
      const result = await calculateMonthlyRevenueProfit();
      setStats(result.monthlyStats);
      setAllSales(result.salesList);
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

      <h2>All Sales Details</h2>
      <div style={{ maxHeight: "400px", overflowY: "auto" }}>
        {allSales.map((sale, index) => (
          <div key={index} style={{ border: "1px solid #ccc", padding: "0.5rem", margin: "0.5rem 0" }}>
            <p><strong>Company:</strong> {sale.companyName}</p>
            <p><strong>Item:</strong> {sale.itemName}</p>
            <p><strong>Date:</strong> {sale.date}</p>
            <p><strong>Units Sold:</strong> {sale.unitsSold}</p>
            <p><strong>Revenue:</strong> ₹{sale.revenue}</p>
            <p><strong>Profit:</strong> ₹{sale.profit}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
