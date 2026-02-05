import { loadLibrary } from "openverb"

export const chessRegistry = loadLibrary({
  namespace: "chess",
  version: "1.0.0",
  description: "AI-Native Chess Interface using OpenVerb Protocol",
  verbs: [
    {
      name: "get_state",
      category: "read",
      description: "Returns the current board position (FEN), whose turn it is, and the game status.",
      params: {
        gameId: { type: "string", description: "Game identifier", required: true },
      },
    },
    {
      name: "get_legal_moves",
      category: "read",
      description: "Returns all legal moves for the current position in UCI format.",
      params: {
        gameId: { type: "string", description: "Game identifier", required: true },
      },
    },
    {
      name: "get_history",
      category: "read",
      description: "Returns the complete move history with SAN notation, timestamps, and ply numbers.",
      params: {
        gameId: { type: "string", description: "Game identifier", required: true },
      },
    },
    {
      name: "make_move",
      category: "write",
      description: "Submits a move in UCI format. The engine validates turn order, legality, and game status before applying.",
      params: {
        gameId: { type: "string", description: "Game identifier", required: true },
        moveUCI: { type: "string", description: "Move in UCI format (e.g., 'e2e4')", required: true },
        reasoning: { type: "string", description: "Optional reasoning for the move", required: false },
      },
    },
    {
      name: "resign",
      category: "write",
      description: "Resign the game. The opponent wins.",
      params: {
        gameId: { type: "string", description: "Game identifier", required: true },
      },
    },
  ],
})

// Get verb summaries for AI planner
export function getVerbSummary(): string {
  return chessRegistry.verbs
    .map((v) => `- ${v.name}: ${v.description}`)
    .join("\n")
}
