import React, { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Receipt, LogOut, TrendingDown,
  Menu, X, User, ChevronDown, Info
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
import './Layout.css';

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
    { to: '/expenses', icon: <Receipt size={18} />, label: 'Expenses' },
    { to: '/about', icon: <Info size={18} />, label: 'About Us' }
  ];

  return (
    <div className="layout">
      {/* Sidebar overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="sidebar-logo">
              <TrendingDown size={20} />
            </div>
            <span>Expensetivity</span>
          </div>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-section-label">Main Menu</p>
          {navItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-item ${isActive ? 'nav-item-active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              {item.icon}
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">
              {user?.name?.charAt(0).toUpperCase()}
            </div>
            <div className="user-info">
              <p className="user-name">{user?.name}</p>
              <p className="user-email">{user?.email}</p>
            </div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={16} />
            <span>Log out</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="main-content">
        {/* Top bar */}
        <header className="topbar">
          <button className="menu-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>

          <div className="topbar-right">
            <div className="user-dropdown" onClick={() => setUserMenuOpen(!userMenuOpen)}>
              <div className="topbar-avatar">{user?.name?.charAt(0).toUpperCase()}</div>
              <span className="topbar-username">{user?.name}</span>
              <ChevronDown size={14} style={{ color: 'var(--text-muted)' }} />
              {userMenuOpen && (
                <div className="dropdown-menu">
                  <div className="dropdown-user">
                    <User size={14} />
                    <span>{user?.email}</span>
                  </div>
                  <hr className="dropdown-divider" />
                  <button className="dropdown-item dropdown-item-danger" onClick={handleLogout}>
                    <LogOut size={14} />
                    <span>Log out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
