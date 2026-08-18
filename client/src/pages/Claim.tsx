import { useState } from "react";
import { CheckCircle2, LockKeyhole, ShieldAlert } from "lucide-react";
import { useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { trpc } from "@/lib/trpc";
import { isValidStarknetAddress } from "@shared/operations";
import { toast } from "sonner";
import { useDemoMode } from "@/contexts/DemoModeContext";

export default function Claim() {
  const { isDemoMode } = useDemoMode();
  const params = useParams<{ token: string }>();
  const [walletAddress, setWalletAddress] = useState("");
  const claimQuery = trpc.claims.public.useQuery({ token: params.token ?? "" });
  const redeemMutation = trpc.claims.redeem.useMutation({ onSuccess: () => toast("Claim recorded.", { description: "The sender can now complete the wallet-authorized private transfer." }), onError: (error) => toast("Claim could not be recorded.", { description: error.message }) });

  if (claimQuery.isLoading) return <main className="grid min-h-screen place-items-center bg-[#111210] text-[#F3EEE5]"><div className="font-mono text-[10px] tracking-[0.16em] text-[#AEB8BE]">VERIFYING PRIVATE INVITATION…</div></main>;
  if (claimQuery.error || !claimQuery.data) return <main className="grid min-h-screen place-items-center bg-[#111210] px-6 text-[#F3EEE5]"><div className="max-w-md rounded-[18px] border border-[#F0563A]/30 bg-[#151D21] p-8 text-center"><ShieldAlert className="mx-auto text-[#F0563A]" size={28} /><h1 className="mt-5 font-display text-3xl">Invitation unavailable.</h1><p className="mt-3 text-sm leading-6 text-[#AEB8BE]">This private claim link is expired, already claimed, or revoked.</p></div></main>;
  const claim = claimQuery.data;
  return <main className="min-h-screen bg-[#111210] px-5 py-10 text-[#F3EEE5] sm:px-8 sm:py-16"><div className="mx-auto max-w-xl"><div className="flex items-center justify-between border-b border-white/10 pb-6"><div><div className="font-display text-2xl">Veyra</div><div className="mt-1 font-mono text-[9px] tracking-[0.2em] text-[#AEB8BE]">PRIVATE RECIPIENT CLAIM {isDemoMode ? "/ DEMO BOUNDARY" : ""}</div></div><LockKeyhole className="text-[#F0563A]" size={22} /></div><section className="mt-16 rounded-[20px] border border-white/10 bg-[#151D21] p-7 sm:p-10"><div className="flex items-center gap-3 font-mono text-[10px] tracking-[0.16em] text-[#70D49D]"><CheckCircle2 size={16} /> INVITATION VERIFIED</div><h1 className="mt-6 font-display text-4xl leading-[0.95]">A private payment<br />is waiting.</h1><p className="mt-5 text-sm leading-6 text-[#AEB8BE]">This link reveals only the route metadata needed to claim. It does not expose the sender’s roster or other recipients.</p><div className="mt-9 grid gap-3 sm:grid-cols-2"><div className="rounded-[12px] bg-[#163B4A] p-4"><div className="font-mono text-[9px] text-[#AEB8BE]">ROUTE</div><div className="mt-2 text-sm text-[#F3EEE5]">{claim.routeName}</div></div><div className="rounded-[12px] bg-[#163B4A] p-4"><div className="font-mono text-[9px] text-[#AEB8BE]">AMOUNT</div><div className="mt-2 font-mono text-sm text-[#F3EEE5]">{claim.amount} {claim.asset}</div></div></div><div className="mt-8"><label className="font-mono text-[9px] tracking-[0.12em] text-[#AEB8BE]">YOUR STARKNET WALLET ADDRESS</label><Input value={walletAddress} onChange={(event) => setWalletAddress(event.target.value)} placeholder="0x…" className="field-input mt-2 h-12" /><Button disabled={redeemMutation.isPending || !isValidStarknetAddress(walletAddress)} onClick={() => redeemMutation.mutate({ token: claim.token, walletAddress: walletAddress.trim() })} className="mt-4 h-12 w-full rounded-[10px] bg-[#F0563A] font-mono text-[10px] tracking-[0.12em] text-[#111210] hover:bg-[#FF7257]">{redeemMutation.isPending ? "RECORDING…" : "CLAIM PRIVATE PAYMENT"}</Button></div></section><div className="mt-6 font-mono text-[9px] tracking-[0.1em] text-[#7F8F97]">EXPIRES {new Date(claim.expiresAt).toLocaleString()} / WALLET AUTHORIZATION REQUIRED</div></div></main>;
}
