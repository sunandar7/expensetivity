import React, { createContext, useContext, useState, useCallback } from 'react';
import { expenseAPI, categoryAPI, budgetAPI } from '../services/api';
import toast from 'react-hot-toast';

const ExpenseContext = createContext(null);

export const ExpenseProvider = ({ children }) => {
  const [expenses, setExpenses] = useState([]);
  const [categories, setCategories] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1, limit: 20 });
  const [summary, setSummary] = useState({ totalAmount: 0, totalCount: 0 });
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ page: 1, limit: 20, sortBy: 'date', sortOrder: 'desc' });
  const [budget, setBudget] = useState(null);
  const [budgetLoading, setBudgetLoading] = useState(false);

  const fetchExpenses = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const mergedParams = { ...filters, ...params };
      const res = await expenseAPI.getAll(mergedParams);
      setExpenses(res.data.expenses);
      setPagination(res.data.pagination);
      setSummary(res.data.summary);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await categoryAPI.getAll();
      setCategories(res.data.categories);
    } catch (err) {
      toast.error('Failed to load categories');
    }
  }, []);

  const fetchCurrentBudget = useCallback(async (params = {}) => {
    setBudgetLoading(true);
    try {
      const res = await budgetAPI.getCurrent(params);
      setBudget(res.data);
    } catch (err) {
      console.error('Fetch budget error:', err);
    } finally {
      setBudgetLoading(false);
    }
  }, []);

  const updateBudgetSetting = useCallback(async (data) => {
    const res = await budgetAPI.set(data);
    await fetchCurrentBudget({ month: data.month, year: data.year });
    return res.data.budget;
  }, [fetchCurrentBudget]);

  const createExpense = useCallback(async (formData) => {
    const res = await expenseAPI.create(formData);
    await fetchExpenses();
    await fetchCurrentBudget();
    return res.data;
  }, [fetchExpenses, fetchCurrentBudget]);

  const updateExpense = useCallback(async (id, formData) => {
    const res = await expenseAPI.update(id, formData);
    await fetchExpenses();
    await fetchCurrentBudget();
    return res.data;
  }, [fetchExpenses, fetchCurrentBudget]);

  const deleteExpense = useCallback(async (id) => {
    await expenseAPI.delete(id);
    setExpenses(prev => prev.filter(e => e._id !== id));
    setSummary(prev => ({ ...prev, totalCount: prev.totalCount - 1 }));
    await fetchCurrentBudget();
  }, [fetchCurrentBudget]);

  const createCategory = useCallback(async (data) => {
    const res = await categoryAPI.create(data);
    setCategories(prev => [...prev, res.data.category]);
    return res.data.category;
  }, []);

  const deleteCategory = useCallback(async (id) => {
    await categoryAPI.delete(id);
    setCategories(prev => prev.filter(c => c._id !== id));
  }, []);

  const fetchStats = useCallback(async (params = {}) => {
    try {
      const res = await expenseAPI.getStats(params);
      setStats(res.data);
    } catch (err) {
      console.error('Stats error:', err);
    }
  }, []);

  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters, page: 1 }));
  }, []);

  return (
    <ExpenseContext.Provider value={{
      expenses, categories, pagination, summary, stats, loading, filters,
      budget, budgetLoading, fetchCurrentBudget, updateBudgetSetting,
      fetchExpenses, fetchCategories, createExpense, updateExpense, deleteExpense,
      createCategory, deleteCategory, fetchStats, updateFilters, setFilters
    }}>
      {children}
    </ExpenseContext.Provider>
  );
};

export const useExpenses = () => {
  const ctx = useContext(ExpenseContext);
  if (!ctx) throw new Error('useExpenses must be used within ExpenseProvider');
  return ctx;
};
