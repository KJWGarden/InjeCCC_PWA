export type University = "인제대학교" | "가야대학교";

export type Role = "leader" | "member";

export interface Student {
  id: string;
  student_id: string;
  name: string;
  university: University;
  role: Role;
  created_at: string;
}

export interface Group {
  id: string;
  name: string;
  leader_id: string;
  university: string;
  created_at: string;
}

export interface GroupMember {
  id: string;
  group_id: string;
  student_id: string;
  joined_at: string;
}

export interface ChapelSession {
  id: string;
  session_date: string;
  semester: string;
  title: string | null;
  token: string;
  token_expires_at: string;
  is_active: boolean;
  sheet_title: string | null;
  created_at: string;
}

export interface AttendanceRecord {
  id: string;
  student_id: string;
  session_id: string;
  checked_in_at: string;
}

export interface AttendanceWithSession extends AttendanceRecord {
  chapel_sessions: Pick<ChapelSession, "session_date" | "title" | "semester">;
}

export interface Admin {
  id: string;
  username: string;
  password_hash: string;
  created_at: string;
}
