import { useState, useEffect, useCallback } from 'react';
import { useWorkspaceStore } from '@/core/store/useWorkspaceStore';

export function useItemUsedIn(name: string | undefined) {
  const [usedIn, setUsedIn] = useState<Array<{ name: string; type: 'element' | 'complexType' | 'simpleType' }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { lastUpdated } = useWorkspaceStore();

  const [prevTrigger, setPrevTrigger] = useState({ name, lastUpdated });

  // Reset state immediately when dependencies change to avoid cascading renders
  if (name !== prevTrigger.name || lastUpdated !== prevTrigger.lastUpdated) {
    setPrevTrigger({ name, lastUpdated });
    setUsedIn([]);
    if (name) setIsLoading(true);
  }

  const fetchUsedIn = useCallback(async () => {
    if (!name) return;
    
    try {
      const res = await fetch(`/api/item/used-in?name=${name}&v=${lastUpdated}`);
      const data = await res.json();
      setUsedIn(Array.isArray(data) ? data : []);
    } catch {
      setUsedIn([]);
    } finally {
      setIsLoading(false);
    }
  }, [name, lastUpdated]);

  useEffect(() => {
    const triggerFetch = async () => {
      await fetchUsedIn();
    };
    triggerFetch();
  }, [fetchUsedIn]);


  return { usedIn, isLoading };
}
