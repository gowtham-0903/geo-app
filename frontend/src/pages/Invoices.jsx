import { useState, useEffect, useCallback } from 'react';
import { Eye, Download, Trash2, FileText, Search, X, Store, Truck } from 'lucide-react';
import Layout from '../components/Layout';
import { SkeletonList } from '../components/Skeleton';
import { salesApi } from '../api/sales.api';
import { mastersApi } from '../api/masters.api';

const fmt     = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const API_BASE = import.meta.env.VITE_API_URL || '/api';

export default function Invoices() {
  const [entries,     setEntries]     = useState([]);
  const [customers,   setCustomers]   = useState([]);
  const [loading,     setLoading]     = useState(false);
  const [downloading, setDownloading] = useState(null);
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
    } finally { setDownloading(null); }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return;
    await salesApi.remove(id);
    await load();
  }

  function clearFilters() {
    setFilterFrom(''); setFilterTo(''); setFilterCust(''); setFilterType('');
  }

  const totalBill = entries.reduce((s, e) => s + Number(e.bill_amount || 0), 0);
  const totalGST  = entries.reduce((s, e) => s + Number(e.gst_amount  || 0), 0);
  const totalNet  = entries.reduce((s, e) => s + Number(e.net_amount  || 0), 0);

  return (
    <Layout title="Invoices" subtitle="Admin">
      {/* Filter panel */}
      <div className="bg-white rounded-3xl p-4 mb-6 shadow-card">
        <p className="section-label mb-3">Filter Invoices</p>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">From Date</label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
              className="input-base" />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">To Date</label>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)}
              className="input-base" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Customer</label>
            <select value={filterCust} onChange={e => setFilterCust(e.target.value)}
              className="input-base appearance-none">
              <option value="">All Customers</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className="input-base appearance-none">
              <option value="">All Types</option>
              <option value="local">Local</option>
              <option value="despatch">Despatch</option>
            </select>
          </div>
        </div>
        <div className="flex gap-2">
          <button onClick={load}
            className="flex-1 flex items-center justify-center gap-2 btn-primary py-3">
            <Search size={15} /> Search
          </button>
          <button onClick={clearFilters}
            className="px-4 py-3 btn-secondary flex items-center gap-1.5 text-sm">
            <X size={14} /> Clear
          </button>
        </div>
      </div>

      {/* Summary bar */}
      {entries.length > 0 && (
        <div className="bg-navy rounded-3xl p-5 mb-6">
          <p className="section-label text-navy-light mb-3">
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

      {/* Desktop table */}
      <div className="hidden lg:block bg-white rounded-3xl overflow-hidden mb-6 shadow-card">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-app-bg">
              {['Invoice','Date','Customer','Type','Net','GST','Total',''].map(h => (
                <th key={h} className={`px-4 py-3 section-label ${h === '' || h === 'Net' || h === 'GST' || h === 'Total' ? 'text-right' : 'text-left'}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="text-center py-10 text-gray-400">Loading...</td></tr>
            ) : entries.map(e => (
              <tr key={e.id} className="hover:bg-app-bg/50 transition">
                <td className="px-4 py-3">
                  <span className="badge bg-navy/10 text-navy font-bold">
                    {e.invoice_display || '—'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-600">
                  {new Date(e.date).toLocaleDateString('en-IN')}
                </td>
                <td className="px-4 py-3 font-medium text-black">{e.customer_name}</td>
                <td className="px-4 py-3">
                  <span className={`badge ${
                    e.sale_type === 'local' ? 'bg-info-bg text-info' : 'bg-warning-bg text-warning'
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
                      className="icon-btn bg-info-bg text-info hover:bg-blue-100">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => handleDownload(e.id, e.invoice_display, 'download')}
                      disabled={downloading === e.id}
                      className="icon-btn bg-success-bg text-success hover:bg-green-100 disabled:opacity-50">
                      <Download size={14} />
                    </button>
                    <button onClick={() => handleDelete(e.id)}
                      className="icon-btn bg-danger-bg text-danger hover:bg-red-100">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {entries.length === 0 && !loading && (
          <div className="text-center py-16">
            <FileText size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">No invoices found</p>
            <p className="text-gray-400 text-sm mt-1">Adjust your filters and search again</p>
          </div>
        )}
      </div>

      {/* Mobile card list */}
      <div className="lg:hidden">
        {loading ? (
          <SkeletonList count={4} />
        ) : entries.map(e => (
          <div key={e.id} className="bg-white rounded-3xl p-4 mb-3 shadow-card">
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  {e.invoice_display && (
                    <span className="badge bg-navy text-white">{e.invoice_display}</span>
                  )}
                  <span className={`badge ${
                    e.sale_type === 'local' ? 'bg-info-bg text-info' : 'bg-warning-bg text-warning'
                  }`}>
                    {e.sale_type === 'local'
                      ? <><Store size={10} className="inline mr-1" />Local</>
                      : <><Truck size={10} className="inline mr-1" />Despatch</>
                    }
                  </span>
                </div>
                <p className="text-sm font-bold text-black">{e.customer_name}</p>
                <p className="text-xs text-gray-400">{new Date(e.date).toLocaleDateString('en-IN')}</p>
              </div>
              <p className="text-sm font-bold text-navy ml-2">₹{fmt(e.bill_amount)}</p>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={() => handleDownload(e.id, e.invoice_display, 'preview')}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold bg-info-bg text-info">
                <Eye size={13} /> Preview
              </button>
              <button onClick={() => handleDownload(e.id, e.invoice_display, 'download')}
                disabled={downloading === e.id}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold bg-success-bg text-success disabled:opacity-50">
                <Download size={13} /> Download
              </button>
              <button onClick={() => handleDelete(e.id)}
                className="w-11 flex items-center justify-center py-2.5 rounded-2xl bg-danger-bg text-danger">
                <Trash2 size={14} />
              </button>
            </div>
          </div>
        ))}
        {entries.length === 0 && !loading && (
          <div className="text-center py-16">
            <FileText size={32} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-semibold">No invoices found</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
