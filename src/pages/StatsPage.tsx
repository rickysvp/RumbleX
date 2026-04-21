import React from 'react';
import { useGameStore } from '../store/gameStore';
import { useWalletStore } from '../store/walletStore';
import { BarChart3, Target, Skull, Trophy, TrendingUp, History } from 'lucide-react';

export function StatsPage() {
  const userLoadout = useGameStore(state => state.userLoadout);
  const leaderboard = useGameStore(state => state.leaderboard);
  const userHistory = useGameStore(state => state.userHistory || []);
  const currentRound = useGameStore(state => state.roundNumber);
  const { address } = useWalletStore();
  
  // Find user in leaderboard
  const userEntry = leaderboard.find(p => p.isUser);
  
  const userStats = useGameStore(state => state.userStats);
  
  // Stats from store
  const totalKills = userEntry?.kills || 0;
  const isQualified = userEntry?.qualified || false;
  const estimatedPayout = userEntry?.estimatedPayout || 0;
  const gamesPlayed = userStats?.games || 0;
  const queueRemaining = userLoadout.queueRemaining || 0;
  const winRate = gamesPlayed > 0 ? Math.round((userStats.wins / gamesPlayed) * 100) : 0;
  const netMon = userStats?.netMon || 0;
  const wins = userStats?.wins || 0;

  return (
    <div className="h-full w-full bg-[#0a0a0a] overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BarChart3 size={24} className="text-app-accent" />
            <h1 className="text-[24px] font-app-bold text-white uppercase tracking-wide">
              My Stats
            </h1>
          </div>
          <p className="text-app-muted text-[13px]">
            {address ? 'Your performance overview' : 'Connect wallet to view your stats'}
          </p>
        </div>

        {!address ? (
          <div className="text-center py-20 text-app-muted">
            <BarChart3 size={48} className="mx-auto mb-4 opacity-20" />
            <p className="text-[14px]">Connect your wallet to view personal statistics.</p>
          </div>
        ) : (
          <>
            {/* Key Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              <StatCard 
                icon={<Target size={20} />}
                label="Total Kills"
                value={totalKills.toString()}
                subtext={isQualified ? 'Qualified' : 'Not Qualified'}
                highlight={isQualified}
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
                subtext={queueRemaining > 0 ? `${queueRemaining} queued` : 'Completed'}
              />
            </div>

            {/* Performance Summary */}
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

            {/* Round History */}
            <div className="bg-[#111] border border-[#222] p-6 mb-6">
              <div className="flex items-center gap-2 mb-4">
                <History size={18} className="text-app-accent" />
                <h2 className="text-[14px] font-app-bold text-white uppercase">Round History</h2>
              </div>
              
              <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto custom-scrollbar pr-1">
                {/* Queued Rounds */}
                {queueRemaining > 0 && Array.from({ length: Math.min(queueRemaining, 3) }).map((_, i) => (
                  <div key={`queued-${i}`} className="flex items-center justify-between py-2 px-3 bg-[#0a0a0a] border border-[#222] opacity-50">
                    <div className="text-[11px] font-app-bold text-app-muted">#{currentRound + i + 1}</div>
                    <div className="text-[9px] font-app-bold tracking-wider text-[#666] uppercase">Queued</div>
                    <div className="text-[11px] font-app-bold text-right text-[#666]">---</div>
                  </div>
                ))}
                
                {/* History Records */}
                {userHistory.slice(0, 10).map((h) => (
                  <div key={h.roundNumber} className="flex items-center justify-between py-2 px-3 bg-[#0a0a0a] border border-[#222]">
                    <div className="text-[11px] font-app-bold text-app-muted">#{h.roundNumber}</div>
                    <div className="text-[10px] font-app-bold text-white">
                      {h.kills} Kills
                    </div>
                    <div className={`text-[11px] font-app-bold text-right ${h.monDelta >= 0 ? 'text-app-accent' : 'text-red-500'}`}>
                      {h.monDelta > 0 ? '+' : ''}{h.monDelta.toFixed(1)} MON
                    </div>
                  </div>
                ))}

                {userHistory.length === 0 && queueRemaining === 0 && (
                  <div className="text-[11px] font-app-bold text-app-muted italic py-4 text-center">No recent activity.</div>
                )}
              </div>
            </div>

            {/* Current Loadout */}
            <div className="bg-[#111] border border-[#222] p-6">
              <h2 className="text-[14px] font-app-bold text-white uppercase mb-4">Current Loadout</h2>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-app-muted text-[13px]">Strategy</span>
                  <span className="text-white text-[13px] font-app-mono">{userLoadout.strategy?.replace(/_/g, ' ') || 'Default'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-app-muted text-[13px]">Skill</span>
                  <span className="text-white text-[13px] font-app-mono">{userLoadout.skill || 'None'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-app-muted text-[13px]">Item</span>
                  <span className="text-white text-[13px] font-app-mono">{userLoadout.item || 'None'}</span>
                </div>
                <div className="flex justify-between border-t border-[#222] pt-3 mt-3">
                  <span className="text-app-muted text-[13px]">Rounds Queued</span>
                  <span className="text-app-accent text-[13px] font-app-mono">{queueRemaining}</span>
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
