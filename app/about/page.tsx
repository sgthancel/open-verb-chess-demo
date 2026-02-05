import React from "react"
import Link from "next/link"

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-2xl font-semibold text-foreground font-sans tracking-tight text-balance">
        {title}
      </h2>
      {children}
    </section>
  )
}

function CodeBlock({ title, code }: { title?: string; code: string }) {
  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {title && (
        <div className="px-4 py-2 border-b border-border bg-secondary">
          <span className="text-xs font-mono text-muted-foreground">{title}</span>
        </div>
      )}
      <pre className="p-4 bg-card overflow-x-auto">
        <code className="text-sm font-mono text-foreground leading-relaxed whitespace-pre">
          {code}
        </code>
      </pre>
    </div>
  )
}

function VerbCard({
  verb,
  type,
  description,
}: {
  verb: string
  type: "read" | "write"
  description: string
}) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span
          className={
            type === "read"
              ? "px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-[hsl(200,70%,55%)]/20 text-[hsl(200,70%,55%)]"
              : "px-2 py-0.5 rounded text-[11px] font-mono font-semibold bg-primary/20 text-primary"
          }
        >
          {type === "read" ? "READ" : "WRITE"}
        </span>
        <code className="text-sm font-mono font-semibold text-foreground">{verb}</code>
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
    </div>
  )
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-card p-4 flex flex-col gap-1">
      <span className="text-2xl font-mono font-bold text-primary">{value}</span>
      <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">
        {label}
      </span>
    </div>
  )
}

