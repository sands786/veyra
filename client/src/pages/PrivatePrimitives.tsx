import { useMemo, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { ArrowUpRight, Check, Copy, EyeOff, Fingerprint, Link2, LockKeyhole, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { copyText } from "@/lib/clipboard";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { VeyraBrand } from "@/components/VeyraBrand";
import { milestoneSteps, privateClaimDemoPath, privateSettlementState, type PrivatePrimitiveId } from "@shared/privatePrimitives";
import { privateDisclosureFields, type PrivateDisclosureScope } from "@shared/operations";

const primitives = [
  { id: "links", label: "PRIVATE LINKS", kicker: "WHISPER PAY PATTERN", icon: Link2, title: "Request payment without exposing the roster.", description: "Create a recipient-scoped link, share it through any channel, and keep the underlying route private.", points: ["Single-recipient scope", "Expiry-aware claim state", "No public recipient directory"] },
  { id: "proofs", label: "SELECTIVE PROOF", kicker: "PRIVACY WALLET PATTERN", icon: EyeOff, title: "Prove settlement without revealing the payroll.", description: "Share an aggregate proof surface for auditors, partners, or a hackathon judge while keeping names and amounts private.", points: ["Aggregate status only", "Operator-controlled disclosure", "Mainnet receipt evidence"] },
  { id: "milestones", label: "MILESTONE RELEASES", kicker: "MORROW PATTERN", icon: LockKeyhole, title: "Move capital when evidence is ready.", description: "Prepare, fund, evidence, and resolve each milestone as a governed release lane for private launchpad treasuries.", points: ["Evidence before release", "Multi-approver readiness", "Private allocation registry"] },
] as const;

export default function PrivatePrimitives() {
  const [, setLocation] = useLocation();
  const [activeId, setActiveId] = useState<PrivatePrimitiveId>("links");
  const [disclosureScope, setDisclosureScope] = useState<PrivateDisclosureScope>("aggregate");
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
  const receiptConfirmed = privateSettlementState(activeRoute?.status) === "confirmed";
  const createClaimMutation = trpc.claims.create.useMutation({ onSuccess: (result) => { setLinkToken(result.token); toast("Unsigned claim request link persisted.", { description: "No wallet signature or Starknet settlement occurred." }); }, onError: (error) => toast("Claim link could not be created.", { description: error.message }) });
  const createProofMutation = trpc.proofs.create.useMutation({ onSuccess: (result) => { setProofSlug(result.slug); toast("Receipt-backed proof link created.", { description: "The route was already marked settled after receipt verification." }); }, onError: (error) => toast("Proof could not be created.", { description: error.message }) });
  const updateMilestoneMutation = trpc.launchpad.updateMilestoneStatus.useMutation({ onSuccess: () => { void projectsQuery.refetch(); toast("Milestone state persisted."); }, onError: (error) => toast("Milestone update failed.", { description: error.message }) });
  const active = useMemo(() => primitives.find((item) => item.id === activeId) ?? primitives[0], [activeId]);
  const ActiveIcon = active.icon;
  const disclosureFields = privateDisclosureFields(disclosureScope);

  async function copyLink() {
    const url = linkToken ? `${window.location.origin}/claim/${linkToken}` : `${window.location.origin}${privateClaimDemoPath}`;
    const copied = await copyText(url);
    toast(copied ? "Unsigned claim request link copied." : "Copy failed.", copied ? undefined : { description: "Select the link manually if clipboard access is blocked." });
  }

  return (
    <div className="min-h-screen bg-[#111210] text-[#F3EEE5]">
      <header className="flex items-center justify-between border-b border-white/10 px-5 py-5 sm:px-8 lg:px-12">
        <button onClick={() => setLocation("/")} aria-label="Return to Veyra workspace"><VeyraBrand compact /></button>
        <div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.12em] text-[#AEB8BE]"><span>PRIVATE PRIMITIVES</span><button onClick={() => setLocation("/")} className="text-[#F0563A]">BACK TO WORKSPACE</button></div>
      </header>
      <main className="mx-auto max-w-7xl px-5 py-12 sm:px-8 lg:px-12 lg:py-16">
        <div className="max-w-3xl"><div className="eyebrow">STRK20 / PRIVATE SPRINT / PRODUCT LAB</div><h1 className="section-title">Three private primitives.<br /><span>One operating layer.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-[#B7B0A6]">Inspired by the strongest patterns in StarkWare’s Private Sprint: private payment requests, selective disclosure, and evidence-gated milestone releases.</p></div>
        <div className="mt-12 grid gap-5 lg:grid-cols-[280px_1fr]">
          <nav className="space-y-2" aria-label="Private primitives">
            {primitives.map((item) => { const Icon = item.icon; return <button key={item.id} onClick={() => setActiveId(item.id)} className={`w-full border p-4 text-left transition-colors ${activeId === item.id ? "border-[#F0563A] bg-[#201815]" : "border-white/10 bg-[#151D21] hover:border-white/25"}`}><div className="flex items-center gap-3"><Icon size={16} className={activeId === item.id ? "text-[#F0563A]" : "text-[#AEB8BE]"} /><span className="font-mono text-[10px] tracking-[0.12em]">{item.label}</span></div><div className="mt-3 text-[11px] leading-5 text-[#AEB8BE]">{item.kicker}</div></button>; })}
          </nav>
          <section className="border border-white/10 bg-[#151D21] p-6 sm:p-8" aria-live="polite"><div className="flex items-start justify-between gap-5"><div><div className="flex items-center gap-2 text-[#F0563A]"><ActiveIcon size={17} /><span className="eyebrow">{active.kicker}</span></div><h2 className="mt-5 max-w-2xl font-display text-3xl font-bold tracking-[-0.05em] sm:text-5xl">{active.title}</h2><p className="mt-5 max-w-2xl text-sm leading-6 text-[#B7B0A6]">{active.description}</p></div><Sparkles size={24} className="hidden text-[#F0563A] sm:block" /></div><div className="mt-8 grid gap-3 sm:grid-cols-3">{active.points.map((point) => <div key={point} className="border-t border-white/15 pt-3 font-mono text-[10px] leading-5 text-[#D8D0C5]">{point}</div>)}</div>
            {activeId === "links" && <div className="mt-10 border border-white/10 bg-[#163B4A] p-5"><div className="flex items-center justify-between gap-3"><div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-[#AEB8BE]"><Link2 size={14} /> UNSIGNED CLAIM REQUEST</div><span className="font-mono text-[9px] text-[#F0563A]">NO TX SIGNED</span></div><div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><div className="font-display text-lg">{activeRoute ? `${activeRoute.name} · ${activeRoute.totalAmount} ${activeRoute.token}` : "No persisted route selected"}</div><div className="mt-1 font-mono text-[9px] text-[#AEB8BE]">REFERENCE AMOUNT ONLY · NOT FUNDED · EXPIRES IN 7 DAYS · RECIPIENT SCOPED</div></div><Button disabled={createClaimMutation.isPending || !isAuthenticated || !activeRoute || !activeRecipient} onClick={() => { if (!isAuthenticated) { startLogin(); return; } if (!activeRoute || !activeRecipient) return; createClaimMutation.mutate({ routeId: activeRoute.id, recipientId: activeRecipient.id, expiresAt: new Date(Date.now() + 7 * 86400000) }); }} className="h-9 rounded-[9px] bg-[#F0563A] font-mono text-[9px] text-[#111210]">{createClaimMutation.isPending ? "PERSISTING…" : linkToken ? "UNSIGNED LINK READY" : !isAuthenticated ? "SIGN IN TO CREATE" : !activeRoute || !activeRecipient ? "ADD ROUTE + RECIPIENT" : "CREATE PRIVATE LINK"}</Button></div>{linkToken && <button onClick={() => void copyLink()} className="mt-4 flex w-full items-center gap-2 truncate border-t border-white/10 pt-3 text-left font-mono text-[10px] text-[#70D49D]"><Copy size={13} /> {window.location.origin}/claim/{linkToken}</button>}</div>}
            {activeId === "proofs" && <div className="mt-10 border border-white/10 bg-[#163B4A] p-5"><div className="flex items-center justify-between"><div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.1em] text-[#AEB8BE]"><Fingerprint size={14} /> SELECTIVE DISCLOSURE PREVIEW</div><span className="font-mono text-[9px] text-[#70D49D]">PRIVATE BY DEFAULT</span></div><div className="mt-5 grid gap-4 sm:grid-cols-3"><div><div className="font-mono text-[9px] text-[#AEB8BE]">RECIPIENTS</div><div className="mt-1 font-display text-2xl">{activeRoute ? (recipientsQuery.data?.length ?? 0) : "—"}</div></div><div><div className="font-mono text-[9px] text-[#AEB8BE]">ROSTER</div><div className="mt-1 font-display text-2xl text-[#70D49D]">HIDDEN</div></div><div><div className="font-mono text-[9px] text-[#AEB8BE]">STATUS</div><div className="mt-1 font-display text-2xl">{activeRoute?.status?.toUpperCase() ?? "—"}</div></div></div><Button disabled={createProofMutation.isPending || !isAuthenticated || !activeRoute || !receiptConfirmed} onClick={() => { if (!isAuthenticated) { startLogin(); return; } if (!activeRoute) return; createProofMutation.mutate({ routeId: activeRoute.id }); }} className="mt-6 h-9 rounded-[9px] border border-white/15 bg-transparent font-mono text-[9px] text-[#F3EEE5]">{createProofMutation.isPending ? "PUBLISHING…" : proofSlug ? "RECEIPT-BACKED PROOF READY" : !isAuthenticated ? "SIGN IN TO PUBLISH" : !activeRoute ? "CREATE A ROUTE FIRST" : !receiptConfirmed ? "REQUIRES CONFIRMED RECEIPT" : "GENERATE PROOF SUMMARY"}</Button>{proofSlug && <a href={`/proof/${proofSlug}`} className="mt-4 block border-t border-white/10 pt-3 font-mono text-[9px] leading-5 text-[#70D49D]">OPEN RECEIPT-BACKED PROOF / {proofSlug}</a>}</div>}
            {activeId === "milestones" && <div className="mt-10 border border-white/10 bg-[#163B4A] p-5"><div className="flex items-center justify-between"><div className="font-mono text-[10px] tracking-[0.1em] text-[#AEB8BE]">MILESTONE GOVERNANCE RECORD</div><span className="font-mono text-[9px] text-[#F0563A]">OFF-CHAIN UNTIL SIGNED</span></div><div className="mt-5 grid gap-2 sm:grid-cols-4">{milestoneSteps.map((step, index) => <div key={step} className={`border-t-2 pt-3 font-mono text-[9px] ${(activeMilestone && index <= (activeMilestone.status === "released" ? 3 : activeMilestone.status === "ready" ? 2 : 1)) ? "border-[#70D49D] text-[#F3EEE5]" : "border-white/15 text-[#AEB8BE]"}`}><div>{String(index + 1).padStart(2, "0")}</div><div className="mt-1">{step}</div></div>)}</div><Button disabled={updateMilestoneMutation.isPending || !isAuthenticated || !activeMilestone} onClick={() => { if (!isAuthenticated) { startLogin(); return; } if (!activeMilestone) return; updateMilestoneMutation.mutate({ milestoneId: activeMilestone.id, status: activeMilestone.status === "planned" ? "ready" : "released", proofReference: activeMilestone.status === "ready" ? `milestone-${activeMilestone.id}-proof` : undefined }); }} className="mt-7 h-9 rounded-[9px] bg-[#F3EEE5] font-mono text-[9px] text-[#111210]">{updateMilestoneMutation.isPending ? "PERSISTING…" : activeMilestone?.status === "released" ? "RECORD PERSISTED · NO TX" : !isAuthenticated ? "SIGN IN TO UPDATE" : !activeMilestone ? "CREATE A MILESTONE FIRST" : activeMilestone.status === "planned" ? "MARK EVIDENCE READY" : "RELEASE MILESTONE"}</Button></div>}
          </section>
          <section className="mt-6 border border-[#F0563A]/20 bg-[#1B2930] p-5 sm:p-6 lg:col-span-2"><div className="flex flex-wrap items-center justify-between gap-4"><div><div className="eyebrow text-[#F0563A]">DISCLOSURE STUDIO</div><h2 className="mt-2 font-display text-2xl font-bold">Choose who gets to see what.</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-[#CFC7BC]">Preview the smallest verifiable packet for each audience. Raw roster, plaintext amounts, and encrypted terms stay private by default.</p></div><div className="font-mono text-[9px] text-[#70D49D]">{disclosureFields.length} FIELDS / {disclosureScope.toUpperCase()}</div></div><div className="mt-5 flex flex-wrap gap-2">{(["aggregate", "counterparty", "auditor"] as const).map((scope) => <button key={scope} type="button" onClick={() => setDisclosureScope(scope)} className={`rounded-full border px-3 py-2 font-mono text-[9px] tracking-[0.08em] ${disclosureScope === scope ? "border-[#F0563A] bg-[#F0563A] text-[#111210]" : "border-white/15 text-[#CFC7BC] hover:border-white/35"}`}>{scope.toUpperCase()}</button>)}</div><div className="mt-5 grid gap-3 sm:grid-cols-4">{disclosureFields.map((field) => <div key={field} className="border-t border-white/15 pt-3 font-mono text-[10px] text-[#F3EEE5]">{field.replaceAll("_", " ").toUpperCase()}</div>)}</div><div className="mt-5 border-t border-white/10 pt-4 font-mono text-[9px] leading-5 text-[#A99A8D]">PUBLICATION GATE: SETTLEMENT RECEIPT REQUIRED · NO DISCLOSURE IS PUBLISHED FROM THIS PREVIEW ALONE</div></section>
        </div>
        <div className="mt-10 flex items-center gap-2 font-mono text-[9px] tracking-[0.1em] text-[#AEB8BE]"><Check size={13} className="text-[#70D49D]" /> BACKEND RECORDS ARE REAL, BUT THESE PRIMITIVES DO NOT MOVE FUNDS BY THEMSELVES. ONLY A WALLET-SIGNED TRANSACTION WITH A CONFIRMED STARKNET RECEIPT CAN MARK A ROUTE SETTLED OR CREATE A RECEIPT-BACKED PROOF.</div>
      </main>
    </div>
  );
}
