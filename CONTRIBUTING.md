# Contributing to OpenVerb Chess

Thank you for your interest in contributing! This document provides guidelines for contributing to the project.

## 🚀 Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/open-verb-chess-demo.git`
3. Create a new branch: `git checkout -b feature/your-feature-name`
4. Make your changes
5. Test thoroughly
6. Commit with clear messages
7. Push to your fork
8. Open a Pull Request

## 💡 Ways to Contribute

### 1. Improve AI Chess Strategy

The AI prompts are in `app/api/ai-move/route.ts`. You can:
- Enhance the system prompt with better chess principles
- Improve loop detection algorithms
- Add opening book knowledge
- Refine endgame strategy

### 2. Add New AI Models

To add support for a new AI provider:
1. Install the provider's SDK (e.g., `@ai-sdk/google`)
2. Add the model to `components/game-controls.tsx` in the `AI_MODELS` array
3. Update the model selection logic in `app/api/ai-move/route.ts`
4. Test thoroughly with various positions

### 3. Enhance the UI

UI improvements are always welcome:
- Better mobile responsiveness
- Improved board visualization
- Enhanced move history display
- Accessibility improvements

### 4. Fix Bugs

Check the [Issues](https://github.com/yourusername/open-verb-chess-demo/issues) page for known bugs.

## 📝 Code Style

- Use TypeScript for type safety
- Follow the existing code structure
- Use meaningful variable and function names
- Add comments for complex logic
- Keep functions focused and small

## 🧪 Testing

Before submitting a PR:
1. Test with multiple AI models
2. Verify the game works in different scenarios:
   - Opening positions
   - Middlegame tactics
   - Endgame positions
   - Edge cases (stalemate, checkmate, etc.)
3. Check mobile responsiveness
4. Ensure no console errors

## 📋 Pull Request Guidelines

### PR Title Format
- `feat: Add new feature`
- `fix: Fix bug description`
- `docs: Update documentation`
- `style: UI/UX improvements`
- `refactor: Code refactoring`

### PR Description Should Include
- What changes were made
- Why the changes were necessary
- How to test the changes
- Screenshots (if UI changes)

## 🐛 Bug Reports

When reporting bugs, please include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots or error messages
- Browser/OS information
- AI models being used

## ✨ Feature Requests

For feature requests, please describe:
- The problem you're trying to solve
- Your proposed solution
- Alternative solutions considered
- Why this would benefit other users

## 🔧 Development Setup

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Add your API keys to .env.local

# Run development server
pnpm run dev

# Build for production
pnpm run build
```

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [OpenVerb npm package](https://www.npmjs.com/package/openverb)
- [Chess Programming Wiki](https://www.chessprogramming.org/)

## 🤝 Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the code, not the person
- Help others learn and grow

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to OpenVerb Chess! 🎉