export default function AboutPage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-mono font-bold text-sm">OV</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground font-mono tracking-tight">
              OpenVerb Chess
            </h1>
            <p className="text-xs text-muted-foreground font-mono">
              How it works
            </p>
          </div>
        </div>
        <Link
          href="/"
          className="text-sm font-mono text-muted-foreground hover:text-primary transition-colors"
        >
          Back to game
        </Link>
      </header>

      {/* Content */}
      <main className="flex-1 max-w-3xl mx-auto px-6 py-12 flex flex-col gap-12">
        {/* Hero */}
        <div className="flex flex-col gap-4">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground font-sans tracking-tight text-balance leading-tight">
            Chess as a living proof of the OpenVerb protocol
          </h1>
          <p className="text-lg text-muted-foreground leading-relaxed max-w-2xl">
            This is not a chess product. It is a demonstration that any deterministic
            environment can be turned into a verb-driven control surface where AI agents
            operate through structured, validated, and replayable actions.
          </p>
        </div>

        {/* Why Chess */}
        <Section title="Why chess is the perfect sandbox">
          <p className="text-muted-foreground leading-relaxed">
            Chess has everything OpenVerb needs to shine: strict turn-based flow, deterministic
            state, finite legal actions, and a complete audit trail. The verb surface is
            deliberately tiny, which makes it dead simple to demonstrate how the verb-to-executor-to-state-change
            loop works in practice.
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard label="Verbs" value="4" />
            <StatCard label="Avg Moves/Game" value="40-80" />
            <StatCard label="API Calls (AI vs AI)" value="~60" />
            <StatCard label="Cost per Game" value="<$0.05" />
          </div>
        </Section>

        {/* Architecture */}
        <Section title="The architecture">
          <p className="text-muted-foreground leading-relaxed">
            The system follows the OpenVerb mental model: a truth source (the chess engine),
            a set of typed verbs (the action language), pluggable agents (human or AI), and
            an immutable action log that records every interaction.
          </p>

          <CodeBlock
            title="The OpenVerb loop"
            code={`1. Engine: it's White's turn
2. Agent calls chess.get_state → reads FEN, status
3. Agent calls chess.get_legal_moves → gets valid actions
4. Agent calls chess.get_history → reviews past moves
5. Agent chooses → calls chess.make_move with UCI notation
6. Engine validates → applies move → updates state
7. Action is logged with reasoning + timestamp
8. Repeat for next agent`}
          />
        </Section>

        {/* Verb Surface */}
        <Section title="The verb surface">
          <p className="text-muted-foreground leading-relaxed">
            Every interaction between an agent and the game goes through exactly one of these
            four verbs. Read verbs are safe and idempotent. Write verbs mutate state and are
            validated by the engine before execution.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <VerbCard
              verb="chess.get_state"
              type="read"
              description="Returns the current board position (FEN), whose turn it is, and the game status. Safe to call any time."
            />
            <VerbCard
              verb="chess.get_legal_moves"
              type="read"
              description="Returns all legal moves for the current position in UCI format. The agent must choose from this list."
            />
            <VerbCard
              verb="chess.get_history"
              type="read"
              description="Returns the complete move history with SAN notation, timestamps, and ply numbers."
            />
            <VerbCard
              verb="chess.make_move"
              type="write"
              description="Submits a move in UCI format. The engine validates turn order, legality, and game status before applying."
            />
          </div>

          <CodeBlock
            title="Example action payload"
            code={`{
  "verb": "chess.make_move",
  "agent": "ai-white",
  "args": {
    "gameId": "game_1706000000",
    "moveUCI": "e2e4"
  },
  "reasoning": "Controls the center and opens lines for the bishop and queen.",
  "timestamp": 1706000001234
}`}
          />
        </Section>

        {/* Truth Source */}
        <Section title="The truth source">
          <p className="text-muted-foreground leading-relaxed">
            The chess engine is the single source of truth. AI agents never edit the board
            directly -- they can only call verbs. The engine validates every action and
            maintains the canonical game state. This is the core safety guarantee.
          </p>

          <CodeBlock
            title="GameState structure"
            code={`interface GameState {
  board: Square[][]     // 8x8 grid of pieces or null
  turn: "w" | "b"      // Whose move
  castling: {           // Castling availability
    K: boolean          // White kingside
    Q: boolean          // White queenside  
    k: boolean          // Black kingside
    q: boolean          // Black queenside
  }
  enPassant: string | null  // Target square for en passant
  halfmoveClock: number     // For 50-move draw rule
  fullmoveNumber: number    // Increments after Black moves
}`}
          />
        </Section>

        {/* AI Behavior */}
        <Section title="How the AI actually plays">
          <p className="text-muted-foreground leading-relaxed">
            LLMs are not chess engines. They are pattern matchers, not brute-force evaluators.
            Neither GPT nor Claude will play anywhere near Stockfish level. In practice, both
            play human-like, imperfect chess at roughly 1200-1800 ELO depending on the model
            and prompt design.
          </p>

          <div className="rounded-lg border border-border bg-card p-6 flex flex-col gap-4">
            <h3 className="font-semibold text-foreground font-sans">What to expect</h3>
            <ul className="flex flex-col gap-2">
              <li className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>
                  <strong className="text-foreground">Games are competitive.</strong>{" "}
                  Both models play imperfect but interesting chess. No model consistently dominates.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>
                  <strong className="text-foreground">Different styles emerge.</strong>{" "}
                  Some models play more aggressively, others more positionally. This makes for great viewing.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>
                  <strong className="text-foreground">Humans can win.</strong>{" "}
                  In Human vs AI mode, games feel fair. Much better UX than getting crushed by Stockfish.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm text-muted-foreground leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                <span>
                  <strong className="text-foreground">Reasoning is visible.</strong>{" "}
                  Every move includes the AI&apos;s reasoning in the action log, so you can see what it was thinking.
                </span>
              </li>
            </ul>
          </div>
        </Section>

        {/* Cost Analysis */}
        <Section title="API cost analysis">
          <p className="text-muted-foreground leading-relaxed">
            The key insight: do not ask the model to analyze the whole board. You already
            computed the legal moves and the FEN. Just ask the model to choose from the list.
            This keeps token counts tiny and costs negligible.
          </p>

          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-secondary">
                  <th className="px-4 py-3 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider">
                    Mode
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider">
                    API Calls
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider">
                    Tokens/Call
                  </th>
                  <th className="px-4 py-3 text-left font-mono text-xs text-muted-foreground uppercase tracking-wider">
                    Est. Cost
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                <tr className="bg-card">
                  <td className="px-4 py-3 font-mono text-foreground">Human vs AI</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">20-40</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">~300-500</td>
                  <td className="px-4 py-3 font-mono text-primary font-semibold">{'< $0.02'}</td>
                </tr>
                <tr className="bg-card">
                  <td className="px-4 py-3 font-mono text-foreground">AI vs AI</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">40-80</td>
                  <td className="px-4 py-3 font-mono text-muted-foreground">~300-500</td>
                  <td className="px-4 py-3 font-mono text-primary font-semibold">{'< $0.05'}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        {/* The Real Point */}
        <Section title="The real point">
          <p className="text-muted-foreground leading-relaxed">
            The chess game is not the product. It is the proof. People ask &quot;What does
            OpenVerb actually do?&quot; and you point at a live chess match where every move
            is a logged, validated, replayable verb action. That is infinitely more convincing
            than a diagram.
          </p>

          <div className="rounded-lg border border-primary/30 bg-primary/5 p-6 flex flex-col gap-3">
            <h3 className="font-semibold text-primary font-sans text-lg">
              Three demo angles that land
            </h3>
            <ol className="flex flex-col gap-3">
              <li className="flex items-start gap-3 text-sm text-foreground leading-relaxed">
                <span className="font-mono text-primary font-bold flex-shrink-0">01</span>
                <span>
                  <strong>Deterministic sandbox + audited actions.</strong>{" "}
                  Every action is logged, replayable, and attributable to an agent with a policy version.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm text-foreground leading-relaxed">
                <span className="font-mono text-primary font-bold flex-shrink-0">02</span>
                <span>
                  <strong>Swappable agents.</strong>{" "}
                  Plug in an LLM agent, a Stockfish agent, a random agent, or a human. They all
                  talk through the same verb surface.
                </span>
              </li>
              <li className="flex items-start gap-3 text-sm text-foreground leading-relaxed">
                <span className="font-mono text-primary font-bold flex-shrink-0">03</span>
                <span>
                  <strong>Policy + paywall hooks.</strong>{" "}
                  Rate-limit per game, per user. Analysis depth tiers. This is where monetization
                  fits naturally into the protocol.
                </span>
              </li>
            </ol>
          </div>
        </Section>

        {/* Swappable Agents */}
        <Section title="Swappable agents">
          <p className="text-muted-foreground leading-relaxed">
            Because every agent talks through the same verb surface, swapping one agent for
            another is trivial. The engine does not care who is calling the verbs, only that
            the verbs are valid. This is the core extensibility of OpenVerb.
          </p>

          <CodeBlock
            title="Agent interface"
            code={`interface Agent {
  id: string        // Unique identifier
  name: string      // Display name
  type: "human" | "ai"
  color: "w" | "b"  // Which side they play
  model?: string    // AI model (e.g. "openai/gpt-4o")
}

// The engine doesn't care about the agent type.
// It only validates:
//   1. Is it this agent's turn?
//   2. Is the move legal?
//   3. Is the game still playing?`}
          />
        </Section>

        {/* CTA */}
        <div className="border-t border-border pt-8 flex flex-col gap-4 items-center text-center">
          <h2 className="text-2xl font-semibold text-foreground font-sans tracking-tight">
            See it in action
          </h2>
          <p className="text-muted-foreground max-w-md">
            Go back to the game, select AI vs AI, pick two different models, and watch
            them play through the OpenVerb protocol. Every move is logged.
          </p>
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-6 py-3 font-mono text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Play a game
          </Link>
        </div>

        {/* Footer */}
        <footer className="border-t border-border pt-6 pb-8">
          <p className="text-xs text-muted-foreground font-mono text-center">
            Built with OpenVerb protocol, Next.js, and the Vercel AI SDK.
            Chess engine written in pure TypeScript with zero dependencies.
          </p>
        </footer>
      </main>
    </div>
  )
}
