---
name: architecture-enforcer
description: Enforces clean architecture, separation of concerns (no mixing view/business logic), and modular code. Use when generating new code, refactoring, or reviewing structure. Prevents monolithic files.
---

# Architecture Enforcer Skill

**Goal**  
Enforce clean, maintainable architecture: separate business logic, presentation (views/UI), data access, and utilities. Prevent monolithic files and layer mixing.

**When to Use**  
- Generating or editing any code  
- Refactoring existing files  
- Proposing new features or file structures  

**Core Rules**  
- **NEVER** mix view/UI logic with business logic in the same file.  
- Business logic → Services, Models, Use Cases, or Domain layers.  
- UI/Views → Components, Templates, Controllers (presentation only).  
- Data access → Repositories or dedicated data layers.  
- Keep files focused: Aim for <350 lines per file (split if larger). Extract components, hooks, utilities, modules.  
- Prefer small, single-responsibility files/modules.

**Process**  
1. Analyze current/proposed code for layer mixing or bloat.  
2. Propose file structure changes first (with rationale).  
3. Suggest refactors with specific file splits.  
4. Only implement after approval or clear direction.  
5. Flag violations explicitly with examples.

**Output Format**  
- Summary of issues.  
- Proposed structure.  
- Refactored code (per file).  
- Next steps.