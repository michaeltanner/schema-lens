import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HistoryItem {
  name: string;
  type: 'element' | 'complexType' | 'simpleType';
  timestamp?: number;
}

// ── Types ──────────────────────────────────────────────────────────────────

interface NavigationState {
  selectedItem: HistoryItem | null;
  historyDepth: number;
  recentActivity: HistoryItem[];
  bookmarks: HistoryItem[];
  expandedFolders: Set<string>;
  searchQuery: string;
  setSelectedItem: (name: string, type: 'element' | 'complexType' | 'simpleType') => void;
  toggleBookmark: (item: HistoryItem) => void;
  removeBookmark: (name: string, type: string) => void;
  isBookmarked: (name: string, type: 'element' | 'complexType' | 'simpleType') => boolean;
  goHome: () => void;
  navigate: (name: string, type: 'element' | 'complexType' | 'simpleType') => void;
  removeFromRecent: (name: string, type: string) => void;
  goBack: () => void;
  goForward: () => void;
  _applyNavState: (item: HistoryItem | null, depth: number) => void;
  setSearchQuery: (query: string) => void;
  toggleFolder: (fullName: string) => void;
  collapseAll: () => void;
  expandAll: (summary: any) => void;
  expandToSelectedItem: () => void;
  focusCategory: (category: 'Elements' | 'Complex Types' | 'Simple Types') => void;
}

// ── Helpers ────────────────────────────────────────────────────────────────

function itemToUrl(name: string, type: string) {
  return `/?item=${encodeURIComponent(name)}&type=${encodeURIComponent(type)}`;
}

function pushNav(name: string, type: string, depth: number) {
  if (typeof window === 'undefined') return;
  window.history.pushState({ depth, item: name, type }, '', itemToUrl(name, type));
}

function pushHome(depth: number) {
  if (typeof window === 'undefined') return;
  window.history.pushState({ depth }, '', '/');
}

const pushRecent = (item: HistoryItem, current: HistoryItem[]) => {
  const filtered = current.filter(i => !(i.name === item.name && i.type === item.type));
  return [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 100);
};

function foldersForItem(fullName: string, type: string, current: Set<string>): Set<string> {
  const next = new Set(current);
  let categoryTitle = 'Elements';
  if (type === 'complexType') categoryTitle = 'Complex Types';
  if (type === 'simpleType') categoryTitle = 'Simple Types';
  next.add(`__category__${categoryTitle}`);

  const parts = fullName
    .replace(/_/g, ' ')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(' ')
    .filter(Boolean);

  let current2 = '';
  for (let i = 0; i < parts.length - 1; i++) {
    current2 = current2 ? `${current2}/${parts[i]}` : parts[i];
    next.add(current2);
  }
  return next;
}

// ── Store ──────────────────────────────────────────────────────────────────

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      selectedItem: null,
      historyDepth: 0,
      recentActivity: [],
      bookmarks: [],
      expandedFolders: new Set<string>(),
      searchQuery: '',
      toggleBookmark: (item) => set((state) => {
        const exists = state.bookmarks.find(b => b.name === item.name && b.type === item.type);
        if (exists) {
          return { bookmarks: state.bookmarks.filter(b => !(b.name === item.name && b.type === item.type)) };
        } else {
          return { bookmarks: [{ ...item, timestamp: Date.now() }, ...state.bookmarks] };
        }
      }),
      removeBookmark: (name, type) => set((state) => ({
        bookmarks: state.bookmarks.filter(b => !(b.name === name && b.type === type))
      })),
      isBookmarked: (name, type) => get().bookmarks.some(b => b.name === name && b.type === type),

      /** Sidebar item click — always a fresh navigation push. */
      setSelectedItem: (fullName, type) => {
        const { expandedFolders, historyDepth } = get();
        const newDepth = historyDepth + 1;
        pushNav(fullName, type, newDepth);
        set({
          selectedItem: { name: fullName, type },
          historyDepth: newDepth,
          searchQuery: '',
          expandedFolders: foldersForItem(fullName, type, expandedFolders),
          recentActivity: pushRecent({ name: fullName, type }, get().recentActivity),
        });
      },

      /** Go to the dashboard / home screen. */
      goHome: () => {
        const { historyDepth } = get();
        const newDepth = historyDepth + 1;
        pushHome(newDepth);
        set({ selectedItem: null, historyDepth: newDepth });
      },

      /** Type-teleportation: jump from a reference to its definition. */
      navigate: (fullName, type) => {
        const { expandedFolders, historyDepth } = get();
        const newDepth = historyDepth + 1;
        pushNav(fullName, type, newDepth);
        set({
          selectedItem: { name: fullName, type },
          historyDepth: newDepth,
          searchQuery: '',
          expandedFolders: foldersForItem(fullName, type, expandedFolders),
          recentActivity: pushRecent({ name: fullName, type }, get().recentActivity),
        });
      },

      removeFromRecent: (name, type) => set((state) => ({
        recentActivity: state.recentActivity.filter(i => !(i.name === name && i.type === type))
      })),

      /** Delegate to the browser — popstate handler will sync the store. */
      goBack: () => {
        if (typeof window !== 'undefined') window.history.back();
      },

      /** Delegate to the browser — popstate handler will sync the store. */
      goForward: () => {
        if (typeof window !== 'undefined') window.history.forward();
      },

      /** Restore state from a browser history entry without creating a new one. */
      _applyNavState: (item, depth) => {
        const { expandedFolders } = get();
        const nextFolders = item
          ? foldersForItem(item.name, item.type, expandedFolders)
          : expandedFolders;

        set({
          selectedItem: item,
          historyDepth: depth,
          searchQuery: '',
          expandedFolders: nextFolders,
          ...(item ? { recentActivity: pushRecent(item, get().recentActivity) } : {}),
        });
      },

      setSearchQuery: (searchQuery) => set({ searchQuery }),

      toggleFolder: (fullName) => {
        const { expandedFolders } = get();
        const next = new Set(expandedFolders);
        if (next.has(fullName)) {
          next.delete(fullName);
        } else {
          next.add(fullName);
        }
        set({ expandedFolders: next });
      },

      focusCategory: (category) => {
        const { expandedFolders } = get();
        const next = new Set(expandedFolders);
        next.add(`__category__${category}`);
        set({ expandedFolders: next });
      },

      collapseAll: () => set({ expandedFolders: new Set() }),

      expandAll: (summary) => {
        if (!summary) return;
        const next = new Set<string>();
        next.add('__category__Elements');
        next.add('__category__Complex Types');
        next.add('__category__Simple Types');

        const walk = (nodes: any[]) => {
          nodes.forEach(node => {
            if (node.kind === 'folder') {
              next.add(node.fullName);
              if (node.children) walk(node.children);
            }
          });
        };

        walk(summary.elementHierarchy);
        walk(summary.complexTypeHierarchy);
        walk(summary.simpleTypeHierarchy);
        set({ expandedFolders: next });
      },

      expandToSelectedItem: () => {
        const { selectedItem, expandedFolders } = get();
        if (!selectedItem) return;
        set({ expandedFolders: foldersForItem(selectedItem.name, selectedItem.type, expandedFolders) });
      },
    }),
    {
      name: 'schema-lens-navigation',
      partialize: (state) => ({
        recentActivity: state.recentActivity,
        bookmarks: state.bookmarks,
      }),
    }
  )
);

