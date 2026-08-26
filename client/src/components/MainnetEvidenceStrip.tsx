import { ExternalLink } from "lucide-react";

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

  return (
    <div className="mt-5 border border-[#70D49D]/25 bg-[#0D1918]/80 p-4" aria-label={`${title} verified Mainnet evidence`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-mono text-[9px] tracking-[0.14em] text-[#70D49D]">VERIFIED MAINNET EVIDENCE</div>
        <div className="flex flex-wrap items-center gap-3"><a href={explorerUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-[9px] text-[#F3EEE5] underline decoration-[#F0563A]/70 underline-offset-4">
          OPEN CONTRACT <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>{evidencePath && <a href={`https://starkscan.co/${evidencePath}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-mono text-[9px] text-[#70D49D] underline decoration-[#70D49D]/70 underline-offset-4">
          OPEN VERIFIED RECEIPT <ExternalLink className="h-3 w-3" aria-hidden="true" />
        </a>}</div>
      </div>
      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <div><div className="font-mono text-[8px] tracking-[0.12em] text-[#AEB8BE]">CONTRACT / MAINNET</div><div className="mt-1 font-mono text-[10px] text-[#F3EEE5]">{shortHash(contract)}</div></div>
        <div><div className="font-mono text-[8px] tracking-[0.12em] text-[#AEB8BE]">EVIDENCE STATUS</div><div className="mt-1 font-mono text-[10px] text-[#70D49D]">{verifiedLabel}</div></div>
        <div><div className="font-mono text-[8px] tracking-[0.12em] text-[#AEB8BE]">VERIFIED LIFECYCLE</div><div className="mt-1 font-mono text-[10px] text-[#F3EEE5]">{lifecycle}</div></div>
      </div>
      <p className="mt-3 border-t border-white/10 pt-3 text-[11px] leading-5 text-[#CFC7BC]"><span className="font-mono text-[9px] text-[#F0563A]">PRIVACY BOUNDARY</span> {privacyNote}</p>
    </div>
  );
}
