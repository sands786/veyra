import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  buildVeyraAgentCall,
  connectVeilWallet,
  discoverStarknetWallets,
  readVeyraAgentChainState,
  readVeyraAgentReceipt,
  submitVeyraAgentCall,
  type VeilWallet,
  type VeyraAgentAction,
} from "@/lib/strk20";
import { toast } from "sonner";

const agentAddress = import.meta.env.VITE_VEYRA_AGENT_CONTRACT_MAINNET as string | undefined;
const ROUND_TYPE = "0x5345414c45445f424944";

function shortHash(value: string) { return `${value.slice(0, 10)}…${value.slice(-8)}`; }

export function VeyraAgentOnchainPanel({ isDemoMode }: { isDemoMode: boolean }) {
  const wallets = useMemo(() => discoverStarknetWallets(), []);
  const [wallet, setWallet] = useState<VeilWallet>();
  const [address, setAddress] = useState("");
  const [roundId, setRoundId] = useState("1");
  const [itemId, setItemId] = useState("1");
  const [commitment, setCommitment] = useState("");
  const [value, setValue] = useState("");
  const [nonce, setNonce] = useState("");
  const [lastHash, setLastHash] = useState("");
  const [status, setStatus] = useState("WAITING FOR WALLET");
  const [state, setState] = useState<{ roundState: bigint; commitment: string; reveal: string }>();
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);

  async function connect(option: VeilWallet) {
    setBusy(true);
    try {
      const result = await connectVeilWallet(option);
      if (!result.live || !result.wallet || !result.address || result.network !== "mainnet") throw new Error("Connect a wallet reporting Starknet Mainnet.");
      setWallet(result.wallet); setAddress(result.address); setStatus("WALLET READY / SIGNATURE REQUIRED");
      toast("Veyra Agent wallet connected.", { description: "Every state-changing action remains wallet-signed." });
    } catch (error) { toast("Wallet connection failed.", { description: String(error).slice(0, 160) }); }
    finally { setBusy(false); }
  }

  async function submit(action: VeyraAgentAction) {
    if (!agentAddress || !wallet || busy) return;
    setBusy(true);
    try {
      const result = await submitVeyraAgentCall(wallet, "mainnet", buildVeyraAgentCall(agentAddress, action));
      setLastHash(result.transaction_hash); setStatus("SUBMITTED / VERIFY REQUIRED"); setState(undefined);
      toast("Veyra Agent transaction submitted.", { description: "Verify the receipt before treating the round state as changed." });
    } catch (error) { toast("Agent transaction was not submitted.", { description: String(error).slice(0, 180) }); }
    finally { setBusy(false); }
  }

  async function verify() {
    if (!agentAddress || !address || !lastHash || verifying) return;
    setVerifying(true);
    try {
      const [receipt, chainState] = await Promise.all([
        readVeyraAgentReceipt(lastHash),
        readVeyraAgentChainState(agentAddress, BigInt(roundId || "1"), BigInt(itemId || "1"), address),
      ]);
      setStatus(`${receipt.finalityStatus} / ${receipt.executionStatus}`); setState(chainState);
      toast("Veyra Agent evidence verified.", { description: "Receipt and round state were read from Starknet Mainnet." });
    } catch (error) { setStatus("VERIFICATION UNAVAILABLE"); toast("Agent verification unavailable.", { description: String(error).slice(0, 180) }); }
    finally { setVerifying(false); }
  }

  if (isDemoMode) return null;
  const disabled = !agentAddress || !wallet || busy;
  const parsedRoundId = BigInt(roundId || "1");
  const parsedItemId = BigInt(itemId || "1");

  return <section className="mt-6 rounded-[14px] border border-[#F0563A]/25 bg-[#F0563A]/[0.05] p-5">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div><div className="font-mono text-[10px] tracking-[0.13em] text-[#F0563A]">VEYRA AGENT / COMMIT–REVEAL / MAINNET</div><p className="mt-2 max-w-3xl text-sm leading-6 text-[#CFC7BC]">The Agent prepares a sealed-bid coordination payload, but your wallet signs every state change. Commit–reveal hides the value until reveal; it does not anonymize wallet addresses or transfers.</p></div>
      <span className="font-mono text-[10px] text-[#AEB8BE]">{agentAddress ? shortHash(agentAddress) : "CONTRACT NOT CONFIGURED"}</span>
    </div>
    {!wallet ? <div className="mt-4 flex flex-wrap gap-2">{wallets.length ? wallets.map(option => <Button key={option.id} disabled={busy} onClick={() => connect(option.wallet)} className="h-10 rounded-[9px] bg-[#F3EEE5] px-4 font-mono text-[10px] text-[#111210]">{busy ? "CONNECTING…" : `CONNECT ${option.name.toUpperCase()}`}</Button>) : <span className="font-mono text-[10px] text-[#F0563A]">NO SUPPORTED MAINNET WALLET DETECTED</span>}</div> : <>
      <div className="mt-4 flex flex-wrap items-center gap-3"><span className="font-mono text-[10px] text-[#70D49D]">CONNECTED / {shortHash(address)}</span><span className="font-mono text-[10px] text-[#AEB8BE]">{status}</span></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="font-mono text-[10px] text-[#AEB8BE]">ROUND ID<input value={roundId} onChange={e => setRoundId(e.target.value)} className="mt-2 h-10 w-full rounded-[8px] border border-white/15 bg-black/20 px-3 text-sm text-[#F3EEE5]" inputMode="numeric" /></label><label className="font-mono text-[10px] text-[#AEB8BE]">ITEM ID<input value={itemId} onChange={e => setItemId(e.target.value)} className="mt-2 h-10 w-full rounded-[8px] border border-white/15 bg-black/20 px-3 text-sm text-[#F3EEE5]" inputMode="numeric" /></label></div>
      <label className="mt-3 block font-mono text-[10px] text-[#AEB8BE]">COMMITMENT FELT<input value={commitment} onChange={e => setCommitment(e.target.value)} placeholder="0x… Poseidon(value, nonce)" className="mt-2 h-10 w-full rounded-[8px] border border-white/15 bg-black/20 px-3 text-sm text-[#F3EEE5]" /></label>
      <div className="mt-4 flex flex-wrap gap-2"><Button disabled={disabled} onClick={() => submit({ type: "create_round", roundId: parsedRoundId, coordinator: address, roundType: ROUND_TYPE })} className="h-10 rounded-[9px] bg-[#F0563A] px-4 font-mono text-[10px] text-[#111210]">CREATE ROUND</Button><Button disabled={disabled} onClick={() => submit({ type: "open_round", roundId: parsedRoundId })} className="h-10 rounded-[9px] border border-white/20 px-4 font-mono text-[10px] text-[#F3EEE5]">OPEN</Button><Button disabled={disabled || !commitment} onClick={() => submit({ type: "commit", roundId: parsedRoundId, itemId: parsedItemId, commitment })} className="h-10 rounded-[9px] border border-white/20 px-4 font-mono text-[10px] text-[#F3EEE5]">COMMIT</Button><Button disabled={disabled} onClick={() => submit({ type: "close_round", roundId: parsedRoundId })} className="h-10 rounded-[9px] border border-white/20 px-4 font-mono text-[10px] text-[#F3EEE5]">CLOSE</Button></div>
      <div className="mt-4 grid gap-3 sm:grid-cols-2"><label className="font-mono text-[10px] text-[#AEB8BE]">REVEAL VALUE<input value={value} onChange={e => setValue(e.target.value)} placeholder="felt252 value" className="mt-2 h-10 w-full rounded-[8px] border border-white/15 bg-black/20 px-3 text-sm text-[#F3EEE5]" /></label><label className="font-mono text-[10px] text-[#AEB8BE]">NONCE<input value={nonce} onChange={e => setNonce(e.target.value)} placeholder="felt252 nonce" className="mt-2 h-10 w-full rounded-[8px] border border-white/15 bg-black/20 px-3 text-sm text-[#F3EEE5]" /></label></div>
      <div className="mt-4 flex flex-wrap gap-2"><Button disabled={disabled || !value || !nonce} onClick={() => submit({ type: "reveal", roundId: parsedRoundId, itemId: parsedItemId, value, nonce })} className="h-10 rounded-[9px] bg-[#70D49D] px-4 font-mono text-[10px] text-[#111210]">REVEAL</Button><Button disabled={disabled} onClick={() => submit({ type: "resolve", roundId: parsedRoundId, itemId: parsedItemId, winner: address })} className="h-10 rounded-[9px] border border-[#70D49D]/40 px-4 font-mono text-[10px] text-[#70D49D]">RESOLVE SELF</Button></div>
    </>}
    {lastHash && <div className="mt-4 border-t border-white/10 pt-3 font-mono text-[10px] text-[#AEB8BE]">SUBMITTED RECEIPT / {shortHash(lastHash)}<div className="mt-2 flex flex-wrap items-center gap-3"><Button disabled={verifying} onClick={verify} className="h-8 rounded-[8px] border border-[#70D49D]/40 px-3 text-[10px] text-[#70D49D]">{verifying ? "VERIFYING…" : "VERIFY RECEIPT + STATE"}</Button>{state && <span className="text-[#70D49D]">ROUND {state.roundState.toString()} / COMMIT {state.commitment} / REVEAL {state.reveal}</span>}</div></div>}
  </section>;
}
