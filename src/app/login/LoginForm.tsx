"use client";

import { useState, type FormEvent } from "react";

interface LoginFormValues {
  email: string;
  password: string;
}

type LoginFormErrors = Partial<Record<keyof LoginFormValues, string>>;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validate({ email, password }: LoginFormValues): LoginFormErrors {
  const errors: LoginFormErrors = {};
  if (!email.trim()) errors.email = "이메일을 입력하세요.";
  else if (!EMAIL_PATTERN.test(email.trim())) errors.email = "올바른 이메일 형식이 아닙니다.";
  if (!password) errors.password = "비밀번호를 입력하세요.";
  return errors;
}

const inputClass =
  "h-12 w-full rounded-lg border bg-white px-4 text-[15px] text-gray-900 outline-none placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function LoginForm() {
  const [values, setValues] = useState<LoginFormValues>({ email: "", password: "" });
  const [errors, setErrors] = useState<LoginFormErrors>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formMessage, setFormMessage] = useState<string | null>(null);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormMessage(null);

    const nextErrors = validate(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setIsSubmitting(true);
    try {
      // TODO(auth): 로그인 API 연동. 서버가 인증한 기관 역할에 따라 HOME_ROUTE_BY_ROLE로 이동한다.
      // 인증 방식(JWT/HttpOnly 쿠키)과 응답 구조가 확정되기 전까지 화면 이동을 하지 않는다.
      setFormMessage("로그인 API가 아직 연동되지 않았습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col">
      <label htmlFor="email" className="mb-2 text-[15px] font-bold text-gray-900">
        이메일
      </label>
      <input
        id="email"
        type="email"
        autoComplete="email"
        placeholder="이메일을 입력하세요."
        value={values.email}
        onChange={(e) => setValues((prev) => ({ ...prev, email: e.target.value }))}
        aria-invalid={Boolean(errors.email)}
        aria-describedby={errors.email ? "email-error" : undefined}
        className={`${inputClass} ${errors.email ? "border-red-500" : "border-line"}`}
      />
      {errors.email && (
        <p id="email-error" className="mt-1.5 text-sm text-red-600">
          {errors.email}
        </p>
      )}

      <label htmlFor="password" className="mb-2 mt-6 text-[15px] font-bold text-gray-900">
        비밀번호
      </label>
      <input
        id="password"
        type="password"
        autoComplete="current-password"
        placeholder="비밀번호를 입력하세요."
        value={values.password}
        onChange={(e) => setValues((prev) => ({ ...prev, password: e.target.value }))}
        aria-invalid={Boolean(errors.password)}
        aria-describedby={errors.password ? "password-error" : undefined}
        className={`${inputClass} ${errors.password ? "border-red-500" : "border-line"}`}
      />
      {errors.password && (
        <p id="password-error" className="mt-1.5 text-sm text-red-600">
          {errors.password}
        </p>
      )}

      {formMessage && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {formMessage}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-6 h-12 rounded-lg bg-primary text-base font-bold text-white transition-colors hover:bg-primary-hover disabled:cursor-not-allowed disabled:opacity-60"
      >
        로그인
      </button>
    </form>
  );
}
