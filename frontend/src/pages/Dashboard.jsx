import { useState, useEffect } from 'react';
import { TrendingUp, Package, ShoppingCart, Receipt, AlertTriangle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { SkeletonHero, SkeletonList } from '../components/Skeleton';
import api from '../api/axios';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Dashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data.data))
      .catch(() => setError('Failed to load dashboard data'))
      .finally(() => setLoading(false));
  }, []);

  const now       = new Date();
  const monthName = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  const dateStr   = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' });

  return (
    <Layout
      title="Dashboard"
      subtitle={dateStr}
    >
      {loading ? (
        <>
          <SkeletonHero />
          <SkeletonList count={3} />
        </>
      ) : error ? (
        <div className="text-center py-16">
          <AlertTriangle size={32} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">{error}</p>
        </div>
      ) : (
        <>
          {/* Today's production hero */}
          <div className="bg-navy rounded-3xl p-5 mb-4">
            <p className="section-label text-navy-light mb-3">Today's Production</p>
            <p className="text-4xl font-bold text-white mb-1">
              {fmt(data?.todayProd?.bottles_today)}
            </p>
            <p className="text-navy-light text-sm">bottles produced</p>
            <div className="grid grid-cols-3 gap-3 mt-4">
              <div>
                <p className="text-xl font-bold text-white">{fmt(data?.todayProd?.entries_today)}</p>
                <p className="text-navy-light text-xs">Entries</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white">{fmt(data?.todayProd?.waste_today)}</p>
                <p className="text-navy-light text-xs">Preform Waste</p>
              </div>
              <div>
                <p className="text-xl font-bold text-white">{fmt(data?.todayProd?.damage_today)}</p>
                <p className="text-navy-light text-xs">Bottle Damage</p>
              </div>
            </div>
          </div>

          {/* Today by bottle type */}
          {data?.todayByBottle?.length > 0 && (
            <div className="bg-white rounded-3xl p-5 mb-4 shadow-card">
              <p className="section-label mb-3">Today by Bottle Type</p>
              <div className="space-y-2">
                {data.todayByBottle.map(b => (
                  <div key={b.bottle_name} className="flex items-center justify-between">
                    <p className="text-sm text-black font-medium truncate flex-1">{b.bottle_name}</p>
                    <p className="text-sm font-bold text-navy ml-3">{fmt(b.total)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Month summary grid */}
          <p className="section-label mb-3">{monthName}</p>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <StatCard
              label="Sales"
              value={`₹${fmt(data?.monthSales?.sales_month)}`}
              sub={`${data?.monthSales?.invoices_month || 0} invoices`}
              icon={Receipt}
              accent
            />
            <StatCard
              label="Purchase"
              value={`₹${fmt(data?.monthPurchase?.purchase_month)}`}
              sub="preform cost"
              icon={Package}
            />
            <StatCard
              label="Expenses"
              value={`₹${fmt(data?.monthExpenses?.expenses_month)}`}
              sub="this month"
              icon={ShoppingCart}
            />
            <StatCard
              label="Outstanding"
              value={`₹${fmt(data?.customerOutstanding)}`}
              sub="customers owe"
              icon={TrendingUp}
              warn={Number(data?.customerOutstanding) > 0}
            />
          </div>
        </>
      )}
    </Layout>
  );
}

function StatCard({ label, value, sub, accent, warn, icon: Icon }) {
  return (
    <div className={`rounded-3xl p-4 ${accent ? 'bg-navy' : 'bg-white shadow-card'}`}>
      <div className="flex items-center justify-between mb-2">
        <p className={`section-label ${accent ? 'text-navy-light' : 'text-gray-400'}`}>{label}</p>
        {Icon && (
          <Icon
            size={14}
            className={accent ? 'text-navy-light' : warn ? 'text-red-400' : 'text-gray-300'}
          />
        )}
      </div>
      <p className={`text-xl font-bold ${
        accent ? 'text-white' : warn ? 'text-red-500' : 'text-black'
      }`}>{value}</p>
      {sub && (
        <p className={`text-xs mt-1 ${accent ? 'text-navy-light' : 'text-gray-400'}`}>{sub}</p>
      )}
    </div>
  );
}
