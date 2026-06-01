import { useState, useEffect } from 'react';
import { PackageCheck, Package, RefreshCw, TrendingDown, TrendingUp, Boxes } from 'lucide-react';
import Layout from '../components/Layout';
import { SkeletonList } from '../components/Skeleton';
import api from '../api/axios';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN');

export default function Stock() {
  const [data,    setData]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [asOf,    setAsOf]    = useState('');
  const [error,   setError]   = useState('');

  async function load() {
    setLoading(true);
    setError('');
    try {
      const r = await api.get('/stock');
      setData(r.data.data);
      setAsOf(r.data.as_of);
    } catch {
      setError('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  const totalBottleStock  = data.reduce((s, r) => s + r.bottle_stock,  0);
  const totalPreformStock = data.reduce((s, r) => s + r.preform_stock, 0);
  const lowStockItems     = data.filter(r => r.bottle_stock < 1000 && r.total_bottles_produced > 0);

  return (
    <Layout title="Stock" subtitle="Inventory">
      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="bg-navy rounded-3xl p-4">
          <div className="flex items-center gap-2 mb-3">
            <Boxes size={16} className="text-navy-light" />
            <p className="section-label text-navy-light">Finished Bottles</p>
          </div>
          <p className="text-2xl font-bold text-white">{fmt(totalBottleStock)}</p>
          <p className="text-navy-light text-xs mt-1">total in stock</p>
        </div>
        <div className="bg-white rounded-3xl p-4 shadow-card">
          <div className="flex items-center gap-2 mb-3">
            <Package size={16} className="text-gray-400" />
            <p className="section-label">Preforms</p>
          </div>
          <p className="text-2xl font-bold text-black">{fmt(totalPreformStock)}</p>
          <p className="text-gray-400 text-xs mt-1">total available</p>
        </div>
      </div>

      {/* Low stock alert */}
      {!loading && lowStockItems.length > 0 && (
        <div className="flex items-start gap-3 bg-warning-bg rounded-2xl px-4 py-3 mb-5">
          <TrendingDown size={16} className="text-warning flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-warning">Low stock alert</p>
            <p className="text-xs text-warning/80 mt-0.5">
              {lowStockItems.map(i => i.name).join(', ')} below 1,000 bottles
            </p>
          </div>
        </div>
      )}

      {/* Header row */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <p className="text-sm font-bold text-black">Closing Stock</p>
          {asOf && (
            <p className="text-xs text-gray-400">
              As of {new Date(asOf).toLocaleString('en-IN', {
                day: 'numeric', month: 'short', year: 'numeric',
                hour: '2-digit', minute: '2-digit',
              })}
            </p>
          )}
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-xs font-semibold text-navy bg-navy-faint px-3 py-2 rounded-2xl hover:bg-navy hover:text-white transition-all disabled:opacity-50"
        >
          <RefreshCw size={12} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stock table — desktop */}
      {loading ? (
        <SkeletonList count={5} />
      ) : error ? (
        <div className="text-center py-16">
          <p className="text-gray-500 font-medium">{error}</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-3xl overflow-hidden shadow-card mb-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-app-bg">
                  <th className="text-left px-5 py-3 section-label">Bottle Type</th>
                  <th className="text-left px-5 py-3 section-label">Category</th>
                  <th className="text-right px-5 py-3 section-label">Total Produced</th>
                  <th className="text-right px-5 py-3 section-label">Total Sold</th>
                  <th className="text-right px-5 py-3 section-label">Bottle Stock</th>
                  <th className="text-right px-5 py-3 section-label">Preform Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {data.map(row => (
                  <tr key={row.id} className="hover:bg-app-bg/40 transition">
                    <td className="px-5 py-3 font-semibold text-black">{row.name}</td>
                    <td className="px-5 py-3 text-gray-500 capitalize">{row.category}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{fmt(row.total_bottles_produced)}</td>
                    <td className="px-5 py-3 text-right text-gray-600">{fmt(row.total_bottles_sold)}</td>
                    <td className="px-5 py-3 text-right">
                      <StockBadge value={row.bottle_stock} />
                    </td>
                    <td className="px-5 py-3 text-right">
                      <StockBadge value={row.preform_stock} />
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-navy">
                  <td className="px-5 py-3 text-white font-semibold" colSpan={4}>Total</td>
                  <td className="px-5 py-3 text-right text-white font-bold">{fmt(totalBottleStock)}</td>
                  <td className="px-5 py-3 text-right text-white font-bold">{fmt(totalPreformStock)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden space-y-3">
            {data.map(row => (
              <div key={row.id} className="bg-white rounded-3xl p-4 shadow-card">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-bold text-black">{row.name}</p>
                    <p className="text-xs text-gray-400 capitalize mt-0.5">{row.category}</p>
                  </div>
                  <StockBadge value={row.bottle_stock} large />
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="bg-app-bg rounded-2xl p-2.5 text-center">
                    <p className="text-xs font-bold text-black">{fmt(row.total_bottles_produced)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Produced</p>
                  </div>
                  <div className="bg-app-bg rounded-2xl p-2.5 text-center">
                    <p className="text-xs font-bold text-black">{fmt(row.total_bottles_sold)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Sold</p>
                  </div>
                  <div className="bg-app-bg rounded-2xl p-2.5 text-center">
                    <p className="text-xs font-bold text-black">{fmt(row.preform_stock)}</p>
                    <p className="text-xs text-gray-400 mt-0.5">Preforms</p>
                  </div>
                </div>
              </div>
            ))}

            {data.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-navy-faint rounded-3xl flex items-center justify-center mx-auto mb-4">
                  <PackageCheck size={28} className="text-navy-light" />
                </div>
                <p className="text-gray-500 font-semibold">No stock data yet</p>
                <p className="text-gray-400 text-sm mt-1">Add purchases and production entries to see stock</p>
              </div>
            )}
          </div>

          {/* Legend */}
          <div className="bg-app-bg rounded-2xl px-4 py-3 mt-4 space-y-1">
            <p className="section-label mb-2">How stock is calculated</p>
            <p className="text-xs text-gray-500">
              <span className="font-semibold">Bottle Stock</span> = Total Produced − Total Damaged − Total Sold
            </p>
            <p className="text-xs text-gray-500">
              <span className="font-semibold">Preform Stock</span> = Total Purchased (all suppliers) − Total Used in Production − Total Wasted
            </p>
          </div>
        </>
      )}
    </Layout>
  );
}

function StockBadge({ value, large }) {
  const n  = Number(value);
  const cls = n > 5000 ? 'text-green-600' : n > 0 ? 'text-amber-600' : 'text-red-500';
  return (
    <span className={`font-bold ${large ? 'text-base' : 'text-sm'} ${cls}`}>
      {fmt(n)}
    </span>
  );
}
