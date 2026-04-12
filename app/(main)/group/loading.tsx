export default function GroupLoading() {
  return (
    <div className="p-4 space-y-4 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="h-7 w-20 rounded bg-base-300" />
        <div className="h-8 w-24 rounded bg-base-300" />
      </div>

      {Array.from({ length: 2 }).map((_, s) => (
        <div key={s} className="space-y-2">
          <div className="h-4 w-20 rounded bg-base-300" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className="rounded-lg bg-base-200 px-4 py-3 space-y-1.5"
            >
              <div className="h-4 w-24 rounded bg-base-300" />
              <div className="h-3 w-36 rounded bg-base-300" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}
