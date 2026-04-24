import React, { useEffect, useState } from 'react';
import { useWalletStore } from '../store/walletStore';
import { Trophy, Crown, Target, Users, Award, Clock, ChevronDown } from 'lucide-react';
import { getApiErrorMessage, normalizeMonNumber } from '../api/format';
import { isLiveSummaryMode } from '../config/dataMode';
import { useSeasonCurrent, useSeasonRank } from '../hooks/queries/useInsightsQueries';

function FlipDigit({ value }: { value: string }) {
  return (
    <div className="relative w-[22px] h-[32px] bg-[#111] border border-[#333] rounded overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-[#1a1a1a] border-b border-[#333] flex items-end justify-center overflow-hidden">
        <span className="text-[20px] font-app-bold text-white leading-none translate-y-1/2">{value}</span>
      </div>
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#111] flex items-start justify-center overflow-hidden">
        <span className="text-[20px] font-app-bold text-white leading-none -translate-y-1/2">{value}</span>
      </div>
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#333]" />
    </div>
  );
}

function FlipUnit({ value, label }: { value: number; label: string }) {
  const str = value.toString().padStart(2, '0');
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-[2px]">
        <FlipDigit value={str[0]} />
        <FlipDigit value={str[1]} />
      </div>
      <span className="text-[8px] text-app-muted uppercase tracking-wider">{label}</span>
    </div>
  );
}

