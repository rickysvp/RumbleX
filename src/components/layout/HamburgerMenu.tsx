import React from 'react';
import { X } from 'lucide-react';
import { LeftSidebar } from '../sidebar/LeftSidebar';

interface HamburgerMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

export function HamburgerMenu({ isOpen, onClose }: HamburgerMenuProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm transition-opacity duration-300" 
        onClick={onClose}
      />
      
      {/* Drawer */}
      <div className="relative w-[300px] max-w-[85vw] h-full bg-app-bg border-r border-app-border flex flex-col transform transition-transform duration-300 ease-out shadow-2xl animate-[slideInLeft_0.3s_ease-out]">
        <div className="p-6 border-b border-app-border flex justify-between items-center bg-[#0a0a0a]">
          <span className="font-app-bold text-app-accent tracking-widest text-[16px]">NAVIGATION</span>
          <button onClick={onClose} className="p-2 -mr-2 text-app-muted hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <LeftSidebar />
        </div>
      </div>
    </div>
  );
}
