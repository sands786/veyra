import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  buildPrivateMarketsCall,
  buildPrivateMarketsTokenApprovalCall,
  connectVeilWallet,
  discoverStarknetWallets,
  useVeilWalletSession,
  STRK_TOKEN,
  submitPrivateMarketsCall,
  readPrivateMarketsChainState,
  readPrivateMarketsReceipt,
  type PrivateMarketsAction,
  type VeilWallet,
} from "@/lib/strk20";
import { toast } from "sonner";
import { MainnetEvidenceStrip } from "@/components/MainnetEvidenceStrip";
import { VERIFIED_VEYRA_MARKETS_MAINNET } from "@/lib/onchainConfig";

const marketsAddress = (import.meta.env.VITE_VEYRA_MARKETS_CONTRACT_MAINNET as string | undefined) || VERIFIED_VEYRA_MARKETS_MAINNET;
const STRK_DECIMALS = BigInt("1000000000000000000");

function shortHash(value: string) { return `${value.slice(0, 10)}…${value.slice(-8)}`; }
function parseStrk(value: string): bigint {
  const normalized = value.trim();
  if (!/^\d+(\.\d{1,18})?$/.test(normalized)) throw new Error("Enter a valid STRK amount with up to 18 decimals.");
  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * STRK_DECIMALS + BigInt((fraction + "0".repeat(18)).slice(0, 18));
}

