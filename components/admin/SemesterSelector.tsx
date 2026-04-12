"use client";

import { useRouter, useSearchParams } from "next/navigation";

interface SemesterSelectorProps {
  semesters: string[];
  current: string;
}

export default function SemesterSelector({
  semesters,
  current,
}: SemesterSelectorProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function handleChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("semester", e.target.value);
    router.push(`/admin?${params.toString()}`);
  }

  // Parse for display
  function label(s: string) {
    const [year, sem] = s.split("-");
    return `${year}년 ${sem}학기`;
  }

  return (
    <select
      className="select select-bordered select-sm"
      value={current}
      onChange={handleChange}
    >
      {semesters.map((s) => (
        <option key={s} value={s}>
          {label(s)}
        </option>
      ))}
    </select>
  );
}
