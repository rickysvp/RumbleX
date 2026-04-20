import React from 'react';

export function ScanlineOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[50]">
      {/* Horizontal Scanline bar only */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-app-accent opacity-[0.05] animate-[scan_8s_linear_infinite]" 
           style={{ boxShadow: '0 0 10px var(--color-app-accent)' }} />

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes scan {
          0% { top: 0%; }
          100% { top: 100%; }
        }
      `}} />
    </div>
  );
}
