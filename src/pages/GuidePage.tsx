import React from 'react';
import { ScrollText, Play, Shield, Zap, Target, Trophy, Clock, Skull, Scale, Ban, AlertTriangle } from 'lucide-react';

export function GuidePage() {
  return (
    <div className="h-full w-full bg-[#0a0a0a] overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <ScrollText size={24} className="text-app-accent" />
            <h1 className="text-[24px] font-app-bold text-white uppercase tracking-wide">
              How to Play
            </h1>
          </div>
          <p className="text-app-muted text-[13px]">
            Master the arena. Survive. Claim your rewards.
          </p>
        </div>

        {/* Core Concept */}
        <div className="bg-app-accent/10 border border-app-accent/30 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Target size={18} className="text-app-accent" />
            <h2 className="text-[16px] font-app-bold text-white uppercase">The Game</h2>
          </div>
          <p className="text-[14px] text-white leading-relaxed mb-4">
            RumbleX is a battlefield where you fight for MON. 
            Each round has a fixed <span className="text-app-accent font-bold">10 minute timer</span>. Eliminate opponents to steal their stack, and survive until the timer ends to keep everything you're holding.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/40 p-4 border border-app-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-app-accent" />
                <span className="text-[12px] text-app-muted uppercase">Duration</span>
              </div>
              <p className="text-[20px] font-app-bold text-white">10 Minutes</p>
              <p className="text-[11px] text-app-muted mt-1">Fixed round timer</p>
            </div>
            <div className="bg-black/40 p-4 border border-app-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <Skull size={14} className="text-app-accent" />
                <span className="text-[12px] text-app-muted uppercase">Objective</span>
              </div>
              <p className="text-[20px] font-app-bold text-white">Loot & Survive</p>
              <p className="text-[11px] text-app-muted mt-1">Steal MON and stay alive</p>
            </div>
          </div>
        </div>

        {/* Round Rewards */}
        <div className="space-y-6 mb-6">
          <GuideSection 
            icon={<Zap size={18} />}
            title="How MON Works"
            content="Every player enters the arena with an entry amount (their starting MON). When you eliminate another pilot, you instantly steal 100% of the MON they were carrying. MON is not 'earned' from the system—it is taken from your enemies."
          />

          {/* Survival Mechanics */}
          <div className="bg-[#111] border border-[#222] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Scale size={18} className="text-app-accent" />
              <h2 className="text-[14px] font-app-bold text-white uppercase">Retention Rules</h2>
            </div>
            <p className="text-[13px] text-app-muted leading-relaxed mb-4">
              RumbleX operates on a 'Keep What You Carry' model. There are no prize tiers or bonus payout layers:
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-black/40 p-3 border border-[#222]">
                <span className="text-[12px] text-white">Survivor Retention</span>
                <span className="text-[12px] text-app-accent font-app-mono">Keep 100% of held MON</span>
              </div>
              <div className="flex items-center justify-between bg-black/40 p-3 border border-[#222]">
                <span className="text-[12px] text-white">Elimination Penalty</span>
                <span className="text-[12px] text-red-500 font-app-mono">Lose all held MON</span>
              </div>
              <div className="flex items-center justify-between bg-black/40 p-3 border border-[#222]">
                <span className="text-[12px] text-white">Payout Distribution</span>
                <span className="text-[12px] text-app-muted font-app-mono">None (Instant theft loop)</span>
              </div>
            </div>
            <p className="text-[11px] text-app-muted mt-4 leading-relaxed">
              When the timer hits zero, any pilot still alive successfully extracts with their current stack. 
              The round volume shown in history represents the total MON in play during the combat loop.
            </p>
          </div>

          <GuideSection 
            icon={<Shield size={18} />}
            title="Loadout System"
            content="Before entering, configure your strategy, skill, and item. Your choices determine your combat effectiveness. Skills provide special abilities, items give equipment advantages, and strategy defines your AI behavior. Choose wisely based on your playstyle."
          />
        </div>

        {/* Anti-Cheat & Penalties */}
        <div className="bg-red-500/10 border border-red-500/30 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Ban size={18} className="text-red-400" />
            <h2 className="text-[16px] font-app-bold text-white uppercase">Fair Play & Penalties</h2>
          </div>
          <p className="text-[13px] text-app-muted leading-relaxed mb-4">
            RumbleX maintains a zero-tolerance policy for cheating. Our anti-cheat system monitors gameplay 
            patterns and on-chain activities to ensure fair competition.
          </p>
          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-black/40 p-3 border border-red-500/20">
              <AlertTriangle size={14} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-[12px] text-white font-app-bold uppercase mb-1">Prohibited Actions</div>
                <ul className="text-[11px] text-app-muted space-y-1">
                  <li>• Using bots, scripts, or automation tools</li>
                  <li>• Collusion with other players</li>
                  <li>• Exploiting game mechanics or smart contract vulnerabilities</li>
                  <li>• Multi-accounting to gain unfair advantages</li>
                </ul>
              </div>
            </div>
            <div className="flex items-start gap-3 bg-black/40 p-3 border border-red-500/20">
              <Ban size={14} className="text-red-400 mt-0.5 shrink-0" />
              <div>
                <div className="text-[12px] text-white font-app-bold uppercase mb-1">Penalties</div>
                <ul className="text-[11px] text-app-muted space-y-1">
                  <li>• Confiscation of all carried MON in the round</li>
                  <li>• Permanent wallet blacklist from future rounds</li>
                  <li>• Forfeiture of season airdrop eligibility</li>
                  <li>• Public reporting on-chain for transparency</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Season Rewards */}
        <div className="bg-[#111] border border-[#222] p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Trophy size={18} className="text-app-accent" />
            <h2 className="text-[16px] font-app-bold text-white uppercase">Season Airdrop</h2>
          </div>
          <p className="text-[13px] text-app-muted leading-relaxed mb-4">
            At the end of each season, qualified players receive a MON airdrop based on their total kills.
          </p>
          <div className="bg-black/40 p-4 border border-app-accent/20">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[12px] text-app-muted uppercase">Qualification</span>
              <span className="text-[14px] text-app-accent font-bold">100+ Kills</span>
            </div>
            <div className="h-px bg-app-border mb-3" />
            <p className="text-[13px] text-white">
              The more kills you accumulate throughout the season, the larger your share of the airdrop. 
              Top performers receive significantly higher rewards.
            </p>
          </div>
        </div>

        {/* Quick Start */}
        <div className="bg-[#0a0a0a] border border-app-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Play size={18} className="text-app-accent" />
            <h2 className="text-[16px] font-app-bold text-white uppercase">Quick Start</h2>
          </div>
          <ol className="space-y-3 text-[13px]">
            <li className="flex items-start gap-3">
              <span className="text-app-accent font-bold text-[14px]">1.</span>
              <span className="text-app-muted">Connect your wallet</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-app-accent font-bold text-[14px]">2.</span>
              <span className="text-app-muted">Click "Play to Win" when entry opens</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-app-accent font-bold text-[14px]">3.</span>
              <span className="text-app-muted">Configure your loadout and pay entry fee</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-app-accent font-bold text-[14px]">4.</span>
              <span className="text-app-muted">Survive the round timer to keep your stack</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-app-accent font-bold text-[14px]">5.</span>
              <span className="text-app-muted">Climb the kill leaderboard for season rewards</span>
            </li>
          </ol>
        </div>
      </div>
    </div>
  );
}

function GuideSection({ icon, title, content }: { icon: React.ReactNode; title: string; content: string }) {
  return (
    <div className="bg-[#111] border border-[#222] p-5">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-app-accent">{icon}</span>
        <h2 className="text-[14px] font-app-bold text-white uppercase">{title}</h2>
      </div>
      <p className="text-[13px] text-app-muted leading-relaxed">{content}</p>
    </div>
  );
}
