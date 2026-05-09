import { useWorkspaceStore } from './useWorkspaceStore';
import { useNavigationStore } from './useNavigationStore';
import { useUIStore } from './useUIStore';

// The main combined store for backward compatibility and convenience
export const useSchemaStore = () => {
  const data = useWorkspaceStore();
  const nav = useNavigationStore();
  const ui = useUIStore();

  return {
    ...data,
    ...nav,
    ...ui,
  };
};

// Re-export the individual stores for the new modular approach
export { useWorkspaceStore, useNavigationStore, useUIStore };
