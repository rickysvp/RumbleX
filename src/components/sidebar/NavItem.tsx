import React from 'react';

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
  badge?: string;
  badgeColor?: 'red' | 'green' | 'yellow';
}

export function NavItem({ 
  icon, 
  label, 
  isActive, 
  onClick, 
  disabled,
  badge,
  badgeColor = 'yellow'
}: NavItemProps) {
  const badgeStyles = {
    red: 'bg-red-500/20 text-red-400 border-red-500/30',
    green: 'bg-green-500/20 text-green-400 border-green-500/30',
    yellow: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  };

  return (
    <button 
      onClick={onClick}
      disabled={disabled}
      className={`w-full flex items-center justify-between px-3 py-[10px] text-[13px] font-app-mono transition-all group rounded-sm ${
        disabled 
          ? 'opacity-40 cursor-not-allowed text-app-muted'
          : isActive 
            ? 'bg-app-accent text-black font-bold' 
            : 'text-app-muted hover:text-white hover:bg-[#111]'
      }`}
    >
      <div className="flex items-center gap-3">
        <span className={`w-5 flex items-center justify-center ${isActive ? 'text-black' : 'opacity-70 group-hover:opacity-100'}`}>
          {icon}
        </span>
        <span className="truncate tracking-wide">{label}</span>
      </div>
      
      {badge && !disabled && (
        <span className={`text-[9px] px-1.5 py-0.5 rounded border ${badgeStyles[badgeColor]} font-bold`}>
          {badge}
        </span>
      )}
    </button>
  );
}
