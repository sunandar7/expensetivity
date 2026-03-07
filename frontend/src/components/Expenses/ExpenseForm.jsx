import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { X, Upload, Trash2, Plus, ChevronDown } from 'lucide-react';
import { useExpenses } from '../../context/ExpenseContext';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import './ExpenseForm.css';

const EMOJI_OPTIONS = ['🍜', '🍕', '🍔', '☕', '💰', '💄', '🚗', '🏥', '🎬', '📱', '📚', '🛍️', '✈️', '🏠', '💪', '🎮', '🎵', '🌿', '💼', '📌'];
const COLOR_OPTIONS = ['#FF6B6B', '#4ECDC4', '#FF8FB1', '#95D2B3', '#F7DC6F', '#82E0AA', '#BB8FCE', '#85C1E9', '#F0B27A', '#AAB7B8', '#f5c542', '#2dd4bf'];

export default function ExpenseForm({ expense, categories, onClose }) {
  const { createExpense, updateExpense, createCategory } = useExpenses();
  const fileInputRef = useRef();

  const [form, setForm] = useState({
    name: expense?.name || '',
    category: expense?.category?._id || '',
    amount: expense?.amount || '',
    date: expense?.date ? format(new Date(expense.date), 'yyyy-MM-dd') : format(new Date(), 'yyyy-MM-dd'),
    note: expense?.note || '',
  });

  const [receipt, setReceipt] = useState(null);
  const [receiptPreview, setReceiptPreview] = useState(expense?.receipt?.url ? `http://localhost:5000${expense.receipt.url}` : null);
  const [loading, setLoading] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', icon: '📌', color: '#AAB7B8' });
  const [creatingCat, setCreatingCat] = useState(false);

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('File must be less than 5MB');
      return;
    }
    setReceipt(file);
    if (file.type.startsWith('image/')) {
      setReceiptPreview(URL.createObjectURL(file));
    } else {
      setReceiptPreview(null);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { toast.error('File must be less than 5MB'); return; }
      setReceipt(file);
      if (file.type.startsWith('image/')) setReceiptPreview(URL.createObjectURL(file));
    }
  };

  const removeReceipt = () => {
    setReceipt(null);
    setReceiptPreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreateCategory = async () => {
    if (!newCat.name.trim()) { toast.error('Category name is required'); return; }
    setCreatingCat(true);
    try {
      const cat = await createCategory(newCat);
      setForm(p => ({ ...p, category: cat._id }));
      setShowNewCategory(false);
      setNewCat({ name: '', icon: '📌', color: '#AAB7B8' });
      toast.success('Category created!');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create category');
    } finally {
      setCreatingCat(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Expense name is required'); return; }
    if (!form.category) { toast.error('Please select a category'); return; }
    if (!form.amount || isNaN(form.amount) || parseFloat(form.amount) < 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => { if (v) formData.append(k, v); });
      if (receipt) formData.append('receipt', receipt);

      if (expense) {
        await updateExpense(expense._id, formData);
        toast.success('Expense updated!');
      } else {
        await createExpense(formData);
        toast.success('Expense added!');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setLoading(false);
    }
  };

  // Close on backdrop click
  const handleBackdrop = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return createPortal(
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal animate-scale-in" role="dialog" aria-modal="true">
        <div className="modal-header">
          <h2>{expense ? 'Edit Expense' : 'Add Expense'}</h2>
          <button className="modal-close" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-grid">
            {/* Name */}
            <div className="field">
              <label>Expense Name *</label>
              <input
                name="name"
                type="text"
                placeholder="e.g. Lunch at restaurant"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>

            {/* Amount */}
            <div className="field">
              <label>Amount (MMK) *</label>
              <div className="amount-input">
                <input
                  name="amount"
                  type="number"
                  min="0"
                  step="1"
                  placeholder="0"
                  value={form.amount}
                  onChange={handleChange}
                  required
                />
                <span className="currency-badge">MMK</span>
              </div>
              {form.amount && !isNaN(form.amount) && (
                <p className="amount-formatted">
                  {new Intl.NumberFormat('my-MM').format(parseFloat(form.amount))} Kyat
                </p>
              )}
            </div>

            {/* Category */}
            <div className="field field-full">
              <label>Category *</label>
              <div className="category-row">
                <select
                  name="category"
                  value={form.category}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select category...</option>
                  {categories.map(cat => (
                    <option key={cat._id} value={cat._id}>
                      {cat.icon} {cat.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="new-cat-btn"
                  onClick={() => setShowNewCategory(!showNewCategory)}
                >
                  <Plus size={14} />
                  New
                </button>
              </div>

              {/* New category form */}
              {showNewCategory && (
                <div className="new-category-form animate-fade-in">
                  <div className="new-cat-row">
                    <input
                      type="text"
                      placeholder="Category name"
                      value={newCat.name}
                      onChange={e => setNewCat(p => ({ ...p, name: e.target.value }))}
                      className="new-cat-input"
                    />
                    <div className="emoji-picker">
                      {EMOJI_OPTIONS.map(emoji => (
                        <button
                          key={emoji}
                          type="button"
                          className={`emoji-btn ${newCat.icon === emoji ? 'emoji-selected' : ''}`}
                          onClick={() => setNewCat(p => ({ ...p, icon: emoji }))}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                    <div className="color-picker">
                      {COLOR_OPTIONS.map(color => (
                        <button
                          key={color}
                          type="button"
                          className={`color-btn ${newCat.color === color ? 'color-selected' : ''}`}
                          style={{ background: color }}
                          onClick={() => setNewCat(p => ({ ...p, color }))}
                        />
                      ))}
                    </div>
                    <div className="new-cat-actions">
                      <button
                        type="button"
                        className="create-cat-btn"
                        onClick={handleCreateCategory}
                        disabled={creatingCat}
                      >
                        {creatingCat ? 'Creating...' : 'Create Category'}
                      </button>
                      <button type="button" className="cancel-cat-btn" onClick={() => setShowNewCategory(false)}>
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Date */}
            <div className="field">
              <label>Date *</label>
              <input
                name="date"
                type="date"
                value={form.date}
                onChange={handleChange}
                required
              />
            </div>

            {/* Note */}
            <div className="field field-full">
              <label>Note <span className="optional">(optional)</span></label>
              <textarea
                name="note"
                placeholder="Any additional details..."
                value={form.note}
                onChange={handleChange}
                rows={3}
              />
            </div>

            {/* Receipt upload */}
            <div className="field field-full">
              <label>Receipt / Invoice <span className="optional">(optional)</span></label>
              <div
                className={`upload-zone ${receipt || receiptPreview ? 'upload-has-file' : ''}`}
                onDrop={handleDrop}
                onDragOver={e => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
              >
                {receiptPreview ? (
                  <div className="receipt-preview">
                    <img src={receiptPreview} alt="Receipt" />
                    <button type="button" className="remove-receipt" onClick={(e) => { e.stopPropagation(); removeReceipt(); }}>
                      <Trash2 size={14} />
                    </button>
                  </div>
                ) : receipt ? (
                  <div className="receipt-file">
                    <span className="file-icon">📄</span>
                    <span className="file-name">{receipt.name}</span>
                    <button type="button" className="remove-receipt-inline" onClick={(e) => { e.stopPropagation(); removeReceipt(); }}>
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <div className="upload-prompt">
                    <Upload size={24} className="upload-icon" />
                    <p>Drop file here or <span>browse</span></p>
                    <p className="upload-hint">JPG, PNG, PDF · Max 5MB</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="cancel-btn" onClick={onClose}>Cancel</button>
            <button type="submit" className="submit-btn" disabled={loading}>
              {loading && <span className="btn-spinner" />}
              {loading ? 'Saving...' : expense ? 'Update Expense' : 'Add Expense'}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body
  );
}
