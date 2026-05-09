import { useState, useEffect } from 'react';
import { useWorkspaceStore } from '@/core/store/useWorkspaceStore';

export function useItemUsedIn(name: string | undefined) {
  const [usedIn, setUsedIn] = useState<Array<{ name: string; type: 'element' | 'complexType' | 'simpleType' }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { lastUpdated } = useWorkspaceStore();

  useEffect(() => {
    if (!name) {
      setUsedIn([]);
      return;
    }

    let isMounted = true;
    setIsLoading(true);

    fetch(`/api/item/used-in?name=${name}&v=${lastUpdated}`)
      .then(res => res.json())
      .then(data => {
        if (isMounted) {
          setUsedIn(Array.isArray(data) ? data : []);
          setIsLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setUsedIn([]);
          setIsLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [name, lastUpdated]);

  return { usedIn, isLoading };
}
