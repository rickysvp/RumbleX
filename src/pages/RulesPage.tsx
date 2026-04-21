import React from 'react';
import { BookOpen, Shield, Sword, Coins, AlertTriangle } from 'lucide-react';

export function RulesPage() {
  return (
    <div className="h-full w-full bg-[#0a0a0a] overflow-y-auto custom-scrollbar p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <BookOpen size={24} className="text-app-accent" />
            <h1 className="text-[24px] font-app-bold text-white uppercase tracking-wide">
              Rules
            </h1>
          </div>
          <p className="text-app-muted text-[13px]">
            Official game rules and mechanics
          </p>
        </div>

        {/* Rules Sections */}
        <div className="space-y-6">
          {/* Basic Rules */}
          <RuleSection 
            icon={<Shield size={18} />}
            title="Basic Rules"
            content={[
              "Each round lasts 10 minutes",
              "Last player standing wins the round",
              "Entry fee is required to participate",
              "Players can be eliminated by combat or environmental hazards"
            ]}
          />

          {/* Combat System */}
          <RuleSection 
            icon={<Sword size={18} />}
            title="Combat System"
            content={[
              "Players can attack each other during live rounds",
              "Skills and items provide combat advantages",
              "Eliminated players lose their entry fee",
              "Kill count contributes to season ranking"
            ]}
          />

          {/* Prize Distribution */}
          <RuleSection 
            icon={<Coins size={18} />}
            title="Prize Distribution"
            content={[
              "Winner takes 80% of the round prize pool",
              "10% goes to platform fee",
              "10% goes to season prize pool",
              "Season pool distributed to qualified players at season end"
            ]}
          />

          {/* Disqualification */}
          <RuleSection 
            icon={<AlertTriangle size={18} />}
            title="Disqualification"
            content={[
              "Bots and automated play are prohibited",
              "Multiple accounts from same wallet are not allowed",
              "Exploiting bugs will result in disqualification",
              "All decisions by the audit committee are final"
            ]}
          />
        </div>
      </div>
    </div>
  );
}

function RuleSection({ icon, title, content }: { icon: React.ReactNode; title: string; content: string[] }) {
  return (
    <div className="bg-[#111] border border-[#222] p-5">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-app-accent">{icon}</span>
        <h2 className="text-[14px] font-app-bold text-white uppercase">{title}</h2>
      </div>
      <ul className="space-y-2">
        {content.map((item, index) => (
          <li key={index} className="text-[13px] text-app-muted flex items-start gap-2">
            <span className="text-app-accent mt-1">•</span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}
