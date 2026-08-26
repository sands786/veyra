import { describe, expect, it } from "vitest";
import { buildVeyraAgentCall } from "./strk20";
import { VERIFIED_VEYRA_AGENT_MAINNET } from "./onchainConfig";

const agentAddress =
  "0x07d0e03a99a85176ceba9fad11bc63b66bfc198365e12e36cdf0811aa9d61f69";

describe("Veyra Agent Mainnet configuration", () => {
  it("keeps the verified public fallback aligned with the deployed contract", () => {
    expect(VERIFIED_VEYRA_AGENT_MAINNET.toLowerCase()).toBe(agentAddress);
  });

  it("uses the configured deployed contract address for a lightweight call", () => {
    const configuredAddress = import.meta.env.VITE_VEYRA_AGENT_CONTRACT_MAINNET;
    expect(configuredAddress).toBeTypeOf("string");

    expect(configuredAddress.toLowerCase()).toBe(agentAddress);
    expect(
      buildVeyraAgentCall(configuredAddress, {
        type: "create_round",
        roundId: 2n,
        coordinator: agentAddress,
        roundType: "0x1",
      }).contractAddress.toLowerCase(),
    ).toBe(agentAddress);
  });
});
