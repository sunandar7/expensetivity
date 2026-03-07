import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, Receipt, Tag, ArrowRight, Plus } from 'lucide-react';
import { useExpenses } from '../context/ExpenseContext';
import { useAuth } from '../context/AuthContext';
import { format } from 'date-fns';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import './Dashboard.css';

const formatMMK = (amount) =>
  new Intl.NumberFormat('my-MM').format(Math.round(amount)) + ' MMK';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function Dashboard() {
  const { user } = useAuth();
  const { expenses, summary, stats, fetchExpenses, fetchCategories, fetchStats, loading } = useExpenses();
  const now = new Date();

  useEffect(() => {
    fetchExpenses({ limit: 5, sortBy: 'date', sortOrder: 'desc' });
    fetchCategories();
    fetchStats({ year: now.getFullYear(), month: now.getMonth() + 1 });
  }, []);

  const trendData = (stats?.trend || []).map(t => ({
    name: MONTH_NAMES[t._id.month - 1],
    total: t.total,
    count: t.count
  }));

  const pieData = (stats?.byCategory || []).slice(0, 6);

  return (
    <div className="dashboard animate-fade-in">
      {/* Header */}
      <div className="dash-header">
        <div>
          <h1 className="dash-title">
            Good {now.getHours() < 12 ? 'morning' : now.getHours() < 17 ? 'afternoon' : 'evening'},{' '}
            <span className="dash-name">{user?.name?.split(' ')[0]}</span> 👋
          </h1>
          <p className="dash-subtitle">{format(now, 'EEEE, MMMM d, yyyy')}</p>
        </div>
        <Link to="/expenses" className="dash-add-btn">
          <Plus size={16} />
          Add Expense
        </Link>
      </div>

      {/* Stat cards */}
      <div className="stat-grid">
        <div className="stat-card stat-card-gold">
          <div className="stat-icon"><TrendingUp size={20} /></div>
          <div className="stat-info">
            <p className="stat-label">Total Spent (All Time)</p>
            <p className="stat-value">{formatMMK(summary.totalAmount)}</p>
          </div>
        </div>
        <div className="stat-card stat-card-teal">
          <div className="stat-icon"><Receipt size={20} /></div>
          <div className="stat-info">
            <p className="stat-label">Total Expenses</p>
            <p className="stat-value">{summary.totalCount.toLocaleString()}</p>
          </div>
        </div>
        <div className="stat-card stat-card-purple">
          <div className="stat-icon"><Tag size={20} /></div>
          <div className="stat-info">
            <p className="stat-label">This Month</p>
            <p className="stat-value">{formatMMK(stats?.monthlyTotal || 0)}</p>
          </div>
        </div>
      </div>

      {/* Charts row */}
      <div className="charts-grid">
        {/* Spending by category */}
        <div className="chart-card">
          <h3 className="chart-title">This Month by Category</h3>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={3}
                    dataKey="total"
                  >
                    {pieData.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value) => [formatMMK(value), '']}
                    contentStyle={{
                      background: 'var(--bg-elevated)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      color: 'var(--text-primary)',
                      fontFamily: 'var(--font-body)',
                      fontSize: '13px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="pie-legend">
                {pieData.map((cat, i) => (
                  <div key={i} className="legend-item">
                    <span className="legend-dot" style={{ background: cat.color }} />
                    <span className="legend-name">{cat.icon} {cat.name}</span>
                    <span className="legend-val">{formatMMK(cat.total)}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="chart-empty">No expenses this month yet</div>
          )}
        </div>

        {/* Monthly trend */}
        <div className="chart-card">
          <h3 className="chart-title">Monthly Trend</h3>
          {trendData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trendData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fill: 'var(--text-muted)', fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: 'var(--text-muted)', fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={v => v >= 1000000 ? `${(v / 1000000).toFixed(1)}M` : v >= 1000 ? `${(v / 1000).toFixed(0)}K` : v}
                />
                <Tooltip
                  formatter={(value) => [formatMMK(value), 'Spent']}
                  contentStyle={{
                    background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontFamily: 'var(--font-body)',
                    fontSize: '13px'
                  }}
                  cursor={{ fill: 'rgba(245, 197, 66, 0.06)' }}
                />
                <Bar dataKey="total" fill="var(--accent-gold)" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty">No trend data available</div>
          )}
        </div>
      </div>

      {/* Recent expenses */}
      <div className="recent-card">
        <div className="recent-header">
          <h3 className="chart-title">Recent Expenses</h3>
          <Link to="/expenses" className="view-all-link">
            View all <ArrowRight size={14} />
          </Link>
        </div>

        {loading ? (
          <div className="recent-skeleton">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="skeleton-row">
                <div className="skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="skeleton" style={{ width: '40%', height: 14 }} />
                  <div className="skeleton" style={{ width: '25%', height: 12 }} />
                </div>
                <div className="skeleton" style={{ width: 100, height: 16 }} />
              </div>
            ))}
          </div>
        ) : expenses.length === 0 ? (
          <div className="chart-empty" style={{ padding: '48px 0' }}>
            <Receipt size={32} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
            <p>No expenses yet. <Link to="/expenses" style={{ color: 'var(--accent-gold)' }}>Add your first one →</Link></p>
          </div>
        ) : (
          <div className="recent-list">
            {expenses.map(expense => (
              <div key={expense._id} className="recent-item">
                <div className="recent-icon" style={{ background: expense.category?.color + '22' }}>
                  <span>{expense.category?.icon || '📌'}</span>
                </div>
                <div className="recent-info">
                  <p className="recent-name">{expense.name}</p>
                  <p className="recent-meta">
                    <span className="recent-cat" style={{ color: expense.category?.color }}>
                      {expense.category?.name}
                    </span>
                    <span>•</span>
                    <span>{format(new Date(expense.date), 'MMM d, yyyy')}</span>
                  </p>
                </div>
                <p className="recent-amount">{formatMMK(expense.amount)}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
