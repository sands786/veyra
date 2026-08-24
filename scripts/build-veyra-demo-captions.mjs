import { writeFileSync } from "node:fs";

const output = "/home/ubuntu/webdev-static-assets/veyra-demo-v2/captions.ass";

const segments = [
  [0, 15, "A payroll run should not become a permanent public spreadsheet. But teams still need approvals, auditability, and proof that a route completed. Privacy cannot mean operating blind."],
  [15, 30, "Veyra is a Mainnet-only financial coordination layer for Stark twenty. It keeps the operating record private, leaves signing to the wallet, and accepts settlement only after a verified Starknet receipt."],
  [30, 55, "First, private payroll. An operator prepares a route with the recipient, asset, amount, policy, and approval context in one workspace. Saving it is not a transfer. It is a controlled intent, checked against treasury guardrails, then ready for a wallet review."],
  [55, 80, "Second, private primitives. Veyra turns a claim, a wallet hand-off, and a proof into controlled states rather than vague links. It never takes custody. It refuses a generic invoke or public-transfer fallback. A returned hash is recorded once, and a receipt, not a UI label, decides whether proof can exist."],
  [80, 107, "Third, private markets. A team can coordinate an R F Q, sealed bids, risk limits, and lifecycle decisions without publishing every counterparty or term. Operators see the state they need: the window, capacity, policy, and aggregate signal. Sensitive market data stays inside the workspace."],
  [107, 135, "Fourth, Launchpad. Veyra gives a private project room a disciplined capital workflow: allocation commitments, milestone readiness, release requests, and audit context. These are governed coordination records until a user-owned wallet action and a confirmed receipt exist. That boundary is the point."],
  [135, 160, "Under the hood, Veyra separates coordination from custody. React and Vite deliver the workspace. Express, t R P C, Drizzle, and MySQL enforce membership, policy, idempotency, and audit state. The wallet owns the Stark twenty action. Starknet receipts decide confirmation. And the repository exposes three verified Mainnet privacy-pool receipts, without pretending public data can reveal a recipient's private note."],
  [160, 176, "Veyra gives Starknet teams a better financial operating model: coordinate privately, authorize with the wallet, verify the receipt, and reveal only the proof. This is private financial coordination, built for Stark twenty."],
];

function assTime(seconds) {
  const totalCentiseconds = Math.round(seconds * 100);
  const hours = Math.floor(totalCentiseconds / 360000);
  const minutes = Math.floor((totalCentiseconds % 360000) / 6000);
  const secs = Math.floor((totalCentiseconds % 6000) / 100);
  const centiseconds = totalCentiseconds % 100;
  return `${hours}:${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}.${String(centiseconds).padStart(2, "0")}`;
}

function karaoke(text, duration) {
  const words = text.split(/\s+/).filter(Boolean);
  const base = Math.max(12, Math.floor((duration * 100) / words.length));
  let remainder = Math.round(duration * 100) - base * words.length;
  return words
    .map(word => {
      const tokenDuration = base + (remainder-- > 0 ? 1 : 0);
      return `{\\kf${tokenDuration}}${word}`;
    })
    .join(" ")
    .replace(/,/g, "\\,");
}

const header = `[Script Info]
Title: Veyra Hackathon Demo Captions
ScriptType: v4.00+
PlayResX: 1920
PlayResY: 1080
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name,Fontname,Fontsize,PrimaryColour,SecondaryColour,OutlineColour,BackColour,Bold,Italic,Underline,StrikeOut,ScaleX,ScaleY,Spacing,Angle,BorderStyle,Outline,Shadow,Alignment,MarginL,MarginR,MarginV,Encoding
Style: Caption,DejaVu Sans,50,&H00F3EEE5,&H00F0563A,&H00111210,&H8C111210,1,0,0,0,100,100,0,0,1,3,1,2,150,150,94,1

[Events]
Format: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
`;

const lines = segments.map(([start, end, text]) =>
  `Dialogue: 0,${assTime(start)},${assTime(end)},Caption,,0,0,0,,{\\fad(120,120)}${karaoke(text, end - start)}`
);

writeFileSync(output, `${header}${lines.join("\n")}\n`);
console.log(output);
