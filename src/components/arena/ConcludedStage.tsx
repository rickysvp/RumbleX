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
    <div className="absolute inset-0 flex flex-col p-4 md:p-8 overflow-hidden">
      
      {/* Header: Round Info - 更大的顶部区域 */}
      <div className="w-full max-w-5xl mx-auto mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pb-4 border-b-2 border-white/10">
          {/* 左侧：轮次信息 */}
          <div className="flex items-baseline gap-4">
            <span className="text-app-accent font-app-bold text-[32px] md:text-[48px] uppercase tracking-[2px] leading-none">
              #{roundNumber}
            </span>
            <span className="text-app-muted font-app-bold text-[14px] md:text-[16px] uppercase tracking-[4px]">
              ROUND CONCLUDED
            </span>
          </div>
          
          {/* 右侧：统计数据 */}
          <div className="flex items-center gap-8">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-app-muted uppercase tracking-[2px] mb-1">PLAYERS</span>
              <span className="text-white font-app-mono text-[20px] md:text-[24px]">{totalParticipants}</span>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-app-accent uppercase tracking-[2px] mb-1">PRIZE POOL</span>
              <span className="text-app-accent font-app-mono text-[20px] md:text-[24px]">{totalPrizePool.toFixed(1)} MON</span>
            </div>
          </div>
        </div>
      </div>

      {/* Survivor Leaderboard */}
      <div className="w-full max-w-5xl mx-auto flex-1 overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[12px] text-app-muted uppercase font-app-bold tracking-[4px] flex items-center gap-2">
            <Swords size={12} />
            FINAL STANDINGS
          </div>
          <div className="text-[10px] text-app-muted">
            {aliveCount} SURVIVORS
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            {survivors.map((player, index) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 ${
                  index === 0 
                    ? 'bg-app-accent/10 border-2 border-app-accent/40' 
                    : 'bg-white/[0.03] border border-white/10'
                }`}
              >
                <div className="flex items-center gap-4">
                  <span className={`text-[16px] font-app-mono w-8 ${
                    index === 0 ? 'text-app-accent' : 'text-app-muted'
                  }`}>
                    #{index + 1}
                  </span>
                  <span className={`text-[15px] font-app-bold uppercase tracking-wide ${
                    player.isUser ? 'text-app-accent' : 'text-white'
                  }`}>
                    {player.handle}
                  </span>
                  {player.status === 'alive' && (
                    <span className="text-[9px] bg-green-500/20 text-green-400 px-2 py-1 uppercase tracking-wider">SURVIVOR</span>
                  )}
                  {player.isUser && (
                    <span className="text-[9px] bg-app-accent/20 text-app-accent px-2 py-1 uppercase tracking-wider">YOU</span>
                  )}
                </div>
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <span className="text-[10px] text-app-muted uppercase tracking-wider block mb-1">KILLS</span>
                    <span className="text-[14px] text-white font-app-mono">{player.kills}</span>
                  </div>
                  <div className="text-right min-w-[100px]">
                    <span className="text-[10px] text-app-muted uppercase tracking-wider block mb-1">EARNED</span>
                    <span className={`text-[18px] font-app-mono ${
                      index === 0 ? 'text-app-accent' : 'text-white'
                    }`}>
                      {player.mon.toFixed(1)} MON
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom Action */}
      <div className="w-full max-w-5xl mx-auto mt-6">
        {queueRemaining > 0 ? (
          <div className="bg-app-accent/10 border-2 border-app-accent/30 p-5 flex items-center justify-between">
            <div>
              <div className="text-app-accent font-app-bold text-[16px] uppercase tracking-[4px]">AUTO_QUEUE_ACTIVE</div>
              <div className="text-app-muted text-[12px] font-app-mono mt-1">{queueRemaining} ROUNDS REMAINING</div>
            </div>
            <div className="text-right">
              <div className="text-white font-app-mono text-[28px]">{formatTime(timeRemaining)}</div>
              <div className="text-[10px] text-app-muted uppercase tracking-wider">Next Round</div>
            </div>
          </div>
        ) : (
          <div className="flex items-stretch gap-px bg-app-border border-2 border-app-border">
            <div className="flex-[2] bg-[#050505] p-5 flex flex-col justify-center">
              <div className="text-white font-app-bold text-[14px] uppercase tracking-[4px]">NEXT ROUND</div>
              <div className="text-app-muted font-app-mono text-[12px] mt-1">Opens in {formatTime(timeRemaining)}</div>
            </div>
            <button
              onClick={openNextRound}
              className="flex-1 bg-app-accent hover:bg-white text-black font-app-bold py-5 px-10 uppercase tracking-[6px] transition-all flex items-center justify-center gap-3 text-[16px]"
            >
              ENTER <ChevronRight size={20} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
