import React from 'react';

export function ScanlineOverlay() {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[50]">
      {/* Moving Scanline */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-0 bg-[length:100%_4px,3px_100%]" />
      
      {/* Subtle Flickering Grain */}
      <div className="absolute inset-0 opacity-[0.03] bg-[url('https://grainy-gradients.vercel.app/noise.svg')] pointer-events-none" />
      
      {/* Horizontal Scanline bar */}
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
