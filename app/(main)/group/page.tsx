import Link from "next/link";
import { getSession } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase/server";
import GroupCard from "@/components/ui/GroupCard";

export default async function GroupPage() {
  const session = (await getSession())!;
  const supabase = createSupabaseClient();

  // All groups (both campuses)
  const { data: groups } = await supabase
    .from("groups")
    .select("*, students!groups_leader_id_fkey(name)")
    .order("created_at", { ascending: false });

  const allGroups = groups ?? [];

  // My memberships
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id")
    .eq("student_id", session.id);

  const joinedGroupIds = new Set((memberships ?? []).map((m) => m.group_id));

  // Groups I lead
  const { data: ledGroups } = await supabase
    .from("groups")
    .select("id")
    .eq("leader_id", session.id);

  const ledGroupIds = new Set((ledGroups ?? []).map((g) => g.id));

  // Member counts
  const groupIds = allGroups.map((g) => g.id);
  const { data: memberRows } = await supabase
    .from("group_members")
    .select("group_id")
    .in("group_id", groupIds.length > 0 ? groupIds : ["__none__"]);

  const countMap: Record<string, number> = {};
  for (const row of memberRows ?? []) {
    countMap[row.group_id] = (countMap[row.group_id] || 0) + 1;
  }

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">전체 순</h1>
        <Link href="/group/my" className="btn btn-ghost btn-sm">
          나의 순 보기
        </Link>
      </div>

      {session.role === "leader" && (
        <Link href="/group/my" className="btn btn-primary btn-sm w-full">
          순 만들기
        </Link>
      )}

      {allGroups.length === 0 ? (
        <p className="text-base-content/60 text-sm py-8 text-center">
          아직 생성된 순이 없습니다
        </p>
      ) : (
        <>
          {(["인제대학교", "가야대학교"] as const).map((uni) => {
            const uniGroups = allGroups.filter((g) => g.university === uni);
            if (uniGroups.length === 0) return null;
            return (
              <section key={uni} className="space-y-2">
                <h2 className="text-sm font-semibold text-base-content/60">
                  {uni === "인제대학교" ? "인제대학교" : "가야대학교"}
                </h2>
                {uniGroups.map((group) => (
                  <GroupCard
                    key={group.id}
                    id={group.id}
                    name={group.name}
                    leaderName={(group.students as { name: string }).name}
                    memberCount={countMap[group.id] || 0}
                    university={group.university}
                    isLeader={ledGroupIds.has(group.id)}
                    isJoined={joinedGroupIds.has(group.id)}
                  />
                ))}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}
