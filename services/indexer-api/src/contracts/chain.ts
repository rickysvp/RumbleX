import { Contract, Interface, JsonRpcProvider } from "ethers";
import {
  claimVaultAbi,
  roundFactoryAbi,
  roundRoomAbi,
  rumbleXPassAbi,
  seasonVaultAbi,
} from "./abi";
import { DeploymentsManifest } from "./manifest";

export class ChainContext {
  readonly provider: JsonRpcProvider;
  readonly roundFactory: Contract;
  readonly rumbleXPass: Contract;
  readonly seasonVault: Contract;
  readonly claimVault: Contract;

  readonly roundFactoryInterface: Interface;
  readonly roundRoomInterface: Interface;
  readonly rumbleXPassInterface: Interface;
  readonly seasonVaultInterface: Interface;
  readonly claimVaultInterface: Interface;

  private readonly roundRoomContracts = new Map<string, Contract>();

  constructor(rpcUrl: string, chainId: number, readonly manifest: DeploymentsManifest) {
    this.provider = new JsonRpcProvider(rpcUrl, chainId || undefined);

    this.roundFactoryInterface = new Interface(roundFactoryAbi);
    this.roundRoomInterface = new Interface(roundRoomAbi);
    this.rumbleXPassInterface = new Interface(rumbleXPassAbi);
    this.seasonVaultInterface = new Interface(seasonVaultAbi);
    this.claimVaultInterface = new Interface(claimVaultAbi);

    this.roundFactory = new Contract(
      manifest.contracts.RoundFactory.address,
      this.roundFactoryInterface,
      this.provider
    );
    this.rumbleXPass = new Contract(
      manifest.contracts.RumbleXPass.address,
      this.rumbleXPassInterface,
      this.provider
    );
    this.seasonVault = new Contract(
      manifest.contracts.SeasonVault.address,
      this.seasonVaultInterface,
      this.provider
    );
    this.claimVault = new Contract(
      manifest.contracts.ClaimVault.address,
      this.claimVaultInterface,
      this.provider
    );
  }

  getRoundRoomContract(roomAddress: string): Contract {
    const key = roomAddress.toLowerCase();
    const existing = this.roundRoomContracts.get(key);
    if (existing) return existing;

    const contract = new Contract(roomAddress, this.roundRoomInterface, this.provider);
    this.roundRoomContracts.set(key, contract);
    return contract;
  }

  async readPassOwnership(address: string): Promise<{
    hasPass: boolean | null;
    method: "hasPass" | "seasonTokenByOwner" | "balanceOf" | "unavailable";
    errors: string[];
  }> {
    const errors: string[] = [];

    // Preferred canonical gate.
    try {
      const hasPass = await this.rumbleXPass.hasPass(address);
      return { hasPass: Boolean(hasPass), method: "hasPass", errors };
    } catch (error) {
      errors.push(`hasPass: ${this.describeError(error)}`);
    }

    // Fallback: seasonTokenByOwner(activeSeasonId, player) > 0.
    try {
      const activeSeasonId = await this.rumbleXPass.activeSeasonId();
      const tokenId = await this.rumbleXPass.seasonTokenByOwner(activeSeasonId, address);
      const hasPass = BigInt(tokenId.toString()) > 0n;
      return { hasPass, method: "seasonTokenByOwner", errors };
    } catch (error) {
      errors.push(`seasonTokenByOwner: ${this.describeError(error)}`);
    }

    // Last-resort fallback: any pass balance.
    try {
      const balance = await this.rumbleXPass.balanceOf(address);
      return {
        hasPass: BigInt(balance.toString()) > 0n,
        method: "balanceOf",
        errors,
      };
    } catch (error) {
      errors.push(`balanceOf: ${this.describeError(error)}`);
    }

    return { hasPass: null, method: "unavailable", errors };
  }

  async readClaimableTotal(address: string): Promise<{
    claimable: bigint | null;
    errors: string[];
  }> {
    const errors: string[] = [];
    try {
      const value = await this.claimVault.totalClaimableFor(address);
      return { claimable: BigInt(value.toString()), errors };
    } catch (error) {
      errors.push(`totalClaimableFor: ${this.describeError(error)}`);
      return { claimable: null, errors };
    }
  }

  async validateManifestContracts(): Promise<{
    chainId: number;
    contracts: Array<{ name: string; address: string; hasCode: boolean }>;
  }> {
    const network = await this.provider.getNetwork();
    const names: Array<keyof typeof this.manifest.contracts> = [
      "RumbleXPass",
      "SeasonVault",
      "ClaimVault",
      "RoundFactory",
    ];

    const contracts = await Promise.all(
      names.map(async (name) => {
        const address = this.manifest.contracts[name].address;
        const code = await this.provider.getCode(address);
        return {
          name,
          address,
          hasCode: code !== "0x",
        };
      })
    );

    return {
      chainId: Number(network.chainId),
      contracts,
    };
  }

  describeError(error: unknown): string {
    const raw = error instanceof Error ? error.message : String(error);

    if (
      raw.includes("could not decode result data") ||
      raw.includes("BAD_DATA") ||
      raw.includes("CALL_EXCEPTION")
    ) {
      return "METHOD_UNAVAILABLE_OR_ABI_MISMATCH";
    }

    if (raw.includes("network")) {
      return "NETWORK_OR_RPC_ERROR";
    }

    return raw;
  }
}
