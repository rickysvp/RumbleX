import React, { useMemo, useState } from 'react';
import { History, Trophy, Users, Clock, ExternalLink, Shield, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { getApiErrorMessage, normalizeMonNumber, normalizeMonString } from '../api/format';
import { isLiveSummaryMode } from '../config/dataMode';
import { useRoundDetails, useRoundsRecent } from '../hooks/queries/useInsightsQueries';

export function HistoryPage() {
  const [expandedRound, setExpandedRound] = useState<number | null>(null);
  const liveMode = isLiveSummaryMode();

  const recentQuery = useRoundsRecent(30);
  const detailsQuery = useRoundDetails(expandedRound);

  const rows = recentQuery.data?.ok ? recentQuery.data.data : [];
  const meta = recentQuery.data?.ok ? recentQuery.data.meta : null;

  const summary = useMemo(() => {
    const totalRounds = rows.length;
    const totalPlayers = rows.reduce((acc, row) => acc + row.participants, 0);
    const totalVolume = rows.reduce((acc, row) => acc + normalizeMonNumber(row.volume), 0);

    const survivalRates = rows
      .filter((row) => row.participants > 0)
      .map((row) => (row.survivors / row.participants) * 100);

    const avgSurvivalRate =
      survivalRates.length > 0
        ? survivalRates.reduce((acc, rate) => acc + rate, 0) / survivalRates.length
        : 0;

    return {
      totalRounds,
      totalPlayers,
      totalVolume,
      avgSurvivalRate,
    };
  }, [rows]);

  const expandedParticipants = detailsQuery.data?.ok ? detailsQuery.data.data.participants : [];
  const expandedSurvivors = [...expandedParticipants]
    .filter((row) => row.isSurvivor)
    .sort((a, b) => normalizeMonNumber(b.payoutAmount) - normalizeMonNumber(a.payoutAmount));

  const toggleExpand = (round: number) => {
    setExpandedRound(expandedRound === round ? null : round);
  };

  if (!liveMode) {
    return (
      <div className="h-full w-full bg-[#0a0a0a] overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <History size={24} className="text-app-accent" />
              <h1 className="text-[24px] font-app-bold text-white uppercase tracking-wide">Round History</h1>
            </div>
            <p className="text-app-muted text-[13px]">Switch to hybrid/live mode to load chain-derived history.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-[#0a0a0a] overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <History size={24} className="text-app-accent" />
            <h1 className="text-[24px] font-app-bold text-white uppercase tracking-wide">
              Round History
            </h1>
          </div>
          <p className="text-app-muted text-[13px]">
            Chain-derived recent round settlements and payout records.
          </p>
        </div>

        <div className="bg-app-accent/10 border border-app-accent/30 p-4 mb-6 flex items-center gap-3">
          <Shield size={18} className="text-app-accent" />
          <div>
            <div className="text-[12px] text-app-accent font-app-bold uppercase">Data Source</div>
            {meta ? (
              <div className="text-[11px] text-app-muted flex flex-wrap gap-x-3 gap-y-1">
                <span>source: {meta.source}</span>
                <span>{meta.isPending ? 'pending confirmations' : 'confirmed snapshot'}</span>
                <span>{meta.isStale ? 'stale/degraded' : 'fresh'}</span>
                <span>synced: {meta.lastSyncedAt ? new Date(meta.lastSyncedAt).toLocaleTimeString() : '--'}</span>
              </div>
            ) : (
              <div className="text-[11px] text-app-muted">Awaiting API metadata...</div>
            )}
          </div>
        </div>

        {recentQuery.isLoading && (
          <div className="bg-[#111] border border-[#222] p-5 text-[12px] text-app-muted mb-6">Loading recent rounds...</div>
        )}

        {recentQuery.error && (
          <div className="bg-red-500/10 border border-red-500/30 p-5 text-[12px] text-red-400 mb-6">
            {getApiErrorMessage(recentQuery.error)}
          </div>
        )}

        {!recentQuery.isLoading && !recentQuery.error && (
          <>
            <div className="bg-[#111] border border-[#222]">
              <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#222] text-[10px] text-app-muted uppercase tracking-wider font-app-bold">
                <div className="col-span-1">Round</div>
                <div className="col-span-2">Time</div>
                <div className="col-span-2 text-right">Players</div>
                <div className="col-span-2 text-right">Round Volume</div>
                <div className="col-span-3">Survivors</div>
                <div className="col-span-2 text-right">Verification</div>
              </div>

              <div className="divide-y divide-[#222]">
                {rows.map((round) => (
                  <div key={round.roundId}>
                    <div
                      className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors cursor-pointer"
                      onClick={() => toggleExpand(round.roundId)}
                    >
                      <div className="col-span-1">
                        <span className="text-white font-app-bold text-[14px]">#{round.roundId}</span>
                      </div>

                      <div className="col-span-2">
                        <div className="text-[11px] text-app-muted flex items-center gap-1">
                          <Clock size={10} />
                          {round.settledAt
                            ? new Date(round.settledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                            : '--:--'}
                        </div>
                        <div className="text-[10px] text-[#444]">
                          {round.settledAt ? new Date(round.settledAt).toLocaleDateString() : 'Pending'}
                        </div>
                      </div>

                      <div className="col-span-2 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Users size={12} className="text-app-muted" />
                          <span className="text-white font-app-mono text-[13px]">{round.participants}</span>
                        </div>
                      </div>

                      <div className="col-span-2 text-right">
                        <span className="text-app-accent font-app-mono text-[14px]">{normalizeMonString(round.volume)}</span>
                        <span className="text-[10px] text-app-muted ml-1">MON</span>
                      </div>

                      <div className="col-span-3">
                        <div className="flex items-center gap-2">
                          <Trophy size={12} className="text-app-accent" />
                          <span className="text-white font-app-bold text-[13px]">{round.survivors} Survivors</span>
                          {expandedRound === round.roundId ? (
                            <ChevronUp size={14} className="text-app-muted" />
                          ) : (
                            <ChevronDown size={14} className="text-app-muted" />
                          )}
                        </div>
                      </div>

                      <div className="col-span-2 text-right">
                        <a
                          href={`https://testnet.monadexplorer.com/tx/${round.resultHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="inline-flex items-center gap-1.5 text-[10px] text-green-400 hover:text-green-300 transition-colors"
                        >
                          <CheckCircle size={10} />
                          <span className="font-app-mono">{`${round.resultHash.slice(0, 8)}...${round.resultHash.slice(-6)}`}</span>
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    </div>

                    {expandedRound === round.roundId && (
                      <div className="bg-black/40 border-t border-[#222] p-4">
                        <div className="text-[10px] text-app-muted uppercase tracking-wider mb-3">Survivor Details</div>

                        {detailsQuery.isLoading && (
                          <div className="text-[11px] text-app-muted py-2">Loading round details...</div>
                        )}

                        {detailsQuery.error && (
                          <div className="text-[11px] text-red-400 py-2">{getApiErrorMessage(detailsQuery.error)}</div>
                        )}

                        {!detailsQuery.isLoading && !detailsQuery.error && expandedSurvivors.length === 0 && (
                          <div className="text-[11px] text-app-muted py-2">No survivor payout records.</div>
                        )}

                        {!detailsQuery.isLoading && !detailsQuery.error && expandedSurvivors.length > 0 && (
                          <div className="space-y-2">
                            {expandedSurvivors.map((survivor, index) => (
                              <div key={`${survivor.playerAddress}-${index}`} className="flex items-center justify-between bg-[#0a0a0a] p-3 border border-[#222]">
                                <div className="flex items-center gap-3 min-w-0">
                                  <span className="text-[11px] text-app-muted w-6">#{index + 1}</span>
                                  <span className="text-[13px] text-white font-app-bold uppercase truncate">
                                    {`${survivor.playerAddress.slice(0, 6)}...${survivor.playerAddress.slice(-4)}`}
                                  </span>
                                </div>
                                <div className="flex items-center gap-6">
                                  <span className="text-[11px] text-app-muted">{survivor.kills} kills</span>
                                  <span className="text-[13px] text-app-accent font-app-mono">
                                    +{normalizeMonString(survivor.payoutAmount)} MON Carry Out
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {rows.length === 0 && (
                  <div className="p-5 text-[12px] text-app-muted">No settled rounds available yet.</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-4 gap-4 mt-6">
              <div className="bg-[#111] border border-[#222] p-4 text-center">
                <div className="text-[10px] text-app-muted uppercase mb-1">Recent Rounds</div>
                <div className="text-[28px] font-app-mono text-white">{summary.totalRounds}</div>
              </div>
              <div className="bg-[#111] border border-[#222] p-4 text-center">
                <div className="text-[10px] text-app-muted uppercase mb-1">Recent Players</div>
                <div className="text-[28px] font-app-mono text-app-accent">{summary.totalPlayers.toLocaleString()}</div>
              </div>
              <div className="bg-[#111] border border-[#222] p-4 text-center">
                <div className="text-[10px] text-app-muted uppercase mb-1">Recent Volume</div>
                <div className="text-[28px] font-app-mono text-app-accent">{summary.totalVolume.toFixed(1)}</div>
                <div className="text-[10px] text-app-muted">MON</div>
              </div>
              <div className="bg-[#111] border border-[#222] p-4 text-center">
                <div className="text-[10px] text-app-muted uppercase mb-1">Avg Survival Rate</div>
                <div className="text-[28px] font-app-mono text-white">{summary.avgSurvivalRate.toFixed(1)}%</div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
