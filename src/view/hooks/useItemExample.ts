import { useState, useCallback, useRef } from 'react';

export function useItemExample() {
  const [isLoading, setIsLoading] = useState(false);
  const cacheRef = useRef<Record<string, string>>({});

  const fetchExample = useCallback(async (name: string, kind: string, optional: boolean) => {
    const cacheKey = `${name}-${kind}-${optional}`;
    if (cacheRef.current[cacheKey]) return cacheRef.current[cacheKey];

    setIsLoading(true);
    try {
      const res = await fetch(`/api/item/example?name=${name}&type=${kind}&optional=${optional}`);
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || 'Failed to generate XML example');

      cacheRef.current[cacheKey] = data.example;
      setIsLoading(false);
      return data.example;
    } catch (err) {
      console.error('Failed to fetch XML example:', err);
      const errorMsg = `<!-- Error: ${err instanceof Error ? err.message : 'Unknown error'} -->`;
      cacheRef.current[cacheKey] = errorMsg;
      setIsLoading(false);
      return errorMsg;
    }
  }, []);

  return { fetchExample, isLoading };
}
