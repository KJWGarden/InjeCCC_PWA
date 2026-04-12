import Link from "next/link";

interface GroupCardProps {
  id: string;
  name: string;
  leaderName: string;
  memberCount: number;
  university?: string;
  isLeader?: boolean;
  isJoined?: boolean;
}

export default function GroupCard({
  id,
  name,
  leaderName,
  memberCount,
  university,
  isLeader,
  isJoined,
}: GroupCardProps) {
  return (
    <Link
      href={`/group/${id}`}
      className="flex items-center justify-between rounded-lg bg-base-200 px-4 py-3"
    >
      <div>
        <p className="font-medium text-sm">
          {name}
          {isLeader && (
            <span className="badge badge-primary badge-xs ml-2">순장</span>
          )}
          {!isLeader && isJoined && (
            <span className="badge badge-outline badge-xs ml-2">가입됨</span>
          )}
        </p>
        <p className="text-xs text-base-content/60">
          순장: {leaderName}
          {university && (
            <span className="badge badge-ghost badge-xs ml-1">
              {university === "인제대학교" ? "인제" : "가야"}
            </span>
          )}
        </p>
      </div>
      <div className="text-right text-xs text-base-content/60">
        {memberCount}명
      </div>
    </Link>
  );
}
