import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../../store/gameStore';
import { SEASON_CONFIG } from '../../../lib/seasonConfig';
import { HelpCircle, X } from 'lucide-react';

// 翻牌数字组件
function FlipDigit({ value }: { value: string }) {
  return (
    <div className="relative w-[22px] h-[32px] bg-[#111] border border-[#333] rounded overflow-hidden">
      {/* 上半部分 */}
      <div className="absolute top-0 left-0 right-0 h-1/2 bg-[#1a1a1a] border-b border-[#333] flex items-end justify-center overflow-hidden">
        <span className="text-[20px] font-app-bold text-white leading-none translate-y-1/2">{value}</span>
      </div>
      {/* 下半部分 */}
      <div className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#111] flex items-start justify-center overflow-hidden">
        <span className="text-[20px] font-app-bold text-white leading-none -translate-y-1/2">{value}</span>
      </div>
      {/* 中间线 */}
      <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-[#333]" />
    </div>
  );
}

// 翻牌时间单位组件
function FlipTimeUnit({ value, label }: { value: number; label: string }) {
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

// 天数翻牌组件
function FlipDays({ value }: { value: number }) {
  const str = value.toString();
  
  return (
    <div className="flex flex-col items-center gap-1">
      <div className="flex gap-[2px]">
        {str.split('').map((digit, i) => (
          <FlipDigit key={i} value={digit} />
        ))}
      </div>
      <span className="text-[8px] text-app-muted uppercase tracking-wider">DAYS</span>
    </div>
  );
}

// 分隔符
function Separator() {
  return (
    <div className="flex flex-col items-center justify-center gap-2 pt-2">
      <div className="w-1 h-1 rounded-full bg-app-accent/50" />
      <div className="w-1 h-1 rounded-full bg-app-accent/50" />
    </div>
  );
}

// 奖池说明浮层
function PrizePoolTooltip({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-[#0a0a0a] border border-app-border p-5 max-w-[320px] w-full mx-4 relative" onClick={e => e.stopPropagation()}>
        <button 
          onClick={onClose}
          className="absolute top-3 right-3 text-app-muted hover:text-white transition-colors"
        >
          <X size={16} />
        </button>
        
        <div className="font-app-bold text-[14px] text-white uppercase tracking-wide mb-3">
          Season Prize Pool
        </div>
        
        <div className="text-[11px] text-app-muted leading-relaxed space-y-2">
          <p>
            The season prize pool accumulates from all entry fees across every round. 
            At the end of the season, qualified players share the pool based on their performance.
          </p>
          <p>
            <span className="text-app-accent">Platform Fee:</span> 10% of all entry fees go to platform operations.
          </p>
          <p>
            <span className="text-app-accent">Season Pool:</span> 10% of all entry fees contribute to this season's prize pool.
          </p>
          <p>
            <span className="text-white">Qualification:</span> Achieve {SEASON_CONFIG.SEASON_KILL_THRESHOLD}+ kills during the season to be eligible for rewards.
          </p>
        </div>
      </div>
    </div>
  );
}

export function SeasonInfo() {
  const seasonNumber = useGameStore(state => state.seasonNumber || 1);
  const seasonPool = useGameStore(state => state.seasonPool || 0);
  const seasonEndsIn = useGameStore(state => state.seasonEndsIn || 0);
  
  const [timeLeft, setTimeLeft] = useState(seasonEndsIn);
  const [showTooltip, setShowTooltip] = useState(false);
  
  useEffect(() => {
    setTimeLeft(seasonEndsIn);
  }, [seasonEndsIn]);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const days = Math.floor(timeLeft / (24 * 3600));
  const hours = Math.floor((timeLeft % (24 * 3600)) / 3600);
  const mins = Math.floor((timeLeft % 3600) / 60);
  const secs = timeLeft % 60;

  return (
    <div className="p-5 border-b border-app-border">
      {/* 标题 */}
      <div className="flex items-center gap-2 mb-4">
        <div className="font-app-bold text-[12px] uppercase tracking-wide text-white">
          Season {seasonNumber} Prize Pool
        </div>
        <button 
          onClick={() => setShowTooltip(true)}
          className="text-app-muted hover:text-app-accent transition-colors"
        >
          <HelpCircle size={14} />
        </button>
      </div>

      {/* 奖池数字 - 超大显示 */}
      <div className="mb-6 flex items-baseline gap-2">
        <span className="text-[48px] font-app-bold text-app-accent leading-none tracking-tight">
          {seasonPool.toFixed(0)}
        </span>
        <span className="text-[14px] text-app-muted font-app-bold">MON</span>
      </div>

      {/* 翻牌倒计时 */}
      <div className="mb-4">
        <div className="flex items-start justify-center gap-2">
          <FlipDays value={days} />
          <Separator />
          <FlipTimeUnit value={hours} label="HRS" />
          <Separator />
          <FlipTimeUnit value={mins} label="MIN" />
          <Separator />
          <FlipTimeUnit value={secs} label="SEC" />
        </div>
      </div>

      {/* 资格说明 */}
      <div className="text-[8px] text-app-muted font-app-bold uppercase tracking-wider border-t border-[#1a1a1a] pt-3 leading-relaxed text-center">
        {SEASON_CONFIG.SEASON_KILL_THRESHOLD}+ KILLS TO QUALIFY
      </div>

      {/* 说明浮层 */}
      <PrizePoolTooltip isOpen={showTooltip} onClose={() => setShowTooltip(false)} />
    </div>
  );
}
