---
name: best-practices-enforcer
description: Ensures code follows language/framework best practices, style guides, and quality standards.
---

# Best Practices Enforcer Skill

**Goal**  
Apply idiomatic, high-quality patterns for the project's stack.

**Rules** (Customize per your stack, e.g., React + Node, Python/Django, etc.)  
- Naming conventions  
- Error handling  
- Logging & Monitoring  
- Documentation & Comments  
- Testing (unit + integration)  
- Performance patterns  
- Accessibility (if UI)  
- **No Embedded Assets**:  
    - **Inline SVGs**: Avoid `<svg>` tags in components; move to `.svg` files, use Lucide icons, or a dedicated `Icon` library.
    - **Static Inline Styles**: Move static CSS to CSS files/modules. (Dynamic styles are allowed but prefer CSS variables).
    - **Large Data Blobs**: Move large hardcoded objects, base64 strings, or data arrays to external JSON or `constants.ts`.

**Process**  
Flag violations and provide corrected versions.