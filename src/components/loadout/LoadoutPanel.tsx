import React, { useEffect, useState } from 'react';
import { RoundsSelector } from './RoundsSelector';
import { StrategyCards } from './StrategyCards';
import { SkillCards } from './SkillCards';
import { ItemCards } from './ItemCards';
import { CostSummary } from './CostSummary';
import { useLoadout } from '../../hooks/useLoadout';

export function LoadoutPanel({ roundNumber, readOnly, onClose, onConfirm }: { roundNumber?: number, readOnly?: boolean, onClose: () => void, onConfirm: (config: any) => void }) {
  const loadout = useLoadout();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    requestAnimationFrame(() => setMounted(true));
  }, []);

  return (
    <div 
      className={`bg-app-bg transition-opacity duration-100 ease-out flex flex-col relative w-full h-full overflow-hidden ${
        mounted ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b border-app-border shrink-0 bg-[#0a0a0a] z-10">
        <div className="flex-1 min-w-0">
          <h2 className="font-app-bold text-[14px] tracking-wide uppercase text-white truncate">
             {readOnly ? 'YOUR LOADOUT' : 'CONFIGURE'} — ROUND #{roundNumber || '843'}
          </h2>
        </div>
        <button onClick={() => { setMounted(false); setTimeout(onClose, 100); }} className="px-3 py-2 border border-app-border text-app-muted hover:border-white hover:text-white font-app-mono text-[12px] bg-[#111] transition-colors shrink-0 ml-2">
          ✕
        </button>
      </div>

      {readOnly && (
        <div className="bg-app-accent py-2 px-4 flex items-center justify-center gap-2 shrink-0">
           <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
           <span className="text-black font-app-bold text-[9px] uppercase tracking-[1px]">Locked · Round starts soon</span>
        </div>
      )}

      {/* 移动端布局：上下结构 */}
      <div className="flex-1 flex flex-col md:hidden overflow-hidden">
        {/* 顶部固定：Queued Rounds */}
        <div className="shrink-0 bg-[#0a0a0a] border-b border-app-border p-4">
          <RoundsSelector rounds={loadout.rounds} setRounds={loadout.setRounds} readOnly={readOnly} />
        </div>
        
        {/* Content - 可滚动区域 */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 pb-[180px]">
            <StrategyCards selected={loadout.strategy} onSelect={loadout.setStrategy} readOnly={readOnly} />
            <SkillCards selected={loadout.skill} onSelect={loadout.setSkill} readOnly={readOnly} />
            <ItemCards selected={loadout.item} onSelect={loadout.setItem} readOnly={readOnly} />
          </div>
        </div>
        
        {/* 底部固定按钮区域 */}
        <div className="absolute bottom-0 left-0 right-0 bg-[#0a0a0a] border-t border-app-border z-20">
          <CostSummary 
            rounds={loadout.rounds}
            skillPrice={loadout.skillPrice}
            itemPrice={loadout.itemPrice}
            totalCost={loadout.totalCost}
            startingMON={loadout.startingMON}
            entryFeePerRound={loadout.entryFeePerRound}
            config={loadout.config}
            readOnly={readOnly}
            onConfirm={() => {
                setMounted(false);
                setTimeout(() => onConfirm({ ...loadout.config }), 100);
            }}
          />
        </div>
      </div>

      {/* 桌面端布局：左右分栏 */}
      <div className="hidden md:flex flex-1 overflow-hidden">
        {/* 左侧：配置区域 */}
        <div className="flex-1 overflow-y-auto">
          {/* 顶部固定：Queued Rounds */}
          <div className="sticky top-0 bg-[#0a0a0a] border-b border-app-border p-6 z-10">
            <RoundsSelector rounds={loadout.rounds} setRounds={loadout.setRounds} readOnly={readOnly} />
          </div>
          
          <div className="p-6 pb-8">
            <StrategyCards selected={loadout.strategy} onSelect={loadout.setStrategy} readOnly={readOnly} />
            <SkillCards selected={loadout.skill} onSelect={loadout.setSkill} readOnly={readOnly} />
            <ItemCards selected={loadout.item} onSelect={loadout.setItem} readOnly={readOnly} />
          </div>
        </div>
        
        {/* 右侧：成本汇总 - 固定宽度 */}
        <div className="w-[320px] lg:w-[380px] border-l border-app-border bg-[#0a0a0a] flex flex-col">
          <div className="flex-1 overflow-y-auto">
            <CostSummary 
              rounds={loadout.rounds}
              skillPrice={loadout.skillPrice}
              itemPrice={loadout.itemPrice}
              totalCost={loadout.totalCost}
              startingMON={loadout.startingMON}
              entryFeePerRound={loadout.entryFeePerRound}
              config={loadout.config}
              readOnly={readOnly}
              onConfirm={() => {
                  setMounted(false);
                  setTimeout(() => onConfirm({ ...loadout.config }), 100);
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
