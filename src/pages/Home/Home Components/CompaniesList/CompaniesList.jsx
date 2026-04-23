import React, { useState, useEffect } from 'react';
import { FaBuilding } from "react-icons/fa";
import { FiChevronDown, FiChevronRight } from "react-icons/fi";
import './CompaniesList.css';
import { getCompanies, deleteCompany } from '../../../../Database/apis';

export default function CompaniesList({ searchTerm }) {
    const [openId, setOpenId] = useState(null);
    const [deleteCompanyId, setDeleteCompanyId] = useState(null);
    const [countdown, setCountdown] = useState(5);
    const [isCounting, setIsCounting] = useState(false);
    const [companies, setCompanies] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchCompanies();
    }, []);

    useEffect(() => {
        if (!isCounting) return;

        if (countdown === 0) {
            setIsCounting(false);
            return;
        }

        const timer = setTimeout(() => {
            setCountdown(prev => prev - 1);
        }, 1000);

        return () => clearTimeout(timer);
    }, [countdown, isCounting]);

    const fetchCompanies = async () => {
        try {
            setLoading(true);
            const data = await getCompanies();
            setCompanies(data);
            setError(null);
        } catch (err) {
            console.error('Failed to fetch companies:', err);
            setError('Failed to load companies');
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        if (!deleteCompanyId) return;

        try {
            await deleteCompany(deleteCompanyId);
            setCompanies(companies.filter(company => company.id !== deleteCompanyId));

            setDeleteCompanyId(null);
            setIsCounting(false);
            setCountdown(5);

        } catch (err) {
            console.error('Failed to delete company:', err);
            setError('Failed to delete company');
        }
    };

    const filteredCompanies = companies.filter(company =>
        company.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

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

    if (loading) {
        return (
            <div className="companies-list">
                <div className="heading">
                    <FaBuilding className="company-icon" />
                    <p>Companies</p>
                    <p>Loading...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="companies-list">
                <div className="heading">
                    <FaBuilding className="company-icon" />
                    <p>Companies</p>
                    <p>Error: {error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="companies-list">
            <div className="heading">
                <FaBuilding className="company-icon" />
                <p>Companies</p>
                <p>{filteredCompanies.length}</p>
            </div>

            <div className="companies-table">
                {filteredCompanies.map((company) => {
                    const isOpen = openId === company.id;

                    return (
                        <div key={company.id} className="company-card">
                            <div className="companyinfo">
                                <div className="companyinfo-left">
                                    {company.name
                                        .split(" ")
                                        .map(word => word[0])
                                        .join("")
                                        .toUpperCase()
                                        .slice(0, 2)}
                                </div>

                                <div className="companyinfo-middle">
                                    <h4>{company.name}</h4>
                                    <p>Last: {company.createdAt ? getDaysAgo(company.createdAt.toDate().toISOString().split('T')[0]) : 'N/A'}</p>
                                </div>

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
                                    <h3>₹ {company.balancePayable || '0'}</h3>
                                </div>

                                <div className="paymentinfo-right">
                                    Pay Now
                                </div>
                            </div>

                            {isOpen && (
                                <div className="dropdown-click">
                                    <div className="dropdown-item">
                                        <p>Total Purchases</p>
                                        <h3>₹ {company.totalPurchases || '0'}</h3>
                                    </div>

                                    <div className="dropdown-item">
                                        <p>Payments</p>
                                        <h3>{company.payments || '0'}</h3>
                                    </div>

                                    <button
                                        className="delete-btn"
                                        onClick={() => {
                                            setDeleteCompanyId(company.id);
                                            setCountdown(5);
                                            setIsCounting(true);
                                        }}
                                    >
                                        Delete
                                    </button>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {deleteCompanyId && (
                <>
                    <div
                        className="delete-overlay"
                        onClick={() => setDeleteCompanyId(null)}
                    ></div>

                    <div className="delete-modal">
                        <div className="delete-box">
                            <h3>Warning</h3>

                            <p>Deleting this company will permanently remove:</p>

                            <ul style={{ listStyle: "none", paddingLeft: 0 }}>
                                <li style={{ margin: "5px 0" }}>All stock entries</li>
                                <li style={{ margin: "5px 0" }}>All arrival dates</li>
                                <li style={{ margin: "5px 0" }}>All related data</li>
                            </ul>

                            <p>This action cannot be undone.</p>

                            <div className="delete-actions">
                                <button
                                    className="cancel-btn"
                                    onClick={() => setDeleteCompanyId(null)}
                                >
                                    Cancel
                                </button>

                                <button
                                    className="confirm-delete-btn"
                                    disabled={isCounting}
                                    onClick={handleDelete}
                                    style={{
                                        backgroundColor: isCounting ? "#858585" : "#e53935",
                                        cursor: isCounting ? "not-allowed" : "pointer",
                                        opacity: isCounting ? 0.7 : 1
                                    }}
                                >
                                    {isCounting ? `Wait ${countdown}s...` : "Confirm Delete"}
                                </button>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}