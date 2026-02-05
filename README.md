# OpenVerb Chess

An AI vs AI chess game demonstrating the **OpenVerb** architecture pattern for building Agentic AI applications.

> [!NOTE]
> This is a **Reference Implementation** designed to showcase the OpenVerb architectural pattern. While the AI provides reasoning for its moves, this project is not designed to explicitly emphasize or optimize for advanced AI reasoning; rather, it demonstrates how to integrate LLM planning with a deterministic execution engine.

Watch two AI models (GPT-4o and Claude) play chess against each other, with full transparency into their decision-making process through detailed move reasoning and execution logs.

## 🌟 What is OpenVerb?

OpenVerb is an architectural pattern for building Agentic AI applications where:
1. **Registry**: A strictly typed registry defines the "verbs" (actions) the AI can take
2. **Planner**: An LLM generates high-level plans composed of these verbs
3. **Executor**: A runtime engine executes the plan deterministically

In this chess demo:
- **Planner**: OpenAI GPT-4o or Anthropic Claude models
- **Executor**: Chess engine with legal move validation
- **Verbs**: `chess.make_move`, `chess.get_state`, `chess.get_legal_moves`, etc.

## 🚀 Features

- **AI vs AI Chess**: Watch GPT-4o battle Claude 3 Haiku in real-time
- **Full Transparency**: See every AI's reasoning for each move
- **Multiple AI Models**: Choose from GPT-4o, GPT-4o Mini, and Claude 3 Haiku
- **Enhanced AI Context**: AIs receive ASCII board visualization, material count, captured pieces, and loop detection
- **Captured Pieces Display**: Visual tracking of captured pieces on both sides
- **Move History**: Complete game notation with move-by-move breakdown
- **Demo Guardrails**: Rate limiting and usage caps for responsible demo deployment

## 🛠️ Getting Started

### Prerequisites
- Node.js (v18+)
- pnpm (recommended) or npm
- OpenAI API key and/or Anthropic API key

### Installation

1. **Clone the repository**:
   \`\`\`bash
   git clone https://github.com/sgthancel/open-verb-chess-demo.git
   cd open-verb-chess-demo
   \`\`\`

2. **Install dependencies**:
   \`\`\`bash
   pnpm install
   \`\`\`

3. **Set up Environment Variables**:
   Create a \`.env.local\` file in the root directory:
   \`\`\`env
   OPENAI_API_KEY=sk-your-openai-key-here
   ANTHROPIC_API_KEY=sk-ant-your-anthropic-key-here
   \`\`\`
   
   > Note: You need at least one API key. The app supports both OpenAI and Anthropic models.

4. **Run Development Server**:
   \`\`\`bash
   pnpm run dev
   \`\`\`
   Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🏗️ Architecture

### Core Files

- **`app/page.tsx`**: Main application entry point
- **`components/chess-game.tsx`**: Game state management and UI orchestration
- **`lib/chess-engine.ts`**: Chess rules engine with legal move generation
- **`app/api/ai-move/route.ts`**: AI move generation API with enhanced prompts and guardrails

### AI Enhancement Features

The AI receives comprehensive game context:
- **ASCII Board Visualization**: Visual representation of the current position
- **Material Analysis**: Point count and advantage calculation (Q=9, R=5, B=3, N=3, P=1)
- **Piece Positions**: Complete listing of all pieces and their squares
- **Captured Pieces**: Tracking of material lost by each side
- **Loop Detection**: Warnings when moves are repeating to prevent infinite loops
- **Strategic Guidance**: Opening, middlegame, and endgame principles

### Demo Guardrails

To ensure responsible demo deployment:
- **Rate Limiting**: 2-second cooldown between AI move requests
- **Usage Cap**: 50 AI moves per day per user (cookie-based)
- **Input Validation**: FEN, legal moves, and model validation
- **Error Handling**: Graceful fallbacks for API failures

## 🎮 How to Use

1. **Select AI Models**: Choose which AI model plays as White and Black
2. **Start Game**: Click "Human vs AI" or "AI vs AI"
3. **Watch**: See the AIs battle it out with full reasoning displayed
4. **Reset**: Start a new game anytime

## 🤝 Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines on how to:
- Add new AI models
- Improve chess strategy prompts
- Enhance the UI
- Fix bugs

## 📚 Learn More

- [OPENVERB_CONCEPTS.md](./OPENVERB_CONCEPTS.md) - Deep dive into the OpenVerb architecture
- [openverb npm package](https://www.npmjs.com/package/openverb) - Official OpenVerb protocol implementation

## 📄 License

MIT License. See [LICENSE](./LICENSE) for details.

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- AI powered by [Vercel AI SDK](https://sdk.vercel.ai/)
- Chess engine inspired by chess.js
- OpenVerb architecture pattern

---

**Demo Limits**: This demo is rate-limited to 50 AI moves per day. Fork this repo to remove limits and customize for your own use!
