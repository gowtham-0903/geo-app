import { useState, useEffect, useCallback } from 'react';
import {
  TrendingUp, Package, Receipt, AlertCircle,
  Factory, Gauge, Layers, CalendarDays,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
  AreaChart, Area, CartesianGrid, PieChart, Pie, Legend,
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { SkeletonPage } from '../components/Skeleton';
import api from '../api/axios';

const fmt   = (n) => Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 });
const fmtK  = (n) => fmt(n);
const fmtCr = (n) => `₹${fmt(n)}`;

const NAVY        = '#001E61';
const NAVY_LIGHT  = '#A2BFFF';
const NAVY_FAINT  = '#EEF2FF';
const AMBER       = '#F59E0B';
const AMBER_LIGHT = '#FDE68A';

const PIE_COLORS  = [NAVY, '#1D4ED8', '#2563EB', '#3B82F6', '#60A5FA', '#93C5FD', '#BFDBFE'];

// ── Custom tooltip shared by all charts ───────────────────────
function ChartTooltip({ active, payload, label, prefix = '', suffix = '' }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-100 rounded-2xl shadow-modal px-3 py-2 text-xs">
      {label && <p className="text-gray-400 mb-1 font-medium">{label}</p>}
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }} className="font-semibold">
          {p.name}: {prefix}{Number(p.value).toLocaleString('en-IN')}{suffix}
        </p>
      ))}
    </div>
  );
}

