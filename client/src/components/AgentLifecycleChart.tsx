import { Check, EyeOff, Fingerprint, LockKeyhole } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const stages = [
  { label: "CREATE", detail: "Round initialized", proof: "State record", explanation: "Creates the round record that will hold the commit–reveal lifecycle. The public edge is the existence of the round, not the participant’s private decision.", observability: "Read-only round state", icon: Fingerprint },
  { label: "OPEN", detail: "Commit window", proof: "Accepting inputs", explanation: "Opens the round for wallet callers to submit commitments. The contract can observe the caller and the round state while the committed value is not yet exposed.", observability: "Caller and open state", icon: LockKeyhole },
  { label: "COMMIT", detail: "Poseidon hash", proof: "Value concealed", explanation: "Stores a cryptographic commitment for an item. The commitment acts as a binding fingerprint; it does not reveal the underlying value before the reveal step.", observability: "Commitment hash", icon: EyeOff },
  { label: "CLOSE", detail: "Commit window sealed", proof: "Reveal gate", explanation: "Closes the commit window and prevents late commitments from changing the decision set. Reveal is now the only valid path for matching a prior commitment.", observability: "Closed round state", icon: LockKeyhole },
  { label: "REVEAL", detail: "Matching value", proof: "Commitment check", explanation: "Presents the value and salt needed to recompute the commitment. The contract checks that the revealed payload matches the stored commitment before accepting it.", observability: "Revealed payload and match result", icon: Check },
  { label: "RESOLVE", detail: "Round finalized", proof: "Receipt + state", explanation: "Finalizes the resolved round after the valid reveal. The transaction receipt and read-only state provide the public evidence edge for independent inspection.", observability: "Final state and receipt", icon: Fingerprint },
] as const;

export function AgentLifecycleChart() {
  return (
    <section className="mt-6 border border-[#70D49D]/30 bg-[#0B1716] p-5 sm:p-7" aria-labelledby="agent-lifecycle-title" data-testid="agent-lifecycle-chart">
      <div className="flex flex-col gap-3 border-b border-white/10 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#70D49D]">PROTOCOL TELEMETRY / READ-ONLY MODEL</div>
          <h2 id="agent-lifecycle-title" className="mt-2 font-display text-2xl font-semibold tracking-[-0.03em] text-[#F3EEE5] sm:text-3xl">The decision becomes legible only at the edge.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#AEB8BE]">Hover or focus a stage to inspect its contract role, evidence edge, and privacy boundary. Each stage is a contract state or state-changing boundary, not a performance metric.</p>
        </div>
        <div className="shrink-0 font-mono text-[10px] tracking-[0.12em] text-[#F0563A]">6 STATE EDGES / MAINNET</div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3 lg:grid-cols-6" aria-label="Agent commit reveal lifecycle">
        {stages.map(({ label, detail, proof, explanation, observability, icon: Icon }, index) => (
          <Tooltip key={label}>
            <TooltipTrigger asChild>
              <button type="button" className="group relative min-h-[184px] w-full rounded-[12px] border border-white/15 bg-[#12201D] p-4 text-left transition-[transform,border-color,background-color,box-shadow] duration-200 ease-out hover:-translate-y-1 hover:border-[#F0563A]/70 hover:bg-[#172A25] hover:shadow-[0_14px_28px_rgba(0,0,0,0.24),0_0_0_1px_rgba(240,86,58,0.18)] focus-visible:-translate-y-1 focus-visible:border-[#F0563A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0563A]/70 motion-reduce:transform-none motion-reduce:transition-none" aria-label={`${label}: ${explanation}`}>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-[10px] font-semibold tracking-[0.12em] text-[#F0563A]">{String(index + 1).padStart(2, "0")}</span>
                  <Icon className="h-4 w-4 text-[#70D49D] transition-[transform,color] duration-200 ease-out group-hover:scale-110 group-hover:text-[#F0563A] motion-reduce:transition-none" aria-hidden="true" />
                </div>
                <div className="mt-5 font-display text-lg font-semibold text-[#F3EEE5] transition-[transform,color] duration-200 ease-out group-hover:-translate-y-0.5 group-hover:text-[#FFF9EF] motion-reduce:transition-none">{label}</div>
                <div className="mt-2 text-xs leading-5 text-[#CFC7BC]">{detail}</div>
                <div className="mt-5 border-t border-white/10 pt-3 font-mono text-[9px] leading-4 tracking-[0.05em] text-[#70D49D]">{proof}</div>
                <div className="mt-2 font-mono text-[8px] tracking-[0.08em] text-[#7F8F97]">FOCUS FOR DETAIL ↗</div>
                {index < stages.length - 1 && <span className="absolute -right-2 top-1/2 z-10 hidden -translate-y-1/2 bg-[#0B1716] px-1 font-mono text-xs text-[#F0563A] lg:block" aria-hidden="true">→</span>}
              </button>
            </TooltipTrigger>
            <TooltipContent side="top" align="start" className="max-w-[290px] border border-[#F0563A]/45 bg-[#111210]/98 p-4 font-mono text-[#F3EEE5] shadow-[0_18px_40px_rgba(0,0,0,0.38)] backdrop-blur-sm">
              <div className="font-mono text-[10px] font-semibold tracking-[0.12em] text-[#F0563A]">{String(index + 1).padStart(2, "0")} / {label}</div>
              <p className="mt-2 text-[11px] leading-5 text-[#F3EEE5]">{explanation}</p>
              <div className="mt-3 border-t border-white/10 pt-3 font-mono text-[9px] leading-4 tracking-[0.05em] text-[#70D49D]">OBSERVABLE EDGE · {observability}</div>
            </TooltipContent>
          </Tooltip>
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
