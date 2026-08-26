import type { VeilNetwork } from "./strk20";

export type ProtocolSurface = "privacy" | "payroll" | "treasury" | "claims" | "launchpad" | "markets" | "proof";

// Public Mainnet deployment fallback. The environment variable can override this,
// but the UI must not hide a verified public contract when a frontend host omits it.
export const VERIFIED_VEYRA_AGENT_MAINNET = "0x07d0e03a99a85176ceba9fad11bc63b66bfc198365e12e36cdf0811aa9d61f69";
export const VERIFIED_VEYRA_LAUNCHPAD_MAINNET = "0x005d7cb0f5ea0cda8b046d524eaa45e38f3a5c54357f2e4b211da7e2c435bb15";
export const VERIFIED_VEYRA_MARKETS_MAINNET = "0x05476ca7064583238f3e82a6815a7f662b14228e1fb585d480838a282b9d7cf2";

export type ProtocolContractConfig = {
  address: string;
  abiVersion?: string;
};

export type ProtocolContracts = Record<ProtocolSurface, ProtocolContractConfig | undefined>;

const address = (value: unknown): ProtocolContractConfig | undefined => {
  const normalized = String(value ?? "").trim();
  return normalized && /^0x[0-9a-fA-F]+$/.test(normalized) ? { address: normalized } : undefined;
};

const env = (_network: VeilNetwork) => {
  const suffix = "MAINNET" as const;
  return {
    privacy: address(import.meta.env.VITE_VEYRA_STRK20_PRIVACY_CONTRACT_MAINNET),
    payroll: address(import.meta.env[`VITE_VEYRA_PAYROLL_CONTRACT_${suffix}`]),
    treasury: address(import.meta.env[`VITE_VEYRA_TREASURY_CONTRACT_${suffix}`]),
    claims: address(import.meta.env[`VITE_VEYRA_CLAIMS_CONTRACT_${suffix}`]),
    launchpad: address(
      import.meta.env[`VITE_VEYRA_LAUNCHPAD_CONTRACT_${suffix}`] ??
        import.meta.env.VITE_LAUNCHPAD_ESCROW_ADDRESS
    ),
    markets: address(import.meta.env[`VITE_VEYRA_MARKETS_CONTRACT_${suffix}`]),
    proof: address(import.meta.env[`VITE_VEYRA_PROOF_CONTRACT_${suffix}`]),
  } satisfies ProtocolContracts;
};

export function protocolContracts(network: VeilNetwork): ProtocolContracts {
  return env(network);
}

export function protocolReadiness(network: VeilNetwork) {
  const contracts = protocolContracts(network);
  const surfaces = Object.entries(contracts) as Array<[ProtocolSurface, ProtocolContractConfig | undefined]>;
  const configured = surfaces.filter(([, config]) => Boolean(config)).map(([surface]) => surface);
  const missing = surfaces.filter(([, config]) => !config).map(([surface]) => surface);
  return { network, contracts, configured, missing, fullyConfigured: missing.length === 0 } as const;
}
