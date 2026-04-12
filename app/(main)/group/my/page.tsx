import Link from "next/link";
import { getSession } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase/server";
import GroupCard from "@/components/ui/GroupCard";
import GroupCreateForm from "@/components/ui/GroupCreateForm";

export default async function MyGroupPage() {
  const session = (await getSession())!;
  const supabase = createSupabaseClient();

  // Groups I joined (as member)
  const { data: memberships } = await supabase
    .from("group_members")
    .select("group_id, groups(*, students!groups_leader_id_fkey(name))")
    .eq("student_id", session.id)
    .order("joined_at", { ascending: false });

  const myMemberships = memberships ?? [];

  // Groups I lead
  const { data: ledGroups } = await supabase
    .from("groups")
    .select("*, students!groups_leader_id_fkey(name)")
    .eq("leader_id", session.id)
    .order("created_at", { ascending: false });

  const myLedGroups = ledGroups ?? [];

  // Member counts for all relevant groups
  const allGroupIds = [
    ...myMemberships.map((m) => m.group_id),
    ...myLedGroups.map((g) => g.id),
  ];
  const uniqueIds = [...new Set(allGroupIds)];

  const { data: memberRows } = await supabase
    .from("group_members")
    .select("group_id")
    .in("group_id", uniqueIds.length > 0 ? uniqueIds : ["__none__"]);

  const countMap: Record<string, number> = {};
  for (const row of memberRows ?? []) {
    countMap[row.group_id] = (countMap[row.group_id] || 0) + 1;
  }

  const ledGroupIds = new Set(myLedGroups.map((g) => g.id));

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold">나의 순</h1>
        <Link href="/group" className="btn btn-ghost btn-sm">
          전체 순 보기
        </Link>
      </div>

      {myLedGroups.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-base-content/60">이끄는 순</h2>
          {myLedGroups.map((group) => (
            <GroupCard
              key={group.id}
              id={group.id}
              name={group.name}
              leaderName={(group.students as { name: string }).name}
              memberCount={countMap[group.id] || 0}
              isLeader
            />
          ))}
        </section>
      )}

      {myMemberships.length > 0 && (
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-base-content/60">가입한 순</h2>
          {myMemberships.map((m) => {
            const group = m.groups as unknown as {
              id: string;
              name: string;
              leader_id: string;
              students: { name: string };
            };
            return (
              <GroupCard
                key={m.group_id}
                id={group.id}
                name={group.name}
                leaderName={group.students.name}
                memberCount={countMap[m.group_id] || 0}
                isJoined
              />
            );
          })}
        </section>
      )}

      {myLedGroups.length === 0 && myMemberships.length === 0 && (
        <p className="text-base-content/60 text-sm py-8 text-center">
          아직 가입한 순이 없습니다
        </p>
      )}

      {session.role === "leader" && (
        <section className="space-y-2">
          <div className="divider text-sm text-base-content/40">새 순 만들기</div>
          <GroupCreateForm />
        </section>
      )}
    </div>
  );
}
