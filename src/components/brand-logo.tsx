import Image from "next/image";
import { BRAND } from "@/shared/tools";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  /** 高度（px），寬度依比例自動 */
  height?: number;
  priority?: boolean;
};

type BrandDomainMarkProps = BrandLogoProps & {
  /** splash／圖卡那行「匿名問答」；不傳就不顯示 */
  kicker?: string;
};

export function BrandLogo({
  className,
  height = 28,
  priority = false,
}: BrandLogoProps) {
  const width = Math.round(height * 2.4);

  return (
    <span
      className={cn("relative inline-block shrink-0 overflow-hidden", className)}
      style={{ height, width }}
    >
      <Image
        key={BRAND.logoVersion}
        src={BRAND.logoSrc}
        alt={BRAND.en}
        width={width}
        height={height}
        priority={priority}
        className="object-contain object-left"
        style={{ height, width: "auto", maxWidth: width }}
      />
    </span>
  );
}

/** logo + .link，可加底下拉開的「匿名問答」（與 splash 相同） */
export function BrandDomainMark({
  height = 28,
  className,
  priority = false,
  kicker,
}: BrandDomainMarkProps) {
  const linkPx = Math.round(height * 0.63);
  const letters = kicker ? [...kicker] : [];
  const compact = letters.filter((ch) => ch.trim()).length <= 6;
  const kickerSize = Math.max(9, Math.round(height * 0.42));

  return (
    <span className={cn("inline-flex w-fit flex-col items-stretch", className)}>
      <span className="inline-flex items-end">
        <BrandLogo height={height} priority={priority} className="shrink-0" />
        <span
          className="-ml-0.5 font-[family-name:var(--font-display)] font-bold leading-none tracking-tight text-[var(--ink)]"
          style={{
            fontSize: linkPx,
            transform: "translateY(-2px)",
          }}
        >
          .link
        </span>
      </span>
      {kicker ? (
        compact ? (
          <span
            className="mt-1 flex w-full justify-between pl-1 font-semibold leading-none text-[var(--muted)]"
            style={{ fontSize: kickerSize }}
          >
            {letters.map((ch, i) => (
              <span key={`${ch}-${i}`}>{ch}</span>
            ))}
          </span>
        ) : (
          <span
            className="mt-1 whitespace-nowrap pl-1 font-medium leading-none tracking-[0.18em] text-[var(--muted)]"
            style={{ fontSize: kickerSize }}
          >
            {kicker}
          </span>
        )
      ) : null}
    </span>
  );
}
