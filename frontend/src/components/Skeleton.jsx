export function SkeletonCard({ rows = 3 }) {
  return (
    <div className="bg-white rounded-3xl p-4 space-y-3 shadow-card">
      <div className="skeleton h-4 w-1/2" />
      <div className="skeleton h-3 w-3/4" />
      {Array.from({ length: rows - 1 }, (_, i) => (
        <div key={i} className="skeleton h-3 w-full" />
      ))}
    </div>
  );
}

export function SkeletonHero() {
  return (
    <div className="bg-navy/20 rounded-3xl p-5 mb-4 space-y-3 animate-skeleton">
      <div className="bg-navy/30 rounded-xl h-3 w-28" />
      <div className="bg-navy/30 rounded-xl h-10 w-48" />
      <div className="grid grid-cols-3 gap-3 mt-2">
        {[0,1,2].map(i => (
          <div key={i} className="bg-navy/30 rounded-xl h-12" />
        ))}
      </div>
    </div>
  );
}

export function SkeletonList({ count = 4 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }, (_, i) => (
        <SkeletonCard key={i} rows={2} />
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-4 pt-4">
      <SkeletonHero />
      <SkeletonList count={3} />
    </div>
  );
}
