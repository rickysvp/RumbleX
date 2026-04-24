import React from 'react';
import { useWalletStore } from '../store/walletStore';
import { BarChart3, Target, Skull, Trophy, TrendingUp, History } from 'lucide-react';
import { getApiErrorMessage, normalizeMonString } from '../api/format';
import { isLiveSummaryMode } from '../config/dataMode';
import { useMeHistory, useMeStats } from '../hooks/queries/useInsightsQueries';

export function StatsPage() {
  const { address, addressFull, seasonEstimateMon } = useWalletStore();
  const liveMode = isLiveSummaryMode();

  const statsQuery = useMeStats(addressFull);
  const historyQuery = useMeHistory(addressFull);

  if (!liveMode) {
    return (
      <div className="h-full w-full bg-[#0a0a0a] overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <BarChart3 size={24} className="text-app-accent" />
              <h1 className="text-[24px] font-app-bold text-white uppercase tracking-wide">My Stats</h1>
            </div>
            <p className="text-app-muted text-[13px]">Switch to hybrid/live mode to load chain-derived stats.</p>
          </div>
        </div>
      </div>
    );
  }

  const stats = statsQuery.data?.ok
    ? statsQuery.data.data
    : {
        totalRoundsPlayed: 0,
        totalSurvivedRounds: 0,
        totalKills: 0,
        totalPaidOut: '0',
        totalClaimed: '0',
        currentClaimable: '0',
        netMonDelta: '0',
      };

  const historyRows = historyQuery.data?.ok ? historyQuery.data.data : [];
  const meta = statsQuery.data?.ok ? statsQuery.data.meta : null;
  const gamesPlayed = stats.totalRoundsPlayed;
  const wins = stats.totalSurvivedRounds;
  const winRate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0;
  const estimatedPayout = Number(seasonEstimateMon ?? '0');
  const netMon = Number(normalizeMonString(stats.netMonDelta));

  const loadError = statsQuery.error ?? historyQuery.error;

  return (
    <div className="h-full w-full bg-[#0a0a0a] overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 size={24} className="text-app-accent" />
            <h1 className="text-[24px] font-app-bold text-white uppercase tracking-wide">
              My Stats
            </h1>
          </div>
          <p className="text-app-muted text-[13px]">
            {address ? 'Your chain-derived performance overview' : 'Connect wallet to view your stats'}
          </p>
          {meta && (
            <div className="mt-2 text-[10px] text-app-muted uppercase tracking-wide flex flex-wrap gap-3">
              <span>source: {meta.source}</span>
              <span>{meta.isPending ? 'pending confirmations' : 'confirmed snapshot'}</span>
              <span>{meta.isStale ? 'stale/degraded' : 'fresh'}</span>
            </div>
          )}
        </div>

        {!addressFull ? (
          <div className="text-center py-20 text-app-muted">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-[14px]">Connect your wallet to view personal statistics.</p>
          </div>
        ) : statsQuery.isLoading ? (
          <div className="bg-[#111] border border-[#222] p-5 text-[12px] text-app-muted mb-6">Loading stats...</div>
        ) : loadError ? (
          <div className="bg-red-500/10 border border-red-500/30 p-5 text-[12px] text-red-400 mb-6">
            {getApiErrorMessage(loadError)}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard
                icon={<Target size={20} />}
                label="Total Kills"
                value={stats.totalKills.toString()}
                subtext={wins > 0 ? 'Active' : 'No wins yet'}
                highlight={wins > 0}
              />
              <StatCard
                icon={<Trophy size={20} />}
                label="Season Estimate"
                value={`${estimatedPayout.toFixed(1)}`}
                subtext="MON"
                highlight={estimatedPayout > 0}
              />
              <StatCard
                icon={<TrendingUp size={20} />}
                label="Win Rate"
                value={`${winRate}%`}
                subtext="All Time"
              />
              <StatCard
                icon={<Skull size={20} />}
                label="Rounds"
                value={gamesPlayed.toString()}
                subtext="Completed"
              />
            </div>

            <div className="bg-[#111] border border-[#222] p-6 mb-6">
              <h2 className="text-[14px] font-app-bold text-white uppercase mb-4">Performance Summary</h2>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <div className="text-[11px] text-app-muted uppercase mb-1">Net MON</div>
                  <div className={`text-[24px] font-app-mono ${netMon >= 0 ? 'text-app-accent' : 'text-red-500'}`}>
                    {netMon >= 0 ? '+' : ''}{netMon.toFixed(1)} <span className="text-[14px]">MON</span>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-app-muted uppercase mb-1">Total Wins</div>
                  <div className="text-[24px] font-app-mono text-white">{wins}</div>
                </div>
              </div>
            </div>

            <div className="bg-[#111] border border-[#222] p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <History size={18} className="text-app-accent" />
                <h2 className="text-[14px] font-app-bold text-white uppercase">Round History</h2>
              </div>

              {historyQuery.isLoading ? (
                <div className="text-[11px] text-app-muted py-2">Loading history...</div>
              ) : historyQuery.error ? (
                <div className="text-[11px] text-red-400 py-2">{getApiErrorMessage(historyQuery.error)}</div>
              ) : (
                <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto custom-scrollbar pr-1">
                  {historyRows.slice(0, 12).map((row) => {
                    const payout = Number(normalizeMonString(row.payoutAmount));
                    return (
                      <div key={`${row.roundId}-${row.joinedAt ?? 'na'}`} className="flex items-center justify-between py-2 px-3 bg-[#0a0a0a] border border-[#222]">
                        <div className="text-[11px] font-app-bold text-app-muted">#{row.roundId}</div>
                        <div className="text-[10px] font-app-bold text-white uppercase">{row.kills} Kills</div>
                        <div className={`text-[11px] font-app-bold text-right ${payout > 0 ? 'text-app-accent' : 'text-app-muted'}`}>
                          {payout > 0 ? '+' : ''}{payout.toFixed(1)} MON
                        </div>
                      </div>
                    );
                  })}

                  {historyRows.length === 0 && (
                    <div className="text-[11px] font-app-bold text-app-muted italic py-4 text-center">No recent activity.</div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-[#111] border border-[#222] p-6">
              <h2 className="text-[14px] font-app-bold text-white uppercase mb-4">Payout Summary</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-app-muted text-[13px]">Total Paid Out</span>
                  <span className="text-white text-[13px] font-app-mono">{normalizeMonString(stats.totalPaidOut)} MON</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-app-muted text-[13px]">Total Claimed</span>
                  <span className="text-white text-[13px] font-app-mono">{normalizeMonString(stats.totalClaimed)} MON</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-app-muted text-[13px]">Current Claimable</span>
                  <span className="text-white text-[13px] font-app-mono">{normalizeMonString(stats.currentClaimable)} MON</span>
                </div>
                <div className="flex justify-between border-t border-[#222] pt-3 mt-3">
                  <span className="text-app-muted text-[13px]">Rounds Survived</span>
                  <span className="text-app-accent text-[13px] font-app-mono">{stats.totalSurvivedRounds}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, subtext, highlight = false }: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
  highlight?: boolean;
}) {
  return (
    <div className="bg-[#111] border border-[#222] p-4">
      <div className={`mb-2 ${highlight ? 'text-app-accent' : 'text-app-muted'}`}>
        {icon}
      </div>
      <div className="text-[11px] text-app-muted uppercase mb-1">{label}</div>
      <div className={`text-[20px] font-app-mono ${highlight ? 'text-app-accent' : 'text-white'}`}>
        {value}
      </div>
      <div className="text-[10px] text-app-muted">{subtext}</div>
    </div>
  );
}
