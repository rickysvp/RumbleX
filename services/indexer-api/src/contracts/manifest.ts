import fs from "node:fs";

export interface ContractManifestEntry {
  address: string;
  startBlock?: number;
}

export interface DeploymentsManifest {
  network: string;
  chainId: number;
  contracts: {
    RumbleXPass: ContractManifestEntry;
    SeasonVault: ContractManifestEntry;
    ClaimVault: ContractManifestEntry;
    RoundFactory: ContractManifestEntry;
    ProtocolTreasury: { address: string };
  };
}

function assertHexAddress(address: string, field: string): void {
  if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
    throw new Error(`Invalid address for ${field}: ${address}`);
  }
}

function assertNonZeroAddress(address: string, field: string): void {
  if (/^0x0{40}$/i.test(address)) {
    throw new Error(`Zero address in deployment manifest for ${field}. Run deploy scripts first.`);
  }
}

export function loadDeploymentsManifest(path: string): DeploymentsManifest {
  if (!fs.existsSync(path)) {
    throw new Error(`Deployment manifest not found at ${path}`);
  }

  const raw = fs.readFileSync(path, "utf8");
  const parsed = JSON.parse(raw) as DeploymentsManifest;

  assertHexAddress(parsed.contracts.RumbleXPass.address, "contracts.RumbleXPass.address");
  assertHexAddress(parsed.contracts.SeasonVault.address, "contracts.SeasonVault.address");
  assertHexAddress(parsed.contracts.ClaimVault.address, "contracts.ClaimVault.address");
  assertHexAddress(parsed.contracts.RoundFactory.address, "contracts.RoundFactory.address");
  assertHexAddress(parsed.contracts.ProtocolTreasury.address, "contracts.ProtocolTreasury.address");

  assertNonZeroAddress(parsed.contracts.RumbleXPass.address, "contracts.RumbleXPass.address");
  assertNonZeroAddress(parsed.contracts.SeasonVault.address, "contracts.SeasonVault.address");
  assertNonZeroAddress(parsed.contracts.ClaimVault.address, "contracts.ClaimVault.address");
  assertNonZeroAddress(parsed.contracts.RoundFactory.address, "contracts.RoundFactory.address");

  return parsed;
}
