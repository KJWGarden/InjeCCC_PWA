export function getCurrentSemester(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // March-August: 1학기, September-February: 2학기
  const semester = month >= 3 && month <= 8 ? 1 : 2;
  const semesterYear = month <= 2 ? year - 1 : year;
  return `${semesterYear}-${semester}`;
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`;
}

export function formatSemester(semester: string): string {
  const [year, sem] = semester.split("-");
  return `${year}년 ${sem}학기`;
}
