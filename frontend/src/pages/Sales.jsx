// frontend/src/pages/Sales.jsx — UPDATED v2
// Adds: invoice_display, place_of_supply, narration field
// Adds: PDF download + preview buttons on each invoice card
// Adds: FAB for mobile

import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import FormField, { Input, Select } from '../components/FormField';
import { salesApi } from '../api/sales.api';
import { mastersApi } from '../api/masters.api';

const today   = () => new Date().toISOString().split('T')[0];
const fmt     = (n) => Number(n || 0).toLocaleString('en-IN');
const GST_PCT = 0.18;

const emptyForm = {
  date: today(), invoice_no: '', customer_id: '', sale_type: 'local',
  place_of_supply: 'Tamil Nadu', narration: '',
};
const emptyItem = { bottle_type_id: '', quantity: '', rate: '' };

export default function Sales() {
  const [entries,     setEntries]     = useState([]);
  const [customers,   setCustomers]   = useState([]);
  const [bottleTypes, setBottleTypes] = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [modal,       setModal]       = useState(false);
  const [form,        setForm]        = useState(emptyForm);
  const [items,       setItems]       = useState([{ ...emptyItem }]);
  const [saving,      setSaving]      = useState(false);
  const [expandedId,  setExpandedId]  = useState(null);
  const [saleItems,   setSaleItems]   = useState({});
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterCust,  setFilterCust]  = useState('');

  const load = useCallback(async () => {
    const [y, m] = filterMonth.split('-');
    const [r, s] = await Promise.all([
      salesApi.getMonthly(y, m),
      salesApi.getSummary(y, m),
    ]);
    setEntries(r.data.data);
    setSummary(s.data.data);
  }, [filterMonth]);

  useEffect(() => {
    load();
    mastersApi.getCustomers().then(r => setCustomers(r.data.data.filter(c => c.is_active)));
    mastersApi.getBottleTypes().then(r => setBottleTypes(r.data.data.filter(b => b.is_active)));
  }, [load]);

  // When customer changes, auto-fill place_of_supply from their state
  function handleCustomerChange(customerId) {
    setF('customer_id', customerId);
    const cust = customers.find(c => c.id === customerId);
    if (cust?.state) setF('place_of_supply', cust.state);
  }

  function setF(field, value) { setForm(f => ({ ...f, [field]: value })); }

  function setItem(i, field, value) {
    setItems(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === 'quantity' || field === 'rate') {
        const qty  = field === 'quantity' ? value : next[i].quantity;
        const rate = field === 'rate'     ? value : next[i].rate;
        next[i].amount = ((parseFloat(qty) || 0) * (parseFloat(rate) || 0)).toFixed(2);
      }
      return next;
    });
  }

  function addItem()     { setItems(p => [...p, { ...emptyItem }]); }
  function removeItem(i) { setItems(p => p.filter((_, idx) => idx !== i)); }

  const netAmount  = items.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  const gstAmount  = netAmount * GST_PCT;
  const billAmount = netAmount + gstAmount;

  function openAdd() {
    setForm(emptyForm);
    setItems([{ ...emptyItem }]);
    setModal(true);
  }

  async function handleSave() {
    if (!form.customer_id || items.some(it => !it.bottle_type_id || !it.quantity || !it.rate)) return;
    setSaving(true);
    try {
      await salesApi.create({
        ...form,
        net_amount:  netAmount.toFixed(2),
        gst_amount:  gstAmount.toFixed(2),
        bill_amount: billAmount.toFixed(2),
        items: items.map(it => ({
          bottle_type_id: it.bottle_type_id,
          quantity:       parseInt(it.quantity),
          rate:           parseFloat(it.rate),
          amount:         parseFloat(it.amount),
        })),
      });
      await load();
      setModal(false);
    } finally { setSaving(false); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this invoice?')) return;
    await salesApi.remove(id);
    await load();
  }

  async function toggleExpand(id) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!saleItems[id]) {
      const r = await salesApi.getItems(id);
      setSaleItems(p => ({ ...p, [id]: r.data.data }));
    }
  }

  const filtered = filterCust
    ? entries.filter(e => e.customer_id === filterCust)
    : entries;

  return (
    <Layout title="Sales" subtitle="Supervisor">

      {/* Filters row */}
      <div className="flex items-center gap-2 mb-4 min-w-0">
        <div className="flex-1 min-w-0">
          <input type="month" value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="w-full bg-white border-0 rounded-2xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-navy-light" />
        </div>
        <div className="hidden lg:flex">
          <button onClick={openAdd}
            className="bg-navy text-white text-sm font-semibold px-5 py-3 rounded-2xl whitespace-nowrap">
            + Invoice
          </button>
        </div>
      </div>

      {/* Customer filter */}
      <div className="mb-6">
        <select value={filterCust} onChange={e => setFilterCust(e.target.value)}
          className="w-full bg-white border-0 rounded-2xl px-4 py-3 text-sm font-medium text-black focus:outline-none focus:ring-2 focus:ring-navy-light appearance-none">
          <option value="">All Customers</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Mobile FAB */}
      <div className="lg:hidden fixed bottom-20 right-4 z-[45]">
        <button onClick={openAdd}
          className="w-14 h-14 rounded-full bg-navy text-white text-3xl leading-none flex items-center justify-center shadow-lg">
          +
        </button>
      </div>

      {/* Month Summary */}
      {summary?.invoice_count > 0 && (
        <div className="bg-navy rounded-3xl p-5 mb-6">
          <p className="text-navy-light text-xs font-semibold uppercase tracking-wider mb-3">Month Summary</p>
          <div className="grid grid-cols-2 gap-4 mb-3">
            <div>
              <p className="text-2xl font-bold text-white">₹{fmt(summary.total_sales)}</p>
              <p className="text-navy-light text-xs mt-1">Total Sales (incl. GST)</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">₹{fmt(summary.total_net)}</p>
              <p className="text-navy-light text-xs mt-1">Net Amount</p>
            </div>
          </div>
          <div className="flex gap-6">
            <div>
              <p className="text-lg font-bold text-white">₹{fmt(summary.total_gst)}</p>
              <p className="text-navy-light text-xs">GST Collected</p>
            </div>
            <div>
              <p className="text-lg font-bold text-white">{summary.invoice_count}</p>
              <p className="text-navy-light text-xs">Invoices</p>
            </div>
          </div>
        </div>
      )}

      {/* Sales list */}
      <div className="space-y-3">
        {filtered.map(entry => (
          <SaleCard
            key={entry.id}
            entry={entry}
            expanded={expandedId === entry.id}
            items={saleItems[entry.id]}
            onToggle={() => toggleExpand(entry.id)}
            onDelete={() => handleDelete(entry.id)}
          />
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-16">
          <p className="text-4xl mb-3">🧾</p>
          <p className="text-gray-500 font-medium">No sales this month</p>
          <p className="text-gray-400 text-sm mt-1">Tap + Invoice to raise a sale</p>
        </div>
      )}

      {/* New Invoice Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Sales Invoice">
        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date">
            <Input type="date" value={form.date} onChange={e => setF('date', e.target.value)} />
          </FormField>
          <FormField label="Ref / Challan No">
            <Input value={form.invoice_no} onChange={e => setF('invoice_no', e.target.value)} placeholder="Optional ref" />
          </FormField>
        </div>

        <FormField label="Customer">
          <Select value={form.customer_id} onChange={e => handleCustomerChange(e.target.value)}>
            <option value="">Select customer...</option>
            {customers.map(c => (
              <option key={c.id} value={c.id}>{c.name} — {c.type}</option>
            ))}
          </Select>
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Sale Type">
            <div className="flex gap-2">
              {['local', 'despatch'].map(t => (
                <button key={t} onClick={() => setF('sale_type', t)}
                  className={`flex-1 py-3 rounded-2xl text-xs font-semibold transition ${
                    form.sale_type === t ? 'bg-navy text-white' : 'bg-app-bg text-gray-500'
                  }`}>
                  {t === 'local' ? '🏪 Local' : '🚛 Despatch'}
                </button>
              ))}
            </div>
          </FormField>
          <FormField label="Place of Supply">
            <Input value={form.place_of_supply} onChange={e => setF('place_of_supply', e.target.value)} placeholder="Tamil Nadu" />
          </FormField>
        </div>

        {/* Line items */}
        <div className="flex items-center justify-between mb-3 mt-2">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Items</p>
          <button onClick={addItem}
            className="text-xs font-semibold text-navy bg-navy-light/20 px-3 py-1 rounded-full">
            + Add Item
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {items.map((item, i) => (
            <div key={i} className="bg-app-bg rounded-2xl p-2.5 text-xs">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500">Item {i + 1}</p>
                {items.length > 1 && (
                  <button onClick={() => removeItem(i)} className="text-red-400 text-xs">✕ Remove</button>
                )}
              </div>
              <Select value={item.bottle_type_id} onChange={e => setItem(i, 'bottle_type_id', e.target.value)}
                className="text-xs px-3 py-2.5 rounded-xl">
                <option value="">Select bottle type...</option>
                {bottleTypes.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Qty (Nos)</p>
                  <Input type="number" value={item.quantity}
                    onChange={e => setItem(i, 'quantity', e.target.value)}
                    placeholder="1000" className="text-xs px-3 py-2.5 rounded-xl" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Rate ₹/Nos</p>
                  <Input type="number" step="0.01" value={item.rate}
                    onChange={e => setItem(i, 'rate', e.target.value)}
                    placeholder="3.50" className="text-xs px-3 py-2.5 rounded-xl" />
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Amount</p>
                  <div className="bg-white rounded-xl px-2.5 py-2.5 text-xs font-bold text-navy">
                    ₹{fmt(item.amount || 0)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="bg-navy rounded-2xl p-4 mb-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-navy-light">Net Amount</span>
            <span className="text-white font-semibold">₹{fmt(netAmount.toFixed(2))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-navy-light">CGST 9%</span>
            <span className="text-white font-semibold">₹{fmt((gstAmount / 2).toFixed(2))}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-navy-light">SGST 9%</span>
            <span className="text-white font-semibold">₹{fmt((gstAmount / 2).toFixed(2))}</span>
          </div>
          <div className="flex justify-between text-sm border-t border-navy-light/30 pt-2">
            <span className="text-navy-light font-bold">Bill Amount</span>
            <span className="text-white font-bold text-base">₹{fmt(billAmount.toFixed(2))}</span>
          </div>
        </div>

        <FormField label="Narration (optional)">
          <Input value={form.narration} onChange={e => setF('narration', e.target.value)} placeholder="e.g. Against PO #123" />
        </FormField>

        <button onClick={handleSave} disabled={saving || !form.customer_id}
          className="w-full bg-navy text-white font-semibold py-4 rounded-2xl disabled:opacity-40 transition text-sm mt-2">
          {saving ? 'Saving...' : 'Save Invoice'}
        </button>
      </Modal>
    </Layout>
  );
}

// ─── SALE CARD ────────────────────────────────────────────────
function SaleCard({ entry, expanded, items, onToggle, onDelete }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload(e, mode = 'download') {
    e.stopPropagation();
    setDownloading(true);
    try {
      const url = `${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/sales/${entry.id}/${mode === 'download' ? 'pdf' : 'preview'}`;
      if (mode === 'preview') {
        window.open(url, '_blank');
      } else {
        const res = await fetch(url, { credentials: 'include' });
        const blob = await res.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Invoice_${entry.invoice_display || entry.id}.pdf`;
        link.click();
        URL.revokeObjectURL(link.href);
      }
    } finally { setDownloading(false); }
  }

  return (
    <div className="bg-white rounded-3xl overflow-hidden">
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {/* Invoice number badge */}
              {entry.invoice_display && (
                <span className="text-xs font-bold bg-navy text-white px-2 py-0.5 rounded-full">
                  {entry.invoice_display}
                </span>
              )}
              <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                entry.sale_type === 'local' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
              }`}>
                {entry.sale_type === 'local' ? '🏪 Local' : '🚛 Despatch'}
              </span>
            </div>
            <p className="text-sm font-bold text-black truncate">{entry.customer_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(entry.date).toLocaleDateString('en-IN')}
              {entry.entered_by_name ? ` · ${entry.entered_by_name}` : ''}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 ml-2 flex-shrink-0">
            <div className="text-right mr-1">
              <p className="text-sm font-bold text-navy">₹{Number(entry.bill_amount).toLocaleString('en-IN')}</p>
              <p className="text-xs text-gray-400">incl. GST</p>
            </div>
            {/* Preview in browser */}
            <button onClick={e => handleDownload(e, 'preview')}
              title="Preview PDF"
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 text-blue-500 text-xs hover:bg-blue-100 transition">
              👁️
            </button>
            {/* Download PDF */}
            <button onClick={e => handleDownload(e, 'download')}
              title="Download Invoice PDF"
              disabled={downloading}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-green-50 text-green-600 text-xs hover:bg-green-100 transition disabled:opacity-50">
              {downloading ? '⏳' : '⬇️'}
            </button>
            <button onClick={onDelete}
              className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-400 text-xs hover:bg-red-100 transition">
              🗑️
            </button>
          </div>
        </div>
      </div>

      {/* Expanded items */}
      {expanded && (
        <div className="border-t border-gray-50 px-4 pb-4 pt-3">
          {items ? (
            <div className="space-y-2">
              {items.map(item => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-black">{item.bottle_name}</p>
                    <p className="text-xs text-gray-400">
                      {Number(item.quantity).toLocaleString('en-IN')} Nos × ₹{item.rate}
                      {item.hsn_code ? ` · HSN ${item.hsn_code}` : ''}
                    </p>
                  </div>
                  <p className="text-xs font-bold text-navy">₹{Number(item.amount).toLocaleString('en-IN')}</p>
                </div>
              ))}
              <div className="flex flex-col gap-0.5 pt-2 border-t border-gray-100 text-xs text-gray-400">
                <span>Net ₹{Number(entry.net_amount).toLocaleString('en-IN')} + CGST ₹{Number(entry.gst_amount / 2).toLocaleString('en-IN')} + SGST ₹{Number(entry.gst_amount / 2).toLocaleString('en-IN')}</span>
                {entry.place_of_supply && <span>Place of Supply: {entry.place_of_supply}</span>}
                {entry.narration && <span>Note: {entry.narration}</span>}
              </div>
            </div>
          ) : (
            <p className="text-xs text-gray-400">Loading items...</p>
          )}
        </div>
      )}
    </div>
  );
}