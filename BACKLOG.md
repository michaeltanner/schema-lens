# SchemaLens Backlog

This document tracks planned features, architectural improvements, and future experiments for the SchemaLens project.

## 🚀 Future Experiments

### [ ] Serverless / GitHub Pages Portability (Standalone Static App)
Transform SchemaLens into a portable, static project that runs entirely in a modern browser (GitHub Pages, Vercel Static, or local ZIP) without a Node.js backend.

**Key Requirements:**
- **Browser-Native Workspace**: Replace the current Node-based `WorkspaceManager` with a combination of **IndexedDB** (for storage) and the **FileSystem Access API** (for local folder mapping).
- **Web Worker Orchestration**: Move the `SchemaParser` and all core services into a Web Worker to ensure "Zero UI Lag" when parsing 8MB+ schemas entirely on the client.
- **CORS Mitigation**: Implement a strategy for remote repository imports (GitHub/GitLab) that handles browser CORS limitations (e.g., direct raw URL fetching vs. manual file fallback).
- **Hash Routing Compatibility**: Transition to a routing strategy (like Hash Routing) that allows for deep linking on static hosts without a server-side catch-all/redirect.
- **Static Export Architecture**: Optimize for `output: 'export'` with a focus on code-splitting and asset portability. Goal: A production bundle that works as a standalone static folder or hosted GitHub Pages site.


---

## 🛠️ Architectural Improvements
*   [ ] **Git Commit Hash Injection**: Automatically append the short Git commit hash to the application version during the build process (e.g., `v0.0.1+7a2b3c4`) to improve traceability.

## ✨ Features
*   [ ] (Placeholder for upcoming tasks)
