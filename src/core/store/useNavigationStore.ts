import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface HistoryItem {
  name: string;
  type: 'element' | 'complexType' | 'simpleType';
  timestamp?: number;
}

interface NavigationState {
  selectedItem: HistoryItem | null;
  history: HistoryItem[];
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
  setSearchQuery: (query: string) => void;
  toggleFolder: (fullName: string) => void;
  collapseAll: () => void;
  expandAll: (summary: any) => void;
  expandToSelectedItem: () => void;
  focusCategory: (category: 'Elements' | 'Complex Types' | 'Simple Types') => void;
}

const pushRecent = (item: HistoryItem, current: HistoryItem[]) => {
  const filtered = current.filter(i => !(i.name === item.name && i.type === item.type));
  return [{ ...item, timestamp: Date.now() }, ...filtered].slice(0, 100);
};

export const useNavigationStore = create<NavigationState>()(
  persist(
    (set, get) => ({
      selectedItem: null,
      history: [],
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
      isBookmarked: (name, type) => {
        return get().bookmarks.some(b => b.name === name && b.type === type);
      },
      setSelectedItem: (fullName, type) => {
    const { expandedFolders } = get();
    const next = new Set(expandedFolders);
    
    let categoryTitle = 'Elements';
    if (type === 'complexType') categoryTitle = 'Complex Types';
    if (type === 'simpleType') categoryTitle = 'Simple Types';
    next.add(`__category__${categoryTitle}`);
    
    const parts = fullName
      .replace(/_/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .split(' ')
      .filter(Boolean);

    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
      current = current ? `${current}/${parts[i]}` : parts[i];
      next.add(current);
    }
    set({ 
      selectedItem: { name: fullName, type }, 
      history: [], 
      searchQuery: '', 
      expandedFolders: next,
      recentActivity: pushRecent({ name: fullName, type }, get().recentActivity)
    });
  },
  goHome: () => set({ selectedItem: null, history: [] }),
  navigate: (fullName, type) => {
    const { selectedItem, history, expandedFolders } = get();
    const newHistory = selectedItem ? [...history, selectedItem] : history;
    
    const next = new Set(expandedFolders);
    
    let categoryTitle = 'Elements';
    if (type === 'complexType') categoryTitle = 'Complex Types';
    if (type === 'simpleType') categoryTitle = 'Simple Types';
    next.add(`__category__${categoryTitle}`);

    const parts = fullName
      .replace(/_/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .split(' ')
      .filter(Boolean);

    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
      current = current ? `${current}/${parts[i]}` : parts[i];
      next.add(current);
    }
    set({ 
      selectedItem: { name: fullName, type }, 
      history: newHistory, 
      searchQuery: '', 
      expandedFolders: next,
      recentActivity: pushRecent({ name: fullName, type }, get().recentActivity)
    });
  },
  removeFromRecent: (name, type) => set((state) => ({
    recentActivity: state.recentActivity.filter(i => !(i.name === name && i.type === type))
  })),
  goBack: () => {
    const { history } = get();
    if (history.length === 0) return;
    const previous = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    set({ 
      selectedItem: previous, 
      history: newHistory,
      recentActivity: pushRecent(previous, get().recentActivity)
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
    
    const next = new Set(expandedFolders);
    const { name: fullName, type } = selectedItem;
    
    let categoryTitle = 'Elements';
    if (type === 'complexType') categoryTitle = 'Complex Types';
    if (type === 'simpleType') categoryTitle = 'Simple Types';
    next.add(`__category__${categoryTitle}`);
    
    const parts = fullName
      .replace(/_/g, ' ')
      .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
      .split(' ')
      .filter(Boolean);

    let current = '';
    for (let i = 0; i < parts.length - 1; i++) {
      current = current ? `${current}/${parts[i]}` : parts[i];
      next.add(current);
    }
    set({ expandedFolders: next });
  },
    }),
    {
      name: 'schema-lens-navigation',
      partialize: (state) => ({ 
        recentActivity: state.recentActivity,
        bookmarks: state.bookmarks 
      }),
    }
  )
);
