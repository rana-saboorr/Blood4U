export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`skeleton ${className}`}
      role="status"
      aria-label="Loading"
      aria-busy="true"
      {...props}
    />
  );
}

export function SkeletonCard() {
  return (
    <div className="glass-panel rounded-2xl p-6 space-y-4" aria-hidden="true">
      <Skeleton className="h-10 w-10 rounded-xl" />
      <Skeleton className="h-6 w-3/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-5/6" />
    </div>
  );
}

export function SkeletonStats({ count = 5 }) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-panel rounded-2xl p-5 space-y-3">
          <Skeleton className="h-11 w-11 rounded-xl" />
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export default Skeleton;
