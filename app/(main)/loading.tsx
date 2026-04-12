export default function DashboardLoading() {
  return (
    <div className="p-4 space-y-6 animate-pulse">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 space-y-2">
          <div className="h-7 w-48 rounded bg-base-300" />
          <div className="h-4 w-32 rounded bg-base-300" />
        </div>
        <div className="h-8 w-16 rounded bg-base-300" />
      </div>

      <div className="rounded-2xl bg-base-200 p-6 space-y-3">
        <div className="h-5 w-24 rounded bg-base-300" />
        <div className="h-10 w-20 rounded bg-base-300" />
        <div className="h-2 w-full rounded-full bg-base-300" />
      </div>

      <div className="space-y-3">
        <div className="h-6 w-24 rounded bg-base-300" />
        {Array.from({ length: 3 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center justify-between rounded-lg bg-base-200 px-4 py-3"
          >
            <div className="space-y-1.5">
              <div className="h-4 w-28 rounded bg-base-300" />
              <div className="h-3 w-20 rounded bg-base-300" />
            </div>
            <div className="h-5 w-10 rounded bg-base-300" />
          </div>
        ))}
      </div>
    </div>
  );
}
