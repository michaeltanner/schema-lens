# Errata & Known Bugs

This document tracks known technical issues, architectural limitations, and unresolved bugs in SchemaLens.

## Navigation & Browser History

### [BUG-001] Infinite Loading on Forward Navigation
**Status:** Open / Unresolved
**Description:** 
When navigating **Forward** into the SchemaLens application from an external website (e.g., navigating from Google back to a previously open SchemaLens tab), the application hangs on the "Analyzing Schemas..." loading screen.

**Details:**
- The loading screen animations remain active, but the application fails to transition to the Dashboard or Item View.
- A manual browser refresh (F5) resolves the issue immediately.
- The issue is suspected to be related to the browser's **Back-Forward Cache (BFCache)** or a hydration stall in the Next.js App Router where client-side effects fail to "thaw" correctly after being restored from a frozen state.

**Attempted Fixes (Unsuccessful):**
- Implementing a `StyledJsxRegistry` to fix SSR style injection.
- Using `isHydrated` state gates to control render cycles.
- Moving fetch logic to the Zustand store level to avoid component lifecycle resets.
- Implementing a `pageshow` event listener to force re-renders.
- Implementing an automatic `window.location.reload()` when `PerformanceNavigationTiming` detects a `back_forward` type.

**Workaround:** 
Perform a manual page refresh (Ctrl+R / F5).
