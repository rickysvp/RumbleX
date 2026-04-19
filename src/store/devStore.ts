import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface DevState {
  isOpen: boolean;
  simulationIntervalMs: number | null; // null = follow default 8-15s logic
  checklist: Record<string, boolean>;
  
  // Actions
  togglePanel: () => void;
  setSimulationSpeed: (ms: number | null) => void;
  toggleChecklistItem: (id: string) => void;
  resetChecklist: () => void;
}

export const useDevStore = create<DevState>()(
  persist(
    (set) => ({
      isOpen: false,
      simulationIntervalMs: null,
      checklist: {},

      togglePanel: () => set((state) => ({ isOpen: !state.isOpen })),
      
      setSimulationSpeed: (ms) => set({ simulationIntervalMs: ms }),
      
      toggleChecklistItem: (id) => set((state) => ({
        checklist: { ...state.checklist, [id]: !state.checklist[id] }
      })),
      
      resetChecklist: () => set({ checklist: {} }),
    }),
    {
      name: 'rumblex-dev-storage',
      partialize: (state) => ({ checklist: state.checklist }), // Only persist checklist
    }
  )
);
