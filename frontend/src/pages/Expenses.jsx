import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import FormField, { Input, Select } from '../components/FormField';
import { expensesApi } from '../api/expenses.api';
import { mastersApi } from '../api/masters.api';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

export default function Expenses() {
  const [entries,     setEntries]     = useState([]);
  const [summary,     setSummary]     = useState([]);
  const [categories,  setCategories]  = useState([]);
  const [modal,       setModal]       = useState(false);
  const [form,        setForm]        = useState({
    date: new Date().toISOString().split('T')[0],
    category_id: '', amount: '', description: '',
  });
  const [saving,      setSaving]      = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  const load = useCallback(async () => {
    const [y, m] = filterMonth.split('-');
    const [r, s] = await Promise.all([
      expensesApi.getMonthly(y, m),
      expensesApi.getMonthlySummary(y, m),
    ]);
    setEntries(r.data.data);
    setSummary(s.data.data);
  }, [filterMonth]);

  useEffect(() => {
    load();
    mastersApi.getExpenseCategories().then(r =>
      setCategories(r.data.data.filter(c => c.is_active))
    );
  }, [load]);

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  async function handleSave() {
    if (!form.category_id || !form.amount) return;
    setSaving(true);
    try {
      await expensesApi.create(form);
      await load();
      setModal(false);
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this expense?')) return;
    await expensesApi.remove(id);
    await load();
  }

  const totalExpense = entries.reduce((s, e) => s + Number(e.amount), 0);

  return (
    <Layout title="Expenses" subtitle="Admin">
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <input type="month" value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="w-full bg-white border-0 rounded-2xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-navy-light" />
        </div>
        <button onClick={() => { setForm({ date: new Date().toISOString().split('T')[0], category_id: '', amount: '', description: '' }); setModal(true); }}
          className="bg-navy text-white text-sm font-semibold px-5 py-3 rounded-2xl whitespace-nowrap">
          + Add
        </button>
      </div>

      {/* Summary by category */}
      {summary.length > 0 && (
        <div className="bg-navy rounded-3xl p-5 mb-6">
          <p className="text-navy-light text-xs font-semibold uppercase tracking-wider mb-3">
            Month Total — ₹{fmt(totalExpense)}
          </p>
          <div className="space-y-2">
            {summary.map(s => (
              <div key={s.category_name} className="flex items-center justify-between">
                <p className="text-white text-sm">{s.category_name}</p>
                <p className="text-navy-light text-sm font-semibold">₹{fmt(s.total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {entries.map(entry => (
          <div key={entry.id} className="bg-white rounded-3xl px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold text-black">{entry.category_name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {new Date(entry.date).toLocaleDateString('en-IN')}
                {entry.description ? ` · ${entry.description}` : ''}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="text-sm font-bold text-navy">₹{fmt(entry.amount)}</p>
              <button onClick={() => handleDelete(entry.id)}
                className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-400 text-xs hover:bg-red-100 transition">
                🗑️
              </button>
            </div>
          </div>
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📋</p>
          <p className="text-gray-500 font-medium">No expenses this month</p>
        </div>
      )}

      <Modal isOpen={modal} onClose={() => setModal(false)} title="Add Expense">
        <FormField label="Date">
          <Input type="date" value={form.date} onChange={e => set('date', e.target.value)} />
        </FormField>
        <FormField label="Category">
          <Select value={form.category_id} onChange={e => set('category_id', e.target.value)}>
            <option value="">Select category...</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </FormField>
        <FormField label="Amount (₹)">
          <Input type="number" step="0.01" value={form.amount}
            onChange={e => set('amount', e.target.value)} placeholder="0.00" />
        </FormField>
        <FormField label="Description (optional)">
          <Input value={form.description}
            onChange={e => set('description', e.target.value)} placeholder="Notes..." />
        </FormField>
        <button onClick={handleSave} disabled={saving || !form.category_id || !form.amount}
          className="w-full bg-navy text-white font-semibold py-4 rounded-2xl mt-2 disabled:opacity-40 transition text-sm">
          {saving ? 'Saving...' : 'Save Expense'}
        </button>
      </Modal>
    </Layout>
  );
}