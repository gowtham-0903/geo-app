export default function StatCard({ label, value, sub, trend, trendUp, accent }) {
  return (
    <div className={`rounded-3xl p-5 ${accent ? 'bg-navy text-white' : 'bg-white'}`}>
      <div className="flex items-start justify-between mb-3">
        <p className={`text-xs font-semibold uppercase tracking-wider ${
          accent ? 'text-navy-light' : 'text-gray-400'
        }`}>
          {label}
        </p>
        {trend && (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            trendUp
              ? 'bg-green-100 text-green-600'
              : 'bg-red-100 text-red-500'
          }`}>
            {trendUp ? '+' : ''}{trend}
          </span>
        )}
      </div>
      <p className={`text-3xl font-bold tracking-tight ${accent ? 'text-white' : 'text-black'}`}>
        {value}
      </p>
      {sub && (
        <p className={`text-xs mt-1 ${accent ? 'text-navy-light' : 'text-gray-400'}`}>
          {sub}
        </p>
      )}
    </div>
  );
}