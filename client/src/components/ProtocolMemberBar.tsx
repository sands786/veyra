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
    <nav aria-label="Protocol members" className="flex w-full min-w-0 items-stretch gap-1 overflow-x-auto rounded-[14px] border border-white/15 bg-[#111210]/90 p-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
      <span className="hidden shrink-0 items-center border-r border-white/10 px-4 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#7F8F97] lg:inline-flex">PROTOCOL</span>
      {members.map((member) => {
        const active = location === member.path;
        return (
          <Link
            key={member.path}
            href={member.path}
            className={`group inline-flex min-h-14 min-w-[148px] flex-1 items-center justify-center rounded-[11px] border px-5 font-mono text-[10px] font-semibold tracking-[0.09em] transition-[background-color,border-color,color,transform] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0563A]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111210] sm:min-w-0 sm:px-4 ${active ? "border-[#F0563A]/70 bg-[#F0563A] text-[#111210] shadow-[0_8px_20px_rgba(240,86,58,0.18)]" : "border-transparent text-[#CFC7BC] hover:-translate-y-0.5 hover:border-white/15 hover:bg-white/[0.07] hover:text-[#F3EEE5]"}`}
            aria-current={active ? "page" : undefined}
          >
            {member.label.toUpperCase()}
          </Link>
        );
      })}
    </nav>
  );
}
