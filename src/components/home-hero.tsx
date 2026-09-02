import type { ReactNode } from "react";
import { HomeViewportSection } from "@/components/home-viewport-fill";

type Props = {
  copy: ReactNode;
  preview: ReactNode;
};

/** 首頁第一屏：手機填滿頂欄與頁尾之間的可視區 */
export function HomeHero({ copy, preview }: Props) {
  return (
    <HomeViewportSection
      copy={copy}
      panel={preview}
      innerClassName="lg:grid-cols-[minmax(0,1fr)_16.5rem] lg:py-20"
    />
  );
}
