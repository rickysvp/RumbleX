import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DevState {
  isOpen: boolean;
  simulationIntervalMs: number | null;
  playerCount: number;
  checklist: Record<string, boolean>;
  
  togglePanel: () => void;
  setSimulationSpeed: (ms: number | null) => void;
  setPlayerCount: (count: number) => void;
  toggleChecklistItem: (id: string) => void;
  resetChecklist: () => void;
}

export const useDevStore = create<DevState>()(
  persist(
    (set) => ({
      isOpen: false,
      simulationIntervalMs: null,
      playerCount: 4,
      checklist: {},

      togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
      
      setSimulationSpeed: (ms) => set({ simulationIntervalMs: ms }),
      
      setPlayerCount: (count) => set({ playerCount: Math.max(2, Math.min(50, count)) }),
      
      toggleChecklistItem: (id) => set((state) => ({
        checklist: { ...state.checklist, [id]: !state.checklist[id] }
      })),
      
      resetChecklist: () => set({ checklist: {} }),
    }),
    {
      name: 'rumblex-dev-storage',
      partialize: (state) => ({ checklist: state.checklist }),
    }
  )
);
