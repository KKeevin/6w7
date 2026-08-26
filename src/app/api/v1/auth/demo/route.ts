import { signIn, signOut } from "@/lib/auth";
import { ensureDemoAccount, demoAccountPassword } from "@/services/demo-account.service";
import { DEMO_PROFILE } from "@/shared/demo-account";
import { safeInternalPath, withSearchParam } from "@/shared/paths";

function nextPath(request: Request) {
  const url = new URL(request.url);
  return safeInternalPath(url.searchParams.get("next"));
}

/** 以真實帳密登入示範帳號 */
export async function GET(request: Request) {
  await ensureDemoAccount();
  await signIn("credentials", {
    username: DEMO_PROFILE.username,
    password: demoAccountPassword(),
    redirectTo: withSearchParam(nextPath(request), "guideHint", "1"),
  });
}

/** 登出示範帳號 */
export async function POST() {
  await signOut({ redirectTo: "/" });
}
