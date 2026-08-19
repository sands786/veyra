type VeyraBrandProps = {
  compact?: boolean;
  className?: string;
  descriptor?: string;
};

function CinematicVeyraMark({ className }: { className: string }) {
  return (
    <svg viewBox="0 0 88 104" aria-hidden="true" className={className} fill="none">
      <defs>
        <linearGradient id="veyra-metal" x1="14" y1="8" x2="74" y2="94" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F3EEE5" />
          <stop offset="0.45" stopColor="#77868B" />
          <stop offset="1" stopColor="#E8E4DA" />
        </linearGradient>
        <linearGradient id="veyra-v-metal" x1="25" y1="29" x2="58" y2="74" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F3EEE5" />
          <stop offset="0.62" stopColor="#909C9B" />
          <stop offset="1" stopColor="#F3EEE5" />
        </linearGradient>
        <filter id="veyra-glow" x="-40%" y="-30%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.8" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>
      </defs>
      <path d="M44 4 78 18v33c0 21-13.2 36.8-34 47C23.2 87.8 10 72 10 51V18L44 4Z" fill="#111210" fillOpacity="0.6" stroke="url(#veyra-metal)" strokeWidth="2.2" filter="url(#veyra-glow)" />
      <path d="M44 11 71 23v27.1c0 16.3-9.9 29.2-27 38.6-17.1-9.4-27-22.3-27-38.6V23l27-12Z" stroke="#EDE9DE" strokeOpacity="0.72" strokeWidth="1.2" />
      <path d="m24.5 29.5 11.1 0 9.2 31.1-5.5 11.7L24.5 29.5Z" fill="url(#veyra-v-metal)" stroke="#F3EEE5" strokeOpacity="0.86" strokeWidth="1.05" />
      <path d="m61.5 29.5-13.8 30.2 5.5 12.6 15.3-42.8H61.5Z" stroke="#F3EEE5" strokeOpacity="0.92" strokeWidth="1.4" />
    </svg>
  );
}

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
      <CinematicVeyraMark className={`${markSize} shrink-0 drop-shadow-[0_0_18px_rgba(112,212,157,.22)]`} />
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
