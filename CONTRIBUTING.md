# Contributing to SchemaLens

Thank you for your interest in contributing to SchemaLens! We welcome contributions that help make this tool better for everyone.

## 🚀 How to Contribute

### Reporting Bugs
- Search existing issues to see if the bug has already been reported.
- If not, open a new issue using the "Bug Report" template.
- Include steps to reproduce, expected behavior, and screenshots if applicable.

### Suggesting Features
- We love new ideas! Open an issue using the "Feature Request" template.
- Explain why the feature would be useful and how you imagine it working.

### Pull Requests
1. Fork the repository.
2. Create a new branch for your feature or fix: `git checkout -b feature/your-feature-name`.
3. Make your changes and ensure the code follows our styling and logic patterns.
4. Run `npm run build` and `npm run lint` to verify everything is working.
5. Submit a Pull Request with a clear description of your changes.

## 🛠️ Local Development

```bash
# Clone your fork
git clone https://github.com/michaeltanner/schema-lens.git
cd schema-lens

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🏗️ Technical Guidelines
- **TypeScript**: Use strict typing. Avoid `any` where possible.
- **Styling**: Use Vanilla CSS. Follow the existing glassmorphic design system.
- **Assets**: Avoid inline SVGs. Extract brand or shared icons to `src/view/components/common/Icons.tsx`.
- **Performance**: Ensure search and tree rendering remain fast (use virtualization for large lists).

Thank you for helping us improve SchemaLens!
