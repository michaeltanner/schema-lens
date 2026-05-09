---
name: git-commit-formatter
description: Formats git commit messages according to Conventional Commits specification. Use this when the user wants to commit changes, write a commit message, or prepare a PR description.
---

# Git Commit Formatter Skill

**Goal**  
Generate clear, standardized, Conventional Commits messages that help with changelog generation, semantic versioning, and team collaboration.

**When to Use This Skill**  
- User asks to commit changes, stage files, or write a commit message.  
- Preparing PR titles or descriptions.  
- Reviewing existing commit history for consistency.

**Conventional Commits Standard** (Strictly Follow)

**Format:**
<type>[optional scope]: <description>
[optional body]
[optional footer(s)]

**Allowed Types** (use the most appropriate):
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (formatting, missing semi-colons, etc.)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `build`: Changes that affect the build system or external dependencies
- `ci`: Changes to CI configuration files and scripts
- `chore`: Other changes that don't modify src or test files
- `revert`: Reverts a previous commit

**Rules**
- Use **present tense** ("add" not "added").
- Keep the subject line under 72 characters.
- Capitalize the first letter of the description.
- Do not end the subject line with a period.
- Separate subject from body with a blank line.
- In the body, explain **what** and **why** (not how).
- Use footers for breaking changes: `BREAKING CHANGE: ...` or reference issues (`Closes #123`).

**Process**
1. Analyze the changes (diff, staged files, or user description).
2. Identify the primary type and scope (if applicable, e.g., `feat(auth)`).
3. Generate 1–2 strong commit message options.
4. Suggest a command: `git commit -m "..."`

**Examples**

**Good:**
feat(auth): add Google OAuth login support

Implement OAuth2 flow with Gemini identity
Add protected route middleware
Update login UI with new provider buttons

Closes #45

**Bad (Avoid):**
- If multiple unrelated changes are present, recommend splitting into multiple commits.
- For large refactors, use `refactor` + detailed body.
- Always ask for confirmation before finalizing the commit message if context is limited.

When the user says "commit this" or similar, use this skill automatically and present polished message options.