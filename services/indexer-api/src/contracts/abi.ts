import fs from "node:fs";
import path from "node:path";
import type { InterfaceAbi } from "ethers";
import { rootDir } from "../config";

function readAbi(relativeArtifactPath: string): InterfaceAbi {
  const artifactPath = path.join(rootDir(), "onchain", "out", relativeArtifactPath);
  if (!fs.existsSync(artifactPath)) {
    throw new Error(`Artifact not found: ${artifactPath}`);
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf8")) as { abi: InterfaceAbi };
  if (!Array.isArray(artifact.abi)) {
    throw new Error(`Invalid artifact ABI: ${artifactPath}`);
  }

  return artifact.abi as InterfaceAbi;
}

export const roundFactoryAbi = readAbi("RoundFactory.sol/RoundFactory.json");
export const roundRoomAbi = readAbi("RoundRoom.sol/RoundRoom.json");
export const rumbleXPassAbi = readAbi("RumbleXPass.sol/RumbleXPass.json");
export const seasonVaultAbi = readAbi("SeasonVault.sol/SeasonVault.json");
export const claimVaultAbi = readAbi("ClaimVault.sol/ClaimVault.json");
