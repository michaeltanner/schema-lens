'use client';

/**
 * useUrlSync
 *
 * Bridges the browser History API and the Zustand navigation store.
 *
 * Responsibilities:
 *  1. On mount: read the current URL params and restore the selected item
 *     (enables deep links like /?item=FooType&type=complexType).
 *     Then call replaceState to seed the history entry with { depth, item, type }
 *     so that popstate events have reliable state objects.
 *
 *  2. Listen to the `popstate` event fired when the user presses browser
 *     Back / Forward (or when goBack() / goForward() resolve).  Sync the
 *     Zustand store to match the history entry — WITHOUT pushing a new entry.
 *
 * This hook should be mounted exactly once, at the top-level page component.
 */

import { useEffect } from 'react';
import { useNavigationStore, HistoryItem } from '@/core/store/useNavigationStore';

type NavHistoryState = {
  depth: number;
  item?: string;
  type?: string;
};

function parseUrlParams(): { item: string; type: string } | null {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const item = params.get('item');
  const type = params.get('type');
  if (item && type) return { item, type };
  return null;
}

function isValidType(t: string): t is HistoryItem['type'] {
  return t === 'element' || t === 'complexType' || t === 'simpleType';
}

export function useUrlSync() {
  const _applyNavState = useNavigationStore((s) => s._applyNavState);

  useEffect(() => {
    // ── 1. Restore from current URL on initial mount ──────────────────────
    const parsed = parseUrlParams();
    if (parsed && isValidType(parsed.type)) {
      const item: HistoryItem = { name: parsed.item, type: parsed.type };
      const depth = (window.history.state as NavHistoryState | null)?.depth ?? 0;
      _applyNavState(item, depth);
      // Seed replaceState so popstate has a valid state object
      window.history.replaceState(
        { depth, item: parsed.item, type: parsed.type } satisfies NavHistoryState,
        '',
        window.location.href
      );
    } else {
      // Home — seed with depth 0
      const depth = (window.history.state as NavHistoryState | null)?.depth ?? 0;
      window.history.replaceState({ depth } satisfies NavHistoryState, '', '/');
    }

    // ── 2. Sync on browser Back / Forward ─────────────────────────────────
    const onPopState = (event: PopStateEvent) => {
      const state = event.state as NavHistoryState | null;

      // Ignore history entries not created by this app (e.g. Next.js internal
      // router entries have a different state shape and no `depth` property).
      // Handling them would incorrectly navigate to home.
      if (!state || typeof state.depth !== 'number') return;

      const depth = state.depth;

      if (state.item && state.type && isValidType(state.type)) {
        const restoredItem: HistoryItem = { name: state.item, type: state.type };
        _applyNavState(restoredItem, depth);
      } else {
        // Navigated back to home (no item params)
        _applyNavState(null, depth);
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, [_applyNavState]);
}
