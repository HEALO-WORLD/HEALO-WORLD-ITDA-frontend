import type { Metadata } from "next";

import DevRoleShortcuts from "@/components/dev/DevRoleShortcuts";
import AppHeader from "@/components/layout/AppHeader";

import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "의료기관 로그인 | IT:DA",
};

export default function LoginPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader subtitle="의료기관 검사 의뢰·예약 플랫폼" />
      <main className="flex flex-1 flex-col items-center justify-center px-4 py-16">
        <section className="w-full max-w-[652px] rounded-xl border border-line bg-white px-14 py-14">
          <h1 className="text-center text-[34px] font-bold text-gray-900">의료기관 로그인</h1>
          <p className="mt-3 text-center text-lg text-gray-600">
            등록된 기관 계정으로 로그인하세요.
          </p>

          <div className="mt-10">
            <LoginForm />
          </div>

          <p className="mt-8 border-t border-line pt-6 text-center text-[15px] text-gray-600">
            의뢰기관 · 검사기관 공통 로그인
          </p>
        </section>

        <DevRoleShortcuts />
      </main>
    </div>
  );
}
