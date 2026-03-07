import React from 'react';
import { format } from 'date-fns';
import { Pencil, Trash2, FileText, StickyNote, Calendar } from 'lucide-react';
import './ExpenseCards.css';

const formatMMK = (amount) =>
  new Intl.NumberFormat('my-MM').format(Math.round(amount)) + ' MMK';

export default function ExpenseCards({ expenses, onEdit, onDelete }) {
  return (
    <div className="cards-grid">
      {expenses.map((expense, i) => (
        <div
          key={expense._id}
          className="expense-card"
          style={{ animationDelay: `${i * 0.05}s` }}
        >
          {/* Card top accent */}
          <div className="card-accent" style={{ background: expense.category?.color || 'var(--accent-gold)' }} />

          <div className="card-body">
            {/* Header */}
            <div className="card-header">
              <div className="card-icon" style={{ background: (expense.category?.color || '#f5c542') + '22' }}>
                <span>{expense.category?.icon || '📌'}</span>
              </div>
              <div className="card-actions">
                <button className="card-action-btn edit" onClick={() => onEdit(expense)} title="Edit">
                  <Pencil size={13} />
                </button>
                <button className="card-action-btn delete" onClick={() => onDelete(expense._id)} title="Delete">
                  <Trash2 size={13} />
                </button>
              </div>
            </div>

            {/* Name & category */}
            <h4 className="card-name">{expense.name}</h4>
            <div className="card-category" style={{ color: expense.category?.color }}>
              {expense.category?.name}
            </div>

            {/* Amount */}
            <div className="card-amount">{formatMMK(expense.amount)}</div>

            {/* Meta */}
            <div className="card-meta">
              <div className="card-meta-item">
                <Calendar size={12} />
                <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
              </div>
              {expense.note && (
                <div className="card-meta-item card-note">
                  <StickyNote size={12} />
                  <span>{expense.note}</span>
                </div>
              )}
              {expense.receipt?.url && (
                <a
                  href={`http://localhost:5000${expense.receipt.url}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="card-receipt-link"
                  onClick={e => e.stopPropagation()}
                >
                  <FileText size={12} />
                  <span>View Receipt</span>
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
