import { useState, useEffect, useCallback } from 'react';
import { Plus, Trash2, ClipboardList } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import FormField, { Input, Select } from '../components/FormField';
import { SkeletonList } from '../components/Skeleton';
import { expensesApi } from '../api/expenses.api';
import { mastersApi } from '../api/masters.api';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

export default function Expenses() {
  const [entries,    setEntries]    = useState([]);
  const [summary,    setSummary]    = useState([]);
  const [categories, setCategories] = useState([]);
  const [modal,      setModal]      = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    category_id: '', amount: '', description: '',
  });
  const [saving, setSaving] = useState(false);
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [y, m] = filterMonth.split('-');
      const [r, s] = await Promise.all([
        expensesApi.getMonthly(y, m),
        expensesApi.getMonthlySummary(y, m),
      ]);
      setEntries(r.data.data);
      setSummary(s.data.data);
    } finally {
      setLoading(false);
    }
  }, [filterMonth]);

  useEffect(() => {
    load();
    mastersApi.getExpenseCategories().then(r =>
      setCategories(r.data.data.filter(c => c.is_active))
    );
  }, [load]);

  function set(f, v) { setForm(p => ({ ...p, [f]: v })); }

  function openAdd() {
    setForm({
      date: new Date().toISOString().split('T')[0],
      category_id: '', amount: '', description: '',
    });
    setModal(true);
  }

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
      <div className="flex items-center gap-2 mb-6 min-w-0">
        <div className="flex-1 min-w-0">
          <input type="month" value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="input-base" />
        </div>
        <div className="hidden lg:flex">
          <button onClick={openAdd} className="flex items-center gap-2 btn-primary px-5 py-3">
            <Plus size={16} /> Add
          </button>
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="lg:hidden fixed bottom-20 right-4 z-[45]">
        <button onClick={openAdd}
          className="w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center shadow-fab"
          aria-label="Add expense">
          <Plus size={24} />
        </button>
      </div>

      {/* Summary by category */}
      {!loading && summary.length > 0 && (
        <div className="bg-navy rounded-3xl p-5 mb-6">
          <p className="section-label text-navy-light mb-3">
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

      {loading ? (
        <SkeletonList count={4} />
      ) : (
        <>
          <div className="space-y-3">
            {entries.map(entry => (
              <div key={entry.id} className="bg-white rounded-3xl px-4 py-3 flex items-center justify-between shadow-card">
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
                    className="icon-btn bg-danger-bg text-danger hover:bg-red-100">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
          {entries.length === 0 && (
            <div className="text-center py-16">
              <div className="w-16 h-16 bg-navy-faint rounded-3xl flex items-center justify-center mx-auto mb-4">
                <ClipboardList size={28} className="text-navy-light" />
              </div>
              <p className="text-gray-500 font-semibold">No expenses this month</p>
            </div>
          )}
        </>
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
          className="w-full btn-primary">
          {saving ? 'Saving...' : 'Save Expense'}
        </button>
      </Modal>
    </Layout>
  );
}
