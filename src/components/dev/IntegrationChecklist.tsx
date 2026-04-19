import React from 'react';
import { useDevStore } from '../../store/devStore';
import { CheckSquare, Square, RefreshCcw } from 'lucide-react';

const ITEMS = [
  { id: 'p_e_open', label: 'Phase: ENTRY_OPEN displays correctly' },
  { id: 'p_live', label: 'Phase: LIVE displays correctly' },
  { id: 'p_conc', label: 'Phase: CONCLUDED displays correctly' },
  { id: 't_e_open_live', label: 'entry_open → live transition fires' },
  { id: 't_live_conc', label: 'live → concluded transition fires' },
  { id: 't_conc_e_open', label: 'concluded → entry_open transition fires' },
  { id: 'side_flip_live', label: 'Right sidebar flips on live start' },
  { id: 'side_flip_conc', label: 'Right sidebar flips back on concluded' },
  { id: 'kill_board', label: 'Kill Board updates on elimination' },
  { id: 'kill_log', label: 'Kill Log updates on elimination' },
  { id: 'feed_kill', label: 'Feed receives kill events' },
  { id: 'feed_sys', label: 'Feed receives system events' },
  { id: 'loadout_pane', label: 'Loadout panel opens/closes' },
  { id: 'cost_summary', label: 'Cost summary updates live' },
  { id: 'wallet_conn', label: 'Wallet connect flow works' },
  { id: 'tx_signing', label: 'Tx: awaiting signature state' },
  { id: 'tx_pending', label: 'Tx: pending state' },
  { id: 'tx_confirmed', label: 'Tx: confirmed state' },
  { id: 'tx_failed', label: 'Tx: failed state' },
  { id: 'bal_deduct', label: 'Balance deducted on confirm' },
  { id: 'season_kill', label: 'Season kill count increments' },
  { id: 'season_leader', label: 'Season leaderboard updates' },
  { id: 'user_history', label: 'User history updates on round end' },
  { id: 'timer_countdown', label: 'Timer counts down correctly' },
  { id: 'auto_phase', label: 'Auto phase transition at 0s' },
];

export function IntegrationChecklist() {
  const { checklist, toggleChecklistItem, resetChecklist } = useDevStore();

  if (process.env.NODE_ENV !== 'development') return null;

  return (
    <div className="flex flex-col gap-1">
      <div className="text-[10px] text-app-muted uppercase font-app-bold tracking-widest mt-2 border-t border-[#1a1a1a] pt-3 mb-2 flex justify-between items-center">
        <span>Integration Check</span>
        <button 
          onClick={resetChecklist}
          className="text-red-400 hover:text-red-300 flex items-center gap-1 transition-colors"
        >
          <RefreshCcw size={10} />
          <span className="text-[8px]">Reset</span>
        </button>
      </div>

      <div className="flex flex-col gap-0.5">
        {ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => toggleChecklistItem(item.id)}
            className="flex items-center gap-2 p-1.5 hover:bg-[#111] transition-colors text-left group"
          >
            {checklist[item.id] ? (
              <CheckSquare size={14} className="text-app-accent shrink-0" />
            ) : (
              <Square size={14} className="text-[#333] group-hover:text-[#555] shrink-0" />
            )}
            <span className={`text-[10px] ${checklist[item.id] ? 'text-white' : 'text-[#666]'} leading-tight`}>
              {item.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
