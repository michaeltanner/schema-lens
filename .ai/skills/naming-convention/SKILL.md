---
name: naming-convention
description: Enforces consistent naming across the project using 'schema' for global/XSD concepts and 'item' for individual elements.
---

# Naming Convention & Refactoring Protocol

**Goal**  
Ensure intuitive, precise, and consistent naming across the codebase while minimizing breaking changes and token usage.

## Naming Rules
1. **`schema`**: Use for XSD-level, file-level, project-wide, or workspace-level naming.
   - *Example*: `SchemaManager`, `SchemaWorkspace`, `SchemaParser`.
2. **`item`**: Use for individual elements, complex types, attributes, or specific nodes within a schema.
   - *Example*: `ItemDetails`, `ItemTreeNode`, `ItemGraph`.
3. **Simplicity**: Names should be simple yet precise for a user. Avoid overly technical jargon where a common term suffices.

## Refactoring Process (The "Phase-Gate" Rule)
To ensure stability and user control, every refactor must follow these steps:

1. **Audit**: Analyze a specific, small subset of the project (e.g., one directory).
2. **Propose (COAs)**: Provide multiple Courses of Action (COAs) for consideration. 
   - Present a "Before -> After" mapping.
   - Explain the rationale for each option.
3. **Permission**: **STOP** and wait for explicit user approval before making *any* changes.
4. **Execution**: Perform only the approved changes iteratively.
5. **Verification**: Confirm that the GUI remains functional after changes.

## Constraints
- **NO AWOL Refactoring**: Do not rename things outside the agreed scope (especially project names or root configs).
- **Token Efficiency**: Focus on small chunks to keep the context window clear.
