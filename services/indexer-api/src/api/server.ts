import express, { Request, Response } from "express";
import { isAddress } from "ethers";
import { ChainContext } from "../contracts/chain";
import { JsonStore } from "../models/store";
import { ApiMeta, ClaimSourceRecordModel, DatabaseState, Provenance } from "../models/types";
import { normalizeAddress } from "../utils/format";
import { ErrorCodes } from "./errors";
import { fail, ok } from "./envelope";

export interface ApiServerOptions {
  staleAfterMs: number;
}

export function createApiServer(store: JsonStore, chain: ChainContext, opts: ApiServerOptions) {
  const app = express();
  app.use(express.json());

  app.get("/health", (_req, res) => {
    const state = store.getState();
    res.json(
      ok(
        {
          status: state.meta.indexerStatus,
          latestIndexedBlock: state.meta.latestIndexedBlock,
          lastError: state.meta.lastError,
        },
        buildMeta(
          store,
          "indexer",
          state.meta.latestIndexedBlock,
          state.meta.indexerStatus !== "ready",
          false,
          opts.staleAfterMs
        )
      )
    );
  });

  app.get(["/mesummary", "/me/summary"], async (req, res) => {
    const address = readAddress(req, res);
    if (!address) return;

    const state = store.getState();
    const indexerReady = state.meta.indexerStatus === "ready" && !store.isStale(opts.staleAfterMs);
    const indexed = buildIndexedSummary(state, address);

    if (indexerReady) {
      return res.json(
        ok(
          indexed.data,
          buildMeta(
            store,
            "aggregated",
            indexed.sourceBlockNumber,
            indexed.pending,
            false,
            opts.staleAfterMs
          )
        )
      );
    }

    if (indexed.hasIndexedData) {
      return res.json(
        ok(
          indexed.data,
          buildMeta(
            store,
            "aggregated",
            indexed.sourceBlockNumber,
            true,
            true,
            opts.staleAfterMs
          )
        )
      );
    }

    const fallback = await buildChainSummary(chain, address);
    if (!fallback.available) {
      return res.status(503).json(
        fail(
          ErrorCodes.INDEXER_UNAVAILABLE,
          "Indexer unavailable and chain fallback failed to resolve summary"
        )
      );
    }

    return res.json(
      ok(
        fallback.data,
        buildMeta(store, "chain", fallback.sourceBlockNumber, true, true, opts.staleAfterMs)
      )
    );
  });

  app.get(["/meclaims", "/me/claims"], async (req, res) => {
    const address = readAddress(req, res);
    if (!address) return;

    const state = store.getState();
    const indexerReady = state.meta.indexerStatus === "ready" && !store.isStale(opts.staleAfterMs);
    const indexed = buildIndexedClaims(state, address);

    if (indexerReady) {
      return res.json(
        ok(
          indexed.data,
          buildMeta(
            store,
            "indexer",
            indexed.sourceBlockNumber,
            indexed.pending,
            false,
            opts.staleAfterMs
          )
        )
      );
    }

    if (indexed.hasIndexedData) {
      return res.json(
        ok(
          indexed.data,
          buildMeta(
            store,
            "indexer",
            indexed.sourceBlockNumber,
            true,
            true,
            opts.staleAfterMs
          )
        )
      );
    }

    const fallback = await buildChainClaims(chain, state, address);
    return res.json(
      ok(
        fallback.data,
        buildMeta(store, "chain", fallback.sourceBlockNumber, true, true, opts.staleAfterMs)
      )
    );
  });

  app.get(["/mehistory", "/me/history"], (req, res) => {
    const address = readAddress(req, res);
    if (!address) return;

    const state = store.getState();
    if (state.meta.indexerStatus !== "ready") {
      return res.status(503).json(fail(ErrorCodes.INDEXER_UNAVAILABLE, "Indexer is unavailable"));
    }

    const participantRows = Object.values(state.roundParticipants).filter(
      (row) => row.playerAddress === address
    );

    const rows = participantRows
      .map((row) => {
        const settlement = state.roundSettlements[String(row.roundId)];
        return {
          roundId: row.roundId,
          joinedAt: row.joinTime,
          kills: row.kills,
          survivalStatus: row.isSurvivor ? "survived" : row.isEliminated ? "eliminated" : "unknown",
          payoutAmount: row.payoutAmount,
          payoutStatus: row.payoutStatus,
          settledAt: settlement?.settledAt ?? null,
        };
      })
      .sort((a, b) => b.roundId - a.roundId);

    return res.json(
      ok(
        rows,
        buildMeta(
          store,
          "indexer",
          maxSourceBlock(participantRows),
          hasPending(participantRows),
          false,
          opts.staleAfterMs
        )
      )
    );
  });

  app.get(["/mestats", "/me/stats"], (req, res) => {
    const address = readAddress(req, res);
    if (!address) return;

    const state = store.getState();
    if (state.meta.indexerStatus !== "ready") {
      return res.status(503).json(fail(ErrorCodes.INDEXER_UNAVAILABLE, "Indexer is unavailable"));
    }

    const participants = Object.values(state.roundParticipants).filter(
      (row) => row.playerAddress === address
    );

    const totalRoundsPlayed = participants.length;
    const totalSurvivedRounds = participants.filter((row) => row.isSurvivor).length;
    const totalKills = participants.reduce((acc, row) => acc + row.kills, 0);

    const totalPaidOut = participants
      .filter((row) => row.payoutStatus === "paid")
      .reduce((acc, row) => acc + BigInt(row.payoutAmount), 0n)
      .toString();

    const totalClaimed = Object.values(state.claimSourceRecords)
      .filter((claim) => claim.playerAddress === address && claim.status === "claimed")
      .reduce((acc, claim) => acc + BigInt(claim.amount), 0n)
      .toString();

    const currentClaimable = state.claimBalances[address]?.claimableTotal ?? "0";

    const entrySpent = participants.reduce((acc, row) => {
      const round = state.rounds[String(row.roundId)];
      return acc + BigInt(round?.entryFee ?? "0");
    }, 0n);

    const netMonDelta = (
      BigInt(totalPaidOut) +
      BigInt(totalClaimed) +
      BigInt(currentClaimable) -
      entrySpent
    ).toString();

    return res.json(
      ok(
        {
          totalRoundsPlayed,
          totalSurvivedRounds,
          totalKills,
          totalPaidOut,
          totalClaimed,
          currentClaimable,
          netMonDelta,
        },
        buildMeta(
          store,
          "aggregated",
          maxSourceBlock(participants),
          hasPending(participants),
          false,
          opts.staleAfterMs
        )
      )
    );
  });

  app.get(["/roundslive", "/rounds/live"], async (_req, res) => {
    const state = store.getState();
    const degraded = state.meta.indexerStatus !== "ready" || store.isStale(opts.staleAfterMs);

    if (degraded) {
      const chainRowsRead = await safeRead(async () => buildChainLiveRounds(chain));
      if (!chainRowsRead.value) {
        return res
          .status(503)
          .json(fail(ErrorCodes.CHAIN_READ_FAILED, "Unable to read live rounds from chain"));
      }
      const chainRows = chainRowsRead.value;
      return res.json(
        ok(
          chainRows.rows,
          buildMeta(store, "chain", chainRows.sourceBlockNumber, true, true, opts.staleAfterMs)
        )
      );
    }

    const rounds = Object.values(state.rounds)
      .filter((round) => ["SignupOpen", "SignupLocked", "Live"].includes(round.state))
      .sort((a, b) => b.roundId - a.roundId)
      .map((round) => ({
        roundId: round.roundId,
        seasonId: round.seasonId,
        state: round.state,
        entryFee: round.entryFee,
        joinedCount: round.participantCount,
        maxPlayers: round.maxPlayers,
        startTime: round.startTime,
        roomAddress: round.roomAddress,
      }));

    return res.json(
      ok(
        rounds,
        buildMeta(
          store,
          "indexer",
          maxSourceBlock(Object.values(state.rounds)),
          false,
          false,
          opts.staleAfterMs
        )
      )
    );
  });

  app.get(["/roundsrecent", "/rounds/recent"], (req, res) => {
    const limit = Number(req.query.limit ?? 20);
    const state = store.getState();

    const settlements = Object.values(state.roundSettlements)
      .sort((a, b) => b.roundId - a.roundId)
      .slice(0, Math.max(1, Math.min(100, limit)));

    const rows = settlements.map((settlement) => {
      const participants = Object.values(state.roundParticipants).filter(
        (row) => row.roundId === settlement.roundId
      );
      const survivors = participants.filter((row) => row.isSurvivor).length;

      return {
        roundId: settlement.roundId,
        participants: participants.length,
        survivors,
        volume: settlement.totalEntryCollected,
        settledAt: settlement.settledAt,
        resultHash: settlement.resultHash,
      };
    });

    return res.json(
      ok(
        rows,
        buildMeta(
          store,
          "indexer",
          maxSourceBlock(settlements),
          hasPending(settlements),
          false,
          opts.staleAfterMs
        )
      )
    );
  });

  app.get("/rounds/:roundId", (req, res) => {
    const roundId = Number(req.params.roundId);
    if (!Number.isFinite(roundId)) {
      return res.status(400).json(fail(ErrorCodes.BAD_REQUEST, "Invalid roundId"));
    }

    const state = store.getState();
    const round = state.rounds[String(roundId)];
    if (!round) {
      return res.status(404).json(fail(ErrorCodes.ROUND_NOT_FOUND, "Round not found"));
    }

    const settlement = state.roundSettlements[String(roundId)] ?? null;
    const participants = Object.values(state.roundParticipants)
      .filter((row) => row.roundId === roundId)
      .sort((a, b) => b.kills - a.kills);

    const payoutSummary = {
      totalPayoutAmount: participants.reduce((acc, row) => acc + BigInt(row.payoutAmount), 0n).toString(),
      paidCount: participants.filter((row) => row.payoutStatus === "paid").length,
      claimableCount: participants.filter((row) => row.payoutStatus === "claimable").length,
      noneCount: participants.filter((row) => row.payoutStatus === "none").length,
    };

    return res.json(
      ok(
        {
          round,
          settlement,
          participants,
          payoutSummary,
        },
        buildMeta(
          store,
          "aggregated",
          maxSourceBlock([round, settlement, ...participants]),
          hasPending([round, settlement, ...participants]),
          false,
          opts.staleAfterMs
        )
      )
    );
  });

  app.get(["/season/current", "/seasoncurrent"], (_req, res) => {
    const state = store.getState();
    const season = pickCurrentSeason(state);

    if (!season) {
      return res.status(404).json(fail(ErrorCodes.BAD_REQUEST, "No season available"));
    }

    return res.json(
      ok(
        {
          seasonId: season.seasonId,
          status: season.status,
          endsAt: season.endTime,
          prizePool: season.seasonVaultBalance,
          qualificationKillThreshold: season.qualificationKillThreshold,
        },
        buildMeta(
          store,
          "indexer",
          season.sourceBlockNumber,
          season.confirmationStatus === "pending",
          false,
          opts.staleAfterMs
        )
      )
    );
  });

  app.get(["/season/:seasonId/rank", "/season/:seasonId/rankings"], (req, res) => {
    const seasonId = Number(req.params.seasonId);
    if (!Number.isFinite(seasonId)) {
      return res.status(400).json(fail(ErrorCodes.BAD_REQUEST, "Invalid seasonId"));
    }

    const state = store.getState();
    const stats = Object.values(state.playerSeasonStats)
      .filter((row) => row.seasonId === seasonId)
      .sort((a, b) => {
        if (b.totalKills !== a.totalKills) return b.totalKills - a.totalKills;
        return Number(BigInt(b.estimatedReward) - BigInt(a.estimatedReward));
      });

    const rankRows = stats.map((row) => ({
      playerAddress: row.playerAddress,
      displayName: null,
      totalKills: row.totalKills,
      qualified: row.qualified,
      estimatedReward: row.estimatedReward,
    }));

    return res.json(
      ok(
        rankRows,
        buildMeta(
          store,
          "aggregated",
          maxSourceBlock(stats),
          hasPending(stats),
          false,
          opts.staleAfterMs
        )
      )
    );
  });

  app.get(["/season/:seasonId/me", "/season/:seasonId/me-summary"], (req, res) => {
    const seasonId = Number(req.params.seasonId);
    const address = readAddress(req, res);
    if (!address) return;

    if (!Number.isFinite(seasonId)) {
      return res.status(400).json(fail(ErrorCodes.BAD_REQUEST, "Invalid seasonId"));
    }

    const state = store.getState();
    const season = state.seasons[String(seasonId)];
    const stat = state.playerSeasonStats[`${seasonId}:${address}`];

    if (!season || !stat) {
      return res.json(
        ok(
          {
            totalKills: 0,
            qualified: false,
            killsToThreshold: season?.qualificationKillThreshold ?? null,
            estimatedReward: "0",
            claimedReward: "0",
          },
          buildMeta(
            store,
            "indexer",
            season?.sourceBlockNumber ?? null,
            false,
            false,
            opts.staleAfterMs
          )
        )
      );
    }

    const killsToThreshold = Math.max(0, season.qualificationKillThreshold - stat.totalKills);

    return res.json(
      ok(
        {
          totalKills: stat.totalKills,
          qualified: stat.qualified,
          killsToThreshold,
          estimatedReward: stat.estimatedReward,
          claimedReward: stat.claimedSeasonReward,
        },
        buildMeta(
          store,
          "aggregated",
          stat.sourceBlockNumber,
          stat.confirmationStatus === "pending",
          false,
          opts.staleAfterMs
        )
      )
    );
  });

  app.post(["/txpassmint-intent", "/tx/pass/mint-intent"], async (req, res) => {
    const address = bodyAddress(req, res);
    if (!address) return;

    try {
      const passRead = await chain.readPassOwnership(address);
      if (passRead.hasPass === null) {
        return res
          .status(503)
          .json(fail(ErrorCodes.CHAIN_READ_FAILED, "Unable to verify pass ownership from chain"));
      }
      if (passRead.hasPass) {
        return res.status(400).json(fail(ErrorCodes.PASS_ALREADY_OWNED, "Address already owns a pass"));
      }

      const seasonId = await chain.rumbleXPass.activeSeasonId();
      const data = chain.rumbleXPass.interface.encodeFunctionData("mintPass", [address, seasonId]);

      return res.json(
        ok(
          {
            to: chain.manifest.contracts.RumbleXPass.address,
            data,
            value: "0",
          },
          buildMeta(store, "chain", await chain.provider.getBlockNumber(), true, false, opts.staleAfterMs)
        )
      );
    } catch (error) {
      return res.status(500).json(
        fail(
          ErrorCodes.TX_BUILD_FAILED,
          `Failed to build pass mint intent: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  });

  app.post(["/txroundjoin-intent", "/tx/round/join-intent"], async (req, res) => {
    const address = bodyAddress(req, res);
    if (!address) return;

    const roundId = Number(req.body?.roundId);
    if (!Number.isFinite(roundId)) {
      return res.status(400).json(fail(ErrorCodes.BAD_REQUEST, "roundId is required"));
    }

    try {
      const passRead = await chain.readPassOwnership(address);
      if (passRead.hasPass === null) {
        return res
          .status(503)
          .json(fail(ErrorCodes.CHAIN_READ_FAILED, "Unable to verify pass ownership from chain"));
      }
      if (!passRead.hasPass) {
        return res.status(400).json(fail(ErrorCodes.PASS_REQUIRED, "RumbleX Pass required to join"));
      }

      const state = store.getState();
      let roomAddress = state.rounds[String(roundId)]?.roomAddress;
      if (!roomAddress) {
        roomAddress = await chain.roundFactory.getRoundAddress(roundId);
      }

      if (!roomAddress || roomAddress === "0x0000000000000000000000000000000000000000") {
        return res.status(404).json(fail(ErrorCodes.ROUND_NOT_FOUND, "Round not found"));
      }

      const room = chain.getRoundRoomContract(roomAddress);
      const roundState = Number((await room.state()).toString());
      if (roundState !== 0) {
        return res.status(400).json(fail(ErrorCodes.ROUND_NOT_JOINABLE, "Round is not joinable"));
      }

      const participation = await room.participationByPlayer(address);
      const alreadyJoined = Boolean(participation.joined ?? participation[0]);
      if (alreadyJoined) {
        return res.status(400).json(fail(ErrorCodes.ALREADY_JOINED, "Address already joined this round"));
      }

      const value = (await room.entryFee()).toString();
      const data = room.interface.encodeFunctionData("join", []);

      return res.json(
        ok(
          {
            to: roomAddress,
            data,
            value,
          },
          buildMeta(store, "chain", await chain.provider.getBlockNumber(), true, false, opts.staleAfterMs)
        )
      );
    } catch (error) {
      return res.status(500).json(
        fail(
          ErrorCodes.TX_BUILD_FAILED,
          `Failed to build join intent: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  });

  app.post(["/txclaimall-intent", "/tx/claim/all-intent"], async (req, res) => {
    const address = bodyAddress(req, res);
    if (!address) return;

    try {
      const claimable = await chain.claimVault.totalClaimableFor(address);
      if (BigInt(claimable.toString()) <= 0n) {
        return res.status(400).json(fail(ErrorCodes.NOTHING_TO_CLAIM, "No pending payouts to claim"));
      }

      const data = chain.claimVault.interface.encodeFunctionData("claimAll", []);

      return res.json(
        ok(
          {
            to: chain.manifest.contracts.ClaimVault.address,
            data,
            value: "0",
          },
          buildMeta(store, "chain", await chain.provider.getBlockNumber(), true, false, opts.staleAfterMs)
        )
      );
    } catch (error) {
      return res.status(500).json(
        fail(
          ErrorCodes.TX_BUILD_FAILED,
          `Failed to build claim-all intent: ${error instanceof Error ? error.message : String(error)}`
        )
      );
    }
  });

  app.use((_req, res) => {
    res.status(404).json(fail(ErrorCodes.BAD_REQUEST, "Route not found"));
  });

  app.use((error: unknown, _req: Request, res: Response, _next: () => void) => {
    const message = error instanceof Error ? error.message : "Internal server error";
    const looksLikeDecodeFailure =
      message.includes("could not decode result data") ||
      message.includes("BAD_DATA") ||
      message.includes("CALL_EXCEPTION");

    if (looksLikeDecodeFailure) {
      return res
        .status(503)
        .json(fail(ErrorCodes.CHAIN_READ_FAILED, "Chain read failed. Verify RPC/chainId/manifest alignment."));
    }

    res
      .status(500)
      .json(fail(ErrorCodes.INTERNAL_ERROR, message));
  });

  return app;
}

function buildMeta(
  store: JsonStore,
  source: ApiMeta["source"],
  sourceBlockNumber: number | null,
  isPending: boolean,
  forceStale = false,
  staleAfterMs = 120000
): ApiMeta {
  const stale = forceStale || store.isStale(staleAfterMs);
  return {
    source,
    isPending,
    isConfirmed: !isPending,
    isStale: stale,
    lastSyncedAt: store.getState().meta.lastSyncedAt,
    sourceBlockNumber,
  };
}

function readAddress(req: Request, res: Response): string | null {
  const raw = String(req.query.address ?? "").trim();
  if (!raw || !isAddress(raw)) {
    res.status(400).json(fail(ErrorCodes.INVALID_ADDRESS, "Valid address query param is required"));
    return null;
  }
  return normalizeAddress(raw);
}

function bodyAddress(req: Request, res: Response): string | null {
  const raw = String(req.body?.address ?? "").trim();
  if (!raw || !isAddress(raw)) {
    res.status(400).json(fail(ErrorCodes.INVALID_ADDRESS, "Valid address is required"));
    return null;
  }
  return normalizeAddress(raw);
}

function maxSourceBlock(values: Array<Partial<Provenance> | undefined | null>): number | null {
  const numbers = values
    .filter(Boolean)
    .map((v) => Number(v?.sourceBlockNumber ?? 0))
    .filter((n) => Number.isFinite(n) && n > 0);

  if (numbers.length === 0) return null;
  return Math.max(...numbers);
}

function hasPending(values: Array<Partial<Provenance> | undefined | null>): boolean {
  return values.some((v) => v?.confirmationStatus === "pending");
}

function pickCurrentSeason(state: DatabaseState) {
  const seasons = Object.values(state.seasons);
  if (seasons.length === 0) return null;

  const active = seasons.filter((season) => season.status === "Active").sort((a, b) => b.seasonId - a.seasonId);
  if (active.length > 0) return active[0];

  return seasons.sort((a, b) => b.seasonId - a.seasonId)[0];
}

function claimRecordView(claim: ClaimSourceRecordModel) {
  return {
    claimType: claim.claimType,
    sourceId: claim.sourceId,
    amount: claim.amount,
    status: claim.status,
    createdAt: claim.createdAt,
    claimedAt: claim.claimedAt,
  };
}

function buildIndexedSummary(state: DatabaseState, address: string) {
  const passState = state.passStates[address];
  const claimBalance = state.claimBalances[address];
  const participantRows = Object.values(state.roundParticipants).filter(
    (row) => row.playerAddress === address
  );

  let activeRoundId: number | null = null;
  let lockedInRounds = 0n;

  for (const row of participantRows) {
    const round = state.rounds[String(row.roundId)];
    if (!round) continue;
    if (!["Settled", "FallbackClaimOpen", "Closed"].includes(round.state)) {
      activeRoundId = activeRoundId ? Math.max(activeRoundId, row.roundId) : row.roundId;
      lockedInRounds += BigInt(round.entryFee);
    }
  }

  const currentSeason = pickCurrentSeason(state);
  const seasonStat = currentSeason
    ? state.playerSeasonStats[`${currentSeason.seasonId}:${address}`]
    : undefined;

  return {
    hasIndexedData: Boolean(passState || claimBalance || seasonStat || participantRows.length > 0),
    sourceBlockNumber: maxSourceBlock([passState, claimBalance, seasonStat, ...participantRows]),
    pending: hasPending([passState, claimBalance, seasonStat, ...participantRows]),
    data: {
      address,
      hasPass: passState?.hasPass ?? false,
      walletBalance: null,
      claimableMon: claimBalance?.claimableTotal ?? "0",
      lockedInRounds: lockedInRounds.toString(),
      seasonEstimateMon: seasonStat?.estimatedReward ?? "0",
      activeRoundId,
    },
  };
}

function buildIndexedClaims(state: DatabaseState, address: string) {
  const claimBalance = state.claimBalances[address];
  const claims = Object.values(state.claimSourceRecords).filter((c) => c.playerAddress === address);

  const fallbackClaims = claims
    .filter((c) => c.claimType === "fallback_round_payout")
    .map(claimRecordView);
  const seasonRewards = claims.filter((c) => c.claimType === "season_reward").map(claimRecordView);

  return {
    hasIndexedData: Boolean(claimBalance || claims.length > 0),
    sourceBlockNumber: maxSourceBlock([claimBalance, ...claims]),
    pending: hasPending([claimBalance, ...claims]),
    data: {
      claimableTotal: claimBalance?.claimableTotal ?? "0",
      fallbackClaims,
      seasonRewards,
      lastUpdatedAt: claimBalance?.updatedAt ?? state.meta.lastSyncedAt,
    },
  };
}

async function buildChainSummary(chain: ChainContext, address: string): Promise<{
  available: boolean;
  sourceBlockNumber: number | null;
  data: {
    address: string;
    hasPass: boolean;
    walletBalance: string | null;
    claimableMon: string;
    lockedInRounds: null;
    seasonEstimateMon: null;
    activeRoundId: number | null;
    degraded: {
      unavailableFields: string[];
      readErrors: string[];
      passOwnershipSource: string;
    };
  };
}> {
  const unavailableFields: string[] = [];
  const readErrors: string[] = [];

  const blockRead = await safeRead(async () => chain.provider.getBlockNumber());
  const sourceBlockNumber = blockRead.value ?? null;
  if (blockRead.error) readErrors.push(`getBlockNumber: ${chain.describeError(blockRead.error)}`);

  const passRead = await chain.readPassOwnership(address);
  readErrors.push(...passRead.errors);
  if (passRead.hasPass === null) unavailableFields.push("hasPass");

  const claimRead = await chain.readClaimableTotal(address);
  readErrors.push(...claimRead.errors);
  if (claimRead.claimable === null) unavailableFields.push("claimableMon");

  const balanceRead = await safeRead(async () => chain.provider.getBalance(address));
  if (balanceRead.error) {
    readErrors.push(`getBalance: ${chain.describeError(balanceRead.error)}`);
    unavailableFields.push("walletBalance");
  }

  const liveRead = await safeRead(async () => buildChainLiveRounds(chain));
  if (liveRead.error) {
    readErrors.push(`buildChainLiveRounds: ${chain.describeError(liveRead.error)}`);
    unavailableFields.push("activeRoundId");
  }

  // Invariant: activeRoundId must only represent a round this address has actually joined
  // and that is currently active (SignupOpen/SignupLocked/Live). Never infer from "first live round".
  let activeRoundId: number | null = null;
  if (liveRead.value?.rows?.length) {
    let hadParticipationReadFailure = false;
    let hadParticipationReadSuccess = false;

    for (const row of liveRead.value.rows) {
      const joinedRead = await safeRead(async () => {
        const room = chain.getRoundRoomContract(row.roomAddress);
        const participation = await room.participationByPlayer(address);
        return Boolean(participation.joined ?? participation[0]);
      });

      if (joinedRead.error) {
        hadParticipationReadFailure = true;
        readErrors.push(
          `participationByPlayer(round=${row.roundId}): ${chain.describeError(joinedRead.error)}`
        );
        continue;
      }

      hadParticipationReadSuccess = true;
      if (joinedRead.value) {
        activeRoundId = row.roundId;
        break;
      }
    }

    // If no check succeeded and no positive match was found, we cannot guarantee user participation state.
    if (activeRoundId === null && hadParticipationReadFailure && !hadParticipationReadSuccess) {
      unavailableFields.push("activeRoundId");
    }
  }

  const hasAnyValue =
    passRead.hasPass !== null ||
    claimRead.claimable !== null ||
    balanceRead.value !== null ||
    liveRead.value !== null;

  return {
    available: hasAnyValue,
    sourceBlockNumber,
    data: {
      address,
      hasPass: passRead.hasPass ?? false,
      walletBalance: balanceRead.value ? balanceRead.value.toString() : null,
      claimableMon: claimRead.claimable !== null ? claimRead.claimable.toString() : "0",
      lockedInRounds: null,
      seasonEstimateMon: null,
      activeRoundId,
      degraded: {
        unavailableFields,
        readErrors,
        passOwnershipSource: passRead.method,
      },
    },
  };
}

async function buildChainClaims(
  chain: ChainContext,
  state: DatabaseState,
  address: string
): Promise<{
  available: boolean;
  sourceBlockNumber: number | null;
  data: {
    claimableTotal: string;
    fallbackClaims: ReturnType<typeof claimRecordView>[];
    seasonRewards: ReturnType<typeof claimRecordView>[];
    lastUpdatedAt: string | null;
    degraded: {
      unavailableFields: string[];
      readErrors: string[];
    };
  };
}> {
  const unavailableFields: string[] = [];
  const readErrors: string[] = [];

  const blockRead = await safeRead(async () => chain.provider.getBlockNumber());
  const sourceBlockNumber = blockRead.value ?? null;
  if (blockRead.error) readErrors.push(`getBlockNumber: ${chain.describeError(blockRead.error)}`);

  const claimRead = await chain.readClaimableTotal(address);
  readErrors.push(...claimRead.errors);
  if (claimRead.claimable === null) unavailableFields.push("claimableTotal");

  const available = claimRead.claimable !== null;

  return {
    available,
    sourceBlockNumber,
    data: {
      claimableTotal: claimRead.claimable?.toString() ?? "0",
      fallbackClaims: [],
      seasonRewards: [],
      lastUpdatedAt: state.meta.lastSyncedAt ?? new Date().toISOString(),
      degraded: {
        unavailableFields,
        readErrors,
      },
    },
  };
}

async function safeRead<T>(fn: () => Promise<T>): Promise<{ value: T | null; error: unknown | null }> {
  try {
    const value = await fn();
    return { value, error: null };
  } catch (error) {
    return { value: null, error };
  }
}

async function buildChainLiveRounds(chain: ChainContext): Promise<{
  rows: Array<{
    roundId: number;
    seasonId: number;
    state: string;
    entryFee: string;
    joinedCount: number;
    maxPlayers: number;
    startTime: null;
    roomAddress: string;
  }>;
  sourceBlockNumber: number;
}> {
  const sourceBlockNumber = await chain.provider.getBlockNumber();
  const ids = (await chain.roundFactory.getRecentRoundIds(20)) as bigint[];

  const rows: Array<{
    roundId: number;
    seasonId: number;
    state: string;
    entryFee: string;
    joinedCount: number;
    maxPlayers: number;
    startTime: null;
    roomAddress: string;
  }> = [];

  for (const rawId of ids) {
    const roundId = Number(rawId);
    const info = await chain.roundFactory.roundInfoById(roundId);
    const roomAddress = String(info.roomAddress ?? info[1]);

    if (!isAddress(roomAddress) || /^0x0{40}$/i.test(roomAddress)) continue;

    const room = chain.getRoundRoomContract(roomAddress);
    const [stateRaw, countRaw] = await Promise.all([room.state(), room.participantCount()]);
    const stateId = Number(stateRaw.toString());

    if (![0, 1, 2].includes(stateId)) continue;

    rows.push({
      roundId,
      seasonId: Number((info.seasonId ?? info[2]).toString()),
      state: ["SignupOpen", "SignupLocked", "Live"][stateId] ?? "Unknown",
      entryFee: (info.entryFee ?? info[3]).toString(),
      joinedCount: Number(countRaw.toString()),
      maxPlayers: Number((info.maxPlayers ?? info[4]).toString()),
      startTime: null,
      roomAddress,
    });
  }

  rows.sort((a, b) => b.roundId - a.roundId);
  return { rows, sourceBlockNumber };
}
