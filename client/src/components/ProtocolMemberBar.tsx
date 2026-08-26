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
    <nav aria-label="Protocol members" className="protocol-member-scroll flex w-full min-w-0 snap-x snap-mandatory items-stretch gap-1 overflow-x-auto rounded-[16px] border border-white/15 bg-[#111210]/90 p-1.5 shadow-[0_14px_40px_rgba(0,0,0,0.22)] backdrop-blur-sm">
      <span className="hidden shrink-0 items-center border-r border-white/10 px-4 font-mono text-[10px] font-semibold tracking-[0.18em] text-[#7F8F97] lg:inline-flex">PROTOCOL</span>
      {members.map((member) => {
        const active = location === member.path;
        return (
          <Link
            key={member.path}
            href={member.path}
            className={`group relative inline-flex min-h-16 min-w-[176px] flex-1 snap-start items-center justify-center rounded-[12px] border px-5 font-mono text-[11px] font-semibold tracking-[0.09em] transition-[background-color,border-color,color,transform,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F0563A]/80 focus-visible:ring-offset-2 focus-visible:ring-offset-[#111210] hover:-translate-y-0.5 hover:border-[#F0563A]/45 hover:bg-[#F0563A]/[0.08] hover:text-[#F3EEE5] hover:shadow-[0_0_24px_rgba(240,86,58,0.14)] sm:min-w-0 sm:px-4 sm:text-[12px] ${active ? "border-[#F0563A]/75 bg-[#F0563A] text-[#111210] shadow-[0_0_26px_rgba(240,86,58,0.28)]" : "border-transparent text-[#CFC7BC]"}`}
            aria-current={active ? "page" : undefined}
          >
            <span>{member.label.toUpperCase()}</span>{active && <span aria-hidden="true" className="absolute inset-x-5 bottom-1 h-0.5 rounded-full bg-[#111210]/70" />}
          </Link>
        );
      })}
    </nav>
  );
}
