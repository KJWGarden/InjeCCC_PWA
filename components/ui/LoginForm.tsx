"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, name, university }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "로그인에 실패했습니다");
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm">
      {error && (
        <div role="alert" className="alert alert-error text-sm">
          <span>{error}</span>
        </div>
      )}

      <label className="floating-label">
        <span>대학교</span>
        <select
          className="select select-bordered w-full"
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
          required
        >
          <option value="" disabled>
            대학교 선택
          </option>
          <option value="인제대학교">인제대학교</option>
          <option value="가야대학교">가야대학교</option>
        </select>
      </label>

      <label className="floating-label">
        <span>학번</span>
        <input
          type="text"
          placeholder="학번"
          className="input input-bordered w-full"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value)}
          required
        />
      </label>

      <label className="floating-label">
        <span>이름</span>
        <input
          type="text"
          placeholder="이름"
          className="input input-bordered w-full"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>

      <button
        type="submit"
        className="btn btn-primary w-full"
        disabled={loading}
      >
        {loading ? <span className="loading loading-spinner loading-sm" /> : "로그인"}
      </button>
    </form>
  );
}
