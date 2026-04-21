import React from 'react';
import { NavItem } from './NavItem';
import { 
  Swords, 
  Trophy, 
  ScrollText, 
  BarChart3,
  BookOpen,
  History,
  Settings, 
  HelpCircle 
} from 'lucide-react';
import { useGameStore } from '../../store/gameStore';

interface ChannelNavProps {
  onNavigate?: (view: string) => void;
  currentView?: string;
}

export function ChannelNav({ onNavigate, currentView = 'arena' }: ChannelNavProps) {
  const phase = useGameStore(state => state.phase);
  const roundNumber = useGameStore(state => state.roundNumber);
  const seasonNumber = useGameStore(state => state.seasonNumber);

  const isLive = phase === 'live';
  const isEntryOpen = phase === 'entry_open';

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
        
        {/* Main Navigation - Core Game Loop */}
        <div className="text-[10px] text-app-muted uppercase font-app-bold tracking-widest px-3 mb-2">
          Game
        </div>
        <div className="flex flex-col gap-1 mb-6">
          <NavItem 
            icon={<Swords size={16} />} 
            label="Arena" 
            isActive={currentView === 'arena'}
            onClick={() => onNavigate?.('arena')}
            badge={isLive ? 'LIVE' : isEntryOpen ? 'OPEN' : undefined}
            badgeColor={isLive ? 'red' : isEntryOpen ? 'green' : undefined}
          />
          <NavItem 
            icon={<Trophy size={16} />} 
            label="Season Rank" 
            isActive={currentView === 'rank'}
            onClick={() => onNavigate?.('rank')}
          />
          <NavItem 
            icon={<BarChart3 size={16} />} 
            label="My Stats" 
            isActive={currentView === 'stats'}
            onClick={() => onNavigate?.('stats')}
          />
        </div>

        {/* Information & Resources */}
        <div className="text-[10px] text-app-muted uppercase font-app-bold tracking-widest px-3 mb-2">
          Intel
        </div>
        <div className="flex flex-col gap-1 mb-6">
          <NavItem 
            icon={<History size={16} />} 
            label="Round History" 
            isActive={currentView === 'history'}
            onClick={() => onNavigate?.('history')}
          />
          <NavItem 
            icon={<ScrollText size={16} />} 
            label="How to Play" 
            isActive={currentView === 'guide'}
            onClick={() => onNavigate?.('guide')}
          />
        </div>

      </div>

      {/* Bottom Actions */}
      <div className="p-4 border-t border-app-border shrink-0 flex flex-col gap-1">
         <NavItem 
           icon={<Settings size={16} />} 
           label="Settings" 
           isActive={currentView === 'settings'}
           onClick={() => onNavigate?.('settings')}
         />
         <NavItem 
           icon={<HelpCircle size={16} />} 
           label="Support" 
           isActive={currentView === 'support'}
           onClick={() => onNavigate?.('support')}
         />
      </div>
    </div>
  );
}
