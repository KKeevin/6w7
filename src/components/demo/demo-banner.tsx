import { signOut } from "@/lib/auth";
import { DEMO_PROFILE } from "@/shared/demo-account";
import { BRAND } from "@/shared/tools";
import { SHELL_X } from "@/shared/shell";
import { getT } from "@/lib/locale";

async function signOutDemoAndRegister() {
  "use server";
  await signOut({ redirectTo: "/?mode=register" });
}

/** 示範帳號已登入時的頂部說明 */
export async function DemoBanner() {
  const t = await getT();
  return (
    <div className="border-b border-[var(--mint)]/25 bg-[#e7f7f2]">
      <div
        className={`${SHELL_X} flex flex-col gap-2 py-2.5 text-xs leading-relaxed text-[var(--ink)] sm:flex-row sm:items-center sm:justify-between sm:text-sm`}
      >
        <p>
          {t("demo.banner", {
            brand: BRAND.en,
            username: DEMO_PROFILE.username,
          })}
        </p>
        <form action={signOutDemoAndRegister} className="shrink-0">
          <button
            type="submit"
            className="text-left font-semibold text-[var(--mint)] underline-offset-2 hover:underline"
          >
            {t("demo.switchAccount")}
          </button>
        </form>
      </div>
    </div>
  );
}
