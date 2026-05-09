import { create } from 'zustand';
import { SchemaSummary } from '@/types/schema';

interface SchemaDataState {
  summary: SchemaSummary | null;
  isParsing: boolean;
  lastUpdated: number;
  setSummary: (summary: SchemaSummary) => void;
  setParsing: (isParsing: boolean) => void;
  refreshSummary: () => Promise<void>;
}

export const useWorkspaceStore = create<SchemaDataState>((set) => ({
  summary: null,
  isParsing: false,
  lastUpdated: Date.now(),
  setSummary: (summary) => set({ summary, lastUpdated: Date.now() }),
  setParsing: (isParsing) => set({ isParsing }),
  refreshSummary: async () => {
    if ((window as any).__refreshTimeout) clearTimeout((window as any).__refreshTimeout);
    
    return new Promise((resolve) => {
      (window as any).__refreshTimeout = setTimeout(async () => {
        set({ isParsing: true });
        try {
          const res = await fetch(`/api/workspace?t=${Date.now()}&reset=true`);
          const data = await res.json();
          if (data.error) throw new Error(data.error);
          set({ summary: data, isParsing: false, lastUpdated: Date.now() });
          resolve();
        } catch (err) {
          console.error('Failed to refresh summary:', err);
          set({ isParsing: false });
          resolve();
        }
      }, 250);
    });
  },
}));
