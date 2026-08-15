import { useMemo, useState } from "react";
import { ArrowUpRight, BookOpen, Check, ChevronRight, CircleHelp, EyeOff, Fingerprint, GitBranch, Layers3, LockKeyhole, PlayCircle, Shield, Sparkles, WalletCards } from "lucide-react";
import { Link } from "wouter";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { documentationChapters, documentationProductSurfaces, documentationTeaserAsset } from "@shared/documentation";

const teaserVideo = documentationTeaserAsset;

const chapters = documentationChapters.map((id) => ({
  id,
  label: id === "why" ? "Why VeilPay" : id === "product" ? "Product map" : id === "privacy" ? "Privacy model" : id === "starknet" ? "Starknet flow" : id === "demo" ? "Demo Mode" : "Overview",
}));

const productSurfaces = [
  { icon: WalletCards, index: "01", title: documentationProductSurfaces[0], copy: "Build a route from a private roster, shield the intent, and move toward settlement without turning compensation data into a public spreadsheet." },
  { icon: Layers3, index: "02", title: documentationProductSurfaces[1], copy: "Coordinate schedules, approval thresholds, policy limits, balance snapshots, and receipt health from one workspace." },
  { icon: LockKeyhole, index: "03", title: documentationProductSurfaces[2], copy: "Create recipient claim links that keep the claimant context out of the public project surface until redemption." },
  { icon: GitBranch, index: "04", title: documentationProductSurfaces[3], copy: "Run private project rooms with milestones, shielded allocations, release requests, and aggregate public proofs." },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[#F0563A]"><span className="h-px w-7 bg-[#F0563A]" />{children}</div>;
}

export default function Documentation() {
  const { isDemoMode, exitDemo } = useDemoMode();
  const [activeChapter, setActiveChapter] = useState("overview");
  const [simulationStep, setSimulationStep] = useState(2);
  const [revealPrivate, setRevealPrivate] = useState(false);
  const steps = useMemo(() => [
    { label: "Roster", detail: "Private recipients and amounts stay workspace-scoped.", icon: Fingerprint },
    { label: "Shield", detail: "The payment intent is wrapped before execution.", icon: Shield },
    { label: "Proof", detail: "Public surfaces receive aggregate verification, not the roster.", icon: EyeOff },
  ], []);

  function jumpTo(id: string) {
    setActiveChapter(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-[#111210] text-[#F2EEE7]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[204px] border-r border-white/10 bg-[#151614] lg:block">
        <div className="flex h-full flex-col px-5 py-6">
          <Link href="/" className="mb-12 flex items-center gap-3 no-underline">
            <div className="grid h-9 w-9 place-items-center bg-[#F0563A] text-[#111210]"><BookOpen size={18} /></div>
            <div><div className="font-sans text-lg font-semibold tracking-[-0.04em]">VeilPay</div><div className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#8E897F]">Documentation</div></div>
          </Link>
          <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[#6E6A63]">Read the system</div>
          <nav className="space-y-1">
            {chapters.map((chapter) => <button key={chapter.id} onClick={() => jumpTo(chapter.id)} className={`flex w-full items-center justify-between px-3 py-3 text-left font-mono text-[10px] uppercase tracking-[0.11em] transition ${activeChapter === chapter.id ? "bg-[#F0563A] text-[#111210]" : "text-[#AAA49A] hover:bg-white/5 hover:text-white"}`}><span>{chapter.label}</span><ChevronRight size={13} /></button>)}
          </nav>
          <div className="mt-auto space-y-2 border-t border-white/10 pt-5">
            {isDemoMode && <button onClick={() => { exitDemo(); window.location.href = "/"; }} className="w-full border border-[#F0563A]/40 px-3 py-2 text-left font-mono text-[9px] uppercase tracking-[0.12em] text-[#F0563A]">Exit Demo Mode</button>}
            <Link href="/demo" className="flex items-center gap-2 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#A7A197] hover:text-white"><PlayCircle size={13} />Open Demo Tour</Link>
            <Link href="/" className="flex items-center gap-2 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#A7A197] hover:text-white"><ArrowUpRight size={13} />Back to workspace</Link>
          </div>
        </div>
      </aside>

      <main className="lg:pl-[204px]">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#111210]/90 px-5 py-4 backdrop-blur lg:px-10">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#8E897F]"><span className="h-2 w-2 rounded-full bg-[#6DE3A1]" />VeilPay / Product documentation</div>
          <div className="flex items-center gap-3"><span className="hidden font-mono text-[9px] uppercase tracking-[0.12em] text-[#F0563A] sm:inline">STRK20 / PRIVACY-FIRST</span><Link href="/" className="border border-white/15 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#D5CEC4] hover:border-white/35">Workspace</Link></div>
        </header>

        <div className="mx-auto max-w-[1180px] px-5 pb-24 pt-10 lg:px-10 lg:pt-16">
          <section id="overview" className="scroll-mt-24">
            <SectionLabel>01 / Start here</SectionLabel>
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div><h1 className="max-w-4xl font-sans text-5xl font-semibold leading-[0.9] tracking-[-0.07em] sm:text-7xl lg:text-[7.2rem]">Private money.<br /><span className="text-[#F0563A]">Clear intent.</span></h1><p className="mt-7 max-w-2xl text-base leading-7 text-[#AAA49A] sm:text-lg">VeilPay is a privacy-first operating system for payroll, treasury governance, private claims, and Starknet project launches. This guide explains what the product does, why it exists, and where the Demo Mode boundary ends.</p></div>
              <div className="border border-[#F0563A]/30 bg-[#211815] p-5"><div className="mb-5 flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.18em] text-[#F0563A]"><Sparkles size={14} />Coming soon / product film</div><div className="aspect-video overflow-hidden border border-white/10 bg-black"><video className="h-full w-full object-cover" controls playsInline preload="metadata"><source src={teaserVideo} type="video/mp4" />Your browser does not support the teaser video.</video></div><p className="mt-4 font-mono text-[9px] uppercase tracking-[0.14em] text-[#8E897F]">Watch the typographic teaser, then use the guided Demo Mode below.</p></div>
            </div>
          </section>

          <section id="why" className="scroll-mt-24 border-t border-white/10 pt-20 mt-24">
            <SectionLabel>02 / Why VeilPay</SectionLabel>
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]"><h2 className="font-sans text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">The gap is not another dashboard.</h2><div className="space-y-5 text-[#AAA49A] leading-7"><p>Teams need payment coordination, but the default workflow leaks context: who was paid, how much, which contributors belong to a project, and how treasury decisions were made. Public verification is valuable; public exposure of the full roster is not.</p><p>VeilPay separates those concerns. Operators get a durable workspace for intent, approvals, schedules, and receipts. Public observers get aggregate proof surfaces. Claimants receive private redemption paths. The product is designed around the privacy boundary instead of adding privacy as a late toggle.</p><div className="grid gap-3 pt-3 sm:grid-cols-3"><div className="border border-white/10 p-4"><div className="font-mono text-2xl text-[#F0563A]">01</div><p className="mt-3 text-sm text-[#D5CEC4]">Private roster</p><p className="mt-1 text-xs text-[#77736C]">Identity and amount context stays scoped.</p></div><div className="border border-white/10 p-4"><div className="font-mono text-2xl text-[#F0563A]">02</div><p className="mt-3 text-sm text-[#D5CEC4]">Governed intent</p><p className="mt-1 text-xs text-[#77736C]">Policies and approvals shape execution.</p></div><div className="border border-white/10 p-4"><div className="font-mono text-2xl text-[#F0563A]">03</div><p className="mt-3 text-sm text-[#D5CEC4]">Public proof</p><p className="mt-1 text-xs text-[#77736C]">Verification without the roster dump.</p></div></div></div></div>
          </section>

          <section id="product" className="scroll-mt-24 border-t border-white/10 pt-20 mt-24"><SectionLabel>03 / Product map</SectionLabel><div className="grid gap-4 sm:grid-cols-2">{productSurfaces.map(({ icon: Icon, index, title, copy }) => <article key={title} className="group border border-white/10 bg-[#171816] p-6 transition hover:border-[#F0563A]/50"><div className="flex items-start justify-between"><div className="grid h-10 w-10 place-items-center border border-[#F0563A]/40 text-[#F0563A]"><Icon size={18} /></div><span className="font-mono text-[10px] text-[#6E6A63]">{index}</span></div><h3 className="mt-8 font-sans text-2xl font-medium tracking-[-0.04em]">{title}</h3><p className="mt-3 text-sm leading-6 text-[#918C83]">{copy}</p></article>)}</div></section>

          <section id="privacy" className="scroll-mt-24 border-t border-white/10 pt-20 mt-24"><SectionLabel>04 / Privacy model</SectionLabel><div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start"><div><h2 className="font-sans text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">Reveal the proof.<br /><span className="text-[#F0563A]">Not the roster.</span></h2><p className="mt-5 max-w-xl leading-7 text-[#AAA49A]">The operating model is intentionally asymmetric: private inputs and operational context on one side, a small public proof surface on the other. This is the core product decision behind shielded allocations, recipient claim links, and aggregate health cards.</p></div><div className="border border-white/10 bg-[#171816] p-6"><div className="mb-6 flex items-center justify-between"><span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#8E897F]">Interactive privacy boundary</span><button onClick={() => setRevealPrivate((value) => !value)} className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#F0563A] underline">{revealPrivate ? "Hide context" : "Preview private context"}</button></div><div className="grid gap-3 sm:grid-cols-3">{steps.map(({ label, detail, icon: Icon }, index) => <button key={label} onClick={() => setSimulationStep(index)} className={`border p-4 text-left transition ${simulationStep === index ? "border-[#F0563A] bg-[#211815]" : "border-white/10 hover:border-white/25"}`}><Icon size={17} className={simulationStep === index ? "text-[#F0563A]" : "text-[#8E897F]"} /><div className="mt-6 font-mono text-[10px] uppercase tracking-[0.13em] text-[#D5CEC4]">{label}</div><div className="mt-2 text-xs leading-5 text-[#77736C]">{detail}</div></button>)}</div><div className="mt-5 border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#6DE3A1]">{simulationStep === 0 ? "Workspace only / claimant context stays private" : simulationStep === 1 ? "Shielded intent / execution boundary enforced" : "Public proof / aggregate state only"}</div>{revealPrivate && <div className="mt-4 border border-[#F0563A]/30 bg-[#211815] p-4 text-xs text-[#D5CEC4]">Example private context: <span className="text-[#F0563A]">Alice · 0xDEMO…A1 · 1,200 USDC</span>. This is a local visual simulation, not a real wallet lookup or transaction.</div>}</div></div></section>

          <section id="starknet" className="scroll-mt-24 border-t border-white/10 pt-20 mt-24"><SectionLabel>05 / Starknet flow</SectionLabel><div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]"><div className="border border-white/10 bg-[#171816] p-6"><div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#8E897F]"><span className="border border-[#F0563A]/40 px-3 py-2 text-[#F0563A]">Operator intent</span><ChevronRight size={14} /><span className="border border-white/10 px-3 py-2">STRK20 shield</span><ChevronRight size={14} /><span className="border border-white/10 px-3 py-2">Wallet signature</span><ChevronRight size={14} /><span className="border border-[#6DE3A1]/40 px-3 py-2 text-[#6DE3A1]">Receipt / proof</span></div><div className="mt-10 grid gap-4 sm:grid-cols-2"><div className="border border-white/10 p-5"><WalletCards className="text-[#F0563A]" size={20} /><h3 className="mt-5 text-lg">Account-aware execution</h3><p className="mt-2 text-sm leading-6 text-[#918C83]">VeilPay keeps the wallet and provider boundary explicit. Demo Mode never creates a private key or pretends a simulated receipt is mainnet evidence.</p></div><div className="border border-white/10 p-5"><Shield className="text-[#6DE3A1]" size={20} /><h3 className="mt-5 text-lg">Auditable privacy</h3><p className="mt-2 text-sm leading-6 text-[#918C83]">The product can show workflow health, approvals, and aggregate proofs without making every participant a public data point.</p></div></div></div><div className="border border-[#F0563A]/30 bg-[#211815] p-6"><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F0563A]">Execution boundary</div><p className="mt-5 text-2xl leading-tight text-[#F2EEE7]">Production actions require authenticated workspace access and a connected wallet.</p><p className="mt-5 text-sm leading-6 text-[#AAA49A]">The Documentation page explains the real product. Demo Mode is the safe place to explore the interaction model before supplying real credentials or signing anything.</p><Link href="/demo" className="mt-6 inline-flex items-center gap-2 border border-[#F0563A] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.13em] text-[#F0563A] hover:bg-[#F0563A] hover:text-[#111210]">Explore Demo Mode <ArrowUpRight size={14} /></Link></div></div></section>

          <section id="demo" className="scroll-mt-24 border-t border-white/10 pt-20 mt-24"><SectionLabel>06 / Demo Mode</SectionLabel><div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]"><div><h2 className="font-sans text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">Touch every<br /><span className="text-[#F0563A]">privacy surface.</span></h2><p className="mt-5 leading-7 text-[#AAA49A]">The guided tour uses deterministic local state to demonstrate payroll, operations, treasury, claims, Launchpad, and proof. Each action has visible success, failure, retry, and reset behavior so the product story can be understood without a wallet.</p></div><div className="border border-white/10 bg-[#171816] p-6"><div className="flex items-center justify-between"><div className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#8E897F]">Simulation checklist</div><span className="font-mono text-[10px] text-[#6DE3A1]">LOCAL / REVERSIBLE</span></div><div className="mt-6 space-y-3">{["Build a private payroll route", "Run treasury policy and governance", "Redeem a private claim", "Advance a Launchpad milestone", "Publish an aggregate proof"].map((item, index) => <div key={item} className="flex items-center gap-3 border-b border-white/10 pb-3 text-sm text-[#D5CEC4]"><div className="grid h-6 w-6 place-items-center rounded-full border border-[#6DE3A1]/50 text-[#6DE3A1]"><Check size={13} /></div><span>{item}</span><span className="ml-auto font-mono text-[9px] text-[#6E6A63]">0{index + 1}</span></div>)}</div><Link href="/demo" className="mt-7 inline-flex w-full items-center justify-center gap-2 bg-[#F0563A] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#111210] hover:bg-[#ff6b4e]">Open the full guided tour <PlayCircle size={15} /></Link></div></div></section>

          <footer className="mt-24 border-t border-white/10 pt-8"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center"><div><div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F0563A]">VeilPay / Documentation</div><p className="mt-2 text-sm text-[#77736C]">Private payment infrastructure for teams that need proof without exposure.</p></div><div className="flex gap-3"><Link href="/" className="border border-white/15 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#D5CEC4]">Workspace</Link><Link href="/launchpad" className="border border-white/15 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#D5CEC4]">Launchpad</Link></div></div></footer>
        </div>
      </main>
    </div>
  );
}
