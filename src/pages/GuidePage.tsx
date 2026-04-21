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
            RumbleX is a battle royale where players fight for survival. 
            Each round lasts <span className="text-app-accent font-bold">10 minutes</span>. Survive until the timer ends or become the last survivor to claim your rewards.
          </p>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-black/40 p-4 border border-app-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={14} className="text-app-accent" />
                <span className="text-[12px] text-app-muted uppercase">Time Limit</span>
              </div>
              <p className="text-[20px] font-app-bold text-white">10 Minutes</p>
              <p className="text-[11px] text-app-muted mt-1">Per round max duration</p>
            </div>
            <div className="bg-black/40 p-4 border border-app-accent/20">
              <div className="flex items-center gap-2 mb-2">
                <Skull size={14} className="text-app-accent" />
                <span className="text-[12px] text-app-muted uppercase">Objective</span>
              </div>
              <p className="text-[20px] font-app-bold text-white">Survive</p>
              <p className="text-[11px] text-app-muted mt-1">Until timer ends or last one standing</p>
            </div>
          </div>
        </div>

        {/* Round Rewards */}
        <div className="space-y-6 mb-6">
          <GuideSection 
            icon={<Zap size={18} />}
            title="Round Rewards"
            content="Eliminate opponents to earn MON. Every kill adds to your stack. If you survive until the timer ends or become the last survivor, you keep all the MON you've earned during the round. The longer you survive and the more you kill, the bigger your payout."
          />

          {/* Prize Distribution */}
          <div className="bg-[#111] border border-[#222] p-5">
            <div className="flex items-center gap-2 mb-4">
              <Scale size={18} className="text-app-accent" />
              <h2 className="text-[14px] font-app-bold text-white uppercase">Prize Distribution</h2>
            </div>
            <p className="text-[13px] text-app-muted leading-relaxed mb-4">
              Each round's prize pool is distributed among survivors based on their performance:
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between bg-black/40 p-3 border border-[#222]">
                <span className="text-[12px] text-white">Base Pool (Entry Fees)</span>
                <span className="text-[12px] text-app-accent font-app-mono">100% distributed</span>
              </div>
              <div className="flex items-center justify-between bg-black/40 p-3 border border-[#222]">
                <span className="text-[12px] text-white">Kill Rewards</span>
                <span className="text-[12px] text-app-accent font-app-mono">Per kill bonus</span>
              </div>
              <div className="flex items-center justify-between bg-black/40 p-3 border border-[#222]">
                <span className="text-[12px] text-white">Survival Bonus</span>
                <span className="text-[12px] text-app-accent font-app-mono">Extra for survivors</span>
              </div>
            </div>
            <p className="text-[11px] text-app-muted mt-4 leading-relaxed">
              All rewards are calculated transparently and distributed automatically via smart contracts. 
              Transaction hashes are publicly available for verification.
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
                  <li>• Confiscation of all earned MON in the round</li>
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
              <span className="text-app-muted">Survive the round to claim your earnings</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-app-accent font-bold text-[14px]">5.</span>
              <span className="text-app-muted">Accumulate 100+ kills for season airdrop</span>
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
