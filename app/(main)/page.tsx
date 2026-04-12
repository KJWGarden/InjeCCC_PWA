import { getSession } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase/server";
import { getCurrentSemester, formatDate } from "@/lib/utils";
import AttendanceCard from "@/components/ui/AttendanceCard";
import type { AttendanceWithSession } from "@/lib/supabase/types";

export default async function DashboardPage() {
  const session = (await getSession())!;
  const supabase = createSupabaseClient();
  const semester = getCurrentSemester();

  // Get total sessions for this semester and university
  const { count: totalSessions } = await supabase
    .from("chapel_sessions")
    .select("*", { count: "exact", head: true })
    .eq("university", session.university)
    .eq("semester", semester);

  // Get student's attendance count for this semester
  const { count: attendedCount } = await supabase
    .from("attendance_records")
    .select("*, chapel_sessions!inner(semester, university)", {
      count: "exact",
      head: true,
    })
    .eq("student_id", session.id)
    .eq("chapel_sessions.semester", semester)
    .eq("chapel_sessions.university", session.university);

  // Get recent attendance records (last 5)
  const { data: recentRecords } = await supabase
    .from("attendance_records")
    .select("*, chapel_sessions(session_date, title, semester)")
    .eq("student_id", session.id)
    .order("checked_in_at", { ascending: false })
    .limit(5);

  const records = (recentRecords ?? []) as unknown as AttendanceWithSession[];

  return (
    <div className="p-4 space-y-6">
      <div>
        <h1 className="text-xl font-bold">
          안녕하세요, {session.name}님
        </h1>
        <p className="text-base-content/60 text-sm">
          {session.university} · {session.studentId}
        </p>
      </div>

      <AttendanceCard
        attended={attendedCount ?? 0}
        total={totalSessions ?? 0}
      />

      <div>
        <h2 className="text-lg font-semibold mb-3">최근 출석</h2>
        {records.length === 0 ? (
          <p className="text-base-content/60 text-sm">아직 출석 기록이 없습니다</p>
        ) : (
          <ul className="space-y-2">
            {records.map((record) => (
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
        )}
      </div>
    </div>
  );
}
