import fs from "node:fs";
import path from "node:path";
import { DatabaseState } from "./types";

export class JsonStore {
  private state: DatabaseState;
  private readonly configuredChainId: number;
  private readonly configuredStartBlock: number;

  constructor(
    private readonly filePath: string,
    chainId: number,
    startBlock: number
  ) {
    this.configuredChainId = chainId;
    this.configuredStartBlock = startBlock;
    this.state = this.createEmptyState(chainId, startBlock);
    this.load();
    this.ensureCompatibility();
  }

  createEmptyState(chainId: number, startBlock: number): DatabaseState {
    return {
      meta: {
        chainId,
        startBlock,
        latestIndexedBlock: startBlock - 1,
        indexerStatus: "idle",
        lastSyncedAt: null,
        lastError: null,
      },
      passStates: {},
      seasons: {},
      rounds: {},
      roundAddressToId: {},
      roundParticipants: {},
      roundSettlements: {},
      claimSourceRecords: {},
      claimBalances: {},
      playerSeasonStats: {},
    };
  }

  getState(): DatabaseState {
    return this.state;
  }

  replaceState(nextState: DatabaseState): void {
    this.state = nextState;
    this.persist();
  }

  updateMeta(patch: Partial<DatabaseState["meta"]>): void {
    this.state.meta = { ...this.state.meta, ...patch };
    this.persist();
  }

  isStale(staleAfterMs: number): boolean {
    const ts = this.state.meta.lastSyncedAt;
    if (!ts) return true;
    return Date.now() - new Date(ts).getTime() > staleAfterMs;
  }

  private load(): void {
    if (!fs.existsSync(this.filePath)) {
      this.persist();
      return;
    }

    const raw = fs.readFileSync(this.filePath, "utf8");
    if (!raw.trim()) {
      this.persist();
      return;
    }

    const parsed = JSON.parse(raw) as DatabaseState;
    this.state = parsed;
  }

  private ensureCompatibility(): void {
    const meta = this.state.meta;
    const chainMismatch = meta.chainId !== this.configuredChainId;
    const startBlockMismatch = meta.startBlock !== this.configuredStartBlock;

    if (!chainMismatch && !startBlockMismatch) {
      return;
    }

    this.state = this.createEmptyState(this.configuredChainId, this.configuredStartBlock);
    this.persist();
  }

  private persist(): void {
    const dir = path.dirname(this.filePath);
    fs.mkdirSync(dir, { recursive: true });

    const tmpPath = `${this.filePath}.tmp`;
    fs.writeFileSync(tmpPath, JSON.stringify(this.state, null, 2), "utf8");
    fs.renameSync(tmpPath, this.filePath);
  }
}
