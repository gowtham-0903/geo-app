import { useState, useEffect, useCallback } from 'react';
import { Plus, Eye, Download, Trash2, Receipt, Store, Truck, X, AlertCircle, ChevronDown, ChevronUp, AlertTriangle, LockKeyhole, Unlock } from 'lucide-react';
import Layout from '../components/Layout';
import Modal from '../components/Modal';
import FormField, { Input, Select } from '../components/FormField';
import { SkeletonList } from '../components/Skeleton';
import { salesApi } from '../api/sales.api';
import { mastersApi } from '../api/masters.api';
import { costingApi } from '../api/costing.api';

const today   = () => new Date().toISOString().split('T')[0];
const fmt     = (n) => Number(n || 0).toLocaleString('en-IN');
const GST_PCT = 0.18;

const emptyForm = {
  date: today(), invoice_no: '', customer_id: '', sale_type: 'local',
  place_of_supply: '', narration: '',
};
const emptyItem = { bottle_type_id: '', quantity: '', rate: '', suggestedRate: '', rateOverridden: false };

export default function Sales() {
  const [entries,     setEntries]     = useState([]);
  const [customers,   setCustomers]   = useState([]);
  const [bottleTypes, setBottleTypes] = useState([]);
  const [summary,     setSummary]     = useState(null);
  const [modal,       setModal]       = useState(false);
  const [form,        setForm]        = useState(emptyForm);
  const [items,       setItems]       = useState([{ ...emptyItem }]);
  const [saving,      setSaving]      = useState(false);
  const [saveError,   setSaveError]   = useState('');
  const [loading,     setLoading]     = useState(true);
  const [expandedId,  setExpandedId]  = useState(null);
  const [saleItems,   setSaleItems]   = useState({});
  const [filterMonth, setFilterMonth] = useState(new Date().toISOString().slice(0, 7));
  const [filterCust,  setFilterCust]  = useState('');
  const [costingMap,  setCostingMap]  = useState({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [y, m] = filterMonth.split('-');
      const [r, s] = await Promise.all([
        salesApi.getMonthly(y, m),
        salesApi.getSummary(y, m),
      ]);
      setEntries(r.data.data);
      setSummary(s.data.data);
    } finally {
      setLoading(false);
    }
  }, [filterMonth]);

  useEffect(() => {
    load();
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
  }, [load]);

  function handleCustomerChange(customerId) {
    setF('customer_id', customerId);
    const cust = customers.find(c => c.id === customerId);
    if (cust?.pincode) setF('place_of_supply', cust.pincode);
    else if (cust?.state) setF('place_of_supply', cust.state);
  }

  function setF(field, value) { setForm(f => ({ ...f, [field]: value })); }

  function setItem(i, field, value) {
    setItems(prev => {
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
    setItems(prev => { const next = [...prev]; next[i] = { ...next[i], rateOverridden: true }; return next; });
  }

  function resetRate(i) {
    setItems(prev => {
      const next = [...prev];
      const suggested = next[i].suggestedRate;
      next[i] = {
        ...next[i], rate: suggested, rateOverridden: false,
        amount: ((parseFloat(next[i].quantity) || 0) * (parseFloat(suggested) || 0)).toFixed(2),
      };
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
    setSaveError('');
    setModal(true);
  }

  async function handleSave() {
    if (!form.customer_id || items.some(it => !it.bottle_type_id || !it.quantity || !it.rate)) return;
    setSaving(true);
    setSaveError('');
    try {
      await salesApi.create({
        ...form,
        net_amount:  netAmount.toFixed(2),
        gst_amount:  gstAmount.toFixed(2),
        bill_amount: billAmount.toFixed(2),
        items: items.map(it => ({
          bottle_type_id:  it.bottle_type_id,
          quantity:        parseInt(it.quantity),
          rate:            parseFloat(it.rate),
          amount:          parseFloat(it.amount),
          rate_overridden: it.rateOverridden ? 1 : 0,
        })),
      });
      await load();
      setModal(false);
    } catch (err) {
      setSaveError(err.response?.data?.message || 'Failed to save invoice');
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
      <div className="flex items-center gap-2 mb-4 min-w-0">
        <div className="flex-1 min-w-0">
          <input type="month" value={filterMonth}
            onChange={e => setFilterMonth(e.target.value)}
            className="input-base" />
        </div>
        <div className="hidden lg:flex">
          <button onClick={openAdd} className="flex items-center gap-2 btn-primary px-5 py-3">
            <Plus size={16} /> Invoice
          </button>
        </div>
      </div>

      <div className="mb-6">
        <select value={filterCust} onChange={e => setFilterCust(e.target.value)}
          className="input-base appearance-none">
          <option value="">All Customers</option>
          {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
      </div>

      {/* Mobile FAB */}
      <div className="lg:hidden fixed bottom-20 right-4 z-[45]">
        <button onClick={openAdd}
          className="w-14 h-14 rounded-full bg-navy text-white flex items-center justify-center shadow-fab">
          <Plus size={24} />
        </button>
      </div>

      {/* Month Summary */}
      {!loading && summary?.invoice_count > 0 && (
        <div className="bg-navy rounded-3xl p-5 mb-6">
          <p className="section-label text-navy-light mb-3">Month Summary</p>
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

      {loading ? (
        <SkeletonList count={4} />
      ) : (
        <>
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
              <div className="w-16 h-16 bg-navy-faint rounded-3xl flex items-center justify-center mx-auto mb-4">
                <Receipt size={28} className="text-navy-light" />
              </div>
              <p className="text-gray-500 font-semibold">No sales this month</p>
              <p className="text-gray-400 text-sm mt-1">Tap + to raise a sale invoice</p>
            </div>
          )}
        </>
      )}

      {/* New Invoice Modal */}
      <Modal isOpen={modal} onClose={() => setModal(false)} title="New Sales Invoice">
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
          <button onClick={addItem}
            className="text-xs font-semibold text-navy bg-navy-faint px-3 py-1.5 rounded-full flex items-center gap-1">
            <Plus size={12} /> Add Item
          </button>
        </div>

        <div className="space-y-3 mb-4">
          {items.map((item, i) => (
            <div key={i} className="bg-app-bg rounded-2xl p-3 text-xs">
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold text-gray-500">Item {i + 1}</p>
                {items.length > 1 && (
                  <button onClick={() => removeItem(i)} className="text-danger flex items-center gap-1">
                    <X size={12} /> Remove
                  </button>
                )}
              </div>
              <Select value={item.bottle_type_id} onChange={e => setItem(i, 'bottle_type_id', e.target.value)}>
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
                        className="flex items-center gap-0.5 text-xs text-navy font-semibold">
                        <LockKeyhole size={10} /> Reset
                      </button>
                    )}
                  </div>
                  <input type="number" step="0.0001" value={item.rate}
                    onChange={e => setItem(i, 'rate', e.target.value)}
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

function SaleCard({ entry, expanded, items, onToggle, onDelete }) {
  const [downloading, setDownloading] = useState(false);

  async function handleDownload(e, mode = 'download') {
    e.stopPropagation();
    setDownloading(true);
    try {
      const url = `${import.meta.env.VITE_API_URL || '/api'}/sales/${entry.id}/${mode === 'download' ? 'pdf' : 'preview'}`;
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
    <div className="bg-white rounded-3xl overflow-hidden shadow-card">
      {/* ── Card header ──────────────────────────────────────── */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Left: badges + name + date */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onToggle}>
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              {entry.invoice_display && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700">
                  {entry.invoice_display}
                </span>
              )}
              {entry.sale_type === 'local' ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-50 text-green-700">
                  <Store size={10} /> Local
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600">
                  <Truck size={10} /> Despatch
                </span>
              )}
            </div>
            <p className="text-sm font-bold text-black truncate">{entry.customer_name}</p>
            <p className="text-xs text-gray-400 mt-0.5">
              {new Date(entry.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
              {entry.entered_by_name ? ` · ${entry.entered_by_name}` : ''}
            </p>
          </div>

          {/* Right: amount + actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <div className="text-right">
              <p className="text-base font-bold text-black">
                ₹{Number(entry.bill_amount).toLocaleString('en-IN')}
              </p>
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

      {/* ── Expanded: items + tax summary ────────────────────── */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-4">
          {!items ? (
            <p className="text-xs text-gray-400">Loading items…</p>
          ) : (
            <>
              {/* Line items */}
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.id} className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-black">{item.bottle_name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {Number(item.quantity).toLocaleString('en-IN')} Nos × ₹{item.rate}
                        {item.hsn_code ? ` · HSN ${item.hsn_code}` : ''}
                      </p>
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

              {/* Footer info */}
              <div className="mt-3 space-y-0.5">
                {entry.place_of_supply && (
                  <p className="text-xs text-emerald-600">Place of Supply: {entry.place_of_supply}</p>
                )}
                {entry.narration && (
                  <p className="text-xs text-gray-400">Note: {entry.narration}</p>
                )}
              </div>

              {/* PDF actions */}
              <div className="flex gap-2 mt-4">
                <button onClick={e => handleDownload(e, 'preview')}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold bg-app-bg text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition">
                  <Eye size={13} /> Preview PDF
                </button>
                <button onClick={e => handleDownload(e, 'download')}
                  disabled={downloading}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold bg-app-bg text-gray-600 hover:bg-green-50 hover:text-green-600 transition disabled:opacity-40">
                  <Download size={13} /> Download PDF
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
