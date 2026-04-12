import { getSession } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase/server";
import { formatDate, formatSemester } from "@/lib/utils";
import type { AttendanceWithSession } from "@/lib/supabase/types";

export default async function HistoryPage() {
  const session = (await getSession())!;
  const supabase = createSupabaseClient();

  const { data: records } = await supabase
    .from("attendance_records")
    .select("*, chapel_sessions(session_date, title, semester)")
    .eq("student_id", session.id)
    .order("checked_in_at", { ascending: false });

  const allRecords = (records ?? []) as unknown as AttendanceWithSession[];

  // Group by semester
  const grouped = new Map<string, AttendanceWithSession[]>();
  for (const record of allRecords) {
    const sem = record.chapel_sessions.semester;
    if (!grouped.has(sem)) grouped.set(sem, []);
    grouped.get(sem)!.push(record);
  }

  // Sort semesters descending
  const semesters = [...grouped.keys()].sort().reverse();

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold">출석 기록</h1>
        <p className="text-base-content/60 text-sm">
          전체 채플 출석 기록을 확인하세요
        </p>
      </div>

      {semesters.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-base-content/60">아직 출석 기록이 없습니다</p>
        </div>
      ) : (
        semesters.map((semester) => (
          <div key={semester}>
            <h2 className="text-base font-semibold mb-2">
              {formatSemester(semester)}
            </h2>
            <ul className="space-y-2">
              {grouped.get(semester)!.map((record) => (
                <li
                  key={record.id}
                  className="flex items-center justify-between rounded-lg bg-base-200 px-4 py-3"
                >
                  <div>
                    <p className="font-medium text-sm">
                      {record.chapel_sessions.title ?? "채플"}
                    </p>
                    <p className="text-xs text-base-content/60">
                      {formatDate(record.chapel_sessions.session_date)}
                    </p>
                  </div>
                  <span className="badge badge-success badge-sm">출석</span>
                </li>
              ))}
            </ul>
          </div>
        ))
      )}
    </div>
  );
}
