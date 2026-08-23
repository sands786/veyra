import { ShieldAlert } from "lucide-react";
import { VeyraBrand } from "@/components/VeyraBrand";
import { WorkspaceReturnButton } from "@/components/WorkspaceReturnButton";

type UnavailableBoundaryProps = {
  eyebrow: string;
  title: string;
  description: string;
  evidence: string;
};

export function UnavailableBoundary({ eyebrow, title, description, evidence }: UnavailableBoundaryProps) {
  return (
    <main className="relative grid min-h-screen place-items-center overflow-hidden bg-[#111210] px-5 py-10 text-[#F3EEE5] sm:px-8">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_0%,rgba(240,86,58,0.13),transparent_42%),radial-gradient(ellipse_at_18%_100%,rgba(22,59,74,0.38),transparent_45%)]" />
      <section data-testid="veyra-unavailable-boundary" className="relative w-full max-w-xl border border-white/10 bg-[#151D21]/95 p-6 shadow-[0_28px_100px_rgba(0,0,0,0.4)] sm:p-9">
        <div className="flex items-start justify-between gap-5 border-b border-white/10 pb-6">
          <div>
            <VeyraBrand compact />
            <div className="mt-4 font-mono text-[9px] tracking-[0.2em] text-[#AEB8BE]">{eyebrow}</div>
          </div>
          <div className="grid size-10 place-items-center border border-[#F0563A]/35 bg-[#201815] text-[#F0563A]">
            <ShieldAlert size={19} aria-hidden="true" />
          </div>
        </div>
        <div className="mt-9 border-l-2 border-[#F0563A] pl-5">
          <h1 className="font-display text-4xl font-bold leading-[0.95] tracking-[-0.05em] sm:text-5xl">{title}</h1>
          <p className="mt-5 max-w-md text-sm leading-6 text-[#CFC7BC]">{description}</p>
        </div>
        <div className="mt-8 border-y border-white/10 py-4 font-mono text-[9px] leading-5 tracking-[0.08em] text-[#AEB8BE]">
          {evidence}
        </div>
        <WorkspaceReturnButton className="mt-8 border border-[#F0563A]/45 text-[#F3EEE5] hover:border-[#F0563A] hover:bg-[#201815]" />
      </section>
    </main>
  );
}
