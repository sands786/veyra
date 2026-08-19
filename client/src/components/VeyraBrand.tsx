type VeyraBrandProps = {
  compact?: boolean;
  className?: string;
  descriptor?: string;
};

const veyraShieldMark = "/manus-storage/veyra-transparent-mark-clean_a867fd1b.png";

/** The product brand lockup mirrors the teaser: shield, vermilion signal bar, white uppercase wordmark, emerald descriptor. */
export function VeyraBrand({
  compact = false,
  className = "",
  descriptor = "PRIVATE FINANCIAL COORDINATION",
}: VeyraBrandProps) {
  const markSize = compact ? "h-8 w-8" : "h-11 w-11";
  const wordmarkSize = compact ? "text-[13px]" : "text-[17px]";
  const descriptorSize = compact ? "text-[7px]" : "text-[8px]";

  return (
    <div className={`inline-flex items-center gap-3 ${className}`} aria-label={`Veyra — ${descriptor.toLowerCase()}`}>
      <img
        src={veyraShieldMark}
        alt=""
        aria-hidden="true"
        className={`${markSize} shrink-0 object-contain drop-shadow-[0_0_18px_rgba(112,212,157,.22)]`}
      />
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className="h-[2px] w-5 shrink-0 bg-[#F0563A]" />
          <span className={`font-display ${wordmarkSize} font-bold leading-none tracking-[0.13em] text-[#F3EEE5]`}>VEYRA</span>
        </div>
        <div className={`mt-1 font-mono ${descriptorSize} leading-none tracking-[0.13em] text-[#70D49D]`}>{descriptor}</div>
      </div>
    </div>
  );
}
