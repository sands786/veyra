import { useMemo, useState } from "react";
import {
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleHelp,
  EyeOff,
  Fingerprint,
  GitBranch,
  Layers3,
  LockKeyhole,
  PlayCircle,
  Shield,
  Sparkles,
  WalletCards,
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useDemoMode } from "@/contexts/DemoModeContext";
import { VeyraBrand } from "@/components/VeyraBrand";
import { WorkspaceReturnButton } from "@/components/WorkspaceReturnButton";
import {
  documentationChapters,
  documentationProductSurfaces,
  documentationTeaserAsset,
  documentationVideoGuides,
} from "@shared/documentation";

const teaserVideo = documentationTeaserAsset;

const chapters = [...documentationChapters, "references"].map(id => ({
  id,
  label:
    id === "why"
      ? "Why Veyra"
      : id === "product"
        ? "Product map"
        : id === "privacy"
          ? "Privacy model"
          : id === "starknet"
            ? "Starknet flow"
            : id === "demo"
              ? "Demo Mode"
              : id === "references"
                ? "Reference layer"
                : "Overview",
}));

const protocolReferences = [
  {
    label: "Protocol concepts",
    title: "STRK20 by Example",
    copy: "Note-based privacy, registration, channels, discovery, actions, proofs, and compliance boundaries.",
    href: "https://strk20-by-example.org/what-is-strk20",
  },
  {
    label: "Wallet integration",
    title: "STRK20 Starter Kit",
    copy: "WalletAccountV6 patterns for shielding, private transfer, balances, and privacy_invoke helpers.",
    href: "https://github.com/Akashneelesh/strk20-starter-kit",
  },
  {
    label: "Canonical implementation",
    title: "Starknet Privacy",
    copy: "The SDK, discovery service, proving service, pool contracts, anonymizers, and end-to-end test layers.",
    href: "https://github.com/starkware-libs/starknet-privacy",
  },
  {
    label: "Builder index",
    title: "Awesome STRK20",
    copy: "A curated map of the Wallet API, Privacy SDK, helper contracts, bridge work, and reference applications.",
    href: "https://github.com/Akashneelesh/awesome-strk20",
  },
  {
    label: "Agent skills",
    title: "STRK20 Skills",
    copy: "Freshness checks, Wallet API guidance, privacy SDK notes, and anonymizer contract patterns for builders.",
    href: "https://github.com/odinfree/strk20-skills",
  },
] as const;

const productSurfaces = [
  {
    icon: WalletCards,
    index: "01",
    title: documentationProductSurfaces[0],
    copy: "Build a route from a private roster, shield the intent, and move toward settlement without turning compensation data into a public spreadsheet.",
  },
  {
    icon: Layers3,
    index: "02",
    title: documentationProductSurfaces[1],
    copy: "Coordinate schedules, approval thresholds, policy limits, balance snapshots, and receipt health from one workspace.",
  },
  {
    icon: LockKeyhole,
    index: "03",
    title: documentationProductSurfaces[2],
    copy: "Create recipient claim links that keep the claimant context out of the public project surface until redemption.",
  },
  {
    icon: GitBranch,
    index: "04",
    title: documentationProductSurfaces[3],
    copy: "Run private project rooms with milestones, shielded allocations, release requests, and aggregate public proofs.",
  },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.24em] text-[#F0563A]">
      <span className="h-px w-7 bg-[#F0563A]" />
      {children}
    </div>
  );
}

