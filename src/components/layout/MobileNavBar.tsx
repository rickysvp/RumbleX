import React from 'react';
import { Sword, BarChart3, User, MessageSquare } from 'lucide-react';

export type TabId = 'ARENA' | 'INTEL' | 'PROFILE' | 'FEED';

interface MobileNavBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
}

export function MobileNavBar({ activeTab, onTabChange }: MobileNavBarProps) {
  const tabs = [
    { id: 'ARENA', icon: Sword, label: 'ARENA' },
    { id: 'INTEL', icon: BarChart3, label: 'INTEL' },
    { id: 'PROFILE', icon: User, label: 'PROFILE' },
    { id: 'FEED', icon: MessageSquare, label: 'FEED' },
  ] as const;

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[64px] bg-[#0a0a0a] border-t border-app-border flex items-center justify-around px-2 z-[100] md:hidden">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        const Icon = tab.icon;
        
        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center flex-1 h-full gap-1 transition-colors ${
              isActive ? 'text-app-accent' : 'text-app-muted'
            }`}
          >
            <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
            <span className="text-[10px] font-app-bold tracking-widest leading-none">
              {tab.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}
