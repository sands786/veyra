import { describe, expect, it } from "vitest";
import { buildVeyraAgentCall } from "./strk20";
import { VERIFIED_VEYRA_AGENT_MAINNET, VERIFIED_VEYRA_LAUNCHPAD_MAINNET, VERIFIED_VEYRA_MARKETS_MAINNET } from "./onchainConfig";

const agentAddress =
  "0x07d0e03a99a85176ceba9fad11bc63b66bfc198365e12e36cdf0811aa9d61f69";

describe("Veyra Agent Mainnet configuration", () => {
  it("keeps the verified public fallback aligned with the deployed contract", () => {
    expect(VERIFIED_VEYRA_AGENT_MAINNET.toLowerCase()).toBe(agentAddress);
    expect(VERIFIED_VEYRA_LAUNCHPAD_MAINNET.toLowerCase()).toBe("0x005d7cb0f5ea0cda8b046d524eaa45e38f3a5c54357f2e4b211da7e2c435bb15");
    expect(VERIFIED_VEYRA_MARKETS_MAINNET.toLowerCase()).toBe("0x05476ca7064583238f3e82a6815a7f662b14228e1fb585d480838a282b9d7cf2");
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
