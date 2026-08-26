import { Link, useLocation } from "wouter";

const members = [
  { label: "Launchpad", path: "/launchpad" },
  { label: "Private Primitives", path: "/private-primitives" },
  { label: "Private Markets", path: "/private-markets" },
  { label: "Veyra Agent", path: "/agent" },
] as const;

export function ProtocolMemberBar() {
  const [location] = useLocation();

  return (
    <nav aria-label="Protocol members" className="flex min-w-0 items-center gap-1 overflow-x-auto border border-white/10 bg-[#151D21]/80 p-1 backdrop-blur-sm">
      <span className="hidden shrink-0 px-3 font-mono text-[9px] font-semibold tracking-[0.16em] text-[#7F8F97] lg:inline">PROTOCOL</span>
      {members.map((member) => {
        const active = location === member.path;
        return (
          <Link
            key={member.path}
            href={member.path}
            className={`inline-flex min-h-10 shrink-0 items-center justify-center rounded-[9px] px-3 font-mono text-[9px] font-semibold tracking-[0.08em] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0563A]/70 sm:px-4 ${active ? "bg-[#F0563A] text-[#111210]" : "text-[#CFC7BC] hover:bg-white/10 hover:text-[#F3EEE5]"}`}
            aria-current={active ? "page" : undefined}
          >
            {member.label.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
