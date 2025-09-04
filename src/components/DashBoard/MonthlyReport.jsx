import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../../firebase"; // adjust path if needed

export default function MonthlyReport() {
  const [stats, setStats] = useState({});

  // Function that calculates monthly revenue + profit
  const calculateMonthlyRevenueProfit = async () => {
    const snap = await getDocs(collection(db, "sales"));
    const monthlyStats = {};

    snap.forEach(doc => {
      const sale = doc.data();
      if (!sale.date) return;

      const monthKey = sale.date.slice(0, 7); // "YYYY-MM"

      if (!monthlyStats[monthKey]) {
        monthlyStats[monthKey] = { revenue: 0, profit: 0 };
      }

      monthlyStats[monthKey].revenue += sale.revenue || 0;
      monthlyStats[monthKey].profit += sale.profit || 0;
    });

    return monthlyStats;
  };

  useEffect(() => {
    const fetchStats = async () => {
      const result = await calculateMonthlyRevenueProfit();
      setStats(result);
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
    </div>
  );
}
