import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import FormField, { Input, Select } from '../components/FormField';
import { purchaseApi } from '../api/purchase.api';
import { mastersApi } from '../api/masters.api';

const today = () => new Date().toISOString().split('T')[0];
const fmt   = (n) => Number(n).toLocaleString('en-IN');

const emptyForm = {
  date: today(), supplier_id: '', invoice_no: '',
  bottle_type_id: '', quantity_nos: '', rate_per_kg: '', bill_amount: '',
};

export default function Purchase() {
  const [entries,     setEntries]     = useState([]);
  const [suppliers,   setSuppliers]   = useState([]);
  const [bottleTypes, setBottleTypes] = useState([]);
  const [modal,       setModal]       = useState(false);
  const [form,        setForm]        = useState(emptyForm);
  const [saving,      setSaving]      = useState(false);
  const [filterMonth, setFilterMonth] = useState(
    new Date().toISOString().slice(0, 7)
  );

  const load = useCallback(async () => {
    const [y, m] = filterMonth.split('-');
    const r = await purchaseApi.getMonthly(y, m);
    setEntries(r.data.data);
  }, [filterMonth]);

  useEffect(() => {
    load();
    mastersApi.getSuppliers().then(r =>
      setSuppliers(r.data.data.filter(s => s.is_active && s.type === 'preform'))
    );
    mastersApi.getBottleTypes().then(r =>
      setBottleTypes(r.data.data.filter(b => b.is_active))
    );
  }, [load]);

  function set(field, value) { setForm(f => ({ ...f, [field]: value })); }

  function openAdd() { setForm(emptyForm); setModal(true); }

  async function handleSave() {
    if (!form.supplier_id || !form.bottle_type_id || !form.quantity_nos) return;
    setSaving(true);
    try {
      await purchaseApi.create(form);
      await load();
      setModal(false);
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this purchase entry?')) return;
    await purchaseApi.remove(id);
    await load();
  }

  const totalBill = entries.reduce((s, e) => s + Number(e.bill_amount), 0);
  const totalQty  = entries.reduce((s, e) => s + Number(e.quantity_nos), 0);

  return (
    <Layout title="Purchase" subtitle="Supervisor">

      {/* Month filter + Add */}
      <div className="flex items-center gap-3 mb-6">
        <div className="flex-1">
          <input
            type="month"
            value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="w-full bg-white border-0 rounded-2xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-navy-light"
          />
        </div>
        <button
          onClick={openAdd}
          className="bg-navy text-white text-sm font-semibold px-5 py-3 rounded-2xl hover:bg-opacity-90 transition whitespace-nowrap"
        >
          + Add
        </button>
      </div>

      {/* Summary */}
      {entries.length > 0 && (
        <div className="bg-navy rounded-3xl p-5 mb-6">
          <p className="text-navy-light text-xs font-semibold uppercase tracking-wider mb-3">
            Month Summary
          </p>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <p className="text-2xl font-bold text-white">
                ₹{fmt(totalBill)}
              </p>
              <p className="text-navy-light text-xs mt-1">Total Purchase</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {fmt(totalQty)}
              </p>
              <p className="text-navy-light text-xs mt-1">Total Preforms</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">
                {entries.length}
              </p>
              <p className="text-navy-light text-xs mt-1">Invoices</p>
            </div>
          </div>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {entries.map(entry => (
          <PurchaseCard key={entry.id} entry={entry} onDelete={() => handleDelete(entry.id)} />
        ))}
      </div>

      {entries.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">📦</p>
          <p className="text-gray-500 font-medium">No purchases this month</p>
          <p className="text-gray-400 text-sm mt-1">Tap + Add to record a purchase</p>
        </div>
      )}

      {/* Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Preform Purchase">
        <FormField label="Date">
          <Input type="date" value={form.date}
            onChange={e => set('date', e.target.value)} />
        </FormField>

        <FormField label="Supplier">
          <Select value={form.supplier_id}
            onChange={e => set('supplier_id', e.target.value)}>
            <option value="">Select supplier...</option>
            {suppliers.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </Select>
        </FormField>

        <FormField label="Invoice No (optional)">
          <Input value={form.invoice_no}
            onChange={e => set('invoice_no', e.target.value)}
            placeholder="e.g. INV-001" />
        </FormField>

        <FormField label="Preform Type (Bottle Type)">
          <Select value={form.bottle_type_id}
            onChange={e => set('bottle_type_id', e.target.value)}>
            <option value="">Select bottle type...</option>
            {bottleTypes.map(b => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.weight_grams}g)
              </option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Quantity (nos)">
            <Input type="number" value={form.quantity_nos}
              onChange={e => set('quantity_nos', e.target.value)}
              placeholder="25000" />
          </FormField>
          <FormField label="Rate per KG (₹)">
            <Input type="number" step="0.01" value={form.rate_per_kg}
              onChange={e => set('rate_per_kg', e.target.value)}
              placeholder="158" />
          </FormField>
        </div>

        <FormField label="Bill Amount (₹)">
          <Input type="number" step="0.01" value={form.bill_amount}
            onChange={e => set('bill_amount', e.target.value)}
            placeholder="Total invoice amount incl. GST" />
        </FormField>

        <button
          onClick={handleSave}
          disabled={saving || !form.supplier_id || !form.bottle_type_id || !form.quantity_nos}
          className="w-full bg-navy text-white font-semibold py-4 rounded-2xl mt-2 disabled:opacity-40 transition text-sm"
        >
          {saving ? 'Saving...' : 'Save Purchase'}
        </button>
      </Modal>
    </Layout>
  );
}

// ─── PURCHASE CARD ────────────────────────────────────────────
function PurchaseCard({ entry, onDelete }) {
  return (
    <div className="bg-white rounded-3xl p-4">
      <div className="flex items-start justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-black">{entry.supplier_name}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {new Date(entry.date).toLocaleDateString('en-IN')}
            {entry.invoice_no ? ` · ${entry.invoice_no}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <p className="text-sm font-bold text-navy">₹{Number(entry.bill_amount).toLocaleString('en-IN')}</p>
          <button
            onClick={onDelete}
            className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-400 text-xs hover:bg-red-100 transition"
          >🗑️</button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-app-bg rounded-2xl p-2 text-center">
          <p className="text-sm font-bold text-black">{Number(entry.quantity_nos).toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-400">Preforms</p>
        </div>
        <div className="bg-app-bg rounded-2xl p-2 text-center">
          <p className="text-sm font-bold text-black">₹{entry.rate_per_kg}/kg</p>
          <p className="text-xs text-gray-400">Rate</p>
        </div>
        <div className="bg-navy rounded-2xl p-2 text-center">
          <p className="text-sm font-bold text-white truncate">{entry.bottle_name}</p>
          <p className="text-xs text-navy-light">Type</p>
        </div>
      </div>
    </div>
  );
}