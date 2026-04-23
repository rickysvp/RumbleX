import { Log, ZeroHash } from "ethers";
import { ChainContext } from "../contracts/chain";
import { JsonStore } from "../models/store";
import {
  ClaimBalanceModel,
  ClaimSourceRecordModel,
  DatabaseState,
  PassStateModel,
  PlayerSeasonStatsModel,
  Provenance,
  RoundModel,
  RoundParticipantModel,
  RoundSettlementModel,
  SeasonModel,
} from "../models/types";
import { bnToString, normalizeAddress, nowIso, parseNumber, toBigInt } from "../utils/format";

const ROUND_STATE_BY_ID: Record<number, RoundModel["state"]> = {
  0: "SignupOpen",
  1: "SignupLocked",
  2: "Live",
  3: "SettlementPending",
  4: "Settled",
  5: "FallbackClaimOpen",
  6: "Closed",
};

function claimTypeFromEnum(value: number): ClaimSourceRecordModel["claimType"] {
  if (value === 0) return "fallback_round_payout";
  return "season_reward";
}

function claimKey(playerAddress: string, claimType: number, sourceId: number): string {
  return `${normalizeAddress(playerAddress)}:${claimType}:${sourceId}`;
}

interface IndexerOptions {
  startBlock: number;
  confirmationBlocks: number;
  pollIntervalMs: number;
}

export class IndexerService {
  // Monad testnet RPC currently limits eth_getLogs to 100-block windows.
  private static readonly MAX_LOG_BLOCK_RANGE = 100;
  private timer: NodeJS.Timeout | null = null;
  private syncing = false;

  constructor(
    private readonly store: JsonStore,
    private readonly chain: ChainContext,
    private readonly options: IndexerOptions
  ) {}

  async start(): Promise<void> {
    await this.syncOnce();
    this.timer = setInterval(() => {
      void this.syncOnce();
    }, this.options.pollIntervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  async syncOnce(): Promise<void> {
    if (this.syncing) return;
    this.syncing = true;

    try {
      this.store.updateMeta({ indexerStatus: "syncing", lastError: null });
      const latestBlock = await this.chain.provider.getBlockNumber();
      const currentState = this.store.getState();
      const nextState = this.cloneState(currentState);

      const fromBlock = this.nextFromBlock(currentState.meta.latestIndexedBlock);
      if (fromBlock <= latestBlock) {
        await this.processRange(nextState, fromBlock, latestBlock);
      } else {
        this.recomputeAllSeasonStats(nextState);
        this.refreshAllClaimBalances(nextState, latestBlock);
      }

      nextState.meta.indexerStatus = "ready";
      nextState.meta.lastSyncedAt = nowIso();
      nextState.meta.lastError = null;
      nextState.meta.latestIndexedBlock = latestBlock;
      this.store.replaceState(nextState);
    } catch (error) {
      this.store.updateMeta({
        indexerStatus: "error",
        lastError: error instanceof Error ? error.message : String(error),
      });
    } finally {
      this.syncing = false;
    }
  }

  private async processRange(state: DatabaseState, fromBlock: number, toBlock: number): Promise<void> {
    if (toBlock < fromBlock) {
      return;
    }

    const blockTimestampCache = new Map<number, string>();
    const eventDedup = new Set<string>();

    const factoryLogs = await this.getLogs(this.chain.manifest.contracts.RoundFactory.address, fromBlock, toBlock);
    const roundAddresses = new Set<string>();

    for (const knownAddress of Object.keys(state.roundAddressToId)) {
      roundAddresses.add(normalizeAddress(knownAddress));
    }

    for (const log of factoryLogs) {
      const parsed = this.tryParseFactory(log);
      if (!parsed || parsed.name !== "RoundCreated") continue;
      roundAddresses.add(normalizeAddress(String(parsed.args.roomAddress)));
    }

    const logs = [
      ...factoryLogs,
      ...(await this.getLogs(this.chain.manifest.contracts.RumbleXPass.address, fromBlock, toBlock)),
      ...(await this.getLogs(this.chain.manifest.contracts.SeasonVault.address, fromBlock, toBlock)),
      ...(await this.getLogs(this.chain.manifest.contracts.ClaimVault.address, fromBlock, toBlock)),
    ];

    for (const roomAddress of roundAddresses) {
      logs.push(...(await this.getLogs(roomAddress, fromBlock, toBlock)));
    }

    logs.sort((a, b) => {
      if (a.blockNumber !== b.blockNumber) return a.blockNumber - b.blockNumber;
      return a.index - b.index;
    });

    for (const log of logs) {
      const eventId = this.eventId(log);
      if (eventDedup.has(eventId)) continue;
      eventDedup.add(eventId);

      await this.applyLog(state, log, blockTimestampCache, toBlock);
    }

    this.recomputeAllSeasonStats(state);
    this.refreshAllClaimBalances(state, toBlock);
  }

  private nextFromBlock(latestIndexedBlock: number): number {
    const next = latestIndexedBlock + 1;
    if (!Number.isFinite(next) || latestIndexedBlock < this.options.startBlock - 1) {
      return this.options.startBlock;
    }
    return Math.max(this.options.startBlock, next);
  }

  private cloneState(state: DatabaseState): DatabaseState {
    return JSON.parse(JSON.stringify(state)) as DatabaseState;
  }

  private async getLogs(address: string, fromBlock: number, toBlock: number): Promise<Log[]> {
    if (toBlock < fromBlock) return [];

    const logs: Log[] = [];
    const step = IndexerService.MAX_LOG_BLOCK_RANGE;

    for (let start = fromBlock; start <= toBlock; start += step) {
      const end = Math.min(toBlock, start + step - 1);
      const chunk = await this.chain.provider.getLogs({
        address,
        fromBlock: start,
        toBlock: end,
      });
      logs.push(...chunk);
    }

    return logs;
  }

  private async applyLog(
    state: DatabaseState,
    log: Log,
    blockTimestampCache: Map<number, string>,
    latestBlock: number
  ): Promise<void> {
    const address = normalizeAddress(log.address);
    const txHash = log.transactionHash;
    const sourceBlockNumber = log.blockNumber;
    const sourceLogIndex = log.index;
    const ts = await this.getBlockTimestamp(log.blockNumber, blockTimestampCache);

    if (address === normalizeAddress(this.chain.manifest.contracts.RoundFactory.address)) {
      const parsed = this.tryParseFactory(log);
      if (!parsed) return;

      if (parsed.name === "RoundCreated") {
        const roundId = parseNumber(parsed.args.roundId);
        const seasonId = parseNumber(parsed.args.seasonId);
        const roomAddress = normalizeAddress(String(parsed.args.roomAddress));

        const round: RoundModel = {
          roundId,
          seasonId,
          roomAddress,
          state: "SignupOpen",
          entryFee: bnToString(toBigInt(parsed.args.entryFee)),
          maxPlayers: parseNumber(parsed.args.maxPlayers),
          participantCount: 0,
          startTime: ts,
          endTime: null,
          rulesetHash: null,
          sourceTxHash: txHash,
          sourceBlockNumber,
          sourceLogIndex,
          confirmationStatus: this.confirmationStatus(sourceBlockNumber, latestBlock),
          confirmedAt: this.confirmedAt(sourceBlockNumber, latestBlock),
        };

        state.rounds[String(roundId)] = round;
        state.roundAddressToId[roomAddress] = roundId;

        const season = this.ensureSeason(state, seasonId, {
          sourceTxHash: txHash,
          sourceBlockNumber,
          sourceLogIndex,
          confirmationStatus: this.confirmationStatus(sourceBlockNumber, latestBlock),
          confirmedAt: this.confirmedAt(sourceBlockNumber, latestBlock),
        });

        season.status = "Active";
        if (!season.startTime) season.startTime = ts;
      }

      return;
    }

    if (address === normalizeAddress(this.chain.manifest.contracts.RumbleXPass.address)) {
      const parsed = this.tryParsePass(log);
      if (!parsed) return;

      if (parsed.name === "PassMinted") {
        const player = normalizeAddress(String(parsed.args.player));
        const tokenId = parseNumber(parsed.args.tokenId);

        const pass: PassStateModel = {
          address: player,
          hasPass: true,
          passTokenId: tokenId,
          checkedAt: ts,
          sourceTxHash: txHash,
          sourceBlockNumber,
          sourceLogIndex,
          confirmationStatus: this.confirmationStatus(sourceBlockNumber, latestBlock),
          confirmedAt: this.confirmedAt(sourceBlockNumber, latestBlock),
        };

        state.passStates[player] = pass;
      }

      return;
    }

    if (address === normalizeAddress(this.chain.manifest.contracts.SeasonVault.address)) {
      const parsed = this.tryParseSeason(log);
      if (!parsed) return;

      if (parsed.name === "SeasonFunded") {
        const seasonId = parseNumber(parsed.args.seasonId);
        const amount = toBigInt(parsed.args.amount);

        const season = this.ensureSeason(state, seasonId, {
          sourceTxHash: txHash,
          sourceBlockNumber,
          sourceLogIndex,
          confirmationStatus: this.confirmationStatus(sourceBlockNumber, latestBlock),
          confirmedAt: this.confirmedAt(sourceBlockNumber, latestBlock),
        });

        season.status = "Active";
        season.seasonVaultBalance = (BigInt(season.seasonVaultBalance) + amount).toString();
      }

      if (parsed.name === "SeasonConfigured" || parsed.name === "QualificationThresholdUpdated") {
        const seasonId = parseNumber(parsed.args.seasonId);
        const threshold = parseNumber(parsed.args.qualificationThreshold ?? parsed.args.threshold);

        const season = this.ensureSeason(state, seasonId, {
          sourceTxHash: txHash,
          sourceBlockNumber,
          sourceLogIndex,
          confirmationStatus: this.confirmationStatus(sourceBlockNumber, latestBlock),
          confirmedAt: this.confirmedAt(sourceBlockNumber, latestBlock),
        });

        season.qualificationKillThreshold = threshold;
      }

      if (parsed.name === "SeasonRewardsAssigned") {
        const seasonId = parseNumber(parsed.args.seasonId);
        const threshold = parseNumber(parsed.args.qualificationThreshold);
        const remainder = toBigInt(parsed.args.remainder);

        const season = this.ensureSeason(state, seasonId, {
          sourceTxHash: txHash,
          sourceBlockNumber,
          sourceLogIndex,
          confirmationStatus: this.confirmationStatus(sourceBlockNumber, latestBlock),
          confirmedAt: this.confirmedAt(sourceBlockNumber, latestBlock),
        });

        season.qualificationKillThreshold = threshold;
        season.seasonVaultBalance = remainder.toString();
        season.status = "RewardsReady";
        season.endTime = ts;
      }

      if (parsed.name === "SeasonRewardEntitlement") {
        const seasonId = parseNumber(parsed.args.seasonId);
        const playerAddress = normalizeAddress(String(parsed.args.player));
        const reward = toBigInt(parsed.args.rewardAmount);

        const stat = this.ensurePlayerSeasonStats(state, seasonId, playerAddress, {
          sourceTxHash: txHash,
          sourceBlockNumber,
          sourceLogIndex,
          confirmationStatus: this.confirmationStatus(sourceBlockNumber, latestBlock),
          confirmedAt: this.confirmedAt(sourceBlockNumber, latestBlock),
        });

        stat.assignedReward = (BigInt(stat.assignedReward) + reward).toString();
      }

      return;
    }

    if (address === normalizeAddress(this.chain.manifest.contracts.ClaimVault.address)) {
      const parsed = this.tryParseClaim(log);
      if (!parsed) return;

      if (parsed.name === "ClaimRecorded") {
        const playerAddress = normalizeAddress(String(parsed.args.player));
        const claimType = parseNumber(parsed.args.claimType);
        const sourceId = parseNumber(parsed.args.sourceId);
        const amount = toBigInt(parsed.args.amount);
        const key = claimKey(playerAddress, claimType, sourceId);

        const existing = state.claimSourceRecords[key];
        const nextAmount = BigInt(existing?.amount ?? "0") + amount;

        state.claimSourceRecords[key] = {
          claimKey: key,
          playerAddress,
          claimType: claimTypeFromEnum(claimType),
          sourceId,
          amount: nextAmount.toString(),
          status: existing?.status ?? "unclaimed",
          createdAt: existing?.createdAt ?? ts,
          claimedAt: existing?.claimedAt ?? null,
          sourceTxHash: txHash,
          sourceBlockNumber,
          sourceLogIndex,
          confirmationStatus: this.confirmationStatus(sourceBlockNumber, latestBlock),
          confirmedAt: this.confirmedAt(sourceBlockNumber, latestBlock),
        };
      }

      if (parsed.name === "Claimed" || parsed.name === "ClaimAll") {
        const playerAddress = normalizeAddress(String(parsed.args.player));
        await this.refreshPlayerClaimRecordsFromChain(state, playerAddress, {
          sourceTxHash: txHash,
          sourceBlockNumber,
          sourceLogIndex,
          confirmationStatus: this.confirmationStatus(sourceBlockNumber, latestBlock),
          confirmedAt: this.confirmedAt(sourceBlockNumber, latestBlock),
        });
      }

      return;
    }

    const parsedRoom = this.tryParseRoundRoom(log);
    if (!parsedRoom) return;

    const roomAddress = address;
    const roundId = await this.ensureRoundFromRoomAddress(state, roomAddress, {
      sourceTxHash: txHash,
      sourceBlockNumber,
      sourceLogIndex,
      confirmationStatus: this.confirmationStatus(sourceBlockNumber, latestBlock),
      confirmedAt: this.confirmedAt(sourceBlockNumber, latestBlock),
    });

    const round = state.rounds[String(roundId)];

    if (parsedRoom.name === "PlayerJoined") {
      const playerAddress = normalizeAddress(String(parsedRoom.args.player));
      const participant = this.ensureRoundParticipant(state, roundId, playerAddress, {
        sourceTxHash: txHash,
        sourceBlockNumber,
        sourceLogIndex,
        confirmationStatus: this.confirmationStatus(sourceBlockNumber, latestBlock),
        confirmedAt: this.confirmedAt(sourceBlockNumber, latestBlock),
      });

      participant.joinTime = ts;
      participant.payoutStatus = "none";
      round.participantCount += 1;
      if (!round.startTime) round.startTime = ts;
    }

    if (parsedRoom.name === "RoundStateUpdated") {
      const stateId = parseNumber(parsedRoom.args.state);
      round.state = ROUND_STATE_BY_ID[stateId] ?? round.state;
      if (round.state === "Live" && !round.startTime) {
        round.startTime = ts;
      }
      if (
        round.state === "Settled" ||
        round.state === "FallbackClaimOpen" ||
        round.state === "Closed"
      ) {
        round.endTime = ts;
      }
      this.setProvenance(round, {
        sourceTxHash: txHash,
        sourceBlockNumber,
        sourceLogIndex,
        confirmationStatus: this.confirmationStatus(sourceBlockNumber, latestBlock),
        confirmedAt: this.confirmedAt(sourceBlockNumber, latestBlock),
      });
    }

    if (parsedRoom.name === "PayoutSent" || parsedRoom.name === "FallbackRecorded") {
      const playerAddress = normalizeAddress(String(parsedRoom.args.player));
      const participant = this.ensureRoundParticipant(state, roundId, playerAddress, {
        sourceTxHash: txHash,
        sourceBlockNumber,
        sourceLogIndex,
        confirmationStatus: this.confirmationStatus(sourceBlockNumber, latestBlock),
        confirmedAt: this.confirmedAt(sourceBlockNumber, latestBlock),
      });
      participant.payoutAmount = bnToString(toBigInt(parsedRoom.args.amount));
      participant.payoutStatus = parsedRoom.name === "PayoutSent" ? "paid" : "claimable";
    }

    if (parsedRoom.name === "RoundSettled") {
      const settlement: RoundSettlementModel = {
        roundId,
        resultHash: String(parsedRoom.args.resultHash ?? ZeroHash),
        totalEntryCollected: bnToString(toBigInt(parsedRoom.args.protocolFeeAmount) + toBigInt(parsedRoom.args.seasonFeeAmount) + toBigInt(parsedRoom.args.playerPoolAmount)),
        protocolFeeAmount: bnToString(toBigInt(parsedRoom.args.protocolFeeAmount)),
        seasonFeeAmount: bnToString(toBigInt(parsedRoom.args.seasonFeeAmount)),
        playerPoolAmount: bnToString(toBigInt(parsedRoom.args.playerPoolAmount)),
        totalPaidOut: bnToString(toBigInt(parsedRoom.args.totalPaidOut)),
        totalFallbackClaimable: bnToString(toBigInt(parsedRoom.args.totalFallbackClaimable)),
        settledAt: ts,
        sourceTxHash: txHash,
        sourceBlockNumber,
        sourceLogIndex,
        confirmationStatus: this.confirmationStatus(sourceBlockNumber, latestBlock),
        confirmedAt: this.confirmedAt(sourceBlockNumber, latestBlock),
      };

      state.roundSettlements[String(roundId)] = settlement;
      round.endTime = ts;
      round.state = toBigInt(parsedRoom.args.totalFallbackClaimable) > 0n ? "FallbackClaimOpen" : "Settled";
      this.setProvenance(round, {
        sourceTxHash: txHash,
        sourceBlockNumber,
        sourceLogIndex,
        confirmationStatus: this.confirmationStatus(sourceBlockNumber, latestBlock),
        confirmedAt: this.confirmedAt(sourceBlockNumber, latestBlock),
      });

      await this.hydrateRoundParticipantResults(state, roundId, roomAddress, {
        sourceTxHash: txHash,
        sourceBlockNumber,
        sourceLogIndex,
        confirmationStatus: this.confirmationStatus(sourceBlockNumber, latestBlock),
        confirmedAt: this.confirmedAt(sourceBlockNumber, latestBlock),
      });
    }
  }

  private async hydrateRoundParticipantResults(
    state: DatabaseState,
    roundId: number,
    roomAddress: string,
    provenance: Provenance
  ): Promise<void> {
    const room = this.chain.getRoundRoomContract(roomAddress);
    const participants = (await room.participants()) as string[];

    for (const rawAddress of participants) {
      const playerAddress = normalizeAddress(rawAddress);
      const result = await room.participantResults(playerAddress);

      const isProcessed = Boolean(result.isProcessed ?? result[0]);
      const isSurvivor = Boolean(result.isSurvivor ?? result[1]);
      const kills = parseNumber(result.kills ?? result[2]);
      const finalHolding = toBigInt(result.finalHolding ?? result[3]);
      const payoutAmount = toBigInt(result.payoutAmount ?? result[4]);
      const payoutSent = Boolean(result.payoutSent ?? result[5]);
      const fallbackRecorded = Boolean(result.fallbackRecorded ?? result[6]);

      const participant = this.ensureRoundParticipant(state, roundId, playerAddress, provenance);
      participant.kills = kills;
      participant.isSurvivor = isSurvivor;
      participant.isEliminated = isProcessed ? !isSurvivor : participant.isEliminated;
      participant.finalHolding = finalHolding.toString();
      participant.payoutAmount = payoutAmount.toString();
      if (payoutAmount === 0n) {
        participant.payoutStatus = "none";
      } else if (fallbackRecorded) {
        participant.payoutStatus = "claimable";
      } else if (payoutSent) {
        participant.payoutStatus = "paid";
      }
      this.setProvenance(participant, provenance);
    }
  }

  private ensureSeason(state: DatabaseState, seasonId: number, provenance: Provenance): SeasonModel {
    const key = String(seasonId);
    const existing = state.seasons[key];
    if (existing) {
      this.setProvenance(existing, provenance);
      return existing;
    }

    const season: SeasonModel = {
      seasonId,
      status: "Upcoming",
      startTime: null,
      endTime: null,
      seasonVaultBalance: "0",
      qualificationKillThreshold: 0,
      ...provenance,
    };

    state.seasons[key] = season;
    return season;
  }

  private ensureRoundParticipant(
    state: DatabaseState,
    roundId: number,
    playerAddress: string,
    provenance: Provenance
  ): RoundParticipantModel {
    const key = `${roundId}:${playerAddress}`;
    const existing = state.roundParticipants[key];
    if (existing) {
      this.setProvenance(existing, provenance);
      return existing;
    }

    const participant: RoundParticipantModel = {
      roundId,
      playerAddress,
      joinTime: null,
      kills: 0,
      isSurvivor: false,
      isEliminated: false,
      payoutAmount: "0",
      payoutStatus: "none",
      finalHolding: "0",
      ...provenance,
    };

    state.roundParticipants[key] = participant;
    return participant;
  }

  private ensurePlayerSeasonStats(
    state: DatabaseState,
    seasonId: number,
    playerAddress: string,
    provenance: Provenance
  ): PlayerSeasonStatsModel {
    const key = `${seasonId}:${playerAddress}`;
    const existing = state.playerSeasonStats[key];
    if (existing) {
      this.setProvenance(existing, provenance);
      return existing;
    }

    const stat: PlayerSeasonStatsModel = {
      seasonId,
      playerAddress,
      totalKills: 0,
      qualified: false,
      estimatedReward: "0",
      assignedReward: "0",
      claimedSeasonReward: "0",
      ...provenance,
    };

    state.playerSeasonStats[key] = stat;
    return stat;
  }

  private async ensureRoundFromRoomAddress(
    state: DatabaseState,
    roomAddress: string,
    provenance: Provenance
  ): Promise<number> {
    const existing = state.roundAddressToId[roomAddress];
    if (existing) return existing;

    const room = this.chain.getRoundRoomContract(roomAddress);
    const roundId = parseNumber(await room.roundId());
    const seasonId = parseNumber(await room.seasonId());
    const entryFee = bnToString(toBigInt(await room.entryFee()));
    const maxPlayers = parseNumber(await room.maxPlayers());
    const stateId = parseNumber(await room.state());

    state.roundAddressToId[roomAddress] = roundId;
    state.rounds[String(roundId)] = {
      roundId,
      seasonId,
      roomAddress,
      state: ROUND_STATE_BY_ID[stateId] ?? "SignupOpen",
      entryFee,
      maxPlayers,
      participantCount: 0,
      startTime: null,
      endTime: null,
      rulesetHash: null,
      ...provenance,
    };

    this.ensureSeason(state, seasonId, provenance);
    return roundId;
  }

  private setProvenance(target: Provenance, provenance: Provenance): void {
    target.sourceTxHash = provenance.sourceTxHash;
    target.sourceBlockNumber = provenance.sourceBlockNumber;
    target.sourceLogIndex = provenance.sourceLogIndex;
    target.confirmationStatus = provenance.confirmationStatus;
    target.confirmedAt = provenance.confirmedAt;
  }

  private confirmationStatus(sourceBlock: number, latestBlock: number): "pending" | "confirmed" {
    return sourceBlock + this.options.confirmationBlocks <= latestBlock ? "confirmed" : "pending";
  }

  private confirmedAt(sourceBlock: number, latestBlock: number): string | null {
    return this.confirmationStatus(sourceBlock, latestBlock) === "confirmed" ? nowIso() : null;
  }

  private async getBlockTimestamp(blockNumber: number, cache: Map<number, string>): Promise<string> {
    const cached = cache.get(blockNumber);
    if (cached) return cached;

    const block = await this.chain.provider.getBlock(blockNumber);
    const ts = new Date(Number(block?.timestamp ?? Date.now() / 1000) * 1000).toISOString();
    cache.set(blockNumber, ts);
    return ts;
  }

  private eventId(log: Log): string {
    return `${this.store.getState().meta.chainId}:${normalizeAddress(log.address)}:${log.transactionHash}:${log.index}`;
  }

  private tryParseFactory(log: Log) {
    try {
      return this.chain.roundFactoryInterface.parseLog(log);
    } catch {
      return null;
    }
  }

  private tryParseRoundRoom(log: Log) {
    try {
      return this.chain.roundRoomInterface.parseLog(log);
    } catch {
      return null;
    }
  }

  private tryParsePass(log: Log) {
    try {
      return this.chain.rumbleXPassInterface.parseLog(log);
    } catch {
      return null;
    }
  }

  private tryParseSeason(log: Log) {
    try {
      return this.chain.seasonVaultInterface.parseLog(log);
    } catch {
      return null;
    }
  }

  private tryParseClaim(log: Log) {
    try {
      return this.chain.claimVaultInterface.parseLog(log);
    } catch {
      return null;
    }
  }

  private async refreshPlayerClaimRecordsFromChain(
    state: DatabaseState,
    playerAddress: string,
    provenance: Provenance
  ): Promise<void> {
    const keys = (await this.chain.claimVault.getPlayerClaimKeys(playerAddress)) as string[];

    for (const key of keys) {
      const record = await this.chain.claimVault.claimRecords(key);
      const claimTypeNum = parseNumber(record.claimType ?? record[1]);
      const sourceId = parseNumber(record.sourceId ?? record[2]);
      const amount = toBigInt(record.amount ?? record[3]);
      const claimed = Boolean(record.claimed ?? record[4]);
      const createdAt = parseNumber(record.createdAt ?? record[5]);
      const claimedAt = parseNumber(record.claimedAt ?? record[6]);

      state.claimSourceRecords[key] = {
        claimKey: key,
        playerAddress: normalizeAddress(playerAddress),
        claimType: claimTypeFromEnum(claimTypeNum),
        sourceId,
        amount: amount.toString(),
        status: claimed ? "claimed" : "unclaimed",
        createdAt: createdAt > 0 ? new Date(createdAt * 1000).toISOString() : null,
        claimedAt: claimedAt > 0 ? new Date(claimedAt * 1000).toISOString() : null,
        ...provenance,
      };
    }
  }

  private recomputeAllSeasonStats(state: DatabaseState): void {
    const bySeason = new Map<number, Set<string>>();

    for (const round of Object.values(state.rounds)) {
      if (!bySeason.has(round.seasonId)) bySeason.set(round.seasonId, new Set());
      bySeason.get(round.seasonId)?.add(String(round.roundId));
    }

    for (const seasonId of bySeason.keys()) {
      this.recomputeSeasonStats(state, seasonId);
    }
  }

  private recomputeSeasonStats(state: DatabaseState, seasonId: number): void {
    const season = state.seasons[String(seasonId)];
    if (!season) return;

    const playerKills = new Map<string, number>();
    let maxProv: Provenance | null = null;

    for (const participant of Object.values(state.roundParticipants)) {
      const round = state.rounds[String(participant.roundId)];
      if (!round || round.seasonId !== seasonId) continue;
      const current = playerKills.get(participant.playerAddress) ?? 0;
      playerKills.set(participant.playerAddress, current + participant.kills);

      if (!maxProv || participant.sourceBlockNumber >= maxProv.sourceBlockNumber) {
        maxProv = {
          sourceTxHash: participant.sourceTxHash,
          sourceBlockNumber: participant.sourceBlockNumber,
          sourceLogIndex: participant.sourceLogIndex,
          confirmationStatus: participant.confirmationStatus,
          confirmedAt: participant.confirmedAt,
        };
      }
    }

    const threshold = season.qualificationKillThreshold;
    let totalQualifiedKills = 0;
    for (const kills of playerKills.values()) {
      if (kills >= threshold) totalQualifiedKills += kills;
    }

    for (const [playerAddress, totalKills] of playerKills.entries()) {
      const key = `${seasonId}:${playerAddress}`;
      const qualified = totalKills >= threshold;
      let estimatedReward = "0";

      if (qualified && totalQualifiedKills > 0) {
        estimatedReward = ((BigInt(season.seasonVaultBalance) * BigInt(totalKills)) / BigInt(totalQualifiedKills)).toString();
      }

      const assignedReward = Object.values(state.claimSourceRecords)
        .filter(
          (claim) =>
            claim.playerAddress === playerAddress &&
            claim.claimType === "season_reward" &&
            claim.sourceId === seasonId
        )
        .reduce((acc, claim) => acc + BigInt(claim.amount), 0n)
        .toString();

      const claimedSeasonReward = Object.values(state.claimSourceRecords)
        .filter(
          (claim) =>
            claim.playerAddress === playerAddress &&
            claim.claimType === "season_reward" &&
            claim.sourceId === seasonId &&
            claim.status === "claimed"
        )
        .reduce((acc, claim) => acc + BigInt(claim.amount), 0n)
        .toString();

      const provenance =
        maxProv ??
        ({
          sourceTxHash: ZeroHash,
          sourceBlockNumber: 0,
          sourceLogIndex: 0,
          confirmationStatus: "pending",
          confirmedAt: null,
        } as Provenance);

      state.playerSeasonStats[key] = {
        seasonId,
        playerAddress,
        totalKills,
        qualified,
        estimatedReward,
        assignedReward,
        claimedSeasonReward,
        ...provenance,
      };
    }
  }

  private refreshAllClaimBalances(state: DatabaseState, latestBlock: number): void {
    const byPlayer = new Map<string, ClaimSourceRecordModel[]>();

    for (const claim of Object.values(state.claimSourceRecords)) {
      if (!byPlayer.has(claim.playerAddress)) {
        byPlayer.set(claim.playerAddress, []);
      }
      byPlayer.get(claim.playerAddress)?.push(claim);

      claim.confirmationStatus = this.confirmationStatus(claim.sourceBlockNumber, latestBlock);
      claim.confirmedAt = this.confirmedAt(claim.sourceBlockNumber, latestBlock);
    }

    for (const [playerAddress, claims] of byPlayer.entries()) {
      let fallbackRoundAmount = 0n;
      let seasonRewardAmount = 0n;
      let claimableTotal = 0n;
      let maxSourceBlock = 0;
      let maxLogIndex = 0;
      let sourceTxHash = ZeroHash;
      let hasPending = false;

      for (const claim of claims) {
        if (claim.sourceBlockNumber > maxSourceBlock) {
          maxSourceBlock = claim.sourceBlockNumber;
          maxLogIndex = claim.sourceLogIndex;
          sourceTxHash = claim.sourceTxHash;
        }

        if (claim.confirmationStatus === "pending") {
          hasPending = true;
        }

        if (claim.status !== "unclaimed") continue;

        const amount = BigInt(claim.amount);
        claimableTotal += amount;

        if (claim.claimType === "fallback_round_payout") {
          fallbackRoundAmount += amount;
        } else {
          seasonRewardAmount += amount;
        }
      }

      const balance: ClaimBalanceModel = {
        playerAddress,
        claimableTotal: claimableTotal.toString(),
        fallbackRoundAmount: fallbackRoundAmount.toString(),
        seasonRewardAmount: seasonRewardAmount.toString(),
        updatedAt: nowIso(),
        sourceTxHash,
        sourceBlockNumber: maxSourceBlock,
        sourceLogIndex: maxLogIndex,
        confirmationStatus: hasPending ? "pending" : "confirmed",
        confirmedAt: hasPending ? null : nowIso(),
      };

      state.claimBalances[playerAddress] = balance;
    }

    for (const settlement of Object.values(state.roundSettlements)) {
      settlement.confirmationStatus = this.confirmationStatus(
        settlement.sourceBlockNumber,
        latestBlock
      );
      settlement.confirmedAt = this.confirmedAt(settlement.sourceBlockNumber, latestBlock);
    }

    for (const season of Object.values(state.seasons)) {
      season.confirmationStatus = this.confirmationStatus(season.sourceBlockNumber, latestBlock);
      season.confirmedAt = this.confirmedAt(season.sourceBlockNumber, latestBlock);
    }

    for (const round of Object.values(state.rounds)) {
      round.confirmationStatus = this.confirmationStatus(round.sourceBlockNumber, latestBlock);
      round.confirmedAt = this.confirmedAt(round.sourceBlockNumber, latestBlock);
    }

    for (const participant of Object.values(state.roundParticipants)) {
      participant.confirmationStatus = this.confirmationStatus(participant.sourceBlockNumber, latestBlock);
      participant.confirmedAt = this.confirmedAt(participant.sourceBlockNumber, latestBlock);
    }

    for (const stat of Object.values(state.playerSeasonStats)) {
      stat.confirmationStatus = this.confirmationStatus(stat.sourceBlockNumber, latestBlock);
      stat.confirmedAt = this.confirmedAt(stat.sourceBlockNumber, latestBlock);
    }

    for (const pass of Object.values(state.passStates)) {
      pass.confirmationStatus = this.confirmationStatus(pass.sourceBlockNumber, latestBlock);
      pass.confirmedAt = this.confirmedAt(pass.sourceBlockNumber, latestBlock);
    }
  }
}
