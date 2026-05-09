# SchemaLens: Architecture, Mission & Standards

## 1. Mission & Purpose
SchemaLens is a high-performance, web-based visualization tool designed to make complex Universal Command Interface (UCI) XML Schema Definitions (XSD) navigable and understandable.

### Problem Statement
UCI schemas are massive and deeply nested. Current solutions are either expensive (requiring XMLSpy licenses) or generate unmanageable static HTML files. Developers need a dynamic tool that provides a premium, responsive experience without the overhead of enterprise XML suites.

### Core Objectives
1.  **Eliminate License Dependency**: Provide an open alternative to XMLSpy for schema navigation.
2.  **Optimize Delivery**: Replace massive static HTML with a lean, dynamic SPA that parses schema data on-demand.
3.  **Modern UX**: A "Pro-Tool" aesthetic (Glassmorphism, Dark Mode) with zero UI lag for 8MB+ XSD files.
4.  **IDE-like Experience**: Fast, responsive, and information-dense but not cluttered.

---

## 2. Architecture Overview

### Design Philosophy
SchemaLens follows a **Decoupled Engine** architecture, separating business logic (parsing, traversal, and validation) from the visualization layer (UI/UX). This ensures high performance, testability, and portability.

### Technology Stack
- **Language**: TypeScript (Strict Mode)
- **Frontend Framework**: Next.js (App Router)
- **Styling**: Vanilla CSS (Modern features: Grid, Flexbox, Variables).
- **State Management**: Zustand (Domain-specific, granular reactive stores)
- **Parsing**: `fast-xml-parser` for XSD normalization
- **Search**: `FlexSearch` for high-performance client-side indexing

### Logical Structure
```text
/src
  /app            <-- Next.js App Router & API routes
  /core           <-- "The Brain" (Pure TypeScript, Domain Logic)
    /hooks        - Logic-heavy hooks (Store selectors, state transitions)
    /import       - Remote schema discovery (GitHub/GitLab)
    /parser       - Orchestrator and specialized services
      /services   - Indexer, Mapper, Validator, Generator, Topology
    /store        - Granular Zustand stores (Workspace, UI, Navigation)
    /utils        - Pure utility functions
    /workspace    - Secure local file system management
  /types          <-- Shared TypeScript interfaces (ItemNode, SchemaSummary)
  /view           <-- "The Face" (React + Vanilla CSS)
    /components   - UI components (Standardized "Item-" prefix)
    /styles       - Design system tokens and global styles
```

---

## 3. The Data Pipeline: Lifecycle of an XSD

SchemaLens treats schema analysis as a multi-stage pipeline to ensure the UI remains responsive even with massive datasets.

1.  **Ingestion (Workspace Manager)**: Files are saved to a secure workspace. The `WorkspaceManager` performs a **Path Containment Check** to ensure files are strictly bound to the `.schemalens-workspace` directory.
2.  **Discovery (Orchestrator)**: The `SchemaParser` identifies all enabled XSD files in the workspace.
3.  **Extraction (Parsing)**: `parseSchemaFile()` reads the XML using a **Security-Hardened** parser. It extracts top-level elements into normalized `RawSchemaObject` structures.
4.  **Indexing & Validation**:
    - **Indexer**: Builds O(1) hash-maps for definitions and reverse-reference lookups.
    - **Validator**: Detects "Schema Health" issues like missing references or duplicate names.
5.  **Graph Topology**: The `TopologyBuilder` analyzes dependencies to build the relationship graph used in the visualizer.
6.  **State Hydration**: The finalized `SchemaSummary` is pushed to the Zustand stores, triggering the reactive UI updates in the **ItemExplorer** and **Dashboard**.

---

## 4. Security Standards

To ensure the codebase is safe for public deployment and enterprise use, we implement several "Defense in Depth" strategies:

### XML Security (XXE Protection)
The `XMLParser` is configured with `processEntities: false`. This ensures that the parser treats all entities as literal text, preventing XML External Entity (XXE) attacks from malicious schemas.

### Path Containment (Traversal Prevention)
All filesystem operations in `WorkspaceManager` go through a `getSafePath()` validator. This utility:
1.  **Sanitizes** filenames to remove illegal or hidden characters.
2.  **Canonicalizes** the path to resolve any `../` segments.
3.  **Verifies** that the final absolute path is strictly contained within the intended workspace directory.

---

## 5. Coding & Performance Standards

### Nomenclature: "Schema" vs "Item"
- **Schema**: Refers to project-level or file-level concepts (e.g., `useSchemaStore`, `SchemaSummary`).
- **Item**: Refers to individual XSD components (elements, complexTypes, simpleTypes). UI components representing these components MUST be prefixed with `Item-` (e.g., `ItemExplorer`, `ItemNode`).

### Performance Strategies
- **On-Demand Generation**: Expensive tasks like XML example generation are deferred to server-side API calls.
- **Virtualization**: Large lists in the `ItemExplorer` use `react-virtuoso` to maintain 60fps scrolling.
- **Store Granularity**: Components are encouraged to consume specific sub-stores (`useUIStore`) rather than the global facade to minimize unnecessary re-renders.

### Implementation Rules
- **Decoupling**: Core logic MUST remain separate from React components. No DOM references in `/core`.
- **File Limits**: Aim for **< 350-line limit** per file. Extract logic to services or hooks.
- **Type Safety**: No `any`. Every data structure must have a strictly defined TypeScript interface in `/types`.
