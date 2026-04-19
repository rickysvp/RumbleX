import React, { useEffect, useState } from 'react';
import { PreGamePanel } from './PreGamePanel';
import { InGamePanel } from './InGamePanel';
import { useGameStore } from '../../store/gameStore';
import './intel.css';

export function IntelTower() {
  const [isFlipped, setIsFlipped] = useState(false);
  const [midpointFlash, setMidpointFlash] = useState(false);
  const phase = useGameStore(state => state.phase);

  // Trigger flip based on phase
  useEffect(() => {
    const targetFlipped = phase === 'live';
    if (targetFlipped !== isFlipped) {
      setIsFlipped(targetFlipped);
      
      // Midpoint flash animation with proper cleanup
      let flashOffTimer: number;
      const flashOnTimer = setTimeout(() => {
        setMidpointFlash(true);
        flashOffTimer = setTimeout(() => setMidpointFlash(false), 150);
      }, 200);
      
      return () => {
        clearTimeout(flashOnTimer);
        if (flashOffTimer) clearTimeout(flashOffTimer);
      };
    }
  }, [phase, isFlipped]);

  return (
    <section className="intel-tower-container h-full border-l border-app-border bg-[#0a0a0a] overflow-hidden perspective-1200 relative">
      <div className={`intel-tower-inner h-full w-full transition-transform duration-400 ease-in-out transform-style-3d ${isFlipped ? 'is-flipped' : ''}`}>
        
        {/* FRONT FACE: Pre-Game / Concluded */}
        <div className="intel-face absolute inset-0 backface-hidden shadow-2xl">
          <PreGamePanel />
        </div>

        {/* BACK FACE: In-Game */}
        <div className="intel-face intel-face-back absolute inset-0 backface-hidden rotate-y-180 border-l border-app-accent/20">
          <InGamePanel />
        </div>

      </div>

      {/* Midpoint Transition Flash Overlay */}
      {midpointFlash && (
        <div className="absolute inset-0 bg-app-accent opacity-20 animate-pulse z-[100] pointer-events-none" />
      )}
    </section>
  );
}
