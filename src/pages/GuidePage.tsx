import React from 'react';
import { ScrollText, Play, Shield, Zap, Target } from 'lucide-react';

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
            Learn the basics and master the game
          </p>
        </div>

        {/* Quick Start */}
        <div className="bg-app-accent/10 border border-app-accent/30 p-6 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <Play size={18} className="text-app-accent" />
            <h2 className="text-[16px] font-app-bold text-white uppercase">Quick Start</h2>
          </div>
          <ol className="space-y-3 text-[13px] text-app-muted">
            <li className="flex items-start gap-3">
              <span className="text-app-accent font-bold">1.</span>
              Connect your wallet to access the game
            </li>
            <li className="flex items-start gap-3">
              <span className="text-app-accent font-bold">2.</span>
              Click "Play to Win" when entry is open
            </li>
            <li className="flex items-start gap-3">
              <span className="text-app-accent font-bold">3.</span>
              Configure your loadout (strategy, skill, item)
            </li>
            <li className="flex items-start gap-3">
              <span className="text-app-accent font-bold">4.</span>
              Pay the entry fee to join the round
            </li>
            <li className="flex items-start gap-3">
              <span className="text-app-accent font-bold">5.</span>
              Survive until the end to win the prize!
            </li>
          </ol>
        </div>

        {/* Game Mechanics */}
        <div className="space-y-6">
          <GuideSection 
            icon={<Target size={18} />}
            title="The Objective"
            content="Be the last player standing. Each round is a battle royale where players fight to survive. Use strategy, skills, and items to outlast your opponents."
          />

          <GuideSection 
            icon={<Shield size={18} />}
            title="Loadout System"
            content="Before each round, configure your loadout: Strategy determines your playstyle, Skills provide special abilities, and Items give you equipment advantages. Choose wisely based on your preferred tactics."
          />

          <GuideSection 
            icon={<Zap size={18} />}
            title="Combat & Elimination"
            content="During live rounds, players automatically engage in combat based on their loadouts. You can be eliminated by other players or environmental hazards. Each kill counts toward your season ranking."
          />
        </div>

        {/* Tips */}
        <div className="mt-8 p-4 bg-[#111] border border-[#222]">
          <h3 className="text-[12px] font-app-bold text-white uppercase mb-3">Pro Tips</h3>
          <ul className="space-y-2 text-[12px] text-app-muted">
            <li>• Queue multiple rounds at once to save on gas fees</li>
            <li>• Balance your loadout cost with potential rewards</li>
            <li>• Watch the kill feed to learn successful strategies</li>
            <li>• Aim for 100+ kills this season to qualify for rewards</li>
          </ul>
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
