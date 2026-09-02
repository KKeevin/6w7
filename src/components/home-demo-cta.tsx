"use client";

import { demoEnterHref } from "@/shared/paths";
import { resetDemoIgShareGuideHint } from "@/lib/ig-share-guide-hint";
import { burstMemeFireworks } from "@/components/meme-drift";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useT } from "@/components/i18n-provider";

type Props = {
  className?: string;
};

/** 示範帳號登入後進 dashboard；點下去會重設示範導覽旗標 */
export function HomeDemoCta({ className }: Props) {
  const t = useT();
  return (
    <a
      href={demoEnterHref("/dashboard")}
      className={cn(
        buttonVariants({ variant: "secondary", size: "lg" }),
        "h-12 w-full px-8 text-base sm:w-auto",
        className,
      )}
      onClick={(event) => {
        burstMemeFireworks(event.currentTarget);
        resetDemoIgShareGuideHint();
      }}
    >
      {t("home.tryNow")}
    </a>
  );
}
