import React, { useState } from 'react';
import { FaBuilding } from "react-icons/fa";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import './CompaniesList.css';

export default function CompaniesList() {

    const [openId, setOpenId] = useState(null); // 🔥 NEW

    const companies = [
        { id: 1, name: "Tata", balancePayable: "156655", lastStockAdded: "2024-06-01", payments: 2, totalPurchases: 50000 },
        { id: 2, name: "Reliance", balancePayable: "200000", lastStockAdded: "2024-06-02", payments: 1, totalPurchases: 30000 },
        { id: 3, name: "Infosys", balancePayable: "180000", lastStockAdded: "2024-06-03", payments: 3, totalPurchases: 70000 },
    ];

    const getDaysAgo = (dateString) => {
        const today = new Date();
        const stockDate = new Date(dateString);

        const diffTime = today - stockDate;
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return "Today";
        if (diffDays === 1) return "Yesterday";
        if (diffDays <= 10) return `${diffDays} days ago`;

        return stockDate.toLocaleDateString();
    };

    return (
        <div className="companies-list">

            <div className="heading">
                <FaBuilding className="company-icon" />
                <p>Companies</p>
                <p>{companies.length}</p>
            </div>

            <div className="companies-table">

                {companies.map((company) => {

                    const isOpen = openId === company.id; // 🔥 NEW

                    return (
                        <div key={company.id} className="company-card">

                            <div className="companyinfo">

                                {/* LEFT ICON */}
                                <div className="companyinfo-left">
                                    {company.name
                                        .split(" ")
                                        .map(word => word[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2)}
                                </div>

                                {/* MIDDLE */}
                                <div className="companyinfo-middle">
                                    <h4>{company.name}</h4>
                                    <p>Last: {getDaysAgo(company.lastStockAdded)}</p>
                                </div>

                                {/* RIGHT DROPDOWN */}
                                <div
                                    className="companyinfo-right"
                                    onClick={() =>
                                        setOpenId(isOpen ? null : company.id)
                                    }
                                >
                                    {isOpen ? <FiChevronDown /> : <FiChevronRight />}
                                </div>

                            </div>

                            <div className="paymentinfo">
                                <div className="paymentinfo-left">
                                    <p>Balance Payable</p>
                                    <h3>₹ {company.balancePayable}</h3>
                                </div>

                                <div className="paymentinfo-right">
                                    Pay Now
                                </div>
                            </div>


                            {isOpen && (
                                <div className="dropdown-click">

                                    <div className="dropdown-item">
                                        <p>Total Purchases</p>
                                        <h3>₹ {company.totalPurchases}</h3>
                                    </div>

                                    <div className="dropdown-item">
                                        <p>Payments</p>
                                        <h3>{company.payments}</h3>
                                    </div>

                                    <button className="delete-btn">Delete</button>

                                </div>
                            )}

                        </div>
                    );
                })}

            </div>
        </div>
    );
}