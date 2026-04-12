"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LoginForm() {
  const router = useRouter();
  const [studentId, setStudentId] = useState("");
  const [name, setName] = useState("");
  const [university, setUniversity] = useState("");
  const [role, setRole] = useState<"leader" | "member">("member");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function validateFields(): string | null {
    if (!/^\d+$/.test(studentId)) return "학번은 숫자만 입력해주세요";
    if (studentId.length < 5) return "중복 방지를 위해 학번 전체를 입력해주세요";
    const isKorean = /^[가-힣]+$/.test(name);
    const isEnglish = /^[a-zA-Z]+$/.test(name);
    if (isKorean && name.length < 2) return "한글 이름은 2글자 이상 입력해주세요";
    if (isEnglish && name.length < 4) return "영어 이름은 4글자 이상 입력해주세요";
    if (!isKorean && !isEnglish) return "이름은 한글 또는 영어만 입력해주세요";
    return null;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const validationError = validateFields();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, name, university, role }),
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
          inputMode="numeric"
          placeholder="학번"
          className="input input-bordered w-full"
          value={studentId}
          onChange={(e) => setStudentId(e.target.value.replace(/\D/g, ""))}
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

      <div className="flex gap-4">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="role"
            className="radio radio-primary radio-sm"
            value="member"
            checked={role === "member"}
            onChange={() => setRole("member")}
          />
          <span className="text-sm">순원</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="radio"
            name="role"
            className="radio radio-primary radio-sm"
            value="leader"
            checked={role === "leader"}
            onChange={() => setRole("leader")}
          />
          <span className="text-sm">순장</span>
        </label>
      </div>

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
