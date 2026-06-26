import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { useExpenses } from '../../context/ExpenseContext';
import toast from 'react-hot-toast';
import './BudgetModal.css';

const MONTH_OPTIONS = [
  { value: 1, label: 'January' },
  { value: 2, label: 'February' },
  { value: 3, label: 'March' },
  { value: 4, label: 'April' },
  { value: 5, label: 'May' },
  { value: 6, label: 'June' },
  { value: 7, label: 'July' },
  { value: 8, label: 'August' },
  { value: 9, label: 'September' },
  { value: 10, label: 'October' },
  { value: 11, label: 'November' },
  { value: 12, label: 'December' },
];

export default function BudgetModal({ onClose, initialMonth, initialYear, initialAmount }) {
  const { updateBudgetSetting } = useExpenses();
  const [amount, setAmount] = useState(initialAmount || '');
  const [month, setMonth] = useState(initialMonth || new Date().getMonth() + 1);
  const [year, setYear] = useState(initialYear || new Date().getFullYear());
  const [loading, setLoading] = useState(false);

  // Generate last 2 years and next 2 years
  const currentYear = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (amount === '' || isNaN(amount) || parseFloat(amount) < 0) {
      toast.error('Please enter a valid budget amount');
      return;
    }

    setLoading(true);
    try {
      await updateBudgetSetting({
        amount: parseFloat(amount),
        month: parseInt(month),
        year: parseInt(year),
      });
      toast.success('Monthly budget updated!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update budget');
    } finally {
      setLoading(false);
    }
  };

  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal budget-modal animate-scale-in" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>Configure Budget</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            {/* Amount */}
            <div className="field field-full">
              <label>Budget Amount (MMK) *</label>
              <div className="amount-input">
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="e.g. 500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  autoFocus
                />
                <span className="currency-badge">MMK</span>
              </div>
              {amount && !isNaN(amount) && (
                <p className="amount-formatted">
                  {new Intl.NumberFormat('my-MM').format(parseFloat(amount))} Kyat
                </p>
              )}
            </div>

            {/* Month */}
            <div className="field">
              <label>Select Month</label>
              <select value={month} onChange={(e) => setMonth(parseInt(e.target.value))}>
                {MONTH_OPTIONS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Year */}
            <div className="field">
              <label>Select Year</label>
              <select value={year} onChange={(e) => setYear(parseInt(e.target.value))}>
                {yearOptions.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading && <span className="btn-spinner" />}
              {loading ? 'Saving...' : 'Save Budget'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
