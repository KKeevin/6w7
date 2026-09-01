import { cache } from "react";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";
import {
  chosenAccountLocale,
  rememberInferredLocale,
  requestLocaleWithoutAccount,
} from "@/lib/account-locale";
import {
  DEFAULT_LOCALE,
  isLocale,
  makeTranslator,
  type Locale,
  type Translator,
} from "@/shared/i18n";

export function parseStoredLocale(value: string | null | undefined): Locale {
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export const getRequestLocale = cache(async (): Promise<Locale> => {
  try {
    const session = await auth();
    if (session?.user?.id && !session.user.isDemo) {
      const row = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { locale: true, localeChosen: true, isDemo: true },
      });
      const chosen = chosenAccountLocale(row);
      if (chosen) return chosen;
      await rememberInferredLocale(session.user.id, row);
    }
  } catch {
    /* 未登入或 DB 不可用時改走 Cookie／瀏覽器語言 */
  }

  return requestLocaleWithoutAccount();
});

export async function getT(): Promise<Translator> {
  return makeTranslator(await getRequestLocale());
}
