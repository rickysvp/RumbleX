import React from 'react';
import { useGameStore } from '../../store/gameStore';
import { ChevronRight, Users, Trophy, Swords } from 'lucide-react';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export function ConcludedStage() {
  const roundNumber = useGameStore(state => state.roundNumber);
  const timeRemaining = useGameStore(state => state.timeRemaining);
  const queueRemaining = useGameStore(state => state.userLoadout.queueRemaining);
  const players = useGameStore(state => state.players);
  const openNextRound = useGameStore(state => state.openNextRound);

  // 获取本轮存活玩家，按收益排序
  const survivors = players
    .filter(p => p.status === 'alive' || p.status === 'eliminated')
    .sort((a, b) => b.mon - a.mon);

  const aliveCount = players.filter(p => p.status === 'alive').length;
  const totalParticipants = players.filter(p => p.status !== 'spectating').length;
  const totalPrizePool = players.reduce((acc, p) => acc + p.mon, 0);

  return (
    <div className="h-full w-full flex flex-col p-3 sm:p-4 md:p-8 overflow-hidden">
      
      {/* Header: Round Info - 更大的顶部区域 */}
      <div className="w-full max-w-5xl mx-auto mb-3 sm:mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 sm:gap-4 pb-2 sm:pb-4 border-b-2 border-white/10">
          {/* 左侧：轮次信息 */}
          <div className="flex items-baseline gap-2 sm:gap-4">
            <span className="text-app-accent font-app-bold text-[24px] sm:text-[32px] md:text-[48px] uppercase tracking-[2px] leading-none">
              #{roundNumber}
            </span>
            <span className="text-app-muted font-app-bold text-[11px] sm:text-[14px] md:text-[16px] uppercase tracking-[2px] sm:tracking-[4px]">
              ROUND CONCLUDED
            </span>
          </div>
          
          {/* 右侧：统计数据 */}
          <div className="flex items-center gap-4 sm:gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[9px] sm:text-[10px] text-app-muted uppercase tracking-[2px] mb-0.5 sm:mb-1">PLAYERS</span>
              <span className="text-white font-app-mono text-[16px] sm:text-[20px] md:text-[24px]">{totalParticipants}</span>
            </div>
            <div className="w-px h-8 sm:h-10 bg-white/20" />
            <div className="flex flex-col items-end">
              <span className="text-[9px] sm:text-[10px] text-app-accent uppercase tracking-[2px] mb-0.5 sm:mb-1">PRIZE POOL</span>
              <span className="text-app-accent font-app-mono text-[16px] sm:text-[20px] md:text-[24px]">{totalPrizePool.toFixed(1)} <span className="text-[10px] md:text-[12px]">MON</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Survivor Leaderboard */}
      <div className="w-full max-w-5xl mx-auto flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <div className="text-[10px] sm:text-[12px] text-app-muted uppercase font-app-bold tracking-[2px] sm:tracking-[4px] flex items-center gap-2">
            <Swords size={10} className="sm:w-3 sm:h-3" />
            FINAL STANDINGS
          </div>
          <div className="text-[9px] sm:text-[10px] text-app-muted">
            {aliveCount} SURVIVORS
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          <div className="space-y-1.5 sm:space-y-2">
            {survivors.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-2 sm:p-4 ${
                  index === 0 
                    ? 'bg-app-accent/10 border-2 border-app-accent/40' 
                    : 'bg-white/[0.03] border border-white/10'
                }`}
              >
                <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
                  <span className={`text-[13px] sm:text-[16px] font-app-mono w-6 sm:w-8 shrink-0 ${
                    index === 0 ? 'text-app-accent' : 'text-app-muted'
                  }`}>
                    #{index + 1}
                  </span>
                  <span className={`text-[12px] sm:text-[15px] font-app-bold uppercase tracking-wide truncate ${
                    player.isUser ? 'text-app-accent' : 'text-white'
                  }`}>
                    {player.handle}
                  </span>
                  {player.status === 'alive' && (
                    <span className="hidden sm:inline text-[8px] sm:text-[9px] bg-green-500/20 text-green-400 px-1.5 sm:px-2 py-0.5 sm:py-1 uppercase tracking-wider shrink-0">SURVIVOR</span>
                  )}
                  {player.isUser && (
                    <span className="text-[8px] sm:text-[9px] bg-app-accent/20 text-app-accent px-1.5 sm:px-2 py-0.5 sm:py-1 uppercase tracking-wider shrink-0">YOU</span>
                  )}
                </div>
                <div className="flex items-center gap-3 sm:gap-8 shrink-0">
                  <div className="text-right">
                    <span className="text-[8px] sm:text-[10px] text-app-muted uppercase tracking-wider block mb-0.5 sm:mb-1">KILLS</span>
                    <span className="text-[12px] sm:text-[14px] text-white font-app-mono">{player.kills}</span>
                  </div>
                  <div className="text-right min-w-[70px] sm:min-w-[100px]">
                    <span className="text-[8px] sm:text-[10px] text-app-muted uppercase tracking-wider block mb-0.5 sm:mb-1">EARNED</span>
                    <span className={`text-[14px] sm:text-[18px] font-app-mono ${
                      index === 0 ? 'text-app-accent' : 'text-white'
                    }`}>
                      {player.mon.toFixed(1)} <span className="text-[9px] sm:text-[11px]">MON</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="w-full max-w-5xl mx-auto mt-3 sm:mt-6 shrink-0">
        {queueRemaining > 0 ? (
          <div className="bg-app-accent/10 border-2 border-app-accent/30 p-3 sm:p-5 flex items-center justify-between">
            <div>
              <div className="text-app-accent font-app-bold text-[12px] sm:text-[16px] uppercase tracking-[2px] sm:tracking-[4px]">AUTO_QUEUE_ACTIVE</div>
              <div className="text-app-muted text-[10px] sm:text-[12px] font-app-mono mt-0.5 sm:mt-1">{queueRemaining} ROUNDS REMAINING</div>
            </div>
            <div className="text-right">
              <div className="text-white font-app-mono text-[20px] sm:text-[28px]">{formatTime(timeRemaining)}</div>
              <div className="text-[9px] sm:text-[10px] text-app-muted uppercase tracking-wider">Next Round</div>
            </div>
          </div>
        ) : (
          <div className="flex items-stretch gap-px bg-app-border border-2 border-app-border">
            <div className="flex-[2] bg-[#050505] p-3 sm:p-5 flex flex-col justify-center">
              <div className="text-white font-app-bold text-[12px] sm:text-[14px] uppercase tracking-[2px] sm:tracking-[4px]">NEXT ROUND</div>
              <div className="text-app-muted font-app-mono text-[10px] sm:text-[12px] mt-0.5 sm:mt-1">Opens in {formatTime(timeRemaining)}</div>
            </div>
            <button
              onClick={openNextRound}
              className="flex-1 bg-app-accent hover:bg-white text-black font-app-bold py-3 sm:py-5 px-4 sm:px-10 uppercase tracking-[3px] sm:tracking-[6px] transition-all flex items-center justify-center gap-2 sm:gap-3 text-[14px] sm:text-[16px]"
            >
              ENTER <ChevronRight size={16} className="sm:w-5 sm:h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
