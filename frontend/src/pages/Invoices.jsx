// frontend/src/pages/Invoices.jsx
// Dedicated invoice list page with filters, bulk view, and PDF actions

import { useState, useEffect, useCallback } from 'react';
import Layout from '../components/Layout';
import { salesApi } from '../api/sales.api';
import { mastersApi } from '../api/masters.api';
import api from '../api/axios';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export default function Invoices() {
  const [entries,     setEntries]     = useState([]);
  const [customers,   setCustomers]   = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [downloading, setDownloading] = useState(null);

  // Filters
  const [filterFrom,  setFilterFrom]  = useState('');
  const [filterTo,    setFilterTo]    = useState('');
  const [filterCust,  setFilterCust]  = useState('');
  const [filterType,  setFilterType]  = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = {};
      if (filterFrom) params.from = filterFrom;
      if (filterTo)   params.to   = filterTo;
      if (filterCust) params.customer_id = filterCust;
      if (filterType) params.sale_type   = filterType;
      const r = await salesApi.getAll(params);
      setEntries(r.data.data);
    } finally { setLoading(false); }
  }, [filterFrom, filterTo, filterCust, filterType]);

  useEffect(() => {
    mastersApi.getCustomers().then(r => setCustomers(r.data.data.filter(c => c.is_active)));
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleDownload(id, invoiceDisplay, mode = 'download') {
    setDownloading(id);
    try {
      const url = `${API_BASE}/sales/${id}/${mode === 'preview' ? 'preview' : 'pdf'}`;
      if (mode === 'preview') {
        window.open(url, '_blank');
      } else {
        const res = await fetch(url, { credentials: 'include' });
        if (!res.ok) throw new Error('Failed to download');
        const blob = await res.blob();
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `Invoice_${invoiceDisplay || id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
      }
    } catch (err) {
      console.error('Download failed:', err);
    } finally { setDownloading(null); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return;
    await salesApi.remove(id);
    await load();
  }

  // Summary stats
  const totalBill = entries.reduce((s, e) => s + Number(e.bill_amount || 0), 0);
  const totalGST  = entries.reduce((s, e) => s + Number(e.gst_amount  || 0), 0);
  const totalNet  = entries.reduce((s, e) => s + Number(e.net_amount  || 0), 0);

  return (
    <Layout title="Invoices" subtitle="Admin">

      {/* Filter panel */}
      <div className="bg-white rounded-3xl p-4 mb-6">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Filter Invoices</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">From Date</label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
              className="w-full bg-app-bg border-0 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-light" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">To Date</label>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
              className="w-full bg-app-bg border-0 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-light" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Customer</label>
            <select value={filterCust} onChange={e => setFilterCust(e.target.value)}
              className="w-full bg-app-bg border-0 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-light appearance-none">
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="w-full bg-app-bg border-0 rounded-2xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-navy-light appearance-none">
              <option value="">All Types</option>
              <option value="local">🏪 Local</option>
              <option value="despatch">🚛 Despatch</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="flex-1 bg-navy text-white text-sm font-semibold py-3 rounded-2xl hover:bg-opacity-90 transition">
            Search Invoices
          </button>
          <button onClick={() => { setFilterFrom(''); setFilterTo(''); setFilterCust(''); setFilterType(''); }}
            className="px-4 py-3 bg-app-bg text-gray-600 text-sm font-semibold rounded-2xl">
            Clear
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {entries.length > 0 && (
        <div className="bg-navy rounded-3xl p-5 mb-6">
          <p className="text-navy-light text-xs font-semibold uppercase tracking-wider mb-3">
            {entries.length} invoices found
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <p className="text-xl font-bold text-white">₹{fmt(totalBill)}</p>
              <p className="text-navy-light text-xs mt-1">Total Billed</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white">₹{fmt(totalNet)}</p>
              <p className="text-navy-light text-xs mt-1">Net Amount</p>
            </div>
            <div>
              <p className="text-xl font-bold text-white">₹{fmt(totalGST)}</p>
              <p className="text-navy-light text-xs mt-1">Total GST</p>
            </div>
          </div>
        </div>
      )}

      {/* Invoice table — desktop */}
      <div className="hidden lg:block bg-white rounded-3xl overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-app-bg">
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Invoice</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Customer</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Type</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Net</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">GST</th>
              <th className="text-right px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Total</th>
              <th className="px-4 py-3"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
            ) : entries.map(e => (
              <tr key={e.id} className="hover:bg-app-bg/50 transition">
                <td className="px-4 py-3">
                  <span className="font-bold text-navy text-xs bg-navy/10 px-2 py-1 rounded-full">
                    {e.invoice_display || '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(e.date).toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3 font-medium text-black">{e.customer_name}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                    e.sale_type === 'local' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {e.sale_type === 'local' ? 'Local' : 'Despatch'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right text-gray-600">₹{fmt(e.net_amount)}</td>
                <td className="px-4 py-3 text-right text-gray-600">₹{fmt(e.gst_amount)}</td>
                <td className="px-4 py-3 text-right font-bold text-black">₹{fmt(e.bill_amount)}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 justify-end">
                    <button onClick={() => handleDownload(e.id, e.invoice_display, 'preview')}
                      title="Preview" className="w-8 h-8 flex items-center justify-center rounded-xl bg-blue-50 text-blue-500 hover:bg-blue-100 text-xs">
                      👁️
                    </button>
                    <button onClick={() => handleDownload(e.id, e.invoice_display, 'download')}
                      title="Download PDF" disabled={downloading === e.id}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-green-50 text-green-600 hover:bg-green-100 text-xs disabled:opacity-50">
                      {downloading === e.id ? '⏳' : '⬇️'}
                    </button>
                    <button onClick={() => handleDelete(e.id)}
                      className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-400 hover:bg-red-100 text-xs">
                      🗑️
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🧾</p>
            <p className="text-gray-500 font-medium">No invoices found</p>
            <p className="text-gray-400 text-sm mt-1">Adjust your filters and search again</p>
          </div>
        )}
      </div>

      {/* Mobile card list */}
      <div className="lg:hidden space-y-3">
        {loading ? (
          <div className="text-center py-10 text-gray-400 text-sm">Loading...</div>
        ) : entries.map(e => (
          <div key={e.id} className="bg-white rounded-3xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {e.invoice_display && (
                    <span className="text-xs font-bold bg-navy text-white px-2 py-0.5 rounded-full">
                      {e.invoice_display}
                    </span>
                  )}
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                    e.sale_type === 'local' ? 'bg-blue-100 text-blue-600' : 'bg-orange-100 text-orange-600'
                  }`}>
                    {e.sale_type === 'local' ? 'Local' : 'Despatch'}
                  </span>
                </div>
                <p className="text-sm font-bold text-black">{e.customer_name}</p>
                <p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString('en-IN')}</p>
              </div>
              <p className="text-sm font-bold text-navy">₹{fmt(e.bill_amount)}</p>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => handleDownload(e.id, e.invoice_display, 'preview')}
                className="flex-1 py-2 rounded-2xl text-xs font-semibold bg-blue-50 text-blue-500">
                👁️ Preview
              </button>
              <button onClick={() => handleDownload(e.id, e.invoice_display, 'download')}
                disabled={downloading === e.id}
                className="flex-1 py-2 rounded-2xl text-xs font-semibold bg-green-50 text-green-600 disabled:opacity-50">
                {downloading === e.id ? '⏳' : '⬇️ Download'}
              </button>
              <button onClick={() => handleDelete(e.id)}
                className="w-10 py-2 rounded-2xl text-xs bg-red-50 text-red-400">
                🗑️
              </button>
            </div>
          </div>
        ))}
        {entries.length === 0 && !loading && (
          <div className="text-center py-16">
            <p className="text-4xl mb-3">🧾</p>
            <p className="text-gray-500 font-medium">No invoices found</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
