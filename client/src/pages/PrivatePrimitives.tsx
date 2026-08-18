import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { ArrowUpRight, Check, Copy, EyeOff, Fingerprint, Link2, LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { toast } from "sonner";
import { milestoneSteps, privateClaimDemoPath, type PrivatePrimitiveId } from "@shared/privatePrimitives";

const primitives = [
  { id: "links", label: "PRIVATE LINKS", kicker: "WHISPER PAY PATTERN", icon: Link2, title: "Request payment without exposing the roster.", description: "Create a recipient-scoped link, share it through any channel, and keep the underlying route private.", points: ["Single-recipient scope", "Expiry-aware claim state", "No public recipient directory"] },
  { id: "proofs", label: "SELECTIVE PROOF", kicker: "PRIVACY WALLET PATTERN", icon: EyeOff, title: "Prove settlement without revealing the payroll.", description: "Share an aggregate proof surface for auditors, partners, or a hackathon judge while keeping names and amounts private.", points: ["Aggregate status only", "Operator-controlled disclosure", "Testnet/mainnet evidence boundary"] },
  { id: "milestones", label: "MILESTONE RELEASES", kicker: "MORROW PATTERN", icon: LockKeyhole, title: "Move capital when evidence is ready.", description: "Prepare, fund, evidence, and resolve each milestone as a governed release lane for private launchpad treasuries.", points: ["Evidence before release", "Multi-approver readiness", "Private allocation registry"] },
] as const;

export default function PrivatePrimitives() {
  const [activeId, setActiveId] = useState<PrivatePrimitiveId>("links");
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [proofSlug, setProofSlug] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();
  const overviewQuery = trpc.workspace.overview.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const recipientsQuery = trpc.recipients.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const projectsQuery = trpc.launchpad.list.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const activeRoute = overviewQuery.data?.routes?.[0];
  const activeRecipient = recipientsQuery.data?.find((recipient) => recipient.status === "active");
  const activeProject = projectsQuery.data?.[0];
  const activeMilestone = activeProject?.milestones?.[0];
  const createClaimMutation = trpc.claims.create.useMutation({ onSuccess: (result) => { setLinkToken(result.token); toast("Real claim link persisted."); }, onError: (error) => toast("Claim link could not be created.", { description: error.message }) });
  const createProofMutation = trpc.proofs.create.useMutation({ onSuccess: (result) => { setProofSlug(result.slug); toast("Public proof created from the persisted route."); }, onError: (error) => toast("Proof could not be created.", { description: error.message }) });
  const updateMilestoneMutation = trpc.launchpad.updateMilestoneStatus.useMutation({ onSuccess: () => { void projectsQuery.refetch(); toast("Milestone state persisted."); }, onError: (error) => toast("Milestone update failed.", { description: error.message }) });
  const active = useMemo(() => primitives.find((item) => item.id === activeId) ?? primitives[0], [activeId]);
  const ActiveIcon = active.icon;

  async function copyLink() {
    const url = linkToken ? `${window.location.origin}/claim/${linkToken}` : `${window.location.origin}${privateClaimDemoPath}`;
    const copied = await copyText(url);
    toast(copied ? "Private request link copied." : "Copy failed.", copied ? undefined : { description: "Select the link manually if clipboard access is blocked." });
  }

  return (
    <div className="min-h-screen bg-[#111210] text-[#F3EEE5]">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-8 lg:px-12">
        <button onClick={() => { window.location.href = "/"; }} className="font-display text-lg font-bold tracking-[-0.04em]">VeilPay</button>
        <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.12em] text-[#918B81]"><span>PRIVATE PRIMITIVES</span><button onClick={() => { window.location.href = "/"; }} className="text-[#F0563A]">BACK TO WORKSPACE</button></div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="max-w-3xl"><div className="eyebrow">STRK20 / PRIVATE SPRINT / PRODUCT LAB</div><h1 className="section-title">Three private primitives.<br /><span>One operating layer.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-[#B7B0A6]">Inspired by the strongest patterns in StarkWare’s Private Sprint: private payment requests, selective disclosure, and evidence-gated milestone releases.</p></div>
        <div className="mt-12 grid gap-5 lg:grid-cols-[280px_1fr]">
          <nav className="space-y-2" aria-label="Private primitives">
            {primitives.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setActiveId(item.id)} className={`w-full border p-4 text-left transition-colors ${activeId === item.id ? "border-[#F0563A] bg-[#201815]" : "border-white/10 bg-[#171815] hover:border-white/25"}`}><div className="flex items-center gap-3"><Icon size={16} className={activeId === item.id ? "text-[#F0563A]" : "text-[#918B81]"} /><span className="font-mono text-[10px] tracking-[0.12em]">{item.label}</span></div><div className="mt-3 text-[11px] leading-5 text-[#918B81]">{item.kicker}</div></button>; })}
          </nav>
          <section className="border border-white/10 bg-[#171815] p-6 sm:p-8" aria-live="polite"><div className="flex items-start justify-between gap-5"><div><div className="flex items-center gap-2 text-[#F0563A]"><ActiveIcon size={17} /><span className="eyebrow">{active.kicker}</span></div><h2 className="mt-5 max-w-2xl font-display text-3xl font-bold tracking-[-0.05em] sm:text-5xl">{active.title}</h2><p className="mt-5 max-w-2xl text-sm leading-6 text-[#B7B0A6]">{active.description}</p></div><Sparkles size={24} className="hidden text-[#F0563A] sm:block" /></div><div className="mt-8 grid gap-3 sm:grid-cols-3">{active.points.map((point) => <div key={point} className="border-t border-white/15 pt-3 font-mono text-[10px] leading-5 text-[#D8D0C5]">{point}</div>)}</div>
            {activeId === "links" && <div className="mt-10 border border-white/10 bg-[#20211E] p-5"><div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-[#918B81]"><Link2 size={14} /> PRIVATE PAYMENT REQUEST</div><div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-display text-lg">{activeRoute ? `${activeRoute.name} · ${activeRoute.totalAmount} ${activeRoute.token}` : "No persisted route selected"}</div><div className="mt-1 font-mono text-[9px] text-[#918B81]">EXPIRES IN 7 DAYS · RECIPIENT SCOPED</div></div><Button disabled={createClaimMutation.isPending || !isAuthenticated || !activeRoute || !activeRecipient} onClick={() => { if (!isAuthenticated) { startLogin(); return; } if (!activeRoute || !activeRecipient) return; createClaimMutation.mutate({ routeId: activeRoute.id, recipientId: activeRecipient.id, expiresAt: new Date(Date.now() + 7 * 86400000) }); }} className="h-9 rounded-[9px] bg-[#F0563A] font-mono text-[9px] text-[#111210]">{createClaimMutation.isPending ? "PERSISTING…" : linkToken ? "LINK READY" : !isAuthenticated ? "SIGN IN TO CREATE" : !activeRoute || !activeRecipient ? "ADD ROUTE + RECIPIENT" : "CREATE PRIVATE LINK"}</Button></div>{linkToken && <button onClick={() => void copyLink()} className="mt-4 flex w-full items-center gap-2 truncate border-t border-white/10 pt-3 text-left font-mono text-[10px] text-[#70D49D]"><Copy size={13} /> {window.location.origin}/claim/{linkToken}</button>}</div>}
            {activeId === "proofs" && <div className="mt-10 border border-white/10 bg-[#20211E] p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-[#918B81]"><Fingerprint size={14} /> SELECTIVE DISCLOSURE PREVIEW</div><span className="font-mono text-[9px] text-[#70D49D]">PRIVATE BY DEFAULT</span></div><div className="mt-5 grid gap-4 sm:grid-cols-3"><div><div className="font-mono text-[9px] text-[#918B81]">RECIPIENTS</div><div className="mt-1 font-display text-2xl">{activeRoute ? (recipientsQuery.data?.length ?? 0) : "—"}</div></div><div><div className="font-mono text-[9px] text-[#918B81]">ROSTER</div><div className="mt-1 font-display text-2xl text-[#70D49D]">HIDDEN</div></div><div><div className="font-mono text-[9px] text-[#918B81]">STATUS</div><div className="mt-1 font-display text-2xl">{activeRoute?.status?.toUpperCase() ?? "—"}</div></div></div><Button disabled={createProofMutation.isPending || !isAuthenticated || !activeRoute} onClick={() => { if (!isAuthenticated) { startLogin(); return; } if (!activeRoute) return; createProofMutation.mutate({ routeId: activeRoute.id }); }} className="mt-6 h-9 rounded-[9px] border border-white/15 bg-transparent font-mono text-[9px] text-[#F3EEE5]">{createProofMutation.isPending ? "PUBLISHING…" : proofSlug ? "PROOF SUMMARY READY" : !isAuthenticated ? "SIGN IN TO PUBLISH" : !activeRoute ? "CREATE A ROUTE FIRST" : "GENERATE PROOF SUMMARY"}</Button>{proofSlug && <a href={`/proof/${proofSlug}`} className="mt-4 block border-t border-white/10 pt-3 font-mono text-[9px] leading-5 text-[#70D49D]">OPEN PUBLIC PROOF / {proofSlug}</a>}</div>}
            {activeId === "milestones" && <div className="mt-10 border border-white/10 bg-[#20211E] p-5"><div className="flex items-center justify-between"><div className="font-mono text-[10px] tracking-[0.1em] text-[#918B81]">MILESTONE RELEASE LANE</div><span className="font-mono text-[9px] text-[#F0563A]">EVIDENCE FIRST</span></div><div className="mt-5 grid gap-2 sm:grid-cols-4">{milestoneSteps.map((step, index) => <div key={step} className={`border-t-2 pt-3 font-mono text-[9px] ${(activeMilestone && index <= (activeMilestone.status === "released" ? 3 : activeMilestone.status === "ready" ? 2 : 1)) ? "border-[#70D49D] text-[#F3EEE5]" : "border-white/15 text-[#918B81]"}`}><div>{String(index + 1).padStart(2, "0")}</div><div className="mt-1">{step}</div></div>)}</div><Button disabled={updateMilestoneMutation.isPending || !isAuthenticated || !activeMilestone} onClick={() => { if (!isAuthenticated) { startLogin(); return; } if (!activeMilestone) return; updateMilestoneMutation.mutate({ milestoneId: activeMilestone.id, status: activeMilestone.status === "planned" ? "ready" : "released", proofReference: activeMilestone.status === "ready" ? `milestone-${activeMilestone.id}-proof` : undefined }); }} className="mt-7 h-9 rounded-[9px] bg-[#F3EEE5] font-mono text-[9px] text-[#111210]">{updateMilestoneMutation.isPending ? "PERSISTING…" : activeMilestone?.status === "released" ? "RELEASE PERSISTED" : !isAuthenticated ? "SIGN IN TO UPDATE" : !activeMilestone ? "CREATE A MILESTONE FIRST" : activeMilestone.status === "planned" ? "MARK EVIDENCE READY" : "RELEASE MILESTONE"}</Button></div>}
          </section>
        </div>
        <div className="mt-10 flex items-center gap-2 font-mono text-[9px] tracking-[0.1em] text-[#918B81]"><Check size={13} className="text-[#70D49D]" /> CLAIMS, PROOFS, AND MILESTONE STATES USE REAL AUTHENTICATED BACKEND PROCEDURES. LIVE STRK20 SETTLEMENT STILL REQUIRES WALLET APPROVAL.</div>
      </main>
    </div>
  );
}
