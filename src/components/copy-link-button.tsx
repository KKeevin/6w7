"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n-provider";

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const t = useT();

  async function copy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <Button type="button" size="sm" variant="outline" onClick={() => void copy()}>
      {copied ? t("common.copied") : t("common.copy")}
    </Button>
  );
}
