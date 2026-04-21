import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { Swords, Clock } from 'lucide-react';

const formatTime = (seconds: number) => {
  const m = Math.floor(seconds / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

export function ConcludedStage() {
  const roundNumber = useGameStore(state => state.roundNumber);
  const players = useGameStore(state => state.players);
  const openNextRound = useGameStore(state => state.openNextRound);
  
  // 30秒倒计时，结束后自动进入下一轮
  const [countdown, setCountdown] = useState(30);

  useEffect(() => {
    if (countdown <= 0) {
      openNextRound();
      return;
    }
    
    const timer = setInterval(() => {
      setCountdown(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [countdown, openNextRound]);

  // 获取本轮存活玩家，按收益排序
  const survivors = (players || [])
    .filter(p => p.status === 'alive' || p.status === 'eliminated')
    .sort((a, b) => b.mon - a.mon);

  const aliveCount = (players || []).filter(p => p.status === 'alive').length;
  const totalParticipants = (players || []).filter(p => p.status !== 'spectating').length;
  const totalPrizePool = (players || []).reduce((acc, p) => acc + p.mon, 0);

  return (
    <div className="h-full w-full flex flex-col p-2 sm:p-3 md:p-4 overflow-hidden">
      
      {/* Header: Round Info */}
      <div className="w-full max-w-4xl mx-auto mb-2 sm:mb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-white/10">
          {/* 左侧：轮次信息 */}
          <div className="flex items-baseline gap-2">
            <span className="text-app-accent font-app-bold text-[20px] sm:text-[28px] md:text-[36px] uppercase tracking-[2px] leading-none">
              #{roundNumber}
            </span>
            <span className="text-app-muted font-app-bold text-[10px] sm:text-[12px] uppercase tracking-[2px]">
              ROUND CONCLUDED
            </span>
          </div>
          
          {/* 右侧：统计数据 */}
          <div className="flex items-center gap-3 sm:gap-6">
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-app-muted uppercase tracking-[2px]">PLAYERS</span>
              <span className="text-white font-app-mono text-[14px] sm:text-[18px]">{totalParticipants}</span>
            </div>
            <div className="w-px h-6 sm:h-8 bg-white/20" />
            <div className="flex flex-col items-end">
              <span className="text-[8px] text-app-accent uppercase tracking-[2px]">POOL</span>
              <span className="text-app-accent font-app-mono text-[14px] sm:text-[18px]">{totalPrizePool.toFixed(1)} <span className="text-[9px]">MON</span></span>
            </div>
          </div>
        </div>
      </div>

      {/* Survivor Leaderboard */}
      <div className="w-full max-w-4xl mx-auto flex-1 overflow-hidden flex flex-col min-h-0">
        <div className="flex items-center justify-between mb-2">
          <div className="text-[9px] sm:text-[10px] text-app-muted uppercase font-app-bold tracking-[2px] flex items-center gap-1.5">
            <Swords size={9} className="sm:w-2.5 sm:h-2.5" />
            SURVIVORS
          </div>
          <div className="text-[8px] sm:text-[9px] text-app-muted">
            {aliveCount} STANDING
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
          <div className="space-y-1">
            {survivors.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-2 sm:p-3 ${
                  player.status === 'alive'
                    ? 'bg-app-accent/10 border border-app-accent/40' 
                    : 'bg-white/[0.03] border border-white/10 opacity-50'
                }`}
              >
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className={`text-[10px] sm:text-[12px] font-app-mono w-5 sm:w-6 shrink-0 ${
                    player.status === 'alive' ? 'text-app-accent' : 'text-app-muted'
                  }`}>
                    {player.status === 'alive' ? '●' : '○'}
                  </span>
                  <span className={`text-[11px] sm:text-[13px] font-app-bold uppercase tracking-wide truncate ${
                    player.isUser ? 'text-app-accent' : 'text-white'
                  }`}>
                    {player.handle}
                  </span>
                  {player.status === 'alive' && (
                    <span className="hidden sm:inline text-[7px] bg-green-500/20 text-green-400 px-1.5 py-0.5 uppercase tracking-wider shrink-0">SURVIVED</span>
                  )}
                  {player.isUser && (
                    <span className="text-[7px] bg-app-accent/20 text-app-accent px-1.5 py-0.5 uppercase tracking-wider shrink-0">YOU</span>
                  )}
                </div>
                <div className="flex items-center gap-2 sm:gap-6 shrink-0">
                  <div className="text-right">
                    <span className="text-[7px] sm:text-[8px] text-app-muted uppercase tracking-wider block">KILLS</span>
                    <span className="text-[11px] sm:text-[13px] text-white font-app-mono">{player.kills}</span>
                  </div>
                  <div className="text-right min-w-[60px] sm:min-w-[80px]">
                    <span className="text-[7px] sm:text-[8px] text-app-muted uppercase tracking-wider block">STACK</span>
                    <span className={`text-[12px] sm:text-[15px] font-app-mono ${
                      player.status === 'alive' ? 'text-app-accent' : 'text-white'
                    }`}>
                      {player.mon.toFixed(1)} <span className="text-[8px]">MON</span>
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Bottom: Auto-return countdown */}
      <div className="w-full max-w-4xl mx-auto mt-2 sm:mt-3 shrink-0">
        <div className="bg-[#0a0a0a] border border-app-border p-2 sm:p-3 flex items-center justify-center gap-2 sm:gap-3">
          <Clock size={14} className="text-app-accent sm:w-4 sm:h-4" />
          <span className="text-[10px] sm:text-[11px] text-app-muted uppercase tracking-[2px]">Returning to lobby in</span>
          <span className="text-app-accent font-app-mono text-[16px] sm:text-[20px] tracking-wider">{formatTime(countdown)}</span>
        </div>
      </div>
    </div>
  );
}
