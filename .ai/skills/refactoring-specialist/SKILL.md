---
name: refactoring-specialist
description: Refactors code for modularity, smaller files, better structure, and performance. Use when files are large or logic is tangled.
---

# Refactoring Specialist Skill

**Goal**  
Break down monolithic code while preserving (and improving) functionality.

**Process**  
1. Analyze the file(s) for responsibilities.  
2. Propose extraction plan (new files, components, services).  
3. Provide before/after diffs or full new files.  
4. Update imports/references.  
5. Add/update tests.  

**Guidelines**  
- Target: <300-400 lines per file.  
- Extract pure functions, custom hooks, services, etc.  
- Maintain or improve readability and performance.