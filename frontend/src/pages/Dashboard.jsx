import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import api from '../api/axios';

const fmt = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });

export default function Dashboard() {
  const { user } = useAuth();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout title={`Hello, ${user?.name?.split(' ')[0]}`} subtitle="Dashboard">
        <div className="text-center py-20 text-gray-400 text-sm">Loading...</div>
      </Layout>
    );
  }

  const now = new Date();
  const monthName = now.toLocaleString('en-IN', { month: 'long', year: 'numeric' });

  return (
    <Layout
      title={`Hello, ${user?.name?.split(' ')[0]}`}
      subtitle={now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
    >
      {/* Today's production hero */}
      <div className="bg-navy rounded-3xl p-5 mb-4">
        <p className="text-navy-light text-xs font-semibold uppercase tracking-wider mb-3">
          Today's Production
        </p>
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
        <div className="bg-white rounded-3xl p-5 mb-4">
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            Today by Bottle Type
          </p>
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
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
        {monthName}
      </p>
      <div className="grid grid-cols-2 gap-3 mb-4">
        <StatCard
          label="Sales"
          value={`₹${fmt(data?.monthSales?.sales_month)}`}
          sub={`${data?.monthSales?.invoices_month || 0} invoices`}
          accent
        />
        <StatCard
          label="Purchase"
          value={`₹${fmt(data?.monthPurchase?.purchase_month)}`}
          sub="preform cost"
        />
        <StatCard
          label="Expenses"
          value={`₹${fmt(data?.monthExpenses?.expenses_month)}`}
          sub="this month"
        />
        <StatCard
          label="Outstanding"
          value={`₹${fmt(data?.customerOutstanding)}`}
          sub="customers owe"
          warn={Number(data?.customerOutstanding) > 0}
        />
      </div>
    </Layout>
  );
}

function StatCard({ label, value, sub, accent, warn }) {
  return (
    <div className={`rounded-3xl p-4 ${accent ? 'bg-navy' : 'bg-white'}`}>
      <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${
        accent ? 'text-navy-light' : 'text-gray-400'
      }`}>{label}</p>
      <p className={`text-xl font-bold ${
        accent ? 'text-white' : warn ? 'text-red-500' : 'text-black'
      }`}>{value}</p>
      {sub && <p className={`text-xs mt-1 ${accent ? 'text-navy-light' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  );
}