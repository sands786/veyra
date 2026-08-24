import { writeFileSync } from "node:fs";

const output = "/home/ubuntu/webdev-static-assets/veyra-demo-v2/captions_compact.ass";
const cues = [
  [12.4, 17.8, "Mainnet-only financial coordination for STRK20."],
  [18.2, 24.8, "The operating record stays private. The wallet signs."],
  [26.0, 32.2, "PRIVATE PAYROLL · governed route intent"],
  [32.6, 39.8, "Saving a route is not a transfer."],
  [40.2, 48.4, "Policy checks come before wallet review."],
  [50.0, 56.4, "PRIVATE PRIMITIVES · controlled states"],
  [56.8, 64.5, "Claims, hand-offs, and proof — not vague links."],
  [65.0, 72.8, "No custody. No generic invoke. No public-transfer fallback."],
  [74.0, 80.4, "PRIVATE MARKETS · aggregate signal, private actor"],
  [80.8, 89.4, "Coordinate sealed bids without publishing every term."],
  [90.0, 98.2, "Risk limits, lifecycle, and capacity stay operational."],
  [100.0, 106.0, "PRIVATE LAUNCHPAD · governed capital coordination"],
  [106.5, 115.4, "Allocations, milestones, and release readiness in one room."],
  [116.0, 124.6, "A wallet action and receipt are still required."],
  [126.0, 133.6, "Veyra coordinates. The wallet owns the STRK20 action."],
  [134.0, 142.2, "Policy, idempotency, audit state, and receipt verification."],
  [143.0, 151.2, "Three verified Mainnet privacy-pool receipts — public evidence only."],
];

function time(seconds) {
  const centiseconds = Math.round(seconds * 100);
  const h = Math.floor(centiseconds / 360000);
  const m = Math.floor((centiseconds % 360000) / 6000);
  const s = Math.floor((centiseconds % 6000) / 100);
  const cs = centiseconds % 100;
  return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}.${String(cs).padStart(2, "0")}`;
}

const header = `[Script Info]
Title: Veyra compact accessibility captions
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Caption,DejaVu Sans,30,&H00F3EEE5,&H00F0563A,&H00111210,&H96111210,1,0,0,0,100,100,0,0,3,2,0,2,310,310,40,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
`;

const body = cues.map(([start, end, text]) =>
  `Dialogue: 0,${time(start)},${time(end)},Caption,,0,0,0,,{\\fad(140,120)}${text.replaceAll("\n", "\\N")}`
).join("\n");

writeFileSync(output, `${header}${body}\n`);
console.log(output);
