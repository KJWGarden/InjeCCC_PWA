export type University = "인제대학교" | "가야대학교";

export interface Student {
  id: string;
  student_id: string;
  name: string;
  university: University;
  created_at: string;
}

export interface ChapelSession {
  id: string;
  university: University;
  session_date: string;
  semester: string;
  title: string | null;
  token: string;
  token_expires_at: string;
  is_active: boolean;
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
