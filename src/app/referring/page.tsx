import { redirect } from "next/navigation";

import { HOME_ROUTE_BY_ROLE } from "@/constants/navigation";

export default function ReferringHome() {
  redirect(HOME_ROUTE_BY_ROLE.REFERRING);
}
