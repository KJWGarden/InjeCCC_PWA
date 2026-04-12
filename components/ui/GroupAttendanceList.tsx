import { createSupabaseClient } from "@/lib/supabase/server";
import { getCurrentSemester } from "@/lib/utils";

interface MemberInfo {
  id: string;
  name: string;
  isLeader?: boolean;
}

export default async function GroupAttendanceList({ members }: { members: MemberInfo[] }) {
  const supabase = createSupabaseClient();
  const semester = getCurrentSemester();

  const { count: totalSessions } = await supabase
    .from("chapel_sessions")
    .select("*", { count: "exact", head: true })
    .eq("semester", semester);

  const memberIds = members.map((m) => m.id);
  const { data: attendanceCounts } = await supabase
    .from("attendance_records")
    .select("student_id, chapel_sessions!inner(semester)")
    .in("student_id", memberIds.length > 0 ? memberIds : ["__none__"])
    .eq("chapel_sessions.semester", semester);

  const countMap: Record<string, number> = {};
  if (attendanceCounts) {
    for (const record of attendanceCounts) {
      countMap[record.student_id] = (countMap[record.student_id] || 0) + 1;
    }
  }

  const total = totalSessions ?? 0;

  return (
    <ul className="space-y-2">
      {members.map((member) => {
        const attended = countMap[member.id] || 0;
        const percentage = total > 0 ? Math.round((attended / total) * 100) : 0;

        return (
          <li
            key={member.id}
            className="flex items-center justify-between rounded-lg bg-base-200 px-4 py-3"
          >
            <div className="flex items-center gap-2">
              <div>
                <p className="font-medium text-sm">
                  {member.name}
                  {member.isLeader && (
                    <span className="badge badge-primary badge-xs ml-1">순장</span>
                  )}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-semibold">{attended}/{total}</p>
              <p className="text-xs text-base-content/60">{percentage}%</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
