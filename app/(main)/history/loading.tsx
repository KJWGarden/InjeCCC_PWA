export default function HistoryLoading() {
  return (
    <div className="p-4 space-y-6 animate-pulse">
      <div className="space-y-2">
        <div className="h-7 w-28 rounded bg-base-300" />
        <div className="h-4 w-48 rounded bg-base-300" />
      </div>

      {Array.from({ length: 2 }).map((_, s) => (
        <div key={s} className="space-y-2">
          <div className="h-5 w-24 rounded bg-base-300" />
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
      ))}
    </div>
  );
}
