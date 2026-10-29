import { redirect } from "next/navigation";

import { ROUTES } from "@/constants/navigation";

/** 최초 진입은 로그인 화면 (screen-spec S01) */
export default function Home() {
  redirect(ROUTES.login);
}
