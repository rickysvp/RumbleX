import React from 'react';
import { getApiErrorMessage, normalizeMonNumber, normalizeMonString } from '../../api/format';
import { useRoundsRecent, useSeasonCurrent, useSeasonRank } from '../../hooks/queries/useInsightsQueries';
import './intel.css';

export function IntelTower() {
  return (
    <section className="h-full border-l border-app-border bg-[#0a0a0a] overflow-hidden">
      <LiveIntelPanel />
    </section>
  );
}

function LiveIntelPanel() {
  const seasonCurrentQuery = useSeasonCurrent();
  const seasonId = seasonCurrentQuery.data?.ok ? seasonCurrentQuery.data.data.seasonId : null;
  const seasonRankQuery = useSeasonRank(seasonId);
  const roundsQuery = useRoundsRecent(10);

  const season = seasonCurrentQuery.data?.ok ? seasonCurrentQuery.data.data : null;
  const ranks = seasonRankQuery.data?.ok ? seasonRankQuery.data.data : [];
  const rounds = roundsQuery.data?.ok ? roundsQuery.data.data : [];
  const topRanks = ranks.slice(0, 5);
  const loadError = seasonCurrentQuery.error ?? seasonRankQuery.error ?? roundsQuery.error;

  return (
    <div className="h-full overflow-y-auto custom-scrollbar p-4 space-y-4">
      <div className="border border-[#222] bg-[#111] p-3">
        <div className="text-[10px] text-app-muted uppercase tracking-wide mb-1">Current Season</div>
        <div className="text-white font-app-bold text-[15px]">
          {season ? `Season ${season.seasonId}` : "--"}
        </div>
        <div className="text-[11px] text-app-accent font-app-mono mt-2">
          Pool: {season ? `${normalizeMonNumber(season.prizePool).toFixed(1)} MON` : "--"}
        </div>
        <div className="text-[10px] text-app-muted mt-1">
          Threshold: {season?.qualificationKillThreshold ?? "--"} kills
        </div>
      </div>

      <div className="border border-[#222] bg-[#111] p-3">
        <div className="text-[10px] text-app-muted uppercase tracking-wide mb-2">Top Players</div>
        {topRanks.length === 0 ? (
          <div className="text-[11px] text-app-muted">No rank records yet.</div>
        ) : (
          <div className="space-y-2">
            {topRanks.map((row, index) => (
              <div key={`${row.playerAddress}-${index}`} className="flex items-center justify-between text-[11px]">
                <span className="text-white truncate max-w-[130px]">#{index + 1} {row.displayName || `${row.playerAddress.slice(0, 6)}...${row.playerAddress.slice(-4)}`}</span>
                <span className="text-app-accent font-app-mono">{row.totalKills}K</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border border-[#222] bg-[#111] p-3">
        <div className="text-[10px] text-app-muted uppercase tracking-wide mb-2">Recent Rounds</div>
        {rounds.length === 0 ? (
          <div className="text-[11px] text-app-muted">No settled rounds.</div>
        ) : (
          <div className="space-y-2">
            {rounds.slice(0, 6).map((row) => (
              <div key={row.roundId} className="text-[11px] border border-[#222] bg-[#0a0a0a] p-2">
                <div className="flex items-center justify-between">
                  <span className="text-white font-app-bold">#{row.roundId}</span>
                  <span className="text-app-muted">{row.participants}P / {row.survivors}S</span>
                </div>
                <div className="text-app-accent font-app-mono mt-1">{normalizeMonString(row.volume)} MON</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {loadError && (
        <div className="border border-red-500/30 bg-red-500/10 text-red-400 text-[11px] p-3">
          {getApiErrorMessage(loadError)}
        </div>
      )}
    </div>
  );
}
