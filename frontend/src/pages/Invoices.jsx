import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Eye, Download, Trash2, FileText, Search, Store, Truck,
  ChevronDown, ChevronUp, Plus, AlertCircle, X, AlertTriangle, LockKeyhole, Unlock,
} from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import FormField, { Input, Select } from '../components/FormField';
import { SkeletonList } from '../components/Skeleton';
import { salesApi } from '../api/sales.api';
import { mastersApi } from '../api/masters.api';
import { costingApi } from '../api/costing.api';

const today    = () => new Date().toISOString().split('T')[0];
const fmt      = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const API_BASE = import.meta.env.VITE_API_URL || '/api';
const GST_PCT  = 0.18;

const TYPE_TABS = [
  { value: '',         label: 'All'      },
  { value: 'local',    label: 'Local'    },
  { value: 'despatch', label: 'Despatch' },
];

const emptyForm     = { date: today(), invoice_no: '', customer_id: '', sale_type: 'local', place_of_supply: '', narration: '' };
const emptyLineItem = { bottle_type_id: '', quantity: '', rate: '', suggestedRate: '', rateOverridden: false };

export default function Invoices() {
  const [entries,     setEntries]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [downloading, setDownloading] = useState(null);
  const [search,      setSearch]      = useState('');
  const [typeTab,     setTypeTab]     = useState('');
  const [expandedId,  setExpandedId]  = useState(null);
  const [itemsCache,  setItemsCache]  = useState({});

  // Add invoice state
  const [addModal,    setAddModal]    = useState(false);
  const [form,        setForm]        = useState(emptyForm);
  const [lineItems,   setLineItems]   = useState([{ ...emptyLineItem }]);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState('');
  const [customers,   setCustomers]   = useState([]);
  const [bottleTypes, setBottleTypes] = useState([]);
  const [costingMap,  setCostingMap]  = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await salesApi.getAll({});
      setEntries(r.data.data);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    mastersApi.getCustomers().then(r => setCustomers(r.data.data.filter(c => c.is_active)));
    mastersApi.getBottleTypes().then(r => setBottleTypes(r.data.data.filter(b => b.is_active)));
    costingApi.getLatest().then(r => {
      const map = {};
      r.data.data.forEach(c => {
        const rate = Number(c.cap_cost) > 0
          ? Number(c.total_cost_with_cap)
          : Number(c.total_cost_with_gst);
        map[c.bottle_type_id] = rate.toFixed(4);
      });
      setCostingMap(map);
    });
  }, []);

  // Client-side filter: search + type tab
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return entries.filter(e => {
      const matchType   = !typeTab || e.sale_type === typeTab;
      const matchSearch = !q ||
        (e.invoice_display || '').toLowerCase().includes(q) ||
        (e.customer_name   || '').toLowerCase().includes(q);
      return matchType && matchSearch;
    });
  }, [entries, search, typeTab]);

  const totalBill = filtered.reduce((s, e) => s + Number(e.bill_amount || 0), 0);
  const totalGST  = filtered.reduce((s, e) => s + Number(e.gst_amount  || 0), 0);
  const totalNet  = filtered.reduce((s, e) => s + Number(e.net_amount  || 0), 0);

  async function toggleExpand(id) {
    if (expandedId === id) { setExpandedId(null); return; }
    setExpandedId(id);
    if (!itemsCache[id]) {
      const r = await salesApi.getItems(id);
      setItemsCache(p => ({ ...p, [id]: r.data.data }));
    }
  }

  async function handleDownload(id, invoiceDisplay, mode = 'download') {
    setDownloading(id);
    try {
      const url = `${API_BASE}/sales/${id}/${mode === 'preview' ? 'preview' : 'pdf'}`;
      if (mode === 'preview') {
        window.open(url, '_blank');
      } else {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed');
        const blob = await res.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Invoice_${invoiceDisplay || id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }
    } finally { setDownloading(null); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return;
    await salesApi.remove(id);
    await load();
  }

  // ── Add Invoice form helpers ──────────────────────────────────
  const netAmount  = lineItems.reduce((s, it) => s + (parseFloat(it.amount) || 0), 0);
  const gstAmount  = netAmount * GST_PCT;
  const billAmount = netAmount + gstAmount;

  function setF(field, value) { setForm(f => ({ ...f, [field]: value })); }

  function handleCustomerChange(customerId) {
    setF('customer_id', customerId);
    const cust = customers.find(c => c.id === customerId);
    if (cust?.pincode) setF('place_of_supply', cust.pincode);
    else if (cust?.state) setF('place_of_supply', cust.state);
  }

  function setLineItem(i, field, value) {
    setLineItems(prev => {
      const next = [...prev];
      next[i] = { ...next[i], [field]: value };
      if (field === 'bottle_type_id') {
        const suggested = costingMap[value];
        if (suggested && !next[i].rateOverridden) {
          next[i].suggestedRate = suggested;
          next[i].rate          = suggested;
          next[i].amount = ((parseFloat(next[i].quantity) || 0) * parseFloat(suggested)).toFixed(2);
        }
      }
      if (field === 'quantity' || field === 'rate') {
        const qty  = field === 'quantity' ? value : next[i].quantity;
        const rate = field === 'rate'     ? value : next[i].rate;
        next[i].amount = ((parseFloat(qty) || 0) * (parseFloat(rate) || 0)).toFixed(2);
      }
      return next;
    });
  }

  function overrideRate(i) {
    setLineItems(prev => {
      const next = [...prev];
      next[i] = { ...next[i], rateOverridden: true };
      return next;
    });
  }

  function resetRate(i) {
    setLineItems(prev => {
      const next = [...prev];
      const suggested = next[i].suggestedRate;
      next[i] = {
        ...next[i],
        rate: suggested,
        rateOverridden: false,
        amount: ((parseFloat(next[i].quantity) || 0) * (parseFloat(suggested) || 0)).toFixed(2),
      };
      return next;
    });
  }

  function addLineItem()     { setLineItems(p => [...p, { ...emptyLineItem }]); }
  function removeLineItem(i) { setLineItems(p => p.filter((_, idx) => idx !== i)); }

  function openAdd() {
    setForm(emptyForm);
    setLineItems([{ ...emptyLineItem }]);
    setSaveError('');
    setAddModal(true);
  }

  async function handleSave() {
    if (!form.customer_id || lineItems.some(it => !it.bottle_type_id || !it.quantity || !it.rate)) return;
    setSaving(true);
    setSaveError('');
    try {
      await salesApi.create({
        ...form,
        net_amount:  netAmount.toFixed(2),
        gst_amount:  gstAmount.toFixed(2),
        bill_amount: billAmount.toFixed(2),
        items: lineItems.map(it => ({
          bottle_type_id: it.bottle_type_id,
          quantity:       parseInt(it.quantity),
          rate:           parseFloat(it.rate),
          amount:         parseFloat(it.amount),
          rate_overridden: it.rateOverridden ? 1 : 0,
        })),
      });
      await load();
      setAddModal(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save invoice');
    } finally { setSaving(false); }
  }

  return (
    <Layout title="Invoices" subtitle="Administrator">

      {/* Search + add button row */}
      <div className="mb-4">
        <div className="flex gap-2 mb-3">
          <div className="relative flex-1">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search invoice..."
              className="input-base pl-11"
            />
          </div>
          <button onClick={openAdd}
            className="hidden lg:flex items-center gap-1.5 btn-primary px-5 py-3 text-sm whitespace-nowrap">
            <Plus size={16} /> Add Invoice
          </button>
        </div>
        <div className="flex gap-2">
          {TYPE_TABS.map(tab => (
            <button
              key={tab.value}
              onClick={() => setTypeTab(tab.value)}
              className={`px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                typeTab === tab.value
                  ? 'bg-navy text-white'
                  : 'bg-white text-gray-500 shadow-card hover:bg-app-bg'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Mobile FAB */}
      <div className="lg:hidden fixed bottom-20 right-4 z-[45]">
        <button onClick={openAdd}
          className="w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center shadow-fab">
          <Plus size={24} />
        </button>
      </div>

      {/* Summary strip */}
      {!loading && filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-5">
          <SummaryChip label="Total Billed" value={`₹${fmt(totalBill)}`} accent />
          <SummaryChip label="Net Amount"   value={`₹${fmt(totalNet)}`}  />
          <SummaryChip label="Total GST"    value={`₹${fmt(totalGST)}`}  />
        </div>
      )}

      {/* ── Desktop table ─────────────────────────────────────── */}
      <div className="hidden lg:block bg-white rounded-3xl overflow-hidden shadow-card mb-6">
        {loading ? (
          <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left px-5 py-4 section-label">Invoice #</th>
                <th className="text-left px-5 py-4 section-label">Customer</th>
                <th className="text-left px-5 py-4 section-label">Type</th>
                <th className="text-left px-5 py-4 section-label">Date</th>
                <th className="text-right px-5 py-4 section-label">Net Amt</th>
                <th className="text-right px-5 py-4 section-label">GST</th>
                <th className="text-right px-5 py-4 section-label">Bill Amt</th>
                <th className="px-5 py-4" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-16">
                    <FileText size={28} className="text-gray-200 mx-auto mb-2" />
                    <p className="text-gray-400 text-sm">No invoices found</p>
                  </td>
                </tr>
              ) : filtered.map(e => (
                <tr key={e.id}
                  className="border-b border-gray-50 hover:bg-app-bg/40 transition cursor-pointer"
                  onClick={() => toggleExpand(e.id)}
                >
                  <td className="px-5 py-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">
                      {e.invoice_display || '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4 font-semibold text-black">{e.customer_name}</td>
                  <td className="px-5 py-4">
                    <TypeBadge type={e.sale_type} />
                  </td>
                  <td className="px-5 py-4 text-gray-500">
                    {new Date(e.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </td>
                  <td className="px-5 py-4 text-right text-gray-600">₹{fmt(e.net_amount)}</td>
                  <td className="px-5 py-4 text-right text-gray-600">₹{fmt(e.gst_amount)}</td>
                  <td className="px-5 py-4 text-right font-bold text-black">₹{fmt(e.bill_amount)}</td>
                  <td className="px-5 py-4" onClick={ev => ev.stopPropagation()}>
                    <div className="flex items-center gap-1 justify-end">
                      <button onClick={() => handleDownload(e.id, e.invoice_display, 'preview')}
                        className="icon-btn bg-app-bg text-gray-500 hover:bg-blue-50 hover:text-blue-600">
                        <Eye size={14} />
                      </button>
                      <button onClick={() => handleDownload(e.id, e.invoice_display, 'download')}
                        disabled={downloading === e.id}
                        className="icon-btn bg-app-bg text-gray-500 hover:bg-green-50 hover:text-green-600 disabled:opacity-40">
                        <Download size={14} />
                      </button>
                      <button onClick={() => handleDelete(e.id)}
                        className="icon-btn bg-app-bg text-gray-400 hover:bg-red-50 hover:text-red-500">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Expanded items inline in table */}
        {filtered.map(e => expandedId === e.id && (
          <div key={`exp-${e.id}`} className="border-t border-gray-100 bg-app-bg/50 px-5 py-4">
            <InvoiceDetail entry={e} items={itemsCache[e.id]} />
          </div>
        ))}
      </div>

      {/* ── Mobile cards ──────────────────────────────────────── */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <SkeletonList count={4} />
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <FileText size={28} className="text-gray-200 mx-auto mb-2" />
            <p className="text-gray-400 text-sm">No invoices found</p>
          </div>
        ) : filtered.map(e => (
          <InvoiceCard
            key={e.id}
            entry={e}
            expanded={expandedId === e.id}
            items={itemsCache[e.id]}
            onToggle={() => toggleExpand(e.id)}
            onDownload={(mode) => handleDownload(e.id, e.invoice_display, mode)}
            onDelete={() => handleDelete(e.id)}
            downloading={downloading === e.id}
          />
        ))}
      </div>

      {/* ── Add Invoice Modal ─────────────────────────────────── */}
      <Modal isOpen={addModal} onClose={() => setAddModal(false)} title="New Sales Invoice">
        {saveError && (
          <div className="flex items-start gap-2 bg-danger-bg text-danger text-sm rounded-2xl px-4 py-3 mb-4">
            <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
            <span>{saveError}</span>
          </div>
        )}
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
              {[
                { value: 'local',    label: 'Local',    icon: Store },
                { value: 'despatch', label: 'Despatch', icon: Truck },
              ].map(t => (
                <button key={t.value} onClick={() => setF('sale_type', t.value)}
                  className={`flex-1 flex items-center justify-center gap-1 py-3 rounded-2xl text-xs font-semibold transition ${
                    form.sale_type === t.value ? 'bg-navy text-white' : 'bg-app-bg text-gray-500'
                  }`}>
                  <t.icon size={13} /> {t.label}
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
          <p className="section-label">Items</p>
          <button onClick={addLineItem}
            className="text-xs font-semibold text-navy bg-navy-faint px-3 py-1.5 rounded-full flex items-center gap-1">
            <Plus size={12} /> Add Item
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {lineItems.map((item, i) => (
            <div key={i} className="bg-app-bg rounded-2xl p-3 text-xs">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500">Item {i + 1}</p>
                {lineItems.length > 1 && (
                  <button onClick={() => removeLineItem(i)} className="text-danger flex items-center gap-1">
                    <X size={12} /> Remove
                  </button>
                )}
              </div>
              <Select value={item.bottle_type_id} onChange={e => setLineItem(i, 'bottle_type_id', e.target.value)}>
                <option value="">Select bottle type...</option>
                {bottleTypes.map(b => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </Select>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <div>
                  <p className="text-xs text-gray-400 mb-1">Qty (Nos)</p>
                  <Input type="number" value={item.quantity}
                    onChange={e => setLineItem(i, 'quantity', e.target.value)}
                    placeholder="1000" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-xs text-gray-400">Rate ₹/Nos</p>
                    {item.suggestedRate && !item.rateOverridden && (
                      <button onClick={() => overrideRate(i)}
                        className="flex items-center gap-0.5 text-xs text-amber-600 font-semibold hover:text-amber-700">
                        <Unlock size={10} /> Override
                      </button>
                    )}
                    {item.rateOverridden && (
                      <button onClick={() => resetRate(i)}
                        className="flex items-center gap-0.5 text-xs text-navy font-semibold hover:text-navy-dark">
                        <LockKeyhole size={10} /> Reset
                      </button>
                    )}
                  </div>
                  <input type="number" step="0.0001" value={item.rate}
                    onChange={e => setLineItem(i, 'rate', e.target.value)}
                    readOnly={!!item.suggestedRate && !item.rateOverridden}
                    placeholder="3.50"
                    className="input-base"
                    style={
                      item.rateOverridden
                        ? { borderColor: '#F59E0B', background: '#FFFBEB' }
                        : item.suggestedRate && !item.rateOverridden
                        ? { cursor: 'not-allowed', opacity: 0.75 }
                        : {}
                    }
                  />
                  {item.rateOverridden && (
                    <p className="flex items-center gap-1 text-xs text-amber-600 mt-1">
                      <AlertTriangle size={10} /> Rate overridden
                    </p>
                  )}
                  {item.suggestedRate && !item.rateOverridden && (
                    <p className="text-xs text-gray-400 mt-0.5">From costing</p>
                  )}
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Amount</p>
                  <div className="bg-white rounded-2xl px-3 py-3 text-xs font-bold text-navy">
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
          className="w-full btn-primary">
          {saving ? 'Saving...' : 'Save Invoice'}
        </button>
      </Modal>
    </Layout>
  );
}

// ── Invoice card (mobile + desktop expanded) ──────────────────
function InvoiceCard({ entry, expanded, items, onToggle, onDownload, onDelete, downloading }) {
  return (
    <div className="bg-white rounded-3xl overflow-hidden shadow-card">
      {/* Header */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {entry.invoice_display && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">
                  {entry.invoice_display}
                </span>
              )}
              <TypeBadge type={entry.sale_type} />
            </div>
            <p className="text-sm font-bold text-black">{entry.customer_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {entry.entered_by_name ? ` · ${entry.entered_by_name}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <p className="text-base font-bold text-black">₹{fmt(entry.bill_amount)}</p>
              <p className="text-xs text-gray-400">incl. GST</p>
            </div>
            <button onClick={onDelete}
              className="icon-btn bg-app-bg text-gray-400 hover:bg-red-50 hover:text-red-500">
              <Trash2 size={15} />
            </button>
            <button onClick={onToggle}
              className="icon-btn bg-app-bg text-gray-400 hover:bg-gray-200">
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3">
          <InvoiceDetail entry={entry} items={items} />
          {/* Download actions */}
          <div className="flex gap-2 mt-4">
            <button onClick={() => onDownload('preview')}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold bg-app-bg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition">
              <Eye size={13} /> Preview
            </button>
            <button onClick={() => onDownload('download')} disabled={downloading}
              className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold bg-app-bg text-gray-600 hover:bg-green-50 hover:text-green-600 transition disabled:opacity-40">
              <Download size={13} /> Download
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Shared expanded detail panel ──────────────────────────────
function InvoiceDetail({ entry, items }) {
  if (!items) {
    return <p className="text-xs text-gray-400 py-2">Loading items…</p>;
  }
  return (
    <div>
      {/* Line items */}
      <div className="space-y-3 mb-3">
        {items.map(item => (
          <div key={item.id} className="flex items-start justify-between">
            <div>
              <p className="text-sm font-semibold text-black">{item.bottle_name}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                {Number(item.quantity).toLocaleString('en-IN')} Nos × ₹{item.rate}
                {item.hsn_code ? ` · HSN ${item.hsn_code}` : ''}
              </p>
              {item.rate_overridden ? (
                <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full mt-1">
                  <AlertTriangle size={10} /> Rate overridden
                </span>
              ) : null}
            </div>
            <p className="text-sm font-bold text-black ml-4 flex-shrink-0">
              ₹{Number(item.amount).toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>

      {/* Tax summary box */}
      <div className="bg-gray-50 rounded-2xl p-4 space-y-2">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Net</span>
          <span>₹{Number(entry.net_amount).toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>CGST 9%</span>
          <span>₹{Number(entry.gst_amount / 2).toLocaleString('en-IN')}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>SGST 9%</span>
          <span>₹{Number(entry.gst_amount / 2).toLocaleString('en-IN')}</span>
        </div>
        <div className="border-t border-gray-200 pt-2 flex justify-between text-sm font-bold text-black">
          <span>Total</span>
          <span>₹{Number(entry.bill_amount).toLocaleString('en-IN')}</span>
        </div>
      </div>

      {/* Footer */}
      <div className="mt-3 space-y-0.5">
        {entry.place_of_supply && (
          <p className="text-xs text-emerald-600">Place of Supply: {entry.place_of_supply}</p>
        )}
        {entry.narration && (
          <p className="text-xs text-gray-400">Note: {entry.narration}</p>
        )}
      </div>
    </div>
  );
}

// ── Type badge ─────────────────────────────────────────────────
function TypeBadge({ type }) {
  if (type === 'local') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">
        <Store size={10} /> Local
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
      <Truck size={10} /> Despatch
    </span>
  );
}

// ── Summary chip ───────────────────────────────────────────────
function SummaryChip({ label, value, accent }) {
  return (
    <div className={`rounded-2xl px-4 py-3 ${accent ? 'bg-navy' : 'bg-white shadow-card'}`}>
      <p className={`section-label mb-1 ${accent ? 'text-navy-light' : ''}`}>{label}</p>
      <p className={`text-base font-bold ${accent ? 'text-white' : 'text-black'}`}>{value}</p>
    </div>
  );
}
