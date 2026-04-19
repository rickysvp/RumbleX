import React from 'react';

interface NavItemProps {
  icon: React.ReactNode | string;
  label: string;
  isActive?: boolean;
}

export function NavItem({ icon, label, isActive }: NavItemProps) {
  return (
    <button className={`w-full flex items-center gap-3 px-3 py-[10px] text-[13px] font-app-mono transition-all group ${
      isActive 
        ? 'bg-app-accent text-[#000] font-bold' 
        : 'text-app-muted hover:text-white border-l-2 border-transparent hover:border-app-accent hover:bg-[#111]'
    }`}>
      <span className={`w-4 text-center ${isActive ? 'text-[#000]' : 'opacity-70'}`}>{icon}</span>
      <span className="truncate tracking-wide">{label}</span>
    </button>
  );
}
