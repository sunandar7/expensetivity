import React from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, FileText, ExternalLink } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './ExpenseTable.css';

const formatAmount = (amount, currency = 'MMK') =>
  new Intl.NumberFormat('my-MM').format(Math.round(amount)) + ` ${currency}`;

export default function ExpenseTable({ expenses, onEdit, onDelete }) {
  const { user } = useAuth();
  const apiBaseUrl = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

  const getReceiptUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    return `${apiBaseUrl}${url}`;
  };

  return (
    <div className="table-wrapper">
      <table className="expense-table">
        <thead>
          <tr>
            <th>Expense</th>
            <th>Category</th>
            <th>Date</th>
            <th>Note</th>
            <th>Receipt</th>
            <th className="amount-col">Amount</th>
            <th className="actions-col">Actions</th>
          </tr>
        </thead>
        <tbody>
          {expenses.map((expense, i) => (
            <tr key={expense._id} style={{ animationDelay: `${i * 0.04}s` }} className="table-row">
              <td className="expense-cell">
                <span className="expense-name">{expense.name}</span>
              </td>
              <td className="category-cell">
                {expense.category ? (
                  <div className="category-chip" style={{ borderColor: expense.category.color + '44', color: expense.category.color }}>
                    <span>{expense.category.icon}</span>
                    <span>{expense.category.name}</span>
                  </div>
                ) : (
                  <span className="no-category">—</span>
                )}
              </td>
              <td className="date-cell-wrap">
                <span className="date-cell">{format(new Date(expense.date), 'MMM d, yyyy')}</span>
              </td>
              <td className="note-cell-wrap">
                <span className="note-cell" title={expense.note}>{expense.note || '—'}</span>
              </td>
              <td className="receipt-cell">
                {expense.receipt?.url ? (
                  <a
                    href={getReceiptUrl(expense.receipt.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="receipt-link"
                  >
                    <FileText size={14} />
                    <ExternalLink size={12} />
                  </a>
                ) : (
                  <span className="no-receipt">—</span>
                )}
              </td>
              <td className="amount-cell-wrap amount-col">
                <span className="amount-cell">{formatAmount(expense.amount, expense.currency)}</span>
                {expense.currency !== user?.baseCurrency && expense.baseAmount !== undefined && (
                  <div className="amount-converted" style={{ fontSize: '0.8em', opacity: 0.75, marginTop: '2px' }}>
                    ({formatAmount(expense.baseAmount, user?.baseCurrency || 'MMK')})
                  </div>
                )}
              </td>
              <td className="actions-cell-wrap actions-col">
                <div className="row-actions">
                  <button className="action-btn edit-btn" onClick={() => onEdit(expense)} title="Edit">
                    <Pencil size={14} />
                  </button>
                  <button className="action-btn delete-btn" onClick={() => onDelete(expense._id)} title="Delete">
                    <Trash2 size={14} />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
