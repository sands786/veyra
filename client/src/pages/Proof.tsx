import { CheckCircle2, LockKeyhole, ShieldAlert } from "lucide-react";
import { useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { useDemoMode } from "@/contexts/DemoModeContext";

export default function Proof() {
  const { isDemoMode } = useDemoMode();
  const params = useParams<{ slug: string }>();
  const proofQuery = trpc.proofs.public.useQuery({ slug: params.slug ?? "" });

  if (proofQuery.isLoading) {
    return <main className="grid min-h-screen place-items-center bg-[#111210] px-6 text-[#F3EEE5]"><div className="font-mono text-[10px] tracking-[0.16em] text-[#918B81]">VERIFYING PUBLIC PROOF…</div></main>;
  }

  if (proofQuery.error || !proofQuery.data) {
    return <main className="grid min-h-screen place-items-center bg-[#111210] px-6 text-[#F3EEE5]"><div className="max-w-md rounded-[18px] border border-[#F0563A]/30 bg-[#171815] p-8 text-center"><ShieldAlert className="mx-auto text-[#F0563A]" size={28} /><h1 className="mt-5 font-display text-3xl">Proof unavailable.</h1><p className="mt-3 text-sm leading-6 text-[#918B81]">This proof was revoked, does not exist, or is no longer publicly available.</p></div></main>;
  }

  const proof = proofQuery.data;
  return <main className="min-h-screen bg-[#111210] px-5 py-10 text-[#F3EEE5] sm:px-8 sm:py-16"><div className="mx-auto max-w-3xl"><div className="flex items-center justify-between border-b border-white/10 pb-6"><div><div className="font-display text-2xl">Veyra</div><div className="mt-1 font-mono text-[9px] tracking-[0.2em] text-[#918B81]">PUBLIC STRK20 PROOF {isDemoMode ? "/ DEMO BOUNDARY" : ""}</div></div><LockKeyhole className="text-[#F0563A]" size={22} /></div><section className="mt-16 rounded-[20px] border border-white/10 bg-[#171815] p-7 sm:p-10"><div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.16em] text-[#70D49D]"><CheckCircle2 size={16} /> PUBLIC METADATA VERIFIED</div><h1 className="mt-6 font-display text-4xl leading-[0.95] sm:text-6xl">{proof.name}</h1><p className="mt-5 max-w-xl text-sm leading-6 text-[#918B81]">This page proves the route state and public commitment reference. Private recipients, wallet roster data, and notes are intentionally omitted.</p><div className="mt-10 grid gap-3 sm:grid-cols-3"><div className="rounded-[12px] bg-[#20211E] p-4"><div className="font-mono text-[9px] text-[#918B81]">STATUS</div><div className="mt-2 font-mono text-sm text-[#70D49D]">{proof.status.toUpperCase()}</div></div><div className="rounded-[12px] bg-[#20211E] p-4"><div className="font-mono text-[9px] text-[#918B81]">TOKEN</div><div className="mt-2 font-mono text-sm text-[#F3EEE5]">{proof.token}</div></div><div className="rounded-[12px] bg-[#20211E] p-4"><div className="font-mono text-[9px] text-[#918B81]">AMOUNT</div><div className="mt-2 font-mono text-sm text-[#F3EEE5]">{proof.totalAmount}</div></div></div><div className="mt-8 border-t border-white/10 pt-5"><div className="font-mono text-[9px] tracking-[0.12em] text-[#918B81]">COMMITMENT REFERENCE</div><div className="mt-2 break-all font-mono text-xs text-[#F0563A]">{proof.proofReference ?? "PENDING / ROUTE COMMITMENT NOT YET PUBLISHED"}</div></div></section><div className="mt-6 font-mono text-[9px] tracking-[0.1em] text-[#766F66]">VERIFIED BY VEYRA / PRIVACY BY DEFAULT</div></div></main>;
}
