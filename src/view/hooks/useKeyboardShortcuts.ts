import { useEffect, useRef } from 'react';
import { useSchemaStore } from '@/core/store/useSchemaStore';

export const useKeyboardShortcuts = () => {
  const {
    selectedItem,
    setSpotlightOpen,
    searchQuery,
    setSearchQuery,
    toggleSidebar,
    sidebarCollapsed,
    setShortcutsOpen,
    isShortcutsOpen,
    goHome,
    goBack,
    toggleBookmark,
    setViewMode,
    expandAll,
    collapseAll,
    expandItemTree,
    collapseItemTree,
    summary,
    mobileMenuOpen,
    setMobileMenuOpen,
    isImportDialogOpen,
    setImportDialogOpen,
    isImportWizardOpen,
    setImportWizardOpen,
  } = useSchemaStore();

  const gPressedRef = useRef<boolean>(false);
  const gTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        if (e.key === 'Escape') {
          (e.target as HTMLElement).blur();
        } else {
          return;
        }
      }

      const key = e.key.toLowerCase();

      // Spotlight search shortcut (/ or Ctrl/Cmd+K)
      if (key === '/' || ((e.ctrlKey || e.metaKey) && key === 'k')) {
        e.preventDefault();
        setSpotlightOpen(true);
        return;
      }

      // Toggle sidebar with [
      if (key === '[') {
        e.preventDefault();
        toggleSidebar();
      }

      // Show keyboard shortcuts with ?
      if (key === '?') {
        e.preventDefault();
        setShortcutsOpen(!isShortcutsOpen);
      }

      // Handle 'G' sequences
      if (key === 'g' && !gPressedRef.current) {
        gPressedRef.current = true;
        if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current);
        gTimeoutRef.current = setTimeout(() => {
          gPressedRef.current = false;
        }, 1000); // 1 second window for sequence
        return;
      }

      if (gPressedRef.current) {
        gPressedRef.current = false;
        if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current);
        
        if (key === 'h') { 
          e.preventDefault(); 
          goHome(); 
          const mainContent = document.querySelector('.main-content');
          if (mainContent) {
            mainContent.scrollTo({ top: 0, behavior: 'smooth' });
          }
          return; 
        }
        if (key === 'b') { e.preventDefault(); goBack(); return; }
        
        // Navigation to specific sections on Home Screen
        const jumpToHomeSection = (id: string) => {
          e.preventDefault();
          if (selectedItem) {
            goHome();
            setTimeout(() => {
              document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
            }, 100);
          } else {
            document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
          }
        };

        if (key === 'r') { jumpToHomeSection('recent-activity'); return; }
        if (key === 's') { jumpToHomeSection('pinned-items'); return; }
        if (key === 'd') { jumpToHomeSection('schema-health'); return; }
        if (key === 'f') { jumpToHomeSection('schema-workspace'); return; }
      }

      // Contextual Actions (Require selectedItem)
      if (selectedItem) {
        if (key === 's') { e.preventDefault(); toggleBookmark(selectedItem); }
        if (key === 'c') { 
          e.preventDefault(); 
          navigator.clipboard.writeText(selectedItem.name);
          // Optional: Add a toast notification here if you have one
        }
        
        // Tab Switching (Direct Number)
        if (key === '1') { e.preventDefault(); setViewMode('tree'); }
        if (key === '2') { e.preventDefault(); setViewMode('item'); }
        if (key === '3') { e.preventDefault(); setViewMode('topology'); }
        if (key === '4') { e.preventDefault(); setViewMode('example'); }
        
        // Tree specific
        if (key === 'e') { e.preventDefault(); setViewMode('tree'); expandItemTree(); }
        if (key === 'k') { e.preventDefault(); setViewMode('tree'); collapseItemTree(); }
              }

      // Global navigation
      if (key === 'f') {
        e.preventDefault();
        if (sidebarCollapsed) {
          toggleSidebar();
        }
        setTimeout(() => {
          document.querySelector<HTMLInputElement>('.sidebar-search-input')?.focus();
        }, 100);
      }
      
      if (key === 'u') {
        e.preventDefault();
        goHome();
        setTimeout(() => {
          document.getElementById('schema-workspace')?.scrollIntoView({ behavior: 'smooth' });
          setTimeout(() => {
            document.querySelector<HTMLButtonElement>('.upload-zone')?.click();
          }, 400); // Wait for scroll to progress
        }, 100);
      }

      if (key === 'escape') {
        if (isImportWizardOpen) {
          setImportWizardOpen(false);
        } else if (isImportDialogOpen) {
          setImportDialogOpen(false);
        } else if (mobileMenuOpen) {
          setMobileMenuOpen(false);
        } else if (isShortcutsOpen) {
          setShortcutsOpen(false);
        } else if (searchQuery) {
          setSearchQuery('');
        } else if (!sidebarCollapsed) {
          toggleSidebar();
        } else {
          setSpotlightOpen(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      if (gTimeoutRef.current) clearTimeout(gTimeoutRef.current);
    };
  }, [
    setSpotlightOpen, 
    toggleSidebar, 
    sidebarCollapsed,
    setShortcutsOpen, 
    isShortcutsOpen, 
    searchQuery, 
    setSearchQuery, 
    goHome, 
    goBack, 
    selectedItem, 
    toggleBookmark, 
    setViewMode, 
    expandAll, 
    collapseAll, 
    expandItemTree,
    collapseItemTree,
    summary,
    mobileMenuOpen,
    setMobileMenuOpen,
    isImportDialogOpen,
    setImportDialogOpen,
    isImportWizardOpen,
    setImportWizardOpen,
  ]);
};
