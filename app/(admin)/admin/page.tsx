import { getAdminSession } from "@/lib/admin-auth";
import { createSupabaseClient } from "@/lib/supabase/server";
import { getCurrentSemester, getNextSemester, formatDate } from "@/lib/utils";
import CreateSessionForm from "@/components/admin/CreateSessionForm";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import SessionQrModal from "@/components/admin/SessionQrModal";
import SessionEditModal from "@/components/admin/SessionEditModal";
import SessionDeleteButton from "@/components/admin/SessionDeleteButton";
import SemesterSelector from "@/components/admin/SemesterSelector";
import type { ChapelSession } from "@/lib/supabase/types";

interface Props {
  searchParams: Promise<{ semester?: string }>;
}

export default async function AdminDashboardPage({ searchParams }: Props) {
  const session = (await getAdminSession())!;
  const supabase = createSupabaseClient();
  const { semester: semesterParam } = await searchParams;

  // Get all distinct semesters from existing sessions
  const { data: allSessions } = await supabase
    .from("chapel_sessions")
    .select("semester")
    .order("created_at", { ascending: false });

  const semesterSet = new Set<string>();
  const currentSemester = getCurrentSemester();
  semesterSet.add(currentSemester);
  semesterSet.add(getNextSemester());
  for (const s of allSessions ?? []) {
    semesterSet.add(s.semester);
  }

  // Sort descending: 2026-1 > 2025-2 > 2025-1
  const semesters = [...semesterSet].sort((a, b) => b.localeCompare(a));

  // Default: use param, else latest session's semester, else current
  const latestSemester = allSessions?.[0]?.semester;
  const selectedSemester =
    semesterParam && semesterSet.has(semesterParam)
      ? semesterParam
      : latestSemester ?? currentSemester;

  // Fetch sessions for selected semester
  const { data: sessions } = await supabase
    .from("chapel_sessions")
    .select("*")
    .eq("semester", selectedSemester)
    .order("session_date", { ascending: false });

  const chapelSessions = (sessions ?? []) as ChapelSession[];

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">채플 관리</h1>
          <p className="text-base-content/60 text-sm">{session.username}</p>
        </div>
        <AdminLogoutButton />
      </div>

      <div className="card bg-base-200">
        <div className="card-body">
          <h2 className="card-title text-base">새 채플 생성</h2>
          <CreateSessionForm />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">채플 목록</h2>
          <SemesterSelector
            semesters={semesters}
            current={selectedSemester}
          />
        </div>
        {chapelSessions.length === 0 ? (
          <p className="text-base-content/60 text-sm">
            등록된 채플이 없습니다
          </p>
        ) : (
          <ul className="space-y-2">
            {chapelSessions.map((s) => (
              <li
                key={s.id}
                className="flex items-center justify-between rounded-lg bg-base-200 px-4 py-3"
              >
                <div>
                  <p className="font-medium text-sm">
                    {s.title ?? "채플"}
                  </p>
                  <p className="text-xs text-base-content/60">
                    {formatDate(s.session_date)}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <SessionQrModal
                    sessionId={s.id}
                    token={s.token}
                    title={s.title}
                    sessionDate={s.session_date}
                    tokenExpiresAt={s.token_expires_at}
                    isActive={s.is_active}
                  />
                  <SessionEditModal
                    id={s.id}
                    sessionDate={s.session_date}
                    title={s.title}
                    qrDurationMinutes={s.qr_duration_minutes}
                  />
                  <SessionDeleteButton sessionId={s.id} />
                  <span
                    className={`badge badge-sm ${
                      s.is_active ? "badge-success" : "badge-ghost"
                    }`}
                  >
                    {s.is_active ? "활성" : "비활성"}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
