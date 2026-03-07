import React, { useEffect, useState } from 'react';
import { Plus, LayoutGrid, Table2, Search, Filter, X } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import ExpenseForm from '../components/Expenses/ExpenseForm';
import ExpenseTable from '../components/Expenses/ExpenseTable';
import ExpenseCards from '../components/Expenses/ExpenseCards';
import toast from 'react-hot-toast';
import './ExpensesPage.css';

const formatMMK = (amount) =>
  new Intl.NumberFormat('my-MM').format(Math.round(amount)) + ' MMK';

export default function ExpensesPage() {
  const {
    expenses, categories, pagination, summary, loading,
    fetchExpenses, fetchCategories, deleteExpense, filters, updateFilters
  } = useExpenses();

  const [view, setView] = useState(() => localStorage.getItem('expenseView') || 'table');
  const [showForm, setShowForm] = useState(false);
  const [editExpense, setEditExpense] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchCategories();
    fetchExpenses();
  }, []);

  const handleViewChange = (v) => {
    setView(v);
    localStorage.setItem('expenseView', v);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchExpenses({ search, category: filterCategory, startDate: filterStartDate, endDate: filterEndDate, page: 1 });
  };

  const clearFilters = () => {
    setSearch('');
    setFilterCategory('');
    setFilterStartDate('');
    setFilterEndDate('');
    fetchExpenses({ search: '', category: '', startDate: '', endDate: '', page: 1 });
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await deleteExpense(id);
      toast.success('Expense deleted');
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  const handleEdit = (expense) => {
    setEditExpense(expense);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditExpense(null);
    fetchExpenses({ search, category: filterCategory, startDate: filterStartDate, endDate: filterEndDate });
  };

  const handlePageChange = (page) => {
    fetchExpenses({ search, category: filterCategory, startDate: filterStartDate, endDate: filterEndDate, page });
  };

  const hasActiveFilters = search || filterCategory || filterStartDate || filterEndDate;

  return (
    <div className="expenses-page animate-fade-in">
      {/* Header */}
      <div className="expenses-header">
        <div>
          <h1 className="expenses-title">Expenses</h1>
          <p className="expenses-subtitle">
            {pagination.total} total · {formatMMK(summary.totalAmount)} spent
          </p>
        </div>
        <div className="expenses-actions">
          {/* View toggle */}
          <div className="view-toggle">
            <button
              className={`view-btn ${view === 'table' ? 'view-btn-active' : ''}`}
              onClick={() => handleViewChange('table')}
              title="Table view"
            >
              <Table2 size={16} />
              <span>Table</span>
            </button>
            <button
              className={`view-btn ${view === 'card' ? 'view-btn-active' : ''}`}
              onClick={() => handleViewChange('card')}
              title="Card view"
            >
              <LayoutGrid size={16} />
              <span>Cards</span>
            </button>
          </div>
          <button className="add-expense-btn" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="filters-bar">
        <form className="search-form" onSubmit={handleSearch}>
          <div className="search-input-wrap">
            <Search size={15} className="search-icon" />
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="search-input"
            />
          </div>
          <button
            type="button"
            className={`filter-toggle-btn ${showFilters ? 'active' : ''} ${hasActiveFilters ? 'has-filter' : ''}`}
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter size={14} />
            Filters
            {hasActiveFilters && <span className="filter-dot" />}
          </button>
          <button type="submit" className="search-btn">Search</button>
          {hasActiveFilters && (
            <button type="button" className="clear-btn" onClick={clearFilters}>
              <X size={14} /> Clear
            </button>
          )}
        </form>

        {showFilters && (
          <div className="filter-panel animate-fade-in">
            <div className="filter-group">
              <label>Category</label>
              <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="">All Categories</option>
                {categories.map(cat => (
                  <option key={cat._id} value={cat._id}>{cat.icon} {cat.name}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>From Date</label>
              <input type="date" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
            </div>
            <div className="filter-group">
              <label>To Date</label>
              <input type="date" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
            </div>
            <button className="apply-filter-btn" onClick={handleSearch}>Apply Filters</button>
          </div>
        )}
      </div>

      {/* Expense list */}
      {loading ? (
        <div className="loading-state">
          <div className="loader" />
          <p>Loading expenses...</p>
        </div>
      ) : expenses.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">💸</div>
          <h3>No expenses found</h3>
          <p>{hasActiveFilters ? 'Try adjusting your filters' : 'Start adding your expenses'}</p>
          {!hasActiveFilters && (
            <button className="add-expense-btn" onClick={() => setShowForm(true)}>
              <Plus size={16} /> Add First Expense
            </button>
          )}
        </div>
      ) : view === 'table' ? (
        <ExpenseTable expenses={expenses} onEdit={handleEdit} onDelete={handleDelete} />
      ) : (
        <ExpenseCards expenses={expenses} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      {/* Pagination */}
      {pagination.pages > 1 && (
        <div className="pagination">
          {[...Array(pagination.pages)].map((_, i) => (
            <button
              key={i}
              className={`page-btn ${pagination.page === i + 1 ? 'page-btn-active' : ''}`}
              onClick={() => handlePageChange(i + 1)}
            >
              {i + 1}
            </button>
          ))}
        </div>
      )}

      {/* Expense Form Modal */}
      {showForm && (
        <ExpenseForm
          expense={editExpense}
          categories={categories}
          onClose={handleFormClose}
        />
      )}
    </div>
  );
}
