import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const root = path.resolve(import.meta.dirname, "..");

describe("Veyra mainnet-only operating posture", () => {
  it("removes the public workspace testnet selector and fixes the active network to mainnet", () => {
    const homePage = fs.readFileSync(path.join(root, "client", "src", "pages", "Home.tsx"), "utf8");

    expect(homePage).toContain('const selectedNetwork = "mainnet" as const;');
    expect(homePage).toContain("STARKNET MAINNET");
    expect(homePage).not.toContain('changeNetwork("sepolia")');
    expect(homePage).not.toContain(">TESTNET<");
    expect(homePage).not.toContain("Starknet Sepolia");
  });

  it("restricts product mutations that accept network selection to Starknet mainnet", () => {
    const routerSource = fs.readFileSync(path.join(root, "server", "routers.ts"), "utf8");
    const demoSource = fs.readFileSync(path.join(root, "client", "src", "pages", "DemoMode.tsx"), "utf8");
    const privateMarketsSource = fs.readFileSync(path.join(root, "client", "src", "pages", "PrivateMarkets.tsx"), "utf8");

    expect(routerSource).toContain('const mainnetNetwork = z.literal("mainnet");');
    expect(routerSource).not.toContain('network: z.enum(["mainnet", "sepolia"])');
    expect(demoSource).toContain("STARKNET MAINNET / EXECUTION BOUNDARY");
    expect(demoSource).not.toContain("RUN TESTNET ROUND TRIP");
    expect(privateMarketsSource).toContain("verified Starknet mainnet transaction");
    expect(privateMarketsSource).not.toContain("testnet/mainnet");
  });
});
