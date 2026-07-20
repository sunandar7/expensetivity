import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Edit2, Trash2, X, Wallet, CreditCard, Calendar, AlertCircle } from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import './WalletPage.css';

const DEFAULT_WALLETS = [
  {
    id: 'w-1',
    name: 'KBZ Bank',
    balance: 750000,
    currency: 'MMK',
    createdAt: '2026-05-15T08:30:00.000Z'
  },
  {
    id: 'w-2',
    name: 'Cash Wallet',
    balance: 120000,
    currency: 'MMK',
    createdAt: '2026-06-01T10:15:00.000Z'
  },
  {
    id: 'w-3',
    name: 'USD Savings Card',
    balance: 2500,
    currency: 'USD',
    createdAt: '2026-07-02T14:45:00.000Z'
  }
];

const CURRENCY_OPTIONS = [
  { value: 'MMK', label: 'Myanmar Kyat (MMK)', symbol: 'Ks' },
  { value: 'USD', label: 'US Dollar (USD)', symbol: '$' },
  { value: 'THB', label: 'Thai Baht (THB)', symbol: '฿' },
  { value: 'SGD', label: 'Singapore Dollar (SGD)', symbol: 'S$' },
  { value: 'EUR', label: 'Euro (EUR)', symbol: '€' },
  { value: 'JPY', label: 'Japanese Yen (JPY)', symbol: '¥' }
];

