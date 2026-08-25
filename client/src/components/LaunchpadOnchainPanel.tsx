import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  buildLaunchpadEscrowCall,
  connectVeilWallet,
  discoverStarknetWallets,
  submitLaunchpadEscrowCall,
  readPrivateMarketsReceipt,
  readLaunchpadChainState,
  type VeilWallet,
} from "@/lib/strk20";
import { toast } from "sonner";

const escrowAddress = import.meta.env.VITE_LAUNCHPAD_ESCROW_ADDRESS as string | undefined;

function shortHash(value: string) {
  return `${value.slice(0, 10)}…${value.slice(-8)}`;
}

export function LaunchpadOnchainPanel({
  projectId,
  isDemoMode,
}: {
  projectId: number;
  isDemoMode: boolean;
}) {
  const wallets = useMemo(() => discoverStarknetWallets(), []);
  const [wallet, setWallet] = useState<VeilWallet>();
  const [address, setAddress] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lastHash, setLastHash] = useState("");
  const [receiptStatus, setReceiptStatus] = useState("NOT VERIFIED");
  const [chainState, setChainState] = useState<{ projectState: bigint; milestoneState: bigint; projectBalance: bigint }>();
  const [verifying, setVerifying] = useState(false);

  async function connect(optionWallet: VeilWallet) {
    if (connecting) return;
    setConnecting(true);
    try {
      const result = await connectVeilWallet(optionWallet);
      if (!result.live || !result.wallet || !result.address) {
        throw new Error("Wallet did not return a Mainnet account.");
      }
      setWallet(result.wallet);
      setAddress(result.address);
      toast("Launchpad wallet connected.", { description: "Mainnet wallet API is ready." });
    } catch (error) {
      toast("Wallet connection failed.", { description: String(error).slice(0, 160) });
    } finally {
      setConnecting(false);
    }
  }

  async function submit(action: "create_project" | "activate_project") {
    if (!escrowAddress || !wallet || !address || submitting) return;
    setSubmitting(true);
    try {
      const call = buildLaunchpadEscrowCall(
        escrowAddress,
        action === "create_project"
          ? { type: action, projectId: BigInt(projectId), creator: address }
          : { type: action, projectId: BigInt(projectId) }
      );
      const result = await submitLaunchpadEscrowCall(wallet, "mainnet", call);
      setLastHash(result.transaction_hash);
      setReceiptStatus("SUBMITTED / VERIFY REQUIRED");
      setChainState(undefined);
      toast("Launchpad transaction submitted.", {
        description: "Use Verify Receipt + State before treating the on-chain state as settled.",
      });
    } catch (error) {
      toast("Launchpad transaction was not submitted.", { description: String(error).slice(0, 180) });
    } finally {
      setSubmitting(false);
    }
  }

  async function verifyMainnetEvidence() {
    if (!lastHash || !escrowAddress || verifying) return;
    setVerifying(true);
    try {
      const [receipt, state] = await Promise.all([
        readPrivateMarketsReceipt(lastHash),
        readLaunchpadChainState(escrowAddress, BigInt(projectId), BigInt(1)),
      ]);
      setReceiptStatus(`${receipt.finalityStatus} / ${receipt.executionStatus}`);
      setChainState(state);
      toast("Launchpad Mainnet evidence verified.", { description: "Receipt and current project state were read from Starknet." });
    } catch (error) {
      setReceiptStatus("VERIFICATION UNAVAILABLE");
      toast("Launchpad verification unavailable.", { description: String(error).slice(0, 180) });
    } finally { setVerifying(false); }
  }

  if (isDemoMode) return null;

  return (
    <div className="mt-6 rounded-[14px] border border-[#70D49D]/25 bg-[#70D49D]/[0.05] p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="font-mono text-[9px] tracking-[0.13em] text-[#70D49D]">LIVE MAINNET ESCROW</div>
          <p className="mt-2 text-xs leading-5 text-[#CFC7BC]">
            Deployed contract is configured. These calls are wallet-signed and receipt-backed; database status does not authorize settlement.
          </p>
        </div>
        <span className="font-mono text-[9px] text-[#AEB8BE]">{escrowAddress ? shortHash(escrowAddress) : "NOT CONFIGURED"}</span>
      </div>
      {!wallet ? (
        <div className="mt-4 flex flex-wrap gap-2">
          {wallets.length ? wallets.map((option) => (
            <Button key={option.id} disabled={connecting} onClick={() => connect(option.wallet)} className="h-10 rounded-[9px] bg-[#F3EEE5] px-4 font-mono text-[9px] text-[#111210]">
              {connecting ? "CONNECTING…" : `CONNECT ${option.name.toUpperCase()}`}
            </Button>
          )) : <span className="font-mono text-[9px] text-[#F0563A]">NO SUPPORTED MAINNET WALLET DETECTED</span>}
        </div>
      ) : (
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <span className="font-mono text-[9px] text-[#70D49D]">CONNECTED / {shortHash(address)}</span>
          <Button disabled={submitting} onClick={() => submit("create_project")} className="h-10 rounded-[9px] bg-[#F0563A] px-4 font-mono text-[9px] text-[#111210]">{submitting ? "SIGNING…" : "CREATE ON-CHAIN ROOM"}</Button>
          <Button disabled={submitting} onClick={() => submit("activate_project")} className="h-10 rounded-[9px] border border-white/20 px-4 font-mono text-[9px] text-[#F3EEE5]">ACTIVATE ON-CHAIN ROOM</Button>
        </div>
      )}
      {lastHash && <div className="mt-4 border-t border-white/10 pt-3 font-mono text-[9px] text-[#AEB8BE]">SUBMITTED RECEIPT / {lastHash}<div className="mt-2 flex flex-wrap items-center gap-2"><Button disabled={verifying} onClick={verifyMainnetEvidence} className="h-8 rounded-[8px] border border-[#70D49D]/40 px-3 text-[9px] text-[#70D49D]">{verifying ? "VERIFYING…" : "VERIFY RECEIPT + STATE"}</Button><span className="text-[#F3EEE5]">{receiptStatus}</span>{chainState && <span className="text-[#70D49D]">PROJECT {chainState.projectState.toString()} / MILESTONE {chainState.milestoneState.toString()} / BALANCE {chainState.projectBalance.toString()} LOWEST</span>}</div></div>}
    </div>
  );
}
