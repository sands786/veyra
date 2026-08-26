import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  connectVeilWallet,
  describeStrk20Readiness,
  discoverStarknetWallets,
  readPrivateMarketsReceipt,
  submitShieldedRoute,
  STRK_TOKEN,
  type VeilWallet,
} from "@/lib/strk20";

const DECIMALS = BigInt("1000000000000000000");

function parseAmount(value: string): bigint {
  const normalized = value.trim();
  if (!/^\d+(\.\d{1,18})?$/.test(normalized)) throw new Error("Enter a valid STRK amount with up to 18 decimals.");
  const [whole, fraction = ""] = normalized.split(".");
  return BigInt(whole) * DECIMALS + BigInt((fraction + "0".repeat(18)).slice(0, 18));
}

function shortHash(value: string) { return `${value.slice(0, 10)}…${value.slice(-8)}`; }

export default function PrivatePrimitivesOnchainPanel() {
  const wallets = useMemo(() => discoverStarknetWallets(), []);
  const [wallet, setWallet] = useState<VeilWallet>();
  const [address, setAddress] = useState("");
  const [amount, setAmount] = useState("0.01");
  const [recipient, setRecipient] = useState("");
  const [hash, setHash] = useState("");
  const [receipt, setReceipt] = useState("NOT VERIFIED");
  const [busy, setBusy] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const readiness = describeStrk20Readiness(wallet, "mainnet");

  async function connect(option: VeilWallet) {
    try {
      const result = await connectVeilWallet(option);
      if (!result.live || !result.wallet || !result.address || result.network !== "mainnet") throw new Error("Wallet did not return a verified Starknet Mainnet account.");
      setWallet(result.wallet); setAddress(result.address);
      toast("Private Primitives wallet connected.", { description: "The official STRK20 action capability is ready." });
    } catch (error) { toast("Wallet connection failed.", { description: String(error).slice(0, 160) }); }
  }

  async function submit() {
    if (!wallet || busy) return;
    setBusy(true);
    try {
      const result = await submitShieldedRoute(wallet, parseAmount(amount), "mainnet", recipient.trim() || undefined, STRK_TOKEN);
      setHash(result.transaction_hash); setReceipt("SUBMITTED / VERIFY REQUIRED");
      toast("STRK20 private action submitted.", { description: "The wallet and privacy pool own private-note discovery." });
    } catch (error) { toast("Private action was not submitted.", { description: String(error).slice(0, 180) }); }
    finally { setBusy(false); }
  }

  async function verify() {
    if (!hash || verifying) return;
    setVerifying(true);
    try {
      const result = await readPrivateMarketsReceipt(hash);
      setReceipt(`${result.finalityStatus} / ${result.executionStatus}`);
      toast("Public receipt verified.", { description: "This proves transaction execution only; it does not prove private-note discovery." });
    } catch (error) { setReceipt("VERIFICATION UNAVAILABLE"); toast("Receipt verification unavailable.", { description: String(error).slice(0, 160) }); }
    finally { setVerifying(false); }
  }

  return <section className="mt-10 border border-[#70D49D]/25 bg-[#163B4A] p-5 sm:p-6" aria-live="polite">
    <div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-mono text-[9px] tracking-[0.13em] text-[#70D49D]">PRIVATE PRIMITIVES / STRK20 MAINNET ACTION</div><p className="mt-2 max-w-3xl text-xs leading-5 text-[#CFC7BC]">This panel uses the official <code>wallet_strk20InvokeTransaction</code> boundary. Shielding and transfer actions can be wallet-signed when the connected wallet supports them; registration, channel context, proving, and private-note discovery remain wallet/pool-owned.</p></div><span className="font-mono text-[9px] text-[#AEB8BE]">{readiness.label}</span></div>
    <div className="mt-5 grid gap-px border border-white/10 bg-white/10 sm:grid-cols-3" aria-label="Privacy evidence ladder"><div className="bg-[#0D1918] p-4"><div className="font-mono text-[8px] tracking-[0.12em] text-[#70D49D]">01 / PUBLIC RECEIPT</div><p className="mt-2 text-[11px] leading-5 text-[#F3EEE5]">Wallet-signed action and Mainnet receipt can be verified here.</p><div className="mt-2 font-mono text-[8px] text-[#70D49D]">VERIFIABLE</div></div><div className="bg-[#0D1918] p-4"><div className="font-mono text-[8px] tracking-[0.12em] text-[#F0563A]">02 / PRIVATE NOTE</div><p className="mt-2 text-[11px] leading-5 text-[#F3EEE5]">Discovery happens inside the supporting wallet and privacy pool, not in this public UI.</p><div className="mt-2 font-mono text-[8px] text-[#F0563A]">WALLET-OWNED</div></div><div className="bg-[#0D1918] p-4"><div className="font-mono text-[8px] tracking-[0.12em] text-[#AEB8BE]">03 / RECIPIENT PROOF</div><p className="mt-2 text-[11px] leading-5 text-[#F3EEE5]">A recipient discovery result is required before Veyra can claim end-to-end private delivery.</p><div className="mt-2 font-mono text-[8px] text-[#AEB8BE]">NOT CLAIMED</div></div></div>
    {!wallet ? <div className="mt-4 flex flex-wrap gap-2">{wallets.length ? wallets.map(option => <Button key={option.id} onClick={() => void connect(option.wallet)} className="h-10 rounded-[9px] bg-[#F3EEE5] px-4 font-mono text-[9px] text-[#111210]">CONNECT {option.name.toUpperCase()}</Button>) : <span className="font-mono text-[9px] text-[#F0563A]">NO WALLET DETECTED</span>}</div> : <>
      <div className="mt-4 font-mono text-[9px] text-[#70D49D]">CONNECTED / {shortHash(address)} · {readiness.detail}</div>
      <div className="mt-5 grid gap-3 sm:grid-cols-2"><label className="font-mono text-[9px] text-[#AEB8BE]">AMOUNT STRK<input value={amount} onChange={e => setAmount(e.target.value)} className="mt-2 h-10 w-full border border-white/15 bg-black/20 px-3 text-xs text-[#F3EEE5]" inputMode="decimal" /></label><label className="font-mono text-[9px] text-[#AEB8BE]">OPTIONAL RECIPIENT ADDRESS<input value={recipient} onChange={e => setRecipient(e.target.value)} placeholder="Leave blank to shield only" className="mt-2 h-10 w-full border border-white/15 bg-black/20 px-3 text-xs text-[#F3EEE5]" /></label></div>
      <Button disabled={busy || readiness.status !== "registration"} onClick={() => void submit()} className="mt-5 h-10 rounded-[9px] bg-[#F0563A] px-4 font-mono text-[9px] text-[#111210]">{busy ? "WAITING FOR WALLET…" : "SIGN OFFICIAL STRK20 ACTION"}</Button>
    </>}
    {hash && <div className="mt-5 border-t border-white/10 pt-4 font-mono text-[9px] text-[#AEB8BE]">PUBLIC TX / {hash}<div className="mt-2 flex flex-wrap items-center gap-2"><Button disabled={verifying} onClick={() => void verify()} className="h-8 rounded-[8px] border border-[#70D49D]/40 px-3 text-[9px] text-[#70D49D]">{verifying ? "VERIFYING…" : "VERIFY RECEIPT"}</Button><span className="text-[#F3EEE5]">{receipt}</span></div></div>}
  </section>;
}