const CARD_THEMES = [
  { gradient: 'linear-gradient(135deg, #f5c542 0%, #a78bfa 100%)', text: '#0f0f1a' },
  { gradient: 'linear-gradient(135deg, #2dd4bf 0%, #3b82f6 100%)', text: '#ffffff' },
  { gradient: 'linear-gradient(135deg, #ff6b6b 0%, #ff8fb1 100%)', text: '#ffffff' },
  { gradient: 'linear-gradient(135deg, #a78bfa 0%, #ec4899 100%)', text: '#ffffff' },
  { gradient: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', text: '#ffffff' }
];

export default function WalletPage() {
  const { user } = useAuth();
  const [wallets, setWallets] = useState(() => {
    const saved = localStorage.getItem('wallets');
    return saved ? JSON.parse(saved) : DEFAULT_WALLETS;
  });

  const [showModal, setShowModal] = useState(false);
  const [editingWallet, setEditingWallet] = useState(null);
  const [form, setForm] = useState({ name: '', balance: '', currency: 'MMK' });

  // Save to local storage on change
  useEffect(() => {
    localStorage.setItem('wallets', JSON.stringify(wallets));
  }, [wallets]);

  // Open modal for creating
  const handleAddClick = () => {
    setForm({ name: '', balance: '', currency: user?.baseCurrency || 'MMK' });
    setEditingWallet(null);
    setShowModal(true);
  };

  // Open modal for editing
  const handleEditClick = (wallet, e) => {
    e.stopPropagation();
    setForm({
      name: wallet.name,
      balance: wallet.balance.toString(),
      currency: wallet.currency
    });
    setEditingWallet(wallet);
    setShowModal(true);
  };

  // Delete handler
  const handleDeleteClick = (id, name, e) => {
    e.stopPropagation();
    if (window.confirm(`Are you sure you want to delete the wallet "${name}"?`)) {
      setWallets(prev => prev.filter(w => w.id !== id));
      toast.success('Wallet deleted successfully');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  // Submit modal form
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Wallet name is required');
      return;
    }
    const balanceNum = parseFloat(form.balance);
    if (isNaN(balanceNum) || balanceNum < 0) {
      toast.error('Please enter a valid non-negative balance');
      return;
    }

    if (editingWallet) {
      // Edit mode
      setWallets(prev => prev.map(w => {
        if (w.id === editingWallet.id) {
          return {
            ...w,
            name: form.name.trim(),
            balance: balanceNum,
            currency: form.currency
          };
        }
        return w;
      }));
      toast.success('Wallet updated successfully');
    } else {
      // Create mode
      const newWallet = {
        id: `w-${Date.now()}`,
        name: form.name.trim(),
        balance: balanceNum,
        currency: form.currency,
        createdAt: new Date().toISOString()
      };
      setWallets(prev => [...prev, newWallet]);
      toast.success('Wallet created successfully');
    }

    setShowModal(false);
  };

  // Balance formatting helper
  const formatBalance = (amount, currency) => {
    try {
      if (currency === 'MMK') {
        return new Intl.NumberFormat('my-MM').format(Math.round(amount)) + ' MMK';
      }
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch {
      return `${amount} ${currency}`;
    }
  };

  // Total balance summary grouped by currency
  const balanceSummary = wallets.reduce((acc, w) => {
    acc[w.currency] = (acc[w.currency] || 0) + w.balance;
    return acc;
  }, {});

  return (
    <div className="wallet-page animate-fade-in">
      {/* Header */}
      <div className="wallet-header">
        <div>
          <h1 className="wallet-title">My Wallets</h1>
          <p className="wallet-subtitle">
            Manage your digital and physical accounts ({wallets.length} total)
          </p>
        </div>
        <button className="add-wallet-btn" onClick={handleAddClick}>
          <Plus size={16} />
          Add Wallet
        </button>
      </div>

      {/* Summary totals */}
      {wallets.length > 0 && (
        <div className="wallet-summary-bar">
          <span className="summary-label">Total Balances:</span>
          <div className="summary-list">
            {Object.entries(balanceSummary).map(([curr, sum]) => (
              <div key={curr} className="summary-chip">
                <span className="chip-currency">{curr}</span>
                <span className="chip-amount">{formatBalance(sum, curr).replace(` ${curr}`, '')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Cards list */}
      {wallets.length === 0 ? (
        <div className="wallet-empty-state">
          <div className="empty-icon-wrap">
            <Wallet size={40} className="empty-icon" />
          </div>
          <h3>No Wallets Available</h3>
          <p>Get started by creating a wallet to track your finances.</p>
          <button className="add-wallet-btn" onClick={handleAddClick}>
            <Plus size={16} />
            Create First Wallet
          </button>
        </div>
      ) : (
        <div className="wallet-grid">
          {wallets.map((wallet, index) => {
            const theme = CARD_THEMES[index % CARD_THEMES.length];
            return (
              <div
                key={wallet.id}
                className="wallet-card-container"
                style={{ '--card-bg': theme.gradient, '--card-text': theme.text }}
              >
                <div className="wallet-card-inner">
                  {/* Decorative Elements */}
                  <div className="card-overlay-glow" />
                  <div className="card-glass-shine" />

                  {/* Card Header */}
                  <div className="card-header-row">
                    <div className="card-chip">
                      <CreditCard size={32} strokeWidth={1.5} className="chip-svg" />
                    </div>
                    <span className="card-wallet-name truncate">{wallet.name}</span>
                  </div>

                  {/* Card Body - Balance */}
                  <div className="card-balance-section">
                    <p className="card-balance-label">Current Balance</p>
                    <h2 className="card-balance-value">
                      {formatBalance(wallet.balance, wallet.currency)}
                    </h2>
                  </div>

                  {/* Card Footer */}
                  <div className="card-footer-row">
                    <div className="card-date-info">
                      <Calendar size={12} className="meta-icon" />
                      <span>
                        Created: {format(new Date(wallet.createdAt), 'MMM d, yyyy')}
                      </span>
                    </div>

                    <div className="card-actions">
                      <button
                        className="card-action-btn edit-btn"
                        onClick={(e) => handleEditClick(wallet, e)}
                        title="Edit Wallet"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="card-action-btn delete-btn"
                        onClick={(e) => handleDeleteClick(wallet.id, wallet.name, e)}
                        title="Delete Wallet"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal dialog for creating/editing */}
      {showModal && createPortal(
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal animate-scale-in" role="dialog" aria-modal="true" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingWallet ? 'Edit Wallet' : 'Add Wallet'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="form-grid">
                {/* Wallet Name */}
                <div className="field field-full">
                  <label htmlFor="wallet-name">Wallet Name *</label>
                  <input
                    id="wallet-name"
                    name="name"
                    type="text"
                    placeholder="e.g. KBZ Mobile Banking, Pocket Cash"
                    value={form.name}
                    onChange={handleInputChange}
                    required
                    maxLength={100}
                  />
                </div>

                {/* Balance */}
                <div className="field">
                  <label htmlFor="wallet-balance">Initial Balance *</label>
                  <input
                    id="wallet-balance"
                    name="balance"
                    type="number"
                    min="0"
                    step="any"
                    placeholder="0.00"
                    value={form.balance}
                    onChange={handleInputChange}
                    required
                  />
                </div>

                {/* Currency */}
                <div className="field">
                  <label htmlFor="wallet-currency">Currency *</label>
                  <select
                    id="wallet-currency"
                    name="currency"
                    value={form.currency}
                    onChange={handleInputChange}
                    required
                  >
                    {CURRENCY_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {form.balance && !isNaN(parseFloat(form.balance)) && (
                <div className="form-preview-alert">
                  <AlertCircle size={15} />
                  <span>
                    Will display as:{' '}
                    <strong>{formatBalance(parseFloat(form.balance), form.currency)}</strong>
                  </span>
                </div>
              )}

              <div className="modal-footer" style={{ marginTop: '24px' }}>
                <button type="button" className="cancel-btn" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="submit-btn">
                  {editingWallet ? 'Update Wallet' : 'Create Wallet'}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
