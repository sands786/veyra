import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = process.cwd();
const evidenceStrip = readFileSync(resolve(root, "client/src/components/MainnetEvidenceStrip.tsx"), "utf8");
const launchpad = readFileSync(resolve(root, "client/src/components/LaunchpadOnchainPanel.tsx"), "utf8");
const launchpadPage = readFileSync(resolve(root, "client/src/pages/Launchpad.tsx"), "utf8");
const markets = readFileSync(resolve(root, "client/src/components/PrivateMarketsOnchainPanel.tsx"), "utf8");
const agent = readFileSync(resolve(root, "client/src/components/VeyraAgentOnchainPanel.tsx"), "utf8");
const primitives = readFileSync(resolve(root, "client/src/components/PrivatePrimitivesOnchainPanel.tsx"), "utf8");

describe("judge-facing evidence surfaces", () => {
  it("keeps the reusable evidence strip explicit about Mainnet and privacy boundaries", () => {
    expect(evidenceStrip).toContain("VERIFIED MAINNET EVIDENCE");
    expect(evidenceStrip).toContain("PRIVACY BOUNDARY");
    expect(evidenceStrip).toContain("OPEN CONTRACT");
    expect(evidenceStrip).toContain("OPEN VERIFIED RECEIPT");
    expect(evidenceStrip).toContain("starkscan.co");
  });

  it("mounts verified lifecycle evidence on deployed protocol panels", () => {
    expect(launchpad).toContain("CREATE → ACTIVATE → MILESTONE");
    expect(markets).toContain("CREATE → OPEN → COMMIT → ACCEPT → SETTLE");
    expect(agent).toContain("CREATE → OPEN → COMMIT → CLOSE → REVEAL → RESOLVE");
    expect(markets).toContain("SETTLED / RECEIPT-BACKED");
    expect(agent).toContain("ROUND 2 RESOLVED / RECEIPT-BACKED");
    expect(launchpadPage).toContain("VERIFIED_VEYRA_LAUNCHPAD_MAINNET");
    expect(launchpadPage).toContain("DEPLOYED / RECEIPT-BACKED");
  });

  it("keeps private-note discovery separate from public receipt proof", () => {
    expect(primitives).toContain("PUBLIC RECEIPT");
    expect(primitives).toContain("PRIVATE NOTE");
    expect(primitives).toContain("RECIPIENT PROOF");
    expect(primitives).toContain("WALLET-OWNED");
    expect(primitives).toContain("NOT CLAIMED");
  });
});
