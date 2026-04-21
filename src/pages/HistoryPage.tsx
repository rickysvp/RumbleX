import React, { useState } from 'react';
import { History, Trophy, Users, Clock, ExternalLink, Shield, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';

// Mock round history data - in production this would come from blockchain/indexer
const roundHistoryData = [
  {
    round: 843,
    season: 1,
    endTime: '2026-04-21T14:40:00Z',
    participants: 447,
    survivors: 3,
    prizePool: 447,
    txHash: '0x7a8b9c...d2e3f4',
    survivorList: [
      { name: 'CRYPTOKNIGHT', kills: 12, earnings: 156.5 },
      { name: 'VIPER_X', kills: 8, earnings: 98.2 },
      { name: 'NEONBLADE', kills: 5, earnings: 67.3 },
    ]
  },
  {
    round: 842,
    season: 1,
    endTime: '2026-04-21T14:30:00Z',
    participants: 398,
    survivors: 1,
    prizePool: 398,
    txHash: '0x1a2b3c...d4e5f6',
    survivorList: [
      { name: 'SHADOWHUNTER', kills: 18, earnings: 284.0 },
    ]
  },
  {
    round: 841,
    season: 1,
    endTime: '2026-04-21T14:20:00Z',
    participants: 521,
    survivors: 2,
    prizePool: 521,
    txHash: '0x9a8b7c...d6e5f4',
    survivorList: [
      { name: 'GHOSTWALKER', kills: 15, earnings: 245.5 },
      { name: 'IRONFIST', kills: 11, earnings: 178.3 },
    ]
  },
  {
    round: 840,
    season: 1,
    endTime: '2026-04-21T14:10:00Z',
    participants: 412,
    survivors: 4,
    prizePool: 412,
    txHash: '0x3a4b5c...d7e8f9',
    survivorList: [
      { name: 'BLAZE_RUNNER', kills: 9, earnings: 98.0 },
      { name: 'FROST_BITE', kills: 7, earnings: 76.5 },
      { name: 'THUNDER_STRIKE', kills: 6, earnings: 65.2 },
      { name: 'STEEL_HEART', kills: 4, earnings: 48.3 },
    ]
  },
  {
    round: 839,
    season: 1,
    endTime: '2026-04-21T14:00:00Z',
    participants: 356,
    survivors: 1,
    prizePool: 356,
    txHash: '0x5a6b7c...d8e9f0',
    survivorList: [
      { name: 'PHANTOM_SLAYER', kills: 22, earnings: 312.5 },
    ]
  },
];

export function HistoryPage() {
  const [expandedRound, setExpandedRound] = useState<number | null>(null);

  const toggleExpand = (round: number) => {
    setExpandedRound(expandedRound === round ? null : round);
  };

  return (
    <div className="h-full w-full bg-[#0a0a0a] overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <History size={24} className="text-app-accent" />
            <h1 className="text-[24px] font-app-bold text-white uppercase tracking-wide">
              Round History
            </h1>
          </div>
          <p className="text-app-muted text-[13px]">
            Historical round snapshot archive. Metadata provided for simulation and prototype verification.
          </p>
        </div>

        {/* Verification Banner */}
        <div className="bg-app-accent/10 border border-app-accent/30 p-4 mb-6 flex items-center gap-3">
          <Shield size={18} className="text-app-accent" />
          <div>
            <div className="text-[12px] text-app-accent font-app-bold uppercase">System Archive</div>
            <div className="text-[11px] text-app-muted">Round results are archived for prototype evaluation. Transaction hashes shown are simulated.</div>
          </div>
        </div>

        {/* Round History Table */}
        <div className="bg-[#111] border border-[#222]">
          <div className="grid grid-cols-12 gap-4 p-4 border-b border-[#222] text-[10px] text-app-muted uppercase tracking-wider font-app-bold">
            <div className="col-span-1">Round</div>
            <div className="col-span-2">Time</div>
            <div className="col-span-2 text-right">Players</div>
            <div className="col-span-2 text-right">Round Volume</div>
            <div className="col-span-3">Survivors</div>
            <div className="col-span-2 text-right">Verification</div>
          </div>
          
          <div className="divide-y divide-[#222]">
            {roundHistoryData.map((round) => (
              <div key={round.round}>
                {/* Main Row - Clickable */}
                <div 
                  className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-white/[0.02] transition-colors cursor-pointer"
                  onClick={() => toggleExpand(round.round)}
                >
                  {/* Round */}
                  <div className="col-span-1">
                    <span className="text-white font-app-bold text-[14px]">#{round.round}</span>
                  </div>
                  
                  {/* Time */}
                  <div className="col-span-2">
                    <div className="text-[11px] text-app-muted flex items-center gap-1">
                      <Clock size={10} />
                      {new Date(round.endTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                    <div className="text-[10px] text-[#444]">
                      {new Date(round.endTime).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {/* Players */}
                  <div className="col-span-2 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Users size={12} className="text-app-muted" />
                      <span className="text-white font-app-mono text-[13px]">{round.participants}</span>
                    </div>
                  </div>
                  
                  {/* Round Volume */}
                  <div className="col-span-2 text-right">
                    <span className="text-app-accent font-app-mono text-[14px]">{round.prizePool}</span>
                    <span className="text-[10px] text-app-muted ml-1">MON</span>
                  </div>
                  
                  {/* Survivors */}
                  <div className="col-span-3">
                    <div className="flex items-center gap-2">
                      <Trophy size={12} className="text-app-accent" />
                      <span className="text-white font-app-bold text-[13px]">{round.survivors} Survivors</span>
                      {expandedRound === round.round ? (
                        <ChevronUp size={14} className="text-app-muted" />
                      ) : (
                        <ChevronDown size={14} className="text-app-muted" />
                      )}
                    </div>
                  </div>
                  
                  {/* Verification */}
                  <div className="col-span-2 text-right">
                    <a 
                      href={`https://testnet.monadexplorer.com/tx/${round.txHash}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="inline-flex items-center gap-1.5 text-[10px] text-green-400 hover:text-green-300 transition-colors"
                    >
                      <CheckCircle size={10} />
                      <span className="font-app-mono">{round.txHash}</span>
                      <ExternalLink size={10} />
                    </a>
                  </div>
                </div>

                {/* Expanded Detail Row */}
                {expandedRound === round.round && (
                  <div className="bg-black/40 border-t border-[#222] p-4">
                    <div className="text-[10px] text-app-muted uppercase tracking-wider mb-3">Survivor Details</div>
                    <div className="space-y-2">
                      {round.survivorList.map((survivor, index) => (
                        <div key={index} className="flex items-center justify-between bg-[#0a0a0a] p-3 border border-[#222]">
                          <div className="flex items-center gap-3">
                            <span className="text-[11px] text-app-muted w-6">#{index + 1}</span>
                            <span className="text-[13px] text-white font-app-bold uppercase">{survivor.name}</span>
                          </div>
                          <div className="flex items-center gap-6">
                            <span className="text-[11px] text-app-muted">{survivor.kills} kills</span>
                            <span className="text-[13px] text-app-accent font-app-mono">+{survivor.earnings.toFixed(1)} MON Carry Out</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div className="bg-[#111] border border-[#222] p-4 text-center">
            <div className="text-[10px] text-app-muted uppercase mb-1">Total Rounds</div>
            <div className="text-[28px] font-app-mono text-white">843</div>
          </div>
          <div className="bg-[#111] border border-[#222] p-4 text-center">
            <div className="text-[10px] text-app-muted uppercase mb-1">Total Players</div>
            <div className="text-[28px] font-app-mono text-app-accent">284,392</div>
          </div>
          <div className="bg-[#111] border border-[#222] p-4 text-center">
            <div className="text-[10px] text-app-muted uppercase mb-1">Total Volume</div>
            <div className="text-[28px] font-app-mono text-app-accent">142.5K</div>
            <div className="text-[10px] text-app-muted">MON</div>
          </div>
          <div className="bg-[#111] border border-[#222] p-4 text-center">
            <div className="text-[10px] text-app-muted uppercase mb-1">Avg Survival Rate</div>
            <div className="text-[28px] font-app-mono text-white">0.8%</div>
          </div>
        </div>
      </div>
    </div>
  );
}
