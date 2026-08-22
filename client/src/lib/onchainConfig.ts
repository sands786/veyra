import type { VeilNetwork } from "./strk20";

export type ProtocolSurface = "payroll" | "treasury" | "claims" | "launchpad" | "markets" | "proof";

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
    payroll: address(import.meta.env[`VITE_VEYRA_PAYROLL_CONTRACT_${suffix}`]),
    treasury: address(import.meta.env[`VITE_VEYRA_TREASURY_CONTRACT_${suffix}`]),
    claims: address(import.meta.env[`VITE_VEYRA_CLAIMS_CONTRACT_${suffix}`]),
    launchpad: address(import.meta.env[`VITE_VEYRA_LAUNCHPAD_CONTRACT_${suffix}`]),
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
