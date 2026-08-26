import { Check, EyeOff, Fingerprint, LockKeyhole } from "lucide-react";

const stages = [
  { label: "CREATE", detail: "Round initialized", proof: "State record", icon: Fingerprint },
  { label: "OPEN", detail: "Commit window", proof: "Accepting inputs", icon: LockKeyhole },
  { label: "COMMIT", detail: "Poseidon hash", proof: "Value concealed", icon: EyeOff },
  { label: "CLOSE", detail: "Commit window sealed", proof: "Reveal gate", icon: LockKeyhole },
  { label: "REVEAL", detail: "Matching value", proof: "Commitment check", icon: Check },
  { label: "RESOLVE", detail: "Round finalized", proof: "Receipt + state", icon: Fingerprint },
] as const;

export function AgentLifecycleChart() {
  return (
    <section className="mt-6 border border-[#70D49D]/30 bg-[#0B1716] p-5 sm:p-7" aria-labelledby="agent-lifecycle-title" data-testid="agent-lifecycle-chart">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#70D49D]">PROTOCOL TELEMETRY / READ-ONLY MODEL</div>
          <h2 id="agent-lifecycle-title" className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-[#F3EEE5] sm:text-3xl">The decision becomes legible only at the edge.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#AEB8BE]">A deterministic commit–reveal sequence. Each stage is a contract state or state-changing boundary, not a performance metric.</p>
        </div>
        <div className="shrink-0 font-mono text-[10px] tracking-[0.12em] text-[#F0563A]">6 STATE EDGES / MAINNET</div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Agent commit reveal lifecycle">
        {stages.map(({ label, detail, proof, icon: Icon }, index) => (
          <div key={label} className="relative border border-white/15 bg-[#12201D] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-[#F0563A]">{String(index + 1).padStart(2, "0")}</span>
              <Icon className="h-4 w-4 text-[#70D49D]" aria-hidden="true" />
            </div>
            <div className="mt-5 font-display text-lg font-semibold text-[#F3EEE5]">{label}</div>
            <div className="mt-2 text-xs leading-5 text-[#CFC7BC]">{detail}</div>
            <div className="mt-5 border-t border-white/10 pt-3 font-mono text-[9px] leading-4 tracking-[0.05em] text-[#70D49D]">{proof}</div>
            {index < stages.length - 1 && <span className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 bg-[#0B1716] px-1 font-mono text-xs text-[#F0563A] lg:block" aria-hidden="true">→</span>}
          </div>
        ))}
      </div>

      <div className="mt-6 grid gap-3 border-t border-white/10 pt-5 sm:grid-cols-3">
        <div><div className="font-mono text-[9px] tracking-[0.12em] text-[#AEB8BE]">HIDDEN UNTIL REVEAL</div><div className="mt-2 text-sm text-[#F3EEE5]">Committed value remains unreadable to business logic.</div></div>
        <div><div className="font-mono text-[9px] tracking-[0.12em] text-[#AEB8BE]">MATCHING ENFORCED</div><div className="mt-2 text-sm text-[#F3EEE5]">The reveal must match the prior commitment.</div></div>
        <div><div className="font-mono text-[9px] tracking-[0.12em] text-[#AEB8BE]">PUBLIC EDGE</div><div className="mt-2 text-sm text-[#F3EEE5]">Receipts and read-only state checks remain inspectable.</div></div>
      </div>
    </section>
  );
}
