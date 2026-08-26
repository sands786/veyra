import { ExternalLink, ShieldCheck } from "lucide-react";

export type MainnetEvidenceStripProps = {
  title: string;
  contract: string;
  verifiedLabel: string;
  lifecycle: string;
  privacyNote: string;
  explorerPath?: string;
  evidencePath?: string;
};

function shortHash(value: string) {
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

function lifecycleStages(value: string) {
  return value
    .split("→")
    .map(stage => stage.trim())
    .filter(Boolean);
}

export function MainnetEvidenceStrip({
  title,
  contract,
  verifiedLabel,
  lifecycle,
  privacyNote,
  explorerPath = `contract/${contract}`,
  evidencePath,
}: MainnetEvidenceStripProps) {
  const explorerUrl = `https://starkscan.co/${explorerPath}`;
  const stages = lifecycleStages(lifecycle);

  return (
    <section
      className="mt-8 overflow-hidden rounded-[18px] border border-[#70D49D]/35 bg-[#0B1716] p-5 sm:p-7"
      aria-label={`${title} verified Mainnet evidence`}
      data-testid="mainnet-evidence-panel"
    >
      <div className="flex flex-col gap-5 border-b border-white/10 pb-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[10px] border border-[#70D49D]/35 bg-[#102A25] text-[#70D49D]">
            <ShieldCheck className="h-6 w-6" aria-hidden="true" />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-[10px] font-semibold tracking-[0.18em] text-[#70D49D]">VERIFIED MAINNET EVIDENCE</div>
            <h3 className="mt-2 font-display text-xl font-semibold tracking-[-0.02em] text-[#F3EEE5] sm:text-2xl">{title}</h3>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#AEB8BE]">A public contract identity and receipt-backed lifecycle are available for independent inspection.</p>
          </div>
        </div>
        <div className="flex w-full shrink-0 flex-wrap gap-3 lg:w-auto lg:min-w-[430px] lg:justify-end">
          <a href={explorerUrl} target="_blank" rel="noreferrer" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[10px] border border-[#F0563A]/45 px-5 font-mono text-[10px] font-semibold tracking-[0.08em] text-[#F3EEE5] underline decoration-[#F0563A]/70 underline-offset-4 transition-colors hover:border-[#F0563A] hover:bg-[#F0563A]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0563A]/70 lg:flex-none">
            OPEN CONTRACT <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
          </a>
          {evidencePath && (
            <a href={`https://starkscan.co/${evidencePath}`} target="_blank" rel="noreferrer" className="inline-flex min-h-12 flex-1 items-center justify-center gap-2 rounded-[10px] border border-[#70D49D]/45 bg-[#102A25] px-5 font-mono text-[10px] font-semibold tracking-[0.08em] text-[#70D49D] underline decoration-[#70D49D]/70 underline-offset-4 transition-colors hover:border-[#70D49D] hover:bg-[#70D49D]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#70D49D]/70 lg:flex-none">
              OPEN VERIFIED RECEIPT <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-px overflow-hidden rounded-[12px] bg-white/10 sm:grid-cols-3" aria-label="Mainnet evidence facts">
        <div className="bg-[#0D201D] px-4 py-5 sm:px-5">
          <div className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#AEB8BE]">CONTRACT / MAINNET</div>
          <div className="mt-3 break-all font-mono text-base font-semibold text-[#F3EEE5] sm:text-lg">{shortHash(contract)}</div>
          <div className="mt-2 font-mono text-[10px] tracking-[0.08em] text-[#70D49D]">STARKNET MAINNET</div>
        </div>
        <div className="bg-[#0D201D] px-4 py-5 sm:px-5">
          <div className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#AEB8BE]">EVIDENCE STATUS</div>
          <div className="mt-3 text-base font-semibold leading-6 text-[#70D49D] sm:text-lg">{verifiedLabel}</div>
          <div className="mt-2 font-mono text-[10px] tracking-[0.08em] text-[#AEB8BE]">RECEIPT-BACKED STATE</div>
        </div>
        <div className="bg-[#0D201D] px-4 py-5 sm:px-5">
          <div className="font-mono text-[10px] font-semibold tracking-[0.14em] text-[#AEB8BE]">VERIFICATION SCOPE</div>
          <div className="mt-3 text-base font-semibold leading-6 text-[#F3EEE5] sm:text-lg">Public execution and state</div>
          <div className="mt-2 font-mono text-[10px] tracking-[0.08em] text-[#AEB8BE]">NOT AN ANONYMITY CLAIM</div>
        </div>
      </div>

      <div className="mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <div className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#AEB8BE]">VERIFIED LIFECYCLE</div>
            <p className="mt-1 text-sm text-[#CFC7BC]">State transitions recorded by the deployed contract.</p>
          </div>
          <div className="font-mono text-[10px] tracking-[0.12em] text-[#70D49D]">{stages.length} OBSERVED STAGES</div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3 lg:grid-cols-6" aria-label={`Lifecycle: ${lifecycle}`}>
          {stages.map((stage, index) => (
            <div key={`${stage}-${index}`} className="relative min-w-0">
              <span className="inline-flex min-h-12 w-full items-center justify-center rounded-[10px] border border-white/15 bg-[#14231F] px-3 text-center font-mono text-[10px] font-semibold tracking-[0.06em] text-[#F3EEE5] transition-[border-color,background-color,transform] duration-200 hover:-translate-y-0.5 hover:border-[#F0563A]/60 hover:bg-[#172A25] focus-within:outline-none motion-reduce:transform-none motion-reduce:transition-none">{String(index + 1).padStart(2, "0")} / {stage}</span>
              {index < stages.length - 1 && <span className="absolute -right-[9px] top-1/2 z-10 hidden -translate-y-1/2 bg-[#0B1716] px-1 font-mono text-sm text-[#F0563A] lg:block" aria-hidden="true">→</span>}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 rounded-[12px] border-l-2 border-[#F0563A] bg-[#1B1A18] px-4 py-4 sm:px-5">
        <div className="font-mono text-[10px] font-semibold tracking-[0.16em] text-[#F0563A]">PRIVACY BOUNDARY</div>
        <p className="mt-2 text-sm leading-6 text-[#E2DBD1]">{privacyNote}</p>
      </div>
    </section>
  );
}

export { lifecycleStages };
