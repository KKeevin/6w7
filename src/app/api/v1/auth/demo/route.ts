import { signIn, signOut } from "@/lib/auth";
import { ensureDemoAccount, demoAccountPassword } from "@/services/demo-account.service";
import { DEMO_PROFILE } from "@/shared/demo-account";

function nextPath(request: Request) {
  const url = new URL(request.url);
  const next = url.searchParams.get("next") || DEMO_PROFILE.dashboardPath;
  return next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";
}

/** 以真實帳密登入示範帳號 */
export async function GET(request: Request) {
  await ensureDemoAccount();
  await signIn("credentials", {
    username: DEMO_PROFILE.username,
    password: demoAccountPassword(),
    redirectTo: nextPath(request),
  });
}

/** 登出示範帳號 */
export async function POST() {
  await signOut({ redirectTo: "/" });
}
