import React from 'react';
import { useGameStore } from '../store/gameStore';
import { History, Trophy, Skull, Clock } from 'lucide-react';

export function HistoryPage() {
  const feedEvents = useGameStore(state => state.feedEvents || []);
  const roundNumber = useGameStore(state => state.roundNumber);
  
  // Filter user's personal events
  const userEvents = feedEvents.filter(ev => 
    ev.attacker === 'PILOT_01' || ev.target === 'PILOT_01'
  );

  // Mock round history (would come from store in real implementation)
  const roundHistory = [
    { round: 842, result: 'WIN', kills: 5, earnings: 45.5, date: '2026-04-19' },
    { round: 841, result: 'ELIMINATED', kills: 2, earnings: 0, date: '2026-04-19' },
    { round: 840, result: 'WIN', kills: 7, earnings: 52.0, date: '2026-04-18' },
    { round: 839, result: 'ELIMINATED', kills: 1, earnings: 0, date: '2026-04-18' },
    { round: 838, result: 'WIN', kills: 4, earnings: 38.5, date: '2026-04-17' },
  ];

  return (
    <div className="h-full w-full bg-[#0a0a0a] overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <History size={24} className="text-app-accent" />
            <h1 className="text-[24px] font-app-bold text-white uppercase tracking-wide">
              History
            </h1>
          </div>
          <p className="text-app-muted text-[13px]">
            Your battle history and recent activity
          </p>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-[#111] border border-[#222] p-4 text-center">
            <div className="text-[11px] text-app-muted uppercase mb-1">Total Wins</div>
            <div className="text-[24px] font-app-mono text-app-accent">3</div>
          </div>
          <div className="bg-[#111] border border-[#222] p-4 text-center">
            <div className="text-[11px] text-app-muted uppercase mb-1">Total Kills</div>
            <div className="text-[24px] font-app-mono text-white">19</div>
          </div>
          <div className="bg-[#111] border border-[#222] p-4 text-center">
            <div className="text-[11px] text-app-muted uppercase mb-1">Total Earnings</div>
            <div className="text-[24px] font-app-mono text-app-accent">136.0</div>
          </div>
        </div>

        {/* Round History */}
        <div className="bg-[#111] border border-[#222] mb-6">
          <div className="p-4 border-b border-[#222]">
            <h2 className="text-[14px] font-app-bold text-white uppercase">Round History</h2>
          </div>
          <div className="divide-y divide-[#222]">
            {roundHistory.map((round) => (
              <div key={round.round} className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 flex items-center justify-center ${
                    round.result === 'WIN' ? 'bg-green-500/10' : 'bg-red-500/10'
                  }`}>
                    {round.result === 'WIN' ? (
                      <Trophy size={16} className="text-green-400" />
                    ) : (
                      <Skull size={16} className="text-red-400" />
                    )}
                  </div>
                  <div>
                    <div className="text-white font-app-bold text-[14px]">Round #{round.round}</div>
                    <div className="text-[11px] text-app-muted flex items-center gap-2">
                      <Clock size={10} />
                      {round.date}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-[14px] font-app-mono ${
                    round.earnings > 0 ? 'text-app-accent' : 'text-app-muted'
                  }`}>
                    {round.earnings > 0 ? '+' : ''}{round.earnings.toFixed(1)} MON
                  </div>
                  <div className="text-[10px] text-app-muted">{round.kills} Kills</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        {userEvents.length > 0 && (
          <div className="bg-[#111] border border-[#222]">
            <div className="p-4 border-b border-[#222]">
              <h2 className="text-[14px] font-app-bold text-white uppercase">Recent Activity</h2>
            </div>
            <div className="p-4 space-y-2">
              {userEvents.slice(0, 5).map((event, index) => (
                <div key={index} className="text-[12px] text-app-muted py-2 border-b border-[#222] last:border-0">
                  {event.text}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
