import React, { useEffect, useState, useRef } from 'react';
import { useGameStore } from '../../../store/gameStore';
import { SEASON_CONFIG } from '../../../lib/seasonConfig';

// 翻牌数字组件
function FlipDigit({ value, key }: { value: string; key?: number }) {
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

// 实心问号图标
function SolidHelpIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17h-2v-2h2v2zm2.07-7.75l-.9.92C13.45 12.9 13 13.5 13 15h-2v-.5c0-1.1.45-2.1 1.17-2.83l1.24-1.26c.37-.36.59-.86.59-1.41 0-1.1-.9-2-2-2s-2 .9-2 2H8c0-2.21 1.79-4 4-4s4 1.79 4 4c0 .88-.36 1.68-.93 2.25z"/>
    </svg>
  );
}

export function SeasonInfo() {
  const seasonNumber = useGameStore(state => state.seasonNumber || 1);
  const seasonPool = useGameStore(state => state.seasonPool || 0);
  const seasonEndsIn = useGameStore(state => state.seasonEndsIn || 0);
  
  const [timeLeft, setTimeLeft] = useState(seasonEndsIn);
  const [showTooltip, setShowTooltip] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);
  
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
      <div className="flex items-center justify-between mb-4 relative">
        <div className="font-app-bold text-[12px] uppercase tracking-wide text-white">
          Season {seasonNumber} Prize Pool
        </div>
        
        {/* 问号按钮和浮层容器 */}
        <div className="relative" ref={tooltipRef}>
          <button 
            onClick={() => setShowTooltip(!showTooltip)}
            className="text-app-muted hover:text-app-accent transition-colors"
          >
            <SolidHelpIcon size={14} />
          </button>
          
          {/* 气泡式浮层 - 相对定位 */}
          {showTooltip && (
            <>
              {/* 遮罩层 - 点击关闭 */}
              <div 
                className="fixed inset-0 z-[99]" 
                onClick={() => setShowTooltip(false)}
              />
              
              {/* 浮层内容 */}
              <div 
                className="absolute top-full right-0 mt-2 w-[240px] bg-[#0a0a0a] border border-app-border p-3 shadow-2xl z-[100]"
                onClick={e => e.stopPropagation()}
              >
                {/* 气泡箭头 */}
                <div className="absolute -top-[6px] right-[4px] w-3 h-3 bg-[#0a0a0a] border-t border-l border-app-border rotate-45" />
                
                <div className="relative">
                  <div className="font-app-bold text-[11px] text-white uppercase tracking-wide mb-2">
                    Prize Pool Info
                  </div>
                  
                  <div className="text-[9px] text-app-muted leading-relaxed space-y-1.5">
                    <p>
                      Accumulates from 10% of all entry fees. Qualified players share the pool at season end.
                    </p>
                    <div className="flex justify-between border-t border-[#222] pt-1.5">
                      <span>Platform Fee</span>
                      <span className="text-app-accent">10%</span>
                    </div>
                    <div className="flex justify-between border-t border-[#222] pt-1.5">
                      <span>Qualification</span>
                      <span className="text-white">{SEASON_CONFIG.SEASON_KILL_THRESHOLD}+ Kills</span>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
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
    </div>
  );
}
