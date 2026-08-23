import { ArrowUpRight } from "lucide-react";
import { useLocation } from "wouter";

export function WorkspaceReturnButton({
  className = "",
  onBeforeNavigate,
}: {
  className?: string;
  onBeforeNavigate?: () => void;
}) {
  const [, setLocation] = useLocation();

  return (
    <button
      type="button"
      aria-label="Back to workspace"
      onClick={() => {
        onBeforeNavigate?.();
        setLocation("/");
      }}
      className={`group inline-flex items-center gap-2 rounded-full px-3 py-2 font-mono text-[10px] tracking-[0.14em] text-[#F0563A] transition-colors hover:bg-[#F0563A]/10 hover:text-[#FF7257] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0563A]/70 ${className}`}
    >
      BACK TO WORKSPACE
      <ArrowUpRight
        size={14}
        aria-hidden="true"
        className="transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
      />
    </button>
  );
}
