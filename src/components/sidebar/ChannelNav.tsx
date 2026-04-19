import React from 'react';
import { NavItem } from './NavItem';
import { Settings, HelpCircle } from 'lucide-react';

export function ChannelNav() {
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <div className="flex-1 overflow-y-auto px-2 py-4 custom-scrollbar">
        
        <div className="text-[10px] text-app-muted uppercase font-app-bold tracking-widest px-3 mb-2 mt-2">Official</div>
        <div className="flex flex-col gap-1 mb-6">
          <NavItem icon="#" label="arena" isActive />
          <NavItem icon="#" label="rules" />
          <NavItem icon="#" label="winners" />
          <NavItem icon="#" label="audit-log" />
        </div>

        <div className="text-[10px] text-app-muted uppercase font-app-bold tracking-widest px-3 mb-2">Rooms</div>
        <div className="flex flex-col gap-1">
          <NavItem icon="+" label="create-room" />
          <NavItem icon="★" label="featured-rooms" />
          <NavItem icon="#" label="room-001" />
          <NavItem icon="#" label="room-002" />
        </div>
      </div>

      {/* Bottom pinned */}
      <div className="p-4 border-t border-app-border shrink-0 flex flex-col gap-2">
         <button className="flex items-center gap-3 text-app-muted hover:text-white font-app-mono text-[13px] transition-colors p-2 group border-l-2 border-transparent">
           <Settings size={16} className="opacity-70 group-hover:opacity-100" /> <span>Settings</span>
         </button>
         <button className="flex items-center gap-3 text-app-muted hover:text-white font-app-mono text-[13px] transition-colors p-2 group border-l-2 border-transparent">
           <HelpCircle size={16} className="opacity-70 group-hover:opacity-100" /> <span>Support</span>
         </button>
      </div>
    </div>
  );
}