export function PrivateMarketsOnchainPanel({ isDemoMode }: { isDemoMode: boolean }) {
  const wallets = useMemo(() => discoverStarknetWallets(), []);
  const { wallet, address } = useVeilWalletSession();
  const [connecting, setConnecting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [marketId, setMarketId] = useState("1");
  const [bidId, setBidId] = useState("1");
  const [target, setTarget] = useState("1");
  const [bidAmount, setBidAmount] = useState("1");
  const [commitmentHash, setCommitmentHash] = useState("");
  const [lastHash, setLastHash] = useState("");
  const [receiptStatus, setReceiptStatus] = useState("NOT VERIFIED");
  const [chainState, setChainState] = useState<{ marketState: bigint; bidState: bigint; committed: bigint }>();
  const [verifying, setVerifying] = useState(false);

  async function connect(option: VeilWallet) {
    if (connecting) return;
    setConnecting(true);
    try {
      const result = await connectVeilWallet(option);
      if (!result.live || !result.wallet || !result.address || result.network !== "mainnet") throw new Error("Wallet did not return a verified Starknet Mainnet account.");
      toast("Private Markets wallet connected.", { description: "Mainnet wallet API is ready." });
    } catch (error) { toast("Wallet connection failed.", { description: String(error).slice(0, 160) }); }
    finally { setConnecting(false); }
  }

  async function submit(action: PrivateMarketsAction | { type: "approve_token"; amountSmallestUnit: bigint }) {
    if (!marketsAddress || !wallet || !address || submitting) return;
    setSubmitting(true);
    try {
      const call = action.type === "approve_token"
        ? buildPrivateMarketsTokenApprovalCall(STRK_TOKEN, marketsAddress, action.amountSmallestUnit)
        : buildPrivateMarketsCall(marketsAddress, action);
      const result = await submitPrivateMarketsCall(wallet, "mainnet", call);
      setLastHash(result.transaction_hash);
      setReceiptStatus("SUBMITTED / VERIFY REQUIRED");
      setChainState(undefined);
      toast("Private Markets transaction submitted.", { description: "Use Verify Receipt and Read Chain State before treating state as settled." });
    } catch (error) { toast("Private Markets transaction was not submitted.", { description: String(error).slice(0, 180) }); }
    finally { setSubmitting(false); }
  }

  async function verifyMainnetEvidence() {
    if (!lastHash || !marketsAddress || verifying) return;
    setVerifying(true);
    try {
      const [receipt, state] = await Promise.all([
        readPrivateMarketsReceipt(lastHash),
        readPrivateMarketsChainState(marketsAddress, parsedMarketId, parsedBidId),
      ]);
      setReceiptStatus(`${receipt.finalityStatus} / ${receipt.executionStatus}`);
      setChainState(state);
      toast("Mainnet evidence verified.", { description: "Receipt and current market state were read from Starknet." });
    } catch (error) {
      setReceiptStatus("VERIFICATION UNAVAILABLE");
      toast("Mainnet verification unavailable.", { description: String(error).slice(0, 180) });
    } finally { setVerifying(false); }
  }

  if (isDemoMode) return null;
  const disabled = !wallet || !marketsAddress || submitting;
  const parsedMarketId = BigInt(marketId || "1");
  const parsedBidId = BigInt(bidId || "1");

  return <section className="mt-7 rounded-[18px] border border-[#70D49D]/25 bg-[#70D49D]/[0.05] p-6 sm:p-7">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="font-mono text-[9px] tracking-[0.13em] text-[#70D49D]">PRIVATE MARKETS / MAINNET ESCROW</div><p className="mt-2 max-w-3xl text-xs leading-5 text-[#CFC7BC]">This first contract keeps commitment terms private from the contract’s business logic, while wallet callers, token amounts, and settlement transfers remain public. Do not describe it as anonymous STRK20 settlement without the official privacy-pool proving and discovery path.</p></div>
      <span className="font-mono text-[9px] text-[#AEB8BE]">{marketsAddress ? shortHash(marketsAddress) : "CONTRACT NOT DEPLOYED"}</span>
        </div>
    {marketsAddress && <MainnetEvidenceStrip title="Private Markets" contract={marketsAddress} verifiedLabel="SETTLED / RECEIPT-BACKED" lifecycle="CREATE → OPEN → COMMIT → ACCEPT → SETTLE" privacyNote="Commitment terms are coordinated privately at the application layer, while callers, token amounts, and settlement transfers remain observable on Mainnet. This is not anonymous settlement." explorerPath="contract/0x05476ca7064583238f3e82a6815a7f662b14228e1fb585d480838a282b9d7cf2" evidencePath="tx/0x06e00858408afcc1aa3ec84e7517d92f8a15231131150f21327d15803e0dae93" />}
    {!wallet ? <div className="mt-5 grid gap-3 sm:grid-cols-2">
{wallets.length ? wallets.map(option => <Button key={option.id} disabled={connecting} onClick={() => connect(option.wallet)} className="min-h-14 rounded-[12px] bg-[#F3EEE5] px-5 font-mono text-xs font-semibold tracking-[0.04em] text-[#111210]">{connecting ? "CONNECTING…" : `CONNECT ${option.name.toUpperCase()}`}</Button>) : <span className="font-mono text-[9px] text-[#F0563A]">NO SUPPORTED MAINNET WALLET DETECTED</span>}</div> : <>
      <div className="mt-5 grid gap-3 sm:grid-cols-[auto_1fr_1fr] sm:items-center"><span className="font-mono text-[9px] text-[#70D49D]">CONNECTED / {shortHash(address)}</span><Button disabled={disabled} onClick={() => submit({ type: "create_market", marketId: parsedMarketId, creator: address, targetSmallestUnit: parseStrk(target) })} className="min-h-14 rounded-[12px] bg-[#F0563A] px-5 font-mono text-xs font-semibold tracking-[0.04em] text-[#111210]">CREATE MARKET</Button><Button disabled={disabled} onClick={() => submit({ type: "open_market", marketId: parsedMarketId })} className="min-h-14 rounded-[12px] border border-white/20 px-5 font-mono text-xs font-semibold tracking-[0.04em] text-[#F3EEE5]">OPEN MARKET</Button><Button disabled={disabled} onClick={() => submit({ type: "close_market", marketId: parsedMarketId })} className="min-h-14 rounded-[12px] border border-white/20 px-5 font-mono text-xs font-semibold tracking-[0.04em] text-[#F3EEE5]">CLOSE MARKET</Button></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-4"><label className="font-mono text-[9px] text-[#AEB8BE]">MARKET ID<input value={marketId} onChange={e => setMarketId(e.target.value)} className="mt-3 h-12 w-full rounded-[10px] border border-white/15 bg-black/20 px-3 text-xs text-[#F3EEE5]" inputMode="numeric" /></label><label className="font-mono text-[9px] text-[#AEB8BE]">BID ID<input value={bidId} onChange={e => setBidId(e.target.value)} className="mt-3 h-12 w-full rounded-[10px] border border-white/15 bg-black/20 px-3 text-xs text-[#F3EEE5]" inputMode="numeric" /></label><label className="font-mono text-[9px] text-[#AEB8BE]">TARGET STRK<input value={target} onChange={e => setTarget(e.target.value)} className="mt-3 h-12 w-full rounded-[10px] border border-white/15 bg-black/20 px-3 text-xs text-[#F3EEE5]" inputMode="decimal" /></label><label className="font-mono text-[9px] text-[#AEB8BE]">BID STRK<input value={bidAmount} onChange={e => setBidAmount(e.target.value)} className="mt-3 h-12 w-full rounded-[10px] border border-white/15 bg-black/20 px-3 text-xs text-[#F3EEE5]" inputMode="decimal" /></label></div>
      <label className="mt-3 block font-mono text-[9px] text-[#AEB8BE]">COMMITMENT HASH<input value={commitmentHash} onChange={e => setCommitmentHash(e.target.value)} placeholder="felt252 commitment" className="mt-3 h-12 w-full rounded-[10px] border border-white/15 bg-black/20 px-3 text-xs text-[#F3EEE5]" /></label>
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-5"><Button disabled={disabled} onClick={() => submit({ type: "approve_token", amountSmallestUnit: parseStrk(bidAmount) })} className="min-h-14 rounded-[12px] border border-[#70D49D]/40 px-4 font-mono text-xs font-semibold text-[#70D49D]">1. APPROVE STRK</Button><Button disabled={disabled} onClick={() => submit({ type: "commit_bid", marketId: parsedMarketId, bidId: parsedBidId, commitmentHash, amountSmallestUnit: parseStrk(bidAmount) })} className="min-h-14 rounded-[12px] border border-white/20 px-5 font-mono text-xs font-semibold tracking-[0.04em] text-[#F3EEE5]">2. COMMIT BID</Button><Button disabled={disabled} onClick={() => submit({ type: "accept_bid", marketId: parsedMarketId, bidId: parsedBidId })} className="min-h-14 rounded-[12px] border border-white/20 px-5 font-mono text-xs font-semibold tracking-[0.04em] text-[#F3EEE5]">3. ACCEPT BID</Button><Button disabled={disabled} onClick={() => submit({ type: "settle_bid", marketId: parsedMarketId, bidId: parsedBidId })} className="min-h-14 rounded-[12px] bg-[#70D49D] px-4 font-mono text-xs font-semibold text-[#111210]">4. SETTLE</Button><Button disabled={disabled} onClick={() => submit({ type: "refund_bid", marketId: parsedMarketId, bidId: parsedBidId })} className="min-h-14 rounded-[12px] border border-[#F0563A]/40 px-4 font-mono text-xs font-semibold text-[#F0563A]">REFUND BID</Button></div>
      <p className="mt-3 font-mono text-[9px] leading-4 text-[#F0563A]">Only sign actions you intend to execute. Contract state is not considered settled until its Mainnet receipt is verified.</p>
    </>}
    {lastHash && <div className="mt-6 rounded-[14px] border-t border-white/10 pt-5 font-mono text-[9px] text-[#AEB8BE]">SUBMITTED RECEIPT / {lastHash}<div className="mt-2 flex flex-wrap items-center gap-2"><Button disabled={verifying} onClick={verifyMainnetEvidence} className="min-h-11 rounded-[10px] border border-[#70D49D]/40 px-4 text-[10px] font-semibold text-[#70D49D]">{verifying ? "VERIFYING…" : "VERIFY RECEIPT + STATE"}</Button><span className="text-[#F3EEE5]">{receiptStatus}</span>{chainState && <span className="text-[#70D49D]">MARKET {chainState.marketState.toString()} / BID {chainState.bidState.toString()} / ESCROW {chainState.committed.toString()} LOWEST</span>}</div></div>}
  </section>;
}
