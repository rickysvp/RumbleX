import React, { useEffect } from 'react';
import { useDevStore } from '../../store/devStore';
import { PhaseControl } from './PhaseControl';
import { SimControl } from './SimControl';
import { WalletControl } from './WalletControl';
import { EventInjector } from './EventInjector';
import { StoreInspector } from './StoreInspector';
import { IntegrationChecklist } from './IntegrationChecklist';
import { X } from 'lucide-react';

export function DebugPanel() {
  const { isOpen, togglePanel } = useDevStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === 'D') {
        e.preventDefault();
        togglePanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePanel]);

  if (process.env.NODE_ENV !== 'development' || !isOpen) return null;

  return (
    <div className="fixed bottom-0 right-0 w-[320px] max-h-[85vh] bg-[#0a0a0a] border-l border-t border-app-accent z-[9999] flex flex-col shadow-[0_0_40px_rgba(0,0,0,0.8)]">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-[#222] bg-[#111] shrink-0">
        <div className="flex items-center gap-2">
           <div className="w-2 h-2 bg-app-accent"></div>
           <span className="text-[12px] font-app-bold tracking-[2px] text-white">⚙ DEV PANEL</span>
        </div>
        <button 
          onClick={togglePanel}
          className="text-app-muted hover:text-white flex items-center gap-1 transition-colors"
        >
          <span className="text-[9px] font-app-mono uppercase">[X] Close</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-grow overflow-y-auto p-4 flex flex-col gap-6 custom-scrollbar pb-10">
        <PhaseControl />
        <SimControl />
        <WalletControl />
        <EventInjector />
        <StoreInspector />
        <IntegrationChecklist />
      </div>
    </div>
  );
}
