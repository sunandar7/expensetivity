import React from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, FileText, ExternalLink } from 'lucide-react';
import './ExpenseTable.css';

const formatMMK = (amount) =>
  new Intl.NumberFormat('my-MM').format(Math.round(amount)) + ' MMK';

export default function ExpenseTable({ expenses, onEdit, onDelete }) {
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
              <td>
                <span className="expense-name">{expense.name}</span>
              </td>
              <td>
                <div className="category-chip" style={{ borderColor: expense.category?.color + '44', color: expense.category?.color }}>
                  <span>{expense.category?.icon}</span>
                  <span>{expense.category?.name}</span>
                </div>
              </td>
              <td>
                <span className="date-cell">{format(new Date(expense.date), 'MMM d, yyyy')}</span>
              </td>
              <td>
                <span className="note-cell">{expense.note || '—'}</span>
              </td>
              <td>
                {expense.receipt?.url ? (
                  <a
                    href={`http://localhost:5000${expense.receipt.url}`}
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
              <td className="amount-col">
                <span className="amount-cell">{formatMMK(expense.amount)}</span>
              </td>
              <td className="actions-col">
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
