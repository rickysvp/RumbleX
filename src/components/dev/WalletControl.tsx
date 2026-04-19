import React, { useState } from 'react';
import { useWalletStore } from '../../store/walletStore';
import { mockWallet } from '../../lib/mockWallet';

export function WalletControl() {
  const { status, monBalance, hasAlphaPass, setBalance, setWallet, setStatus, setError } = useWalletStore();
  const [tempBalance, setTempBalance] = useState(monBalance.toString());

  const handleConnectInstant = () => {
    // Skip mockWallet.connect() delay for instant dev usage
    setWallet("0x7a...9fE2", "0x7a3F6B4C2d8A1E9fE2", 12.4, true);
  };

  const handleForceError = () => {
    setError("USER_REJECTED");
  };

  const updateBalance = () => {
    setBalance(parseFloat(tempBalance));
  };

  const toggleAlphaPass = () => {
    useWalletStore.setState({ hasAlphaPass: !hasAlphaPass });
  };

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="flex flex-col gap-3">
      <div className="text-[10px] text-app-muted uppercase font-app-bold tracking-widest mt-2 border-t border-[#1a1a1a] pt-3">Wallet Control</div>
      
      <div className="text-[11px] font-app-mono">
        STATUS: <span className={`uppercase ${status === 'connected' ? 'text-app-accent' : (status === 'error' ? 'text-red-500' : 'text-app-muted')}`}>{status}</span>
      </div>

      <div className="grid grid-cols-3 gap-1">
        <button onClick={handleConnectInstant} className="text-[9px] py-1 border border-[#333] font-app-bold uppercase text-app-muted hover:text-white">Connect</button>
        <button onClick={() => mockWallet.disconnect()} className="text-[9px] py-1 border border-[#333] font-app-bold uppercase text-app-muted hover:text-white">Disc.</button>
        <button onClick={handleForceError} className="text-[9px] py-1 border border-red-500/30 font-app-bold uppercase text-red-500 hover:bg-red-500/10">Error</button>
      </div>

      <div className="mt-2 text-[10px] text-app-muted uppercase font-app-bold tracking-widest">Mon Balance</div>
      <div className="flex gap-2">
        <input 
          type="number"
          value={tempBalance}
          onChange={(e) => setTempBalance(e.target.value)}
          className="bg-black border border-[#333] text-white font-app-mono text-[11px] px-2 py-1 w-24 focus:border-app-accent outline-none"
        />
        <button 
          onClick={updateBalance}
          className="bg-[#222] text-white text-[9px] px-3 uppercase font-app-bold hover:bg-[#333]"
        >
          Set
        </button>
      </div>

      <label className="flex items-center gap-2 cursor-pointer mt-1 group">
        <div 
          onClick={toggleAlphaPass}
          className={`w-10 h-5 border flex items-center px-1 transition-colors ${hasAlphaPass ? 'bg-app-accent border-app-accent' : 'bg-[#1a1a1a] border-[#333]'}`}
        >
          <div className={`w-3 h-3 transition-transform ${hasAlphaPass ? 'translate-x-5 bg-black' : 'translate-x-0 bg-[#666]'}`} />
        </div>
        <span className="text-[10px] text-app-muted uppercase font-app-bold group-hover:text-white">Alpha Pass</span>
      </label>
    </div>
  );
}