// ── Custom donut center label ──────────────────────────────────
function DonutCenter({ total }) {
  return (
    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle">
      <tspan x="50%" dy="-6" fontSize="18" fontWeight="700" fill={NAVY}>{fmtK(total)}</tspan>
      <tspan x="50%" dy="18" fontSize="11" fill="#9CA3AF">total</tspan>
    </text>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [data,      setData]      = useState(null);
  const [mixData,   setMixData]   = useState(null);
  const [mixDate,   setMixDate]   = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  });
  const [loading,   setLoading]   = useState(true);
  const [mixLoad,   setMixLoad]   = useState(false);

  const now     = new Date();
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' });

  useEffect(() => {
    api.get('/dashboard')
      .then(r => setData(r.data.data))
      .finally(() => setLoading(false));
  }, []);

  const loadMix = useCallback(async (date) => {
    setMixLoad(true);
    try {
      const r = await api.get('/dashboard/production-mix', { params: { date } });
      setMixData(r.data);
    } finally { setMixLoad(false); }
  }, []);

  useEffect(() => { loadMix(mixDate); }, [mixDate, loadMix]);

  if (loading) {
    return (
      <Layout title="Dashboard" subtitle={`${user?.role === 'admin' ? 'Administrator' : 'Supervisor'} · ${dateStr}`}>
        <SkeletonPage />
      </Layout>
    );
  }

  const efficiency = Number(data?.todayProd?.efficiency_pct || 0);
  const effColor   = efficiency >= 95 ? 'text-green-500' : efficiency >= 85 ? 'text-amber-500' : 'text-red-500';
  const growth     = data?.monthSales?.growth_pct;

  return (
    <Layout
      title="Dashboard"
      subtitle={`${user?.role === 'admin' ? 'Administrator' : 'Supervisor'} · ${dateStr}`}
    >

      {/* ── HERO: Today's Production ─────────────────────────── */}
      <div className="bg-navy rounded-3xl p-5 mb-5">
        <p className="section-label text-navy-light mb-2">Today's Production</p>
        <p className="text-5xl font-bold text-white tracking-tight mb-0.5">
          {fmt(data?.todayProd?.bottles_today)}
        </p>
        <p className="text-navy-light text-sm mb-5">
          {data?.todayProd?.entries_today || 0} entries
        </p>
        <div className="border-t border-white/10 pt-4 grid grid-cols-3 gap-4">
          <div>
            <p className="text-2xl font-bold text-white">{fmt(data?.todayProd?.waste_today)}</p>
            <p className="text-navy-light text-xs mt-0.5">Preform Waste</p>
          </div>
          <div>
            <p className="text-2xl font-bold text-white">{fmt(data?.todayProd?.damage_today)}</p>
            <p className="text-navy-light text-xs mt-0.5">Bottle Damage</p>
          </div>
          <div>
            <p className={`text-2xl font-bold ${efficiency > 0 ? 'text-white' : 'text-navy-light'}`}>
              {efficiency > 0 ? `${efficiency}%` : '—'}
            </p>
            <p className="text-navy-light text-xs mt-0.5">Efficiency</p>
          </div>
        </div>
      </div>

      {/* ── 4 STAT CARDS ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard
          icon={TrendingUp} iconBg="bg-blue-50" iconColor="text-blue-600"
          label="Month Sales"
          value={fmtCr(data?.monthSales?.sales_month)}
          growth={growth}
        />
        <StatCard
          icon={Package} iconBg="bg-purple-50" iconColor="text-purple-600"
          label="Purchase"
          value={fmtCr(data?.monthPurchase?.purchase_month)}
        />
        <StatCard
          icon={Receipt} iconBg="bg-amber-50" iconColor="text-amber-600"
          label="Expenses"
          value={fmtCr(data?.monthExpenses?.expenses_month)}
        />
        <StatCard
          icon={AlertCircle}
          iconBg={Number(data?.customerOutstanding) > 0 ? 'bg-red-50' : 'bg-green-50'}
          iconColor={Number(data?.customerOutstanding) > 0 ? 'text-red-500' : 'text-green-600'}
          label="Outstanding"
          value={fmtCr(data?.customerOutstanding)}
          warn={Number(data?.customerOutstanding) > 0}
        />
      </div>

      {/* ── CHARTS ROW 1 ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">

        {/* 12-Month Production Bar Chart */}
        <div className="bg-white rounded-3xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <Factory size={15} className="text-gray-400" />
            <p className="text-sm font-bold text-black">12-Month Production</p>
          </div>
          <p className="text-xs text-gray-400 mb-4">Bottles produced per month</p>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={data?.twelveMonthProd || []} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmtK} width={36} />
              <Tooltip content={<ChartTooltip suffix=" bottles" />} cursor={{ fill: NAVY_FAINT }} />
              <Bar dataKey="total" name="Bottles" radius={[4, 4, 0, 0]}>
                {(data?.twelveMonthProd || []).map((entry, i) => (
                  <Cell key={i} fill={entry.is_current ? NAVY : NAVY_LIGHT} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 6-Month Sales vs Purchase Area Chart */}
        <div className="bg-white rounded-3xl p-5 shadow-card">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp size={15} className="text-gray-400" />
            <p className="text-sm font-bold text-black">6-Month Trend</p>
          </div>
          <p className="text-xs text-gray-400 mb-4">Sales vs Purchase (₹)</p>
          <ResponsiveContainer width="100%" height={180}>
            <AreaChart data={data?.sixMonthTrend || []}>
              <defs>
                <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={NAVY}  stopOpacity={0.15} />
                  <stop offset="95%" stopColor={NAVY}  stopOpacity={0} />
                </linearGradient>
                <linearGradient id="purchaseGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={AMBER} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={AMBER} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmtK} width={40} />
              <Tooltip content={<ChartTooltip prefix="₹" />} cursor={{ stroke: '#E5E7EB' }} />
              <Legend iconType="circle" iconSize={8}
                formatter={(v) => <span style={{ fontSize: 11, color: '#6B7280' }}>{v}</span>} />
              <Area type="monotone" dataKey="sales"    name="Sales"    stroke={NAVY}  strokeWidth={2} fill="url(#salesGrad)"    dot={{ fill: NAVY,  r: 3, strokeWidth: 0 }} activeDot={{ r: 4 }} />
              <Area type="monotone" dataKey="purchase" name="Purchase" stroke={AMBER} strokeWidth={2} fill="url(#purchaseGrad)" dot={{ fill: AMBER, r: 3, strokeWidth: 0 }} activeDot={{ r: 4 }} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── CHARTS ROW 2 ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Production Mix — date-picker donut */}
        <div className="bg-white rounded-3xl p-5 shadow-card">
          <div className="flex items-start justify-between mb-1">
            <div>
              <div className="flex items-center gap-2">
                <Layers size={15} className="text-gray-400" />
                <p className="text-sm font-bold text-black">Production Mix</p>
              </div>
              <p className="text-xs text-gray-400 mt-0.5">Bottles by type for selected date</p>
            </div>
            <input
              type="date"
              value={mixDate}
              onChange={e => setMixDate(e.target.value)}
              className="text-xs bg-app-bg border-0 rounded-xl px-2.5 py-1.5 text-gray-600 focus:outline-none focus:ring-2 focus:ring-navy-light"
            />
          </div>

          {mixLoad ? (
            <div className="h-48 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-navy border-t-transparent rounded-full animate-spin" />
            </div>
          ) : !mixData?.byType?.length ? (
            <div className="h-48 flex flex-col items-center justify-center">
              <Factory size={28} className="text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">No production data for this date</p>
            </div>
          ) : (
            <div className="flex items-center gap-4 mt-2">
              {/* Donut */}
              <div className="flex-shrink-0">
                <ResponsiveContainer width={160} height={160}>
                  <PieChart>
                    <Pie
                      data={mixData.byType}
                      dataKey="total"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={52}
                      outerRadius={72}
                      strokeWidth={0}
                    >
                      {mixData.byType.map((_, i) => (
                        <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <DonutCenter total={mixData.total} />
                    <Tooltip
                      formatter={(v, n) => [v.toLocaleString('en-IN'), n]}
                      contentStyle={{ borderRadius: 12, fontSize: 11, border: '1px solid #f0f0f0' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              {/* Legend list */}
              <div className="flex-1 min-w-0 space-y-2">
                {mixData.byType.slice(0, 6).map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                      <span className="text-xs text-gray-600 truncate">{item.name}</span>
                    </div>
                    <span className="text-xs font-semibold text-black flex-shrink-0">{item.total.toLocaleString('en-IN')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Today's Sales Breakdown + Margin */}
        <div className="bg-white rounded-3xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <CalendarDays size={15} className="text-gray-400" />
              <p className="text-sm font-bold text-black">Today's Breakdown</p>
            </div>
            <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Live</span>
          </div>
          <p className="text-xs text-gray-400 mb-4">Sales by bottle type today</p>

          {!data?.todaySalesByType?.length ? (
            <div className="flex flex-col items-center justify-center py-6">
              <Receipt size={24} className="text-gray-200 mb-2" />
              <p className="text-xs text-gray-400">No sales recorded today</p>
            </div>
          ) : (
            <>
              {/* Horizontal bar chart */}
              <ResponsiveContainer width="100%" height={Math.max(100, data.todaySalesByType.length * 36)}>
                <BarChart
                  data={data.todaySalesByType}
                  layout="vertical"
                  barCategoryGap="25%"
                  margin={{ left: 0, right: 8 }}
                >
                  <XAxis type="number" tick={{ fontSize: 10, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={fmtK} />
                  <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#374151' }} axisLine={false} tickLine={false} width={90} />
                  <Tooltip content={<ChartTooltip suffix=" nos" />} cursor={{ fill: NAVY_FAINT }} />
                  <Bar dataKey="qty" name="Qty (nos)" fill={NAVY} radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </>
          )}

          {/* Margin by product */}
          {data?.marginByProduct?.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-50">
              <p className="section-label mb-3">Margin by Product</p>
              <div className="space-y-2">
                {data.marginByProduct.map(item => (
                  <div key={item.name} className="flex items-center gap-2">
                    <span className="text-xs text-gray-600 flex-1 truncate">{item.name}</span>
                    {/* Mini bar */}
                    <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden flex-shrink-0">
                      <div
                        className="h-full rounded-full bg-navy"
                        style={{ width: `${Math.min(item.margin_pct, 50) * 2}%` }}
                      />
                    </div>
                    <span className={`text-xs font-bold flex-shrink-0 w-12 text-right ${
                      item.margin_pct > 20 ? 'text-green-600' : item.margin_pct > 10 ? 'text-amber-600' : 'text-red-500'
                    }`}>
                      {item.margin_pct}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

      </div>
    </Layout>
  );
}

// ── Stat Card ──────────────────────────────────────────────────
function StatCard({ icon: Icon, iconBg, iconColor, label, value, growth, warn }) {
  return (
    <div className="bg-white rounded-3xl p-4 shadow-card">
      <div className={`w-9 h-9 ${iconBg} rounded-2xl flex items-center justify-center mb-3`}>
        <Icon size={16} className={iconColor} />
      </div>
      <p className="section-label mb-1">{label}</p>
      <p className={`text-xl font-bold leading-tight ${warn ? 'text-red-500' : 'text-black'}`}>
        {value}
      </p>
      {growth != null && (
        <p className={`text-xs font-semibold mt-1.5 flex items-center gap-1 ${growth >= 0 ? 'text-green-600' : 'text-red-500'}`}>
          <TrendingUp size={11} className={growth < 0 ? 'rotate-180' : ''} />
          {growth >= 0 ? '+' : ''}{growth}% vs last month
        </p>
      )}
    </div>
  );
}