function CountdownTimer({ seconds }: { seconds: number }) {
  const [timeLeft, setTimeLeft] = useState(seconds);

  useEffect(() => {
    setTimeLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const days = Math.floor(timeLeft / 86400);
  const hours = Math.floor((timeLeft % 86400) / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  return (
    <div className="flex items-start justify-center gap-2">
      {days > 0 && (
        <>
          <FlipUnit value={days} label="DAYS" />
          <div className="flex flex-col items-center justify-center gap-2 pt-2">
            <div className="w-1 h-1 rounded-full bg-app-accent/50" />
            <div className="w-1 h-1 rounded-full bg-app-accent/50" />
          </div>
        </>
      )}
      <FlipUnit value={hours} label="HRS" />
      <div className="flex flex-col items-center justify-center gap-2 pt-2">
        <div className="w-1 h-1 rounded-full bg-app-accent/50" />
        <div className="w-1 h-1 rounded-full bg-app-accent/50" />
      </div>
      <FlipUnit value={mins} label="MIN" />
      <div className="flex flex-col items-center justify-center gap-2 pt-2">
        <div className="w-1 h-1 rounded-full bg-app-accent/50" />
        <div className="w-1 h-1 rounded-full bg-app-accent/50" />
      </div>
      <FlipUnit value={secs} label="SEC" />
    </div>
  );
}

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function RankPage() {
  const { status: walletStatus, addressFull } = useWalletStore();
  const [showSeasonDropdown, setShowSeasonDropdown] = useState(false);
  const liveMode = isLiveSummaryMode();

  const seasonCurrentQuery = useSeasonCurrent();
  const seasonId = seasonCurrentQuery.data?.ok ? seasonCurrentQuery.data.data.seasonId : null;
  const seasonRankQuery = useSeasonRank(seasonId);

  if (!liveMode) {
    return (
      <div className="h-full w-full bg-[#0a0a0a] overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-2">
              <Trophy size={24} className="text-app-accent" />
              <h1 className="text-[24px] font-app-bold text-white uppercase tracking-wide">Season Rankings</h1>
            </div>
            <p className="text-app-muted text-[13px]">Switch to hybrid/live mode to load chain-derived rankings.</p>
          </div>
        </div>
      </div>
    );
  }

  const season = seasonCurrentQuery.data?.ok ? seasonCurrentQuery.data.data : null;
  const rankRows = seasonRankQuery.data?.ok ? seasonRankQuery.data.data : [];
  const meta = seasonRankQuery.data?.ok
    ? seasonRankQuery.data.meta
    : seasonCurrentQuery.data?.ok
      ? seasonCurrentQuery.data.meta
      : null;

  const mappedRows = rankRows.map((row) => ({
    handle: row.displayName || shortAddress(row.playerAddress),
    playerAddress: row.playerAddress,
    kills: row.totalKills,
    estimatedPayout: normalizeMonNumber(row.estimatedReward),
    qualified: row.qualified,
  }));

  const threshold = season?.qualificationKillThreshold ?? 0;
  const isConnected = walletStatus === 'connected';
  const qualifiedCount = mappedRows.filter((row) => row.qualified).length;
  const userRankIndex = addressFull
    ? mappedRows.findIndex((row) => row.playerAddress.toLowerCase() === addressFull.toLowerCase())
    : -1;
  const userEntry = userRankIndex >= 0 ? mappedRows[userRankIndex] : null;
  const userRank = userRankIndex >= 0 ? userRankIndex + 1 : null;

  const seasonEndsIn = season?.endsAt
    ? Math.max(0, Math.floor((new Date(season.endsAt).getTime() - Date.now()) / 1000))
    : 0;

  const loadError = seasonCurrentQuery.error ?? seasonRankQuery.error;

  return (
    <div className="h-full w-full bg-[#0a0a0a] overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Trophy size={24} className="text-app-accent" />
            <h1 className="text-[24px] font-app-bold text-white uppercase tracking-wide">
              Season Rankings
            </h1>
          </div>

          <div className="relative mt-4">
            <button
              onClick={() => setShowSeasonDropdown(!showSeasonDropdown)}
              className="flex items-center gap-2 bg-[#111] border border-[#222] px-4 py-2 text-white hover:border-app-accent transition-colors"
            >
              <span className="font-app-bold">{season ? `Season ${season.seasonId} (Current)` : 'Current Season'}</span>
              <ChevronDown size={16} className={`transition-transform ${showSeasonDropdown ? 'rotate-180' : ''}`} />
            </button>

            {showSeasonDropdown && (
              <div className="absolute top-full left-0 mt-1 bg-[#111] border border-[#222] min-w-[200px] z-10">
                <button
                  onClick={() => setShowSeasonDropdown(false)}
                  className="w-full text-left px-4 py-2 text-[13px] hover:bg-white/5 transition-colors text-app-accent"
                >
                  <div className="flex items-center justify-between">
                    <span>{season ? `Season ${season.seasonId} (Current)` : 'Current Season'}</span>
                    <span className="text-[9px] bg-app-accent/20 text-app-accent px-1.5 py-0.5 rounded">ACTIVE</span>
                  </div>
                </button>
              </div>
            )}
          </div>

          {meta && (
            <div className="mt-2 text-[10px] text-app-muted uppercase tracking-wide flex flex-wrap gap-3">
              <span>source: {meta.source}</span>
              <span>{meta.isPending ? 'pending confirmations' : 'confirmed snapshot'}</span>
              <span>{meta.isStale ? 'stale/degraded' : 'fresh'}</span>
            </div>
          )}
        </div>

        {seasonCurrentQuery.isLoading ? (
          <div className="bg-[#111] border border-[#222] p-5 text-[12px] text-app-muted mb-6">Loading season info...</div>
        ) : loadError ? (
          <div className="bg-red-500/10 border border-red-500/30 p-5 text-[12px] text-red-400 mb-6">
            {getApiErrorMessage(loadError)}
          </div>
        ) : (
          <>
            <div className="bg-[#111] border border-[#222] p-5 mb-6">
              <div className="flex items-center justify-center gap-2 mb-4">
                <Clock size={14} className="text-app-accent" />
                <span className="text-[10px] text-app-muted uppercase tracking-wide">Season Ends In</span>
              </div>
              <CountdownTimer seconds={seasonEndsIn} />
            </div>

            <div className="grid grid-cols-3 gap-4 mb-8">
              <div className="bg-[#111] border border-[#222] p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Award size={14} className="text-app-accent" />
                  <span className="text-[10px] text-app-muted uppercase">Prize Pool</span>
                </div>
                <div className="text-[20px] font-app-bold text-app-accent">{normalizeMonNumber(season?.prizePool ?? '0').toFixed(0)} MON</div>
              </div>
              <div className="bg-[#111] border border-[#222] p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Users size={14} className="text-app-accent" />
                  <span className="text-[10px] text-app-muted uppercase">Qualified</span>
                </div>
                <div className="text-[20px] font-app-bold text-white">{qualifiedCount}</div>
              </div>
              <div className="bg-[#111] border border-[#222] p-4 text-center">
                <div className="flex items-center justify-center gap-2 mb-1">
                  <Target size={14} className="text-app-accent" />
                  <span className="text-[10px] text-app-muted uppercase">Threshold</span>
                </div>
                <div className="text-[20px] font-app-bold text-white">{threshold} Kills</div>
              </div>
            </div>

            {isConnected && userEntry && userRank && (
              <div className="mb-6 p-4 bg-app-accent/10 border border-app-accent/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-[24px] font-app-bold text-app-accent">#{userRank}</div>
                    <div>
                      <div className="text-white font-app-bold text-[14px]">{userEntry.handle}</div>
                      <div className="text-[11px] text-app-muted">
                        {userEntry.kills} Kills • {userEntry.qualified ? 'Qualified' : `${Math.max(0, threshold - userEntry.kills)} to go`}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-app-accent font-app-mono text-[18px]">
                      {userEntry.estimatedPayout.toFixed(1)} MON
                    </div>
                    <div className="text-[10px] text-app-muted">Est. Reward</div>
                  </div>
                </div>
              </div>
            )}

            {seasonRankQuery.isLoading ? (
              <div className="bg-[#111] border border-[#222] p-5 text-[12px] text-app-muted mb-6">Loading rankings...</div>
            ) : mappedRows.length === 0 ? (
              <div className="bg-[#111] border border-[#222] p-5 text-[12px] text-app-muted mb-6">No rank records yet.</div>
            ) : (
              <>
                {mappedRows.length >= 3 && (
                  <div className="grid grid-cols-3 gap-3 mb-6 items-end">
                    <div className="bg-[#151515] border border-[#333] p-4 text-center">
                      <div className="text-[32px] mb-2">🥈</div>
                      <div className="text-white font-app-bold text-[13px] truncate mb-1">{mappedRows[1]?.handle}</div>
                      <div className="text-[11px] text-app-muted">{mappedRows[1]?.kills} Kills</div>
                      <div className="text-app-accent font-app-mono text-[14px] mt-2">{mappedRows[1]?.estimatedPayout.toFixed(0)} MON</div>
                    </div>
                    <div className="bg-app-accent/10 border border-app-accent/30 p-5 text-center">
                      <Crown size={24} className="text-yellow-400 mx-auto mb-2" />
                      <div className="text-[40px] mb-2">🥇</div>
                      <div className="text-white font-app-bold text-[15px] truncate mb-1">{mappedRows[0]?.handle}</div>
                      <div className="text-[12px] text-app-accent">{mappedRows[0]?.kills} Kills</div>
                      <div className="text-app-accent font-app-mono text-[18px] mt-2 font-bold">{mappedRows[0]?.estimatedPayout.toFixed(0)} MON</div>
                    </div>
                    <div className="bg-[#151515] border border-[#333] p-4 text-center">
                      <div className="text-[32px] mb-2">🥉</div>
                      <div className="text-white font-app-bold text-[13px] truncate mb-1">{mappedRows[2]?.handle}</div>
                      <div className="text-[11px] text-app-muted">{mappedRows[2]?.kills} Kills</div>
                      <div className="text-app-accent font-app-mono text-[14px] mt-2">{mappedRows[2]?.estimatedPayout.toFixed(0)} MON</div>
                    </div>
                  </div>
                )}

                <div className="bg-[#111] border border-[#222]">
                  <div className="grid grid-cols-[50px_1fr_80px_100px] gap-2 p-3 text-[10px] text-app-muted uppercase font-app-bold tracking-wide border-b border-[#222]">
                    <div>Rank</div>
                    <div>Player</div>
                    <div className="text-right">Kills</div>
                    <div className="text-right">Reward</div>
                  </div>

                  {mappedRows.slice(3).map((player, index) => (
                    <div
                      key={player.playerAddress}
                      className="grid grid-cols-[50px_1fr_80px_100px] gap-2 p-3 items-center border-b border-[#222] last:border-0 hover:bg-white/[0.02]"
                    >
                      <div className="text-[13px] font-app-bold text-app-muted">#{index + 4}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-app-bold text-[13px] truncate">{player.handle}</span>
                        {player.qualified && (
                          <span className="text-[8px] bg-app-accent/20 text-app-accent px-1 py-0.5 rounded">Q</span>
                        )}
                      </div>
                      <div className="text-right text-[13px] text-white font-app-mono">{player.kills}</div>
                      <div className="text-right text-[13px] text-app-accent font-app-mono">
                        {player.estimatedPayout >= 1000
                          ? `${(player.estimatedPayout / 1000).toFixed(1)}K`
                          : player.estimatedPayout.toFixed(0)} MON
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            <div className="mt-6 p-4 bg-[#111] border border-[#222]">
              <h3 className="text-[12px] font-app-bold text-white uppercase mb-3">How Season Rewards Work</h3>
              <ul className="text-[11px] text-app-muted space-y-2">
                <li>• Achieve {threshold}+ kills to qualify for season rewards</li>
                <li>• Qualified players share the season prize pool based on kill count</li>
                <li>• Rewards are distributed at the end of each season</li>
                <li>• Current season pool: <span className="text-app-accent font-bold">{normalizeMonNumber(season?.prizePool ?? '0').toFixed(0)} MON</span></li>
              </ul>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
