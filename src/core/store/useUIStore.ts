import { create } from 'zustand';

const SIDEBAR_DEFAULT_WIDTH = 320;

interface UIState {
  sidebarCollapsed: boolean;
  isSpotlightOpen: boolean;
  isShortcutsOpen: boolean;
  activeDialog: {
    title: string;
    message: string;
    type: 'alert' | 'confirm';
    severity?: 'info' | 'warning' | 'error';
    confirmLabel?: string;
    cancelLabel?: string;
    resolve: (value: boolean) => void;
  } | null;
  viewMode: 'tree' | 'item' | 'topology' | 'example';
  isXmlExampleOpen: boolean;
  isImportDialogOpen: boolean;
  isImportWizardOpen: boolean;
  mobileMenuOpen: boolean;
  itemExpansionSignal: { type: 'expand' | 'collapse'; timestamp: number } | null;
  sidebarWidth: number;
  toggleSidebar: () => void;
  setSidebarWidth: (width: number) => void;
  setSpotlightOpen: (open: boolean) => void;
  setShortcutsOpen: (open: boolean) => void;
  setMobileMenuOpen: (open: boolean) => void;
  setViewMode: (mode: 'tree' | 'item' | 'topology' | 'example') => void;
  setXmlExampleOpen: (open: boolean) => void;
  setImportDialogOpen: (open: boolean) => void;
  setImportWizardOpen: (open: boolean) => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  expandItemTree: () => void;
  collapseItemTree: () => void;
  resetItemExpansion: () => void;
  confirm: (title: string, message: string, severity?: 'info' | 'warning' | 'error', confirmLabel?: string, cancelLabel?: string) => Promise<boolean>;
  alert: (title: string, message: string, severity?: 'info' | 'warning' | 'error', confirmLabel?: string) => Promise<void>;
}

export const useUIStore = create<UIState>((set) => ({
  sidebarCollapsed: true,
  isSpotlightOpen: false,
  isShortcutsOpen: false,
  activeDialog: null,
  viewMode: 'tree',
  isXmlExampleOpen: false,
  isImportDialogOpen: false,
  isImportWizardOpen: false,
  mobileMenuOpen: false,
  itemExpansionSignal: null,
  sidebarWidth: SIDEBAR_DEFAULT_WIDTH,
  toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
  setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
  setSpotlightOpen: (isSpotlightOpen) => set({ isSpotlightOpen }),
  setShortcutsOpen: (isShortcutsOpen) => set({ isShortcutsOpen }),
  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
  setViewMode: (viewMode) => set({ viewMode }),
  setXmlExampleOpen: (isXmlExampleOpen) => set({ isXmlExampleOpen }),
  setImportDialogOpen: (isImportDialogOpen) => set({ isImportDialogOpen }),
  setImportWizardOpen: (isImportWizardOpen) => set({ isImportWizardOpen }),
  setSidebarCollapsed: (sidebarCollapsed) => set({ sidebarCollapsed }),
  expandItemTree: () => set({ itemExpansionSignal: { type: 'expand', timestamp: Date.now() } }),
  collapseItemTree: () => set({ itemExpansionSignal: { type: 'collapse', timestamp: Date.now() } }),
  resetItemExpansion: () => set({ itemExpansionSignal: null }),
  confirm: (title, message, severity = 'info', confirmLabel = 'Confirm', cancelLabel = 'Cancel') => {
    return new Promise((resolve) => {
      set({ 
        activeDialog: { 
          title, 
          message, 
          type: 'confirm', 
          severity,
          confirmLabel, 
          cancelLabel, 
          resolve: (val) => {
            set({ activeDialog: null });
            resolve(val);
          } 
        } 
      });
    });
  },
  alert: (title, message, severity = 'info', confirmLabel = 'OK') => {
    return new Promise((resolve) => {
      set({ 
        activeDialog: { 
          title, 
          message, 
          type: 'alert', 
          severity,
          confirmLabel, 
          resolve: () => {
            set({ activeDialog: null });
            resolve();
          } 
        } 
      } as any);
    });
  },
}));