export default function Documentation() {
  const { isDemoMode, exitDemo } = useDemoMode();
  const [, setLocation] = useLocation();
  const [activeChapter, setActiveChapter] = useState("overview");
  const [simulationStep, setSimulationStep] = useState(2);
  const [revealPrivate, setRevealPrivate] = useState(false);
  const steps = useMemo(
    () => [
      {
        label: "Roster",
        detail: "Private recipients and amounts stay workspace-scoped.",
        icon: Fingerprint,
      },
      {
        label: "Shield",
        detail: "The payment intent is wrapped before execution.",
        icon: Shield,
      },
      {
        label: "Proof",
        detail:
          "Public surfaces receive aggregate verification, not the roster.",
        icon: EyeOff,
      },
    ],
    []
  );

  function jumpTo(id: string) {
    setActiveChapter(id);
    document
      .getElementById(id)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div className="min-h-screen bg-[#111210] text-[#F2EEE7]">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[204px] border-r border-white/10 bg-[#151614] lg:block">
        <div className="flex h-full flex-col px-5 py-6">
          <Link href="/" className="mb-12 no-underline">
            <VeyraBrand compact />
          </Link>
          <div className="mb-3 font-mono text-[9px] uppercase tracking-[0.2em] text-[#6E6A63]">
            Read the system
          </div>
          <nav className="space-y-1">
            {chapters.map(chapter => (
              <button
                key={chapter.id}
                onClick={() => jumpTo(chapter.id)}
                className={`group relative flex w-full items-center gap-3 overflow-hidden border px-3 py-3.5 text-left font-mono text-[10px] uppercase tracking-[0.11em] transition-[transform,border-color,background-color,color,box-shadow] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6DE3A1] focus-visible:ring-offset-2 focus-visible:ring-offset-[#151614] ${activeChapter === chapter.id ? "border-[#F0563A] bg-[#F0563A] text-[#111210] shadow-[0_10px_26px_rgba(240,86,58,0.18)]" : "border-transparent text-[#AAA49A] hover:border-white/12 hover:bg-white/[0.045] hover:text-[#F2EEE7]"}`}
              >
                <span
                  className={`h-1.5 w-1.5 shrink-0 rounded-full transition-[transform,background-color] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] ${activeChapter === chapter.id ? "scale-100 bg-[#111210]" : "scale-75 bg-[#6E6A63] group-hover:scale-100 group-hover:bg-[#6DE3A1]"}`}
                />
                <span className="min-w-0 flex-1">{chapter.label}</span>
                <ChevronRight
                  size={14}
                  className={`shrink-0 transition-transform duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] ${activeChapter === chapter.id ? "translate-x-0.5" : "group-hover:translate-x-1"}`}
                />
              </button>
            ))}
          </nav>
          <div className="mt-auto space-y-2 border-t border-white/10 pt-5">
            <Link
              href="/demo"
              className="group flex items-center gap-2 px-3 py-2 font-mono text-[9px] uppercase tracking-[0.12em] text-[#A7A197] transition-colors duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6DE3A1]"
            >
              <PlayCircle
                size={13}
                className="transition-transform duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-hover:scale-110 group-hover:text-[#6DE3A1]"
              />
              <span className="transition-transform duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] group-hover:translate-x-0.5">
                Open Demo Tour
              </span>
            </Link>
            <WorkspaceReturnButton
              onBeforeNavigate={isDemoMode ? exitDemo : undefined}
              className="w-full justify-start text-[#A7A197] hover:bg-white/5 hover:text-white"
            />
          </div>
        </div>
      </aside>

      <main className="lg:pl-[204px]">
        <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/10 bg-[#111210]/90 px-5 py-4 backdrop-blur lg:px-10">
          <div className="flex items-center gap-3 font-mono text-[10px] uppercase tracking-[0.18em] text-[#AEB8BE]">
            <span className="h-2 w-2 rounded-full bg-[#6DE3A1]" />
            Veyra / Product documentation
          </div>
          <div className="flex items-center gap-3">
            <span className="hidden font-mono text-[9px] uppercase tracking-[0.12em] text-[#F0563A] sm:inline">
              STRK20 / PRIVACY-FIRST
            </span>
            <WorkspaceReturnButton className="border border-white/15 text-[#D5CEC4] hover:border-white/35 hover:bg-white/5 hover:text-white" />
          </div>
        </header>

        <div className="mx-auto max-w-[1180px] px-5 pb-24 pt-10 lg:px-10 lg:pt-16">
          <section id="overview" className="scroll-mt-24">
            <SectionLabel>01 / Start here</SectionLabel>
            <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
              <div>
                <h1 className="max-w-4xl font-sans text-5xl font-semibold leading-[0.9] tracking-[-0.07em] sm:text-7xl lg:text-[7.2rem]">
                  Private money.
                  <br />
                  <span className="text-[#F0563A]">Clear intent.</span>
                </h1>
                <p className="mt-7 max-w-2xl text-base leading-7 text-[#AAA49A] sm:text-lg">
                  Veyra is a privacy-first operating system for payroll,
                  treasury governance, private claims, and Starknet project
                  launches. This guide explains what the product does, why it
                  exists, and where the Demo Mode boundary ends.
                </p>
              </div>
              <div className="border border-[#F0563A]/40 bg-[#101514] p-3 sm:p-5">
                <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-4 font-mono text-[9px] uppercase tracking-[0.16em]">
                  <span className="flex items-center gap-2 text-[#F0563A]">
                    <Sparkles size={14} />
                    Film 00 / Veyra operating model
                  </span>
                  <span className="border border-[#6DE3A1]/35 px-2 py-1 text-[8px] text-[#6DE3A1]">
                    03:10 stable master
                  </span>
                </div>
                <div className="mt-4 border border-white/10 bg-black p-1">
                  <div className="aspect-video overflow-hidden bg-black">
                    <video
                      className="h-full w-full object-cover"
                      controls
                      playsInline
                      preload="metadata"
                    >
                      <source src={teaserVideo} type="video/mp4" />
                      Your browser does not support the Veyra product film.
                    </video>
                  </div>
                </div>
                <div className="mt-5 space-y-4 border-t border-white/10 pt-5">
                  <p className="max-w-2xl font-sans text-[15px] leading-7 text-[#F2EEE7]">
                    A stable editorial walkthrough of Veyra’s operating model:
                    deliberate title cards, one-direction product scrolls, and
                    an explicit receipt boundary.
                  </p>
                  <div className="flex items-baseline justify-between gap-4 border-t border-white/10 pt-4 font-mono text-[8px] uppercase leading-5 tracking-[0.12em]">
                    <span className="text-[#AEB8BE]">Product film</span>
                    <span className="text-right text-[#F0563A]">
                      Wallet → Receipt → Proof
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="why"
            className="scroll-mt-24 border-t border-white/10 pt-20 mt-24"
          >
            <SectionLabel>02 / Why Veyra</SectionLabel>
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <h2 className="font-sans text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">
                The gap is not another dashboard.
              </h2>
              <div className="space-y-5 text-[#AAA49A] leading-7">
                <p>
                  Teams need payment coordination, but the default workflow
                  leaks context: who was paid, how much, which contributors
                  belong to a project, and how treasury decisions were made.
                  Public verification is valuable; public exposure of the full
                  roster is not.
                </p>
                <p>
                  Veyra separates those concerns. Operators get a durable
                  workspace for intent, approvals, schedules, and receipts.
                  Public observers get aggregate proof surfaces. Claimants
                  receive private redemption paths. The product is designed
                  around the privacy boundary instead of adding privacy as a
                  late toggle.
                </p>
                <div className="grid gap-3 pt-3 sm:grid-cols-3">
                  <div className="border border-white/10 p-4">
                    <div className="font-mono text-2xl text-[#F0563A]">01</div>
                    <p className="mt-3 text-sm text-[#D5CEC4]">
                      Private roster
                    </p>
                    <p className="mt-1 text-xs text-[#77736C]">
                      Identity and amount context stays scoped.
                    </p>
                  </div>
                  <div className="border border-white/10 p-4">
                    <div className="font-mono text-2xl text-[#F0563A]">02</div>
                    <p className="mt-3 text-sm text-[#D5CEC4]">
                      Governed intent
                    </p>
                    <p className="mt-1 text-xs text-[#77736C]">
                      Policies and approvals shape execution.
                    </p>
                  </div>
                  <div className="border border-white/10 p-4">
                    <div className="font-mono text-2xl text-[#F0563A]">03</div>
                    <p className="mt-3 text-sm text-[#D5CEC4]">Public proof</p>
                    <p className="mt-1 text-xs text-[#77736C]">
                      Verification without the roster dump.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section
            id="product"
            className="scroll-mt-24 border-t border-white/10 pt-20 mt-24"
          >
            <SectionLabel>03 / Product map</SectionLabel>
            <div className="grid gap-4 sm:grid-cols-2">
              {productSurfaces.map(({ icon: Icon, index, title, copy }) => (
                <article
                  key={title}
                  className="group border border-white/10 bg-[#151D21] p-6 transition hover:border-[#F0563A]/50"
                >
                  <div className="flex items-start justify-between">
                    <div className="grid h-10 w-10 place-items-center border border-[#F0563A]/40 text-[#F0563A]">
                      <Icon size={18} />
                    </div>
                    <span className="font-mono text-[10px] text-[#6E6A63]">
                      {index}
                    </span>
                  </div>
                  <h3 className="mt-8 font-sans text-2xl font-medium tracking-[-0.04em]">
                    {title}
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-[#918C83]">
                    {copy}
                  </p>
                </article>
              ))}
            </div>
          </section>

          <section
            id="privacy"
            className="scroll-mt-24 border-t border-white/10 pt-20 mt-24"
          >
            <SectionLabel>04 / Privacy model</SectionLabel>
            <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
              <div>
                <h2 className="font-sans text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">
                  Reveal the proof.
                  <br />
                  <span className="text-[#F0563A]">Not the roster.</span>
                </h2>
                <p className="mt-5 max-w-xl leading-7 text-[#AAA49A]">
                  The operating model is intentionally asymmetric: private
                  inputs and operational context on one side, a small public
                  proof surface on the other. This is the core product decision
                  behind shielded allocations, recipient claim links, and
                  aggregate health cards.
                </p>
              </div>
              <div className="border border-white/10 bg-[#151D21] p-6">
                <div className="mb-6 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#AEB8BE]">
                    Interactive privacy boundary
                  </span>
                  <button
                    onClick={() => setRevealPrivate(value => !value)}
                    className="font-mono text-[10px] uppercase tracking-[0.12em] text-[#F0563A] underline"
                  >
                    {revealPrivate ? "Hide context" : "Preview private context"}
                  </button>
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  {steps.map(({ label, detail, icon: Icon }, index) => (
                    <button
                      key={label}
                      onClick={() => setSimulationStep(index)}
                      className={`border p-4 text-left transition ${simulationStep === index ? "border-[#F0563A] bg-[#1B2930]" : "border-white/10 hover:border-white/25"}`}
                    >
                      <Icon
                        size={17}
                        className={
                          simulationStep === index
                            ? "text-[#F0563A]"
                            : "text-[#AEB8BE]"
                        }
                      />
                      <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.13em] text-[#D5CEC4]">
                        {label}
                      </div>
                      <div className="mt-2 text-xs leading-5 text-[#77736C]">
                        {detail}
                      </div>
                    </button>
                  ))}
                </div>
                <div className="mt-5 border-t border-white/10 pt-5 font-mono text-[10px] uppercase tracking-[0.12em] text-[#6DE3A1]">
                  {simulationStep === 0
                    ? "Workspace only / claimant context stays private"
                    : simulationStep === 1
                      ? "Shielded intent / execution boundary enforced"
                      : "Public proof / aggregate state only"}
                </div>
                {revealPrivate && (
                  <div className="mt-4 border border-[#F0563A]/30 bg-[#1B2930] p-4 text-xs text-[#D5CEC4]">
                    Example private context:{" "}
                    <span className="text-[#F0563A]">
                      Alice · 0xDEMO…A1 · 1,200 USDC
                    </span>
                    . This is a local visual simulation, not a real wallet
                    lookup or transaction.
                  </div>
                )}
              </div>
            </div>
          </section>

          <section
            id="videos"
            className="scroll-mt-24 mt-24 border-t border-white/10 pt-20"
          >
            <SectionLabel>05 / Function videos</SectionLabel>
            <div className="flex flex-col gap-8">
              <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
                <div>
                  <h2 className="font-sans text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">
                    See every function.
                    <br />
                    <span className="text-[#F0563A]">One cut at a time.</span>
                  </h2>
                </div>
                <p className="max-w-xl text-sm leading-7 text-[#AAA49A] lg:pb-1">
                  Each walkthrough isolates a single product responsibility.
                  Watch the interaction, inspect the boundary, then compare a
                  simulated workflow with the connected-wallet requirement.
                </p>
              </div>
              <div className="border-y border-white/10 py-3 font-mono text-[8px] uppercase tracking-[0.14em] text-[#6E6A63]">
                <span className="text-[#F0563A]">Eight guided cuts</span>{" "}
                <span className="mx-3 text-white/20">/</span> 24 seconds each{" "}
                <span className="mx-3 text-white/20">/</span> stable editorial
                motion
              </div>
              <div className="grid gap-x-6 gap-y-10 lg:grid-cols-2">
                {documentationVideoGuides.map((guide, index) => (
                  <article
                    key={guide.id}
                    className="group border border-white/10 bg-[#101312] p-3 sm:p-4"
                  >
                    <div className="flex items-center justify-between border-b border-white/10 pb-3 font-mono text-[8px] uppercase tracking-[0.14em]">
                      <span className="text-[#F0563A]">
                        Film {String(index + 1).padStart(2, "0")}
                      </span>
                      <span className="text-[#6DE3A1]">
                        {guide.duration} / stable cut
                      </span>
                    </div>
                    <div className="mt-3 aspect-video border border-white/10 bg-black p-1">
                      <video
                        className="h-full w-full bg-black object-cover"
                        controls
                        playsInline
                        preload="metadata"
                      >
                        <source src={guide.asset} type="video/mp4" />
                        Your browser does not support this video.
                      </video>
                    </div>
                    <div className="px-1 pb-1 pt-5">
                      <div className="flex items-baseline justify-between gap-4">
                        <h3 className="font-sans text-[22px] font-medium tracking-[-0.045em] text-[#F2EEE7]">
                          {guide.title}
                        </h3>
                        <span className="shrink-0 font-mono text-[8px] uppercase tracking-[0.12em] text-[#AEB8BE]">
                          Guide
                        </span>
                      </div>
                      <p className="mt-3 max-w-xl text-[13px] leading-6 text-[#D5CEC4]">
                        {guide.purpose}
                      </p>
                      <div className="mt-5 grid grid-cols-[auto_1fr] gap-3 border-t border-white/10 pt-4 text-xs leading-5 text-[#AEB8BE]">
                        <span className="font-mono text-[8px] uppercase tracking-[0.12em] text-[#F0563A]">
                          Boundary
                        </span>
                        <span>{guide.boundary}</span>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>
          </section>

          <section
            id="starknet"
            className="scroll-mt-24 border-t border-white/10 pt-20 mt-24"
          >
            <SectionLabel>06 / Starknet flow</SectionLabel>
            <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="border border-white/10 bg-[#151D21] p-6">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em] text-[#AEB8BE]">
                  <span className="border border-[#F0563A]/40 px-3 py-2 text-[#F0563A]">
                    Operator intent
                  </span>
                  <ChevronRight size={14} />
                  <span className="border border-white/10 px-3 py-2">
                    STRK20 shield
                  </span>
                  <ChevronRight size={14} />
                  <span className="border border-white/10 px-3 py-2">
                    Wallet signature
                  </span>
                  <ChevronRight size={14} />
                  <span className="border border-[#6DE3A1]/40 px-3 py-2 text-[#6DE3A1]">
                    Receipt / proof
                  </span>
                </div>
                <div className="mt-10 grid gap-4 sm:grid-cols-2">
                  <div className="border border-white/10 p-5">
                    <WalletCards className="text-[#F0563A]" size={20} />
                    <h3 className="mt-5 text-lg">Account-aware execution</h3>
                    <p className="mt-2 text-sm leading-6 text-[#918C83]">
                      Veyra keeps the wallet and provider boundary explicit.
                      Demo Mode never creates a private key or pretends a
                      simulated receipt is mainnet evidence.
                    </p>
                  </div>
                  <div className="border border-white/10 p-5">
                    <Shield className="text-[#6DE3A1]" size={20} />
                    <h3 className="mt-5 text-lg">Auditable privacy</h3>
                    <p className="mt-2 text-sm leading-6 text-[#918C83]">
                      The product can show workflow health, approvals, and
                      aggregate proofs without making every participant a public
                      data point. STRK20’s public edges still include deposits,
                      withdrawals, and timing; Veyra does not promise that those
                      protocol facts disappear.
                    </p>
                  </div>
                </div>
              </div>
              <div className="border border-[#F0563A]/30 bg-[#1B2930] p-6">
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F0563A]">
                  Execution boundary
                </div>
                <p className="mt-5 text-2xl leading-tight text-[#F2EEE7]">
                  Production actions require authenticated workspace access and
                  a connected wallet.
                </p>
                <p className="mt-5 text-sm leading-6 text-[#AAA49A]">
                  The Documentation page explains the real product. Demo Mode is
                  the safe place to explore the interaction model before
                  supplying real credentials or signing anything.
                </p>
                <Link
                  href="/demo"
                  className="mt-6 inline-flex items-center gap-2 border border-[#F0563A] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.13em] text-[#F0563A] hover:bg-[#F0563A] hover:text-[#111210]"
                >
                  Explore Demo Mode <ArrowUpRight size={14} />
                </Link>
              </div>
            </div>
          </section>

          <section
            id="references"
            className="scroll-mt-24 border-t border-white/10 pt-20 mt-24"
          >
            <SectionLabel>07 / Reference layer</SectionLabel>
            <div className="grid gap-8 lg:grid-cols-[0.8fr_1.2fr]">
              <div>
                <h2 className="font-sans text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">
                  Build on the
                  <br />
                  <span className="text-[#F0563A]">real protocol.</span>
                </h2>
                <p className="mt-5 max-w-xl leading-7 text-[#AAA49A]">
                  Veyra follows the public STRK20 references instead of hiding
                  protocol assumptions behind product language. Accounts must be
                  registered before they can hold or receive private notes;
                  discovery is wallet-owned; proof freshness and receipt
                  confirmation are separate steps; and a wallet action is never
                  replaced with a public-transfer fallback. The reference
                  implementation also keeps a proving block behind the latest
                  head so earlier state changes are included before proof.
                </p>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {protocolReferences.map(reference => (
                  <a
                    key={reference.href}
                    href={reference.href}
                    target="_blank"
                    rel="noreferrer"
                    className="group border border-white/10 bg-[#151D21] p-5 transition-[border-color,background-color] duration-200 [transition-timing-function:cubic-bezier(0.23,1,0.32,1)] hover:border-[#F0563A]/55 hover:bg-[#1B2930] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6DE3A1]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-[#F0563A]">
                        {reference.label}
                      </span>
                      <ArrowUpRight
                        size={14}
                        className="text-[#6DE3A1] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                      />
                    </div>
                    <h3 className="mt-7 font-sans text-xl tracking-[-0.04em] text-[#F2EEE7]">
                      {reference.title}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-[#918C83]">
                      {reference.copy}
                    </p>
                  </a>
                ))}
              </div>
            </div>
          </section>

          <section
            id="demo"
            className="scroll-mt-24 border-t border-white/10 pt-20 mt-24"
          >
            <SectionLabel>08 / Demo Mode</SectionLabel>
            <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
              <div>
                <h2 className="font-sans text-4xl font-semibold tracking-[-0.06em] sm:text-6xl">
                  Touch every
                  <br />
                  <span className="text-[#F0563A]">privacy surface.</span>
                </h2>
                <p className="mt-5 leading-7 text-[#AAA49A]">
                  The guided tour uses deterministic local state to demonstrate
                  payroll, operations, treasury, claims, Launchpad, and proof.
                  Each action has visible success, failure, retry, and reset
                  behavior so the product story can be understood without a
                  wallet.
                </p>
              </div>
              <div className="border border-white/10 bg-[#151D21] p-6">
                <div className="flex items-center justify-between">
                  <div className="font-mono text-[10px] uppercase tracking-[0.17em] text-[#AEB8BE]">
                    Simulation checklist
                  </div>
                  <span className="font-mono text-[10px] text-[#6DE3A1]">
                    LOCAL / REVERSIBLE
                  </span>
                </div>
                <div className="mt-6 space-y-3">
                  {[
                    "Build a private payroll route",
                    "Run treasury policy and governance",
                    "Redeem a private claim",
                    "Advance a Launchpad milestone",
                    "Publish an aggregate proof",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="flex items-center gap-3 border-b border-white/10 pb-3 text-sm text-[#D5CEC4]"
                    >
                      <div className="grid h-6 w-6 place-items-center rounded-full border border-[#6DE3A1]/50 text-[#6DE3A1]">
                        <Check size={13} />
                      </div>
                      <span>{item}</span>
                      <span className="ml-auto font-mono text-[9px] text-[#6E6A63]">
                        0{index + 1}
                      </span>
                    </div>
                  ))}
                </div>
                <Link
                  href="/demo"
                  className="mt-7 inline-flex w-full items-center justify-center gap-2 bg-[#F0563A] px-4 py-3 font-mono text-[10px] uppercase tracking-[0.14em] text-[#111210] hover:bg-[#ff6b4e]"
                >
                  Open the full guided tour <PlayCircle size={15} />
                </Link>
              </div>
            </div>
          </section>

          <footer className="mt-24 border-t border-white/10 pt-8">
            <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
              <div>
                <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-[#F0563A]">
                  Veyra / Documentation
                </div>
                <p className="mt-2 text-sm text-[#77736C]">
                  Private payment infrastructure for teams that need proof
                  without exposure.
                </p>
              </div>
              <div className="flex gap-3">
                <WorkspaceReturnButton className="border border-white/15 px-4 py-3 text-[#D5CEC4] hover:bg-white/5 hover:text-white" />
                <Link
                  href="/launchpad"
                  className="border border-white/15 px-4 py-3 font-mono text-[10px] uppercase tracking-[0.12em] text-[#D5CEC4]"
                >
                  Launchpad
                </Link>
              </div>
            </div>
          </footer>
        </div>
      </main>
    </div>
  );
}
