/** 頁尾右下：超過 5 個字時把字形橫向壓扁，版面寬度一起變窄 */
const CONDENSE_AFTER = 5;
const MIN_SCALE = 0.72;

export function FooterCondensedText({ children }: { children: string }) {
  const len = Array.from(children).length;
  if (len <= CONDENSE_AFTER) return children;

  const scale = Math.max(MIN_SCALE, CONDENSE_AFTER / len);
  const unit = /[\u3000-\u9fff\uac00-\ud7af]/.test(children) ? "em" : "ch";

  return (
    <span
      className="inline-block origin-left whitespace-nowrap align-baseline"
      style={{
        transform: `scaleX(${scale})`,
        marginRight: `calc((${scale} - 1) * ${len}${unit})`,
      }}
    >
      {children}
    </span>
  );
}
