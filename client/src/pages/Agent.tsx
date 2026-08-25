import { ArrowUpRight, EyeOff, Fingerprint, LockKeyhole, ShieldCheck, Sparkles } from "lucide-react";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { WorkspaceReturnButton } from "@/components/WorkspaceReturnButton";
import { VeyraAgentOnchainPanel } from "@/components/VeyraAgentOnchainPanel";

const agentAddress = import.meta.env.VITE_VEYRA_AGENT_CONTRACT_MAINNET as string | undefined;

function shortHash(value: string) {
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export default function Agent() {
  const { isDemoMode } = useDemoMode();

  return (
    <div className="page-shell min-h-screen bg-[#111210] text-[#F3EEE5]">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-[#111210]/80 px-5 py-4 backdrop-blur-xl supports-[backdrop-filter]:bg-[#111210]/65 sm:px-8">
        <div className="mx-auto flex max-w-[1380px] items-center justify-between gap-5">
          <div>
            <div className="eyebrow text-[#F0563A]">STRK20 / VEYRA AGENT</div>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-[-0.06em] sm:text-5xl">
              Coordinate privately.
              <br />
              <span className="text-[#F0563A]">Prove it later.</span>
            </h1>
          </div>
          <WorkspaceReturnButton />
        </div>
      </header>

      <main className="mx-auto max-w-[1380px] px-5 py-8 sm:px-8 sm:py-12">
        <section className="grid gap-5 lg:grid-cols-[1.2fr_.8fr]">
          <div className="border border-white/10 bg-[#151D21] p-6 sm:p-9">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.13em] text-[#F0563A]">
              <Sparkles size={15} />
              WALLET-ASSISTED COORDINATION / MAINNET
            </div>
            <p className="mt-7 max-w-3xl font-display text-3xl font-bold tracking-[-0.05em] sm:text-6xl">
              The Agent commits a decision before anyone can read it.
            </p>
            <p className="mt-6 max-w-2xl text-sm leading-7 text-[#B7B0A6]">
              Veyra Agent is a Starknet-native commit–reveal coordinator. It records a Poseidon commitment first, closes the commit window, and only then accepts the matching reveal. Your wallet signs every state change; Veyra never handles private keys or seeds.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <div className="border-t border-white/15 pt-3">
                <div className="font-mono text-[9px] text-[#AEB8BE]">PROTOCOL</div>
                <div className="mt-2 font-display text-xl">COMMIT → REVEAL</div>
              </div>
              <div className="border-t border-white/15 pt-3">
                <div className="font-mono text-[9px] text-[#AEB8BE]">NETWORK</div>
                <div className="mt-2 font-display text-xl">STARKNET MAINNET</div>
              </div>
              <div className="border-t border-white/15 pt-3">
                <div className="font-mono text-[9px] text-[#AEB8BE]">CONTRACT</div>
                <div className="mt-2 font-mono text-xs text-[#70D49D]">
                  {agentAddress ? shortHash(agentAddress) : "NOT CONFIGURED"}
                </div>
              </div>
            </div>
          </div>

          <div className="border border-[#F0563A]/25 bg-[#1B2930] p-6 sm:p-8">
            <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.13em] text-[#F0563A]">
              <ShieldCheck size={15} />
              WHAT THE CHAIN PROVES
            </div>
            <div className="mt-7 space-y-5 text-sm leading-6 text-[#CFC7BC]">
              <div className="flex gap-3">
                <EyeOff size={17} className="mt-1 shrink-0 text-[#F0563A]" />
                <span>The committed value is hidden from the contract’s business logic until reveal.</span>
              </div>
              <div className="flex gap-3">
                <LockKeyhole size={17} className="mt-1 shrink-0 text-[#F0563A]" />
                <span>The contract enforces round states, replay protection, and commitment matching.</span>
              </div>
              <div className="flex gap-3">
                <Fingerprint size={17} className="mt-1 shrink-0 text-[#70D49D]" />
                <span>Receipts and read-only state checks make the lifecycle independently inspectable.</span>
              </div>
            </div>
            <div className="mt-8 border-t border-[#F0563A]/20 pt-4 font-mono text-[9px] leading-5 text-[#A99A8D]">
              PRIVACY LIMIT: WALLET CALLERS, REVEALED VALUES, AND PUBLIC TRANSFERS REMAIN OBSERVABLE ON MAINNET.
            </div>
          </div>
        </section>

        {isDemoMode ? (
          <section className="mt-6 border border-[#F0C674]/30 bg-[#201815] p-6 sm:p-8">
            <div className="font-mono text-[10px] tracking-[0.13em] text-[#F0C674]">DEMO MODE / SIMULATED ONLY</div>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[#CFC7BC]">
              Exit Demo Mode from the workspace to use the wallet-signed Mainnet Agent panel. No simulated action is presented as a chain receipt.
            </p>
            <button type="button" onClick={() => window.location.assign("/")} className="mt-5 inline-flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-[#F0C674] hover:text-[#F3EEE5]">
              RETURN TO WORKSPACE <ArrowUpRight size={13} />
            </button>
          </section>
        ) : (
          <VeyraAgentOnchainPanel isDemoMode={false} />
        )}

        <div className="mt-8 border-t border-white/10 pt-5 font-mono text-[9px] tracking-[0.1em] text-[#AEB8BE]">
          AGENT EVIDENCE IS RECEIPT-FIRST · WALLET SIGNS · VEYRA COORDINATES · PUBLIC CHAIN EDGES STAY PUBLIC
        </div>
      </main>
    </div>
  );
}
