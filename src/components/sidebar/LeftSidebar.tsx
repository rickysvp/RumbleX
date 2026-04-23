import React, { useState } from 'react';
import { ChannelNav } from './ChannelNav';
import { useWalletStore } from '../../store/walletStore';
import { useGameStore } from '../../store/gameStore';
import { User, Trophy, Edit2, Check, X, Ticket } from 'lucide-react';
import { SEASON_CONFIG } from '../../lib/seasonConfig';

interface LeftSidebarProps {
  onNavigate?: (view: string) => void;
  currentView?: string;
}

export function LeftSidebar({ onNavigate, currentView = 'arena' }: LeftSidebarProps) {
  const { status: walletStatus, address, monBalance, hasRumbleXPass, claimableMon, isStale, dataSource } = useWalletStore();
  const { 
    userHandle, 
    seasonNumber, 
    userStats,
    leaderboard,
    userHistory,
    updateUserHandle
  } = useGameStore();
  
  const [isEditing, setIsEditing] = useState(false);
  const [newHandle, setNewHandle] = useState(userHandle);
  
  const isConnected = walletStatus === 'connected';
  const userEntry = leaderboard.find(e => e.isUser);
  const kills = userEntry?.kills || 0;
  const qualified = userEntry?.qualified || false;
  const threshold = SEASON_CONFIG.SEASON_KILL_THRESHOLD;
  
  // Calculate stats
  const roundsPlayed = userHistory?.length || 0;
  const monWon = userStats?.netMon || 0;

  const handleSave = () => {
    if (newHandle.trim()) {
      updateUserHandle(newHandle.trim());
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    setNewHandle(userHandle);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#0a0a0a] w-full border-r border-app-border">
      {/* User Profile Card */}
      <div className="p-4 border-b border-app-border bg-[#0a0a0a]">
        {/* Profile Info */}
        <div className="flex items-center gap-3 mb-3">
          {/* Simple Avatar */}
          {isConnected ? (
            <div className="w-10 h-10 bg-app-accent/10 border border-app-accent/30 flex items-center justify-center">
              <User size={18} className="text-app-accent" />
            </div>
          ) : (
            <div className="w-10 h-10 bg-[#1a1a1a] border border-[#333] flex items-center justify-center">
              <User size={18} className="text-app-muted" />
            </div>
          )}
          
          <div className="flex-1 min-w-0">
            {isEditing ? (
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={newHandle}
                  onChange={(e) => setNewHandle(e.target.value)}
                  className="w-full bg-[#111] border border-app-accent/50 text-white text-[12px] px-2 py-1 focus:outline-none"
                  maxLength={20}
                />
                <button onClick={handleSave} className="p-1 text-app-accent hover:text-white">
                  <Check size={14} />
                </button>
                <button onClick={handleCancel} className="p-1 text-app-muted hover:text-white">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="text-[13px] font-app-bold text-white truncate">
                  {isConnected ? userHandle : 'Guest'}
                </div>
                {isConnected && (
                  <button 
                    onClick={() => setIsEditing(true)}
                    className="text-app-muted hover:text-app-accent transition-colors"
                  >
                    <Edit2 size={12} />
                  </button>
                )}
              </div>
            )}
            {/* RumbleX Pass Status */}
            {isConnected && (
              <div className="flex items-center gap-1 mt-0.5">
                <Ticket size={10} className={hasRumbleXPass ? 'text-app-accent' : 'text-app-muted'} />
                <span className={`text-[9px] uppercase tracking-wide ${hasRumbleXPass ? 'text-app-accent' : 'text-app-muted'}`}>
                  {hasRumbleXPass ? 'RumbleX Pass Active' : 'No Pass'}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Balance */}
        {isConnected && (
          <div className="flex items-center justify-between py-2 px-3 bg-[#111] border border-[#222] mb-3">
            <div className="flex flex-col">
              <span className="text-[10px] text-app-muted uppercase">Balance</span>
              {(isStale || dataSource === "chain") && (
                <span className="text-[8px] text-yellow-400 uppercase">stale/degraded</span>
              )}
            </div>
            <div className="text-right">
              <span className="text-[13px] font-app-bold text-app-accent block">
                {monBalance.toFixed(2)} MON
              </span>
              <span className="text-[10px] text-app-muted block">
                Claimable: {claimableMon}
              </span>
            </div>
          </div>
        )}

        {/* Season Info */}
        <div className="border-t border-[#222] pt-3">
          <div className="flex items-center gap-2 mb-2">
            <Trophy size={12} className="text-app-accent" />
            <span className="text-[10px] text-app-muted uppercase tracking-wide">Season {seasonNumber}</span>
          </div>
          
          {isConnected ? (
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-app-muted uppercase">Kills</span>
                <span className="text-[11px] font-app-bold text-white">{kills}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-app-muted uppercase">Rounds</span>
                <span className="text-[11px] font-app-bold text-white">{roundsPlayed}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[9px] text-app-muted uppercase">MON Won</span>
                <span className={`text-[11px] font-app-bold ${monWon >= 0 ? 'text-app-accent' : 'text-red-400'}`}>
                  {monWon > 0 ? '+' : ''}{monWon.toFixed(2)}
                </span>
              </div>
              
              {/* Qualification Progress Bar - 右边栏样式 */}
              <div className="mt-4 px-1">
                <div className="flex justify-between items-end mb-2">
                  <div className="text-[9px] font-app-bold text-white uppercase tracking-wide">
                    ★ {userHandle}: {kills} / {threshold} Kills
                  </div>
                  <div className="text-[8px] font-app-bold text-app-muted uppercase">
                    {qualified ? 'QUALIFIED' : `${threshold - kills} TO QUALIFY`}
                  </div>
                </div>
                <div className="h-1.5 bg-black border border-[#222] rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-app-accent transition-all duration-500 ease-out shadow-[0_0_8px_rgba(217,255,0,0.4)]"
                    style={{ width: `${Math.min((kills / threshold) * 100, 100)}%` }}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="text-[9px] text-app-muted italic">
              Connect wallet to view season stats
            </div>
          )}
        </div>
      </div>

      <ChannelNav onNavigate={onNavigate} currentView={currentView} />
    </div>
  );
}
