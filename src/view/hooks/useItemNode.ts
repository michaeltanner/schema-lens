'use client';

import { useState, useEffect } from 'react';
import { ItemNode } from '@/types/item';
import { useWorkspaceStore } from '@/core/store/useWorkspaceStore';

export function useItemNode(name: string | undefined, type: string | undefined) {
  const [itemNode, setItemNode] = useState<ItemNode | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { lastUpdated } = useWorkspaceStore();

  useEffect(() => {
    if (!name || !type) {
      setItemNode(null);
      return;
    }

    const fetchItemNode = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/item/node?name=${name}&type=${type}&v=${lastUpdated}`);
        const data = await res.json();

        if (!res.ok) throw new Error(data.error || 'Failed to load item node');

        if (data) {
          setItemNode(data);
        }
      } catch (err: any) {
        console.error('Failed to load item node:', err);
        setError(err.message);
        setItemNode({
          name: name || 'Unknown',
          kind: (type as any) || 'element',
          isBroken: true
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchItemNode();
  }, [name, type, lastUpdated]);

  return { itemNode, isLoading, error };
}
