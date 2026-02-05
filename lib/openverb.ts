// OpenVerb Chess Runtime
// Now using the official 'openverb' npm package
// This file re-exports from the new openverb module structure

import { createGame } from "./chess-engine"

// Re-export everything from the new openverb module
export * from "./openverb/index"

// Keep the createOpenVerbGame factory function here for convenience
import type { Agent, OpenVerbGame } from "./openverb/executor"


export function createOpenVerbGame(
  whiteAgent: Omit<Agent, "color">,
  blackAgent: Omit<Agent, "color">
): OpenVerbGame {
  return {
    id: `game_${Date.now()}`,
    state: createGame(),
    agents: {
      w: { ...whiteAgent, color: "w" },
      b: { ...blackAgent, color: "b" },
    },
    history: [],
    actionLog: [],
    status: "playing",
    createdAt: Date.now(),
  }
}
