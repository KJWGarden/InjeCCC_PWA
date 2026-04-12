interface AttendanceCardProps {
  attended: number;
  total: number;
}

export default function AttendanceCard({ attended, total }: AttendanceCardProps) {
  const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

  return (
    <div className="card bg-base-200 shadow-sm">
      <div className="card-body items-center text-center">
        <div
          className="radial-progress text-primary"
          style={
            { "--value": percentage, "--size": "8rem", "--thickness": "8px" } as React.CSSProperties
          }
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <span className="text-2xl font-bold">{percentage}%</span>
        </div>
        <div className="stat p-0 mt-2">
          <div className="stat-title">이번 학기 출석</div>
          <div className="stat-value text-lg">
            {attended} / {total} 회
          </div>
        </div>
      </div>
    </div>
  );
}
