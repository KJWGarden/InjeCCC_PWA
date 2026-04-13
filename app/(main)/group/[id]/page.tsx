import { notFound } from "next/navigation";
import Link from "next/link";
import { getSession } from "@/lib/auth";
import { createSupabaseClient } from "@/lib/supabase/server";
import GroupAttendanceList from "@/components/ui/GroupAttendanceList";
import GroupDeleteButton from "@/components/ui/GroupDeleteButton";
import GroupLeaveButton from "@/components/ui/GroupLeaveButton";
import GroupJoinButton from "@/components/ui/GroupJoinButton";

export default async function GroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = (await getSession())!;
  const supabase = createSupabaseClient();

  // Get group with leader info
  const { data: group } = await supabase
    .from("groups")
    .select("*, students!groups_leader_id_fkey(id, name)")
    .eq("id", id)
    .single();

  if (!group) notFound();

  const leader = group.students as unknown as {
    id: string;
    name: string;
  };

  const isLeader = group.leader_id === session.id;

  // Get members
  const { data: memberRows } = await supabase
    .from("group_members")
    .select("students(id, name)")
    .eq("group_id", id);

  const members = (memberRows ?? []).map((m) => {
    const s = m.students as unknown as {
      id: string;
      name: string;
    };
    return { id: s.id, name: s.name };
  });

  // Check if current user is a member
  const isMember = members.some((m) => m.id === session.id);

  // Build attendance list: leader first, then members
  const attendanceMembers = [
    { id: leader.id, name: leader.name, isLeader: true },
    ...members.filter((m) => m.id !== leader.id),
  ];

  return (
    <div className="p-4 space-y-4">
      <Link href="/group" className="btn btn-ghost btn-sm">
        &larr; 전체 순
      </Link>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold">{group.name}</h1>
          <p className="text-sm text-base-content/60">
            순장: {leader.name}
          </p>
          <p className="text-xs text-base-content/40">순원 {members.filter((m) => m.id !== leader.id).length}명</p>
        </div>
        <div>
          {isLeader && (
            <GroupDeleteButton
              groupId={group.id}
              groupName={group.name}
              redirectTo="/group"
            />
          )}
          {!isLeader && isMember && (
            <GroupLeaveButton
              groupId={group.id}
              groupName={group.name}
              redirectTo="/group"
            />
          )}
          {!isLeader && !isMember && (
            <GroupJoinButton groupId={group.id} />
          )}
        </div>
      </div>

      <div className="divider text-sm text-base-content/40">출석 현황</div>

      {attendanceMembers.length === 0 ? (
        <p className="text-base-content/60 text-sm">아직 순원이 없습니다</p>
      ) : (
        <GroupAttendanceList members={attendanceMembers} />
      )}
    </div>
  );
}
