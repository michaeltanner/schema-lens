---
name: project-cleanup-expert
description: Manages a multi-phase, step-by-step cleanup of the project to ensure release readiness, architectural integrity, and branding consistency.
---

# Project Cleanup Expert Skill

**Goal**  
Execute a careful, comprehensive cleanup of the repository before a public release or major milestone.

**Strict Rules**
- Take **one step at a time**. Do not make multiple changes in one go.
- First, **propose** what you want to do and explain why.
- Wait for user approval before making any actual code or file changes.
- After each approved change, show a summary of what was done and ask if the user is ready for the next step.
- **Style Migration Guard**: When consolidating styles (e.g., moving from inline `<style jsx>` to external CSS):
    - You MUST audit the component for all class names and nested selectors.
    - You MUST explicitly account for complex layouts (modals, trees, row-based designs).
    - You MUST ensure that button/input resets are preserved in the new global context to prevent browser defaults from breaking the UI.
    - After migration, perform a mental "Visual Audit": check for overlapping icons, missing backgrounds, or broken flex alignment.
- Work strictly in the phase order defined below.

## Phases

### Phase 1: Architecture, Assets & Branding
- **Architecture Review**: Run `architecture-enforcer` skill. Check folder structure, separation of concerns, and identify monolithic files.
- **Asset Audit**: Identify and flag embedded/inline assets (SVGs, static inline styles, large data blobs). Propose extraction to external files.
- **Branding Audit**: Check for legacy "UCI" branding or terminology. Ensure consistency with the "SchemaLens" identity across code and docs.
- **Skill Review**: Audit the `.ai` folder. Remove redundant files and ensure all skills are up to date.
- **Public Assets**: Verify `public/` folder structure and asset organization.

### Phase 2: Configuration & GitHub Readiness
- **README Improvement**: Ensure README is visually appealing, comprehensive, and technical (markdown only).
- **Metadata Review**: Check `package.json` metadata (author, description, repository URLs).
- **Contributing Guide**: Verify `CONTRIBUTING.md` is accurate for new contributors.

### Phase 3: Quality & Security Checks
- **Security Audit**: Run `security-auditor` skill and fix findings.
- **Best Practices**: Run `best-practice-enforcer` (including the "No Embedded Assets" rule).
- **Code Review**: Run `code-review-expert` for final logic validation.
- **Refactoring**: Use `refactoring-specialist` for any remaining monolithic or tightly coupled logic.

### Phase 4: Final Polish & Release
- **Final UI Audit**: Perform a final visual sweep of the application's core flows (Dashboard, Workspace, Import Wizard, Item Details, Spotlight Search, Sidebar, etc.) to ensure no style regressions or "messed up" layouts remain.
- **Interactive Version Bump**: 
    1. Ask the user: *"Do you want to perform a version update at this time?"*
    2. If yes, run `npm run release` to trigger the interactive `bumpp` CLI.
- **Final Commit**: Use `git-commit-formatter` to create a strong initial/release commit message.

**Process**  
1. Start at Phase 1, Step 1.
2. Propose, Approve, Execute, Summarize.
3. Move to next step only when prompted.
