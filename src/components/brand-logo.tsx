import Image from "next/image";
import { BRAND } from "@/shared/tools";
import { cn } from "@/lib/utils";

type BrandLogoProps = {
  className?: string;
  /** 高度（px），寬度依比例自動 */
  height?: number;
  priority?: boolean;
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
