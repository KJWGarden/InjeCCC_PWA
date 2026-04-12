import { getAdminSession } from "@/lib/admin-auth";
import { createSupabaseClient } from "@/lib/supabase/server";
import { getCurrentSemester, formatDate } from "@/lib/utils";
import CreateSessionForm from "@/components/admin/CreateSessionForm";
import AdminLogoutButton from "@/components/admin/AdminLogoutButton";
import SessionQrModal from "@/components/admin/SessionQrModal";
import SessionEditModal from "@/components/admin/SessionEditModal";
import SessionDeleteButton from "@/components/admin/SessionDeleteButton";
import type { ChapelSession } from "@/lib/supabase/types";

function getQrDurationMinutes(session: ChapelSession): number {
  const expiresAt = new Date(session.token_expires_at).getTime();
  const endOfDay = new Date(`${session.session_date}T23:59:59`).getTime();
  return Math.round((expiresAt - endOfDay) / (60 * 1000));
}

export default async function AdminDashboardPage() {
  const session = (await getAdminSession())!;
  const supabase = createSupabaseClient();
  const semester = getCurrentSemester();

  const { data: sessions } = await supabase
    .from("chapel_sessions")
    .select("*")
    .eq("semester", semester)
    .order("session_date", { ascending: false });

  const chapelSessions = (sessions ?? []) as ChapelSession[];

  return (
    <div className="p-4 space-y-6">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-xl font-bold">채플 관리</h1>
          <p className="text-base-content/60 text-sm">
            {session.username}
          </p>
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
        <h2 className="text-lg font-semibold mb-3">
          현재 학기 채플 목록
        </h2>
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
                    qrDurationMinutes={getQrDurationMinutes(s)}
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
