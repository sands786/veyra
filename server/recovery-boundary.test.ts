import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");
const unavailableBoundary = readFileSync(resolve(process.cwd(), "client/src/components/UnavailableBoundary.tsx"), "utf8");
const notFound = readFileSync(resolve(process.cwd(), "client/src/pages/NotFound.tsx"), "utf8");
const claim = readFileSync(resolve(process.cwd(), "client/src/pages/Claim.tsx"), "utf8");
const proof = readFileSync(resolve(process.cwd(), "client/src/pages/Proof.tsx"), "utf8");

describe("Veyra recovery boundaries", () => {
  it("keeps both the canonical and legacy Private Markets URLs connected to the workspace", () => {
    expect(app).toContain('<Route path="/private-markets" component={PrivateMarkets} />');
    expect(app).toContain('<Route path="/markets" component={PrivateMarkets} />');
  });

  it("uses one branded, privacy-safe recovery treatment for 404, claim, and proof failures", () => {
    expect(unavailableBoundary).toContain('data-testid="veyra-unavailable-boundary"');
    expect(notFound).toContain("UnavailableBoundary");
    expect(notFound).toContain("NO WORKSPACE, RECIPIENT, CLAIM, OR PRIVATE MARKET DATA WAS DISCLOSED");
    expect(claim).toContain("UnavailableBoundary");
    expect(proof).toContain("UnavailableBoundary");
    expect(claim).toContain("NO RECIPIENT ROSTER, AMOUNT, OR SENDER METADATA WAS DISCLOSED");
    expect(proof).toContain("NO PRIVATE ROSTER, WALLET, NOTE, OR UNPUBLISHED RECEIPT DATA WAS DISCLOSED");
  });
});
