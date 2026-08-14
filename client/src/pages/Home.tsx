// Copper Veil style reminder: editorial brutalism, graphite canvas, ivory surfaces, Veil Vermilion #F0563A, Space Grotesk + IBM Plex Mono, visible privacy state.
import { useMemo, useState } from "react";
import { ArrowUpRight, Check, ChevronRight, CircleHelp, Copy, EyeOff, Fingerprint, LockKeyhole, Menu, Shield, Sparkles, WalletCards, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { connectVeilWallet, explorerUrl, submitShieldedRoute, type VeilWallet } from "@/lib/strk20";

const stages = [
  { label: "DRAFT", note: "Recipients and amounts stay in your workspace." },
  { label: "SHIELDED", note: "The payment intent is wrapped by STRK20." },
  { label: "ROUTED", note: "A private transfer route is ready to sign." },
  { label: "SETTLED", note: "A proof card closes the loop." },
];

const activity = [
  { id: "VP-019", title: "March contractor run", detail: "6 recipients · USDC", state: "PROOF READY", time: "8 min ago" },
  { id: "VP-018", title: "Design retainer split", detail: "3 recipients · STRK", state: "SHIELDED", time: "Yesterday" },
  { id: "VP-017", title: "Ops reimbursement", detail: "2 recipients · ETH", state: "SETTLED", time: "Apr 04" },
];

export default function Home() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [amount, setAmount] = useState("2,840");
  const [recipientCount, setRecipientCount] = useState("6");
  const [stage, setStage] = useState(1);
  const [connected, setConnected] = useState(false);
  const [wallet, setWallet] = useState<VeilWallet>();
  const [walletAddress, setWalletAddress] = useState("");
  const [copied, setCopied] = useState(false);

  const stageCopy = useMemo(() => stages[stage], [stage]);

  async function handleWalletConnect() {
    try {
      const result = await connectVeilWallet();
      if (!result.live || !result.wallet) {
        toast("No privacy-enabled Starknet wallet detected.", { description: "VeilPay stays in demo mode until a STRK20 wallet is available." });
        return;
      }
      setWallet(result.wallet);
      setWalletAddress(result.address ?? "");
      setConnected(true);
      toast("Wallet connected.", { description: "Live STRK20 actions are now available through your wallet." });
    } catch (error) {
      toast("Wallet connection was cancelled.", { description: String(error).slice(0, 120) });
    }
  }

  async function advanceRoute() {
    if (!connected) {
      await handleWalletConnect();
      return;
    }
    if (wallet?.strk20InvokeTransaction && stage === 1) {
      try {
        const amountSmallestUnit = BigInt(amount.replace(/,/g, "") || "0") * BigInt("1000000");
        const tx = await submitShieldedRoute(wallet, amountSmallestUnit);
        setStage(2);
        toast("Private route submitted.", { description: tx.transaction_hash ? `View on Voyager: ${explorerUrl(tx.transaction_hash, wallet.chainId)}` : "Waiting for confirmation." });
        return;
      } catch (error) {
        toast("STRK20 action was not submitted.", { description: String(error).slice(0, 140) });
        return;
      }
    }
    setStage((current) => Math.min(current + 1, stages.length - 1));
    toast(stage >= 2 ? "Proof card prepared." : "Demo route created.", { description: "The public chain sees a commitment, not your recipient roster." });
  }

  function copyProof() {
    setCopied(true);
    navigator.clipboard?.writeText("veilpay://proof/VP-019/strk20");
    toast("Proof reference copied.");
    window.setTimeout(() => setCopied(false), 1600);
  }

  return (
    <div className="min-h-screen overflow-hidden bg-[#111210] text-[#F3EEE5] selection:bg-[#F0563A] selection:text-[#111210]">
      <div className="pointer-events-none fixed inset-0 z-0 opacity-[0.11] [background-image:radial-gradient(#F3EEE5_0.6px,transparent_0.6px)] [background-size:18px_18px]" />
      <div className="relative z-10 flex min-h-screen">
        <aside className="hidden w-[236px] shrink-0 border-r border-white/10 bg-[#151614]/95 px-6 py-7 lg:flex lg:flex-col">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center overflow-hidden rounded-[10px] bg-[#F0563A] shadow-[0_0_28px_rgba(240,86,58,.25)]">
              <img src="/manus-storage/veilpay-logo_9b291ef8.png" alt="VeilPay mark" className="h-7 w-7 object-contain" />
            </div>
            <div>
              <div className="font-display text-[17px] font-bold tracking-[-0.04em]">VeilPay</div>
              <div className="font-mono text-[9px] tracking-[0.18em] text-[#918B81]">STRK20 / PRIVATE</div>
            </div>
          </div>

          <div className="mt-14 space-y-2">
            <div className="mb-4 font-mono text-[9px] tracking-[0.18em] text-[#766F66]">WORKSPACE</div>
            <button className="nav-item nav-item-active"><WalletCards size={16} /> Payment routes <span className="ml-auto font-mono text-[10px]">03</span></button>
            <button className="nav-item"><Shield size={16} /> Proof ledger</button>
            <button className="nav-item"><Fingerprint size={16} /> Identity keys</button>
          </div>

          <div className="mt-auto rounded-[16px] border border-white/10 bg-[#1D1E1B] p-4">
            <div className="flex items-center justify-between"><span className="font-mono text-[9px] tracking-[0.16em] text-[#918B81]">NETWORK</span><span className="h-2 w-2 rounded-full bg-[#70D49D] shadow-[0_0_12px_#70D49D]" /></div>
            <div className="mt-3 font-display text-[15px]">Starknet mainnet</div>
            <div className="mt-1 text-[12px] leading-5 text-[#918B81]">STRK20 adapter ready for wallet connection.</div>
            <button className="mt-4 flex items-center gap-1 font-mono text-[10px] tracking-[0.12em] text-[#F0563A]">VIEW CONTRACTS <ArrowUpRight size={12} /></button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <header className="relative flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-8 lg:px-12">
            <div className="flex items-center gap-3 lg:hidden">
              <button onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle menu" className="rounded-lg border border-white/10 p-2">{mobileOpen ? <X size={18} /> : <Menu size={18} />}</button>
              <span className="font-display text-lg font-bold tracking-[-0.04em]">VeilPay</span>
            </div>
            <div className="hidden font-mono text-[10px] tracking-[0.16em] text-[#918B81] lg:block">PRIVATE ROUTES / 2026.08</div>
            <div className="flex items-center gap-3">
              <span className="hidden font-mono text-[10px] tracking-[0.12em] text-[#918B81] sm:block">DEMO MODE / MAINNET-READY</span>
              <Button onClick={handleWalletConnect} className="h-9 rounded-full bg-[#F0563A] px-4 font-mono text-[10px] tracking-[0.12em] text-[#111210] hover:bg-[#FF7257]">{connected ? (walletAddress ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}` : "DEMO CONNECTED") : "CONNECT WALLET"}</Button>
            </div>
          </header>

          {mobileOpen && <div className="border-b border-white/10 bg-[#171815] px-5 py-4 lg:hidden"><button className="nav-item nav-item-active w-full">Payment routes <span className="ml-auto font-mono text-[10px]">03</span></button><button className="nav-item w-full">Proof ledger</button><button className="nav-item w-full">Identity keys</button></div>}

          <section className="relative isolate overflow-hidden border-b border-white/10 px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
            <img src="/manus-storage/veilpay-hero_c0925870.png" alt="Copper cryptographic veil texture" className="absolute inset-0 -z-20 h-full w-full object-cover opacity-45" />
            <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#111210] via-[#111210]/80 to-[#111210]/20" />
            <div className="max-w-[900px]">
              <div className="mb-6 flex items-center gap-3 font-mono text-[10px] tracking-[0.18em] text-[#F0563A]"><span className="h-px w-8 bg-[#F0563A]" />PRIVATE PAYROLL / STRK20</div>
              <h1 className="font-display max-w-[780px] text-[clamp(3.2rem,8vw,7.7rem)] font-bold leading-[0.86] tracking-[-0.08em] text-[#F3EEE5]">Move the money.<br /><span className="text-[#F0563A]">Keep the roster</span><br />private.</h1>
              <p className="mt-8 max-w-[520px] text-[15px] leading-7 text-[#BDB5A9]">VeilPay turns a recipient list into a private STRK20 route. Your team gets a payment workflow with a proof card, not a public spreadsheet of who got paid.</p>
              <div className="mt-9 flex flex-wrap items-center gap-5"><Button onClick={() => document.getElementById("route-builder")?.scrollIntoView({ behavior: "smooth" })} className="group h-12 rounded-full bg-[#F3EEE5] px-6 font-mono text-[10px] tracking-[0.13em] text-[#111210] hover:bg-white">CREATE PRIVATE ROUTE <ArrowUpRight className="ml-2 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1" size={15} /></Button><span className="font-mono text-[10px] leading-5 tracking-[0.1em] text-[#918B81]">PUBLICLY VERIFIABLE<br />PRIVATELY SETTLED</span></div>
            </div>
          </section>

          <section id="route-builder" className="grid border-b border-white/10 xl:grid-cols-[1.18fr_.82fr]">
            <div className="border-b border-white/10 p-5 sm:p-8 lg:p-12 xl:border-b-0 xl:border-r">
              <div className="flex items-start justify-between gap-4"><div><div className="eyebrow">01 / ROUTE BUILDER</div><h2 className="section-title">A payment intent<br /><span>without the exposure.</span></h2></div><div className="rounded-full border border-[#F0563A]/40 px-3 py-1 font-mono text-[9px] tracking-[0.1em] text-[#F0563A]">{stageCopy.label}</div></div>
              <div className="mt-10 grid gap-5 sm:grid-cols-2">
                <div><Label className="field-label">ROUTE NAME</Label><Input defaultValue="March contractor run" className="field-input" /></div>
                <div><Label className="field-label">ASSET</Label><div className="field-input flex items-center justify-between"><span>USDC</span><span className="font-mono text-[10px] text-[#918B81]">STRK20</span></div></div>
                <div><Label className="field-label">TOTAL AMOUNT</Label><div className="relative"><Input value={amount} onChange={(e) => setAmount(e.target.value)} className="field-input pr-16" /><span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-[10px] text-[#918B81]">USDC</span></div></div>
                <div><Label className="field-label">RECIPIENTS</Label><Input value={recipientCount} onChange={(e) => setRecipientCount(e.target.value)} className="field-input" /></div>
              </div>
              <div className="mt-8 rounded-[14px] border border-white/10 bg-[#171815]/75 p-4 sm:p-5"><div className="flex items-center gap-2 text-[#F3EEE5]"><EyeOff size={15} className="text-[#F0563A]" /><span className="font-mono text-[10px] tracking-[0.12em]">WHAT STAYS SHIELDED</span></div><div className="mt-4 grid gap-3 text-[13px] text-[#A8A195] sm:grid-cols-3"><div><span className="block text-[#F3EEE5]">Recipient roster</span>not published</div><div><span className="block text-[#F3EEE5]">Individual amounts</span>not published</div><div><span className="block text-[#F3EEE5]">Proof reference</span>shareable</div></div></div>
              <div className="mt-9 flex flex-wrap items-center justify-between gap-4"><div className="font-mono text-[10px] tracking-[0.1em] text-[#918B81]">{recipientCount || "0"} RECIPIENTS / {amount || "0"} USDC</div><Button onClick={advanceRoute} className="h-11 rounded-full bg-[#F0563A] px-5 font-mono text-[10px] tracking-[0.12em] text-[#111210] hover:bg-[#FF7257]">{stage >= 2 ? "PREPARE PROOF CARD" : "CREATE PRIVATE ROUTE"}<ChevronRight className="ml-2" size={15} /></Button></div>
            </div>

            <div className="relative overflow-hidden bg-[#171815] p-5 sm:p-8 lg:p-12"><img src="/manus-storage/veilpay-note_9aafc0f6.png" alt="Encrypted payment notes" className="absolute bottom-0 right-0 w-[78%] max-w-[540px] opacity-35 mix-blend-screen" /><div className="relative"><div className="eyebrow">02 / PRIVACY STATE</div><h2 className="section-title max-w-[420px]">The route is<br /><span>the product.</span></h2><div className="mt-12 space-y-0">{stages.map((item, index) => <div key={item.label} className={`relative flex gap-4 pb-8 ${index === stages.length - 1 ? "pb-0" : ""}`}><div className={`relative z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${index <= stage ? "border-[#F0563A] bg-[#F0563A] text-[#111210]" : "border-white/20 text-[#766F66]"}`}>{index < stage ? <Check size={14} strokeWidth={3} /> : <span className="font-mono text-[10px]">0{index + 1}</span>}{index !== stages.length - 1 && <span className={`absolute left-1/2 top-7 h-[calc(100%+8px)] w-px -translate-x-1/2 ${index < stage ? "bg-[#F0563A]" : "bg-white/10"}`} />}</div><div><div className={`font-mono text-[10px] tracking-[0.14em] ${index <= stage ? "text-[#F3EEE5]" : "text-[#766F66]"}`}>{item.label}</div><p className="mt-1 max-w-[260px] text-[12px] leading-5 text-[#918B81]">{item.note}</p></div></div>)}</div></div></div>
          </section>

          <section className="grid gap-10 border-b border-white/10 px-5 py-12 sm:px-8 lg:grid-cols-[.75fr_1.25fr] lg:px-12 lg:py-16"><div><div className="eyebrow">03 / PROOF LEDGER</div><h2 className="section-title">Privacy that<br /><span>can be explained.</span></h2><p className="mt-6 max-w-[350px] text-[14px] leading-6 text-[#918B81]">Every route leaves a small, shareable receipt: the contract, the commitment, and the state. Never the roster.</p><button onClick={copyProof} className="mt-8 flex items-center gap-2 font-mono text-[10px] tracking-[0.12em] text-[#F0563A]">{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? "REFERENCE COPIED" : "COPY SAMPLE PROOF"}</button></div><div className="overflow-hidden rounded-[16px] border border-white/10 bg-[#171815]"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div className="font-mono text-[10px] tracking-[0.15em] text-[#918B81]">RECENT ROUTES</div><div className="flex items-center gap-2 font-mono text-[9px] text-[#70D49D]"><span className="h-1.5 w-1.5 rounded-full bg-[#70D49D]" /> LIVE INDEX</div></div>{activity.map((item) => <div key={item.id} className="group flex items-center gap-4 border-b border-white/10 px-5 py-5 last:border-b-0"><div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] border border-white/10 bg-[#20211E]"><LockKeyhole size={16} className="text-[#F0563A]" /></div><div className="min-w-0 flex-1"><div className="truncate font-display text-[15px] text-[#F3EEE5]">{item.title}</div><div className="mt-1 font-mono text-[9px] tracking-[0.08em] text-[#766F66]">{item.id} / {item.detail}</div></div><div className="hidden text-right sm:block"><Badge className="border border-[#F0563A]/30 bg-transparent font-mono text-[9px] tracking-[0.08em] text-[#F0563A]">{item.state}</Badge><div className="mt-2 font-mono text-[9px] text-[#766F66]">{item.time}</div></div><ArrowUpRight size={16} className="text-[#766F66] transition-colors group-hover:text-[#F0563A]" /></div>)}</div></section>

          <footer className="flex flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8 lg:px-12"><div className="flex items-center gap-3"><Sparkles size={15} className="text-[#F0563A]" /><span className="font-mono text-[10px] tracking-[0.12em] text-[#918B81]">BUILT FOR THE STRK20 PRIVATE SPRINT</span></div><div className="font-mono text-[9px] tracking-[0.1em] text-[#766F66]">OPEN SOURCE / MAINNET-READY / PRIVACY BY DEFAULT</div></footer>
        </main>
      </div>
    </div>
  );
}
