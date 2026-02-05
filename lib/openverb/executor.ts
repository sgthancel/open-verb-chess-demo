// OpenVerb Chess Executor
// Refactored to use the official 'openverb' package
// This file provides convenience wrapper functions for the chess game

import {
    type GameState,
    type LegalMove,
    type MoveRecord,
    type GameStatus,
    type PieceColor,
    getLegalMoves,
    getGameStatus,
    makeMove,
    toFEN,
} from "../chess-engine"


// --- OpenVerb Types ---

export type AgentType = "human" | "ai"

export interface Agent {
    id: string
    name: string
    type: AgentType
    color: PieceColor
    model?: string // AI model identifier
}

export interface VerbAction {
    id: string
    verb: string
    agent: string
    args: Record<string, unknown>
    result: Record<string, unknown>
    timestamp: number
    reasoning?: string
}

export interface OpenVerbGame {
    id: string
    state: GameState
    agents: { w: Agent; b: Agent }
    history: MoveRecord[]
    actionLog: VerbAction[]
    status: GameStatus
    createdAt: number
}

// --- Helper Functions ---

let actionCounter = 0

function createActionId(): string {
    return `act_${Date.now()}_${++actionCounter}`
}

// --- Convenience Wrapper Functions ---
// These maintain the existing API that the chess-game component uses


export function verbGetState(game: OpenVerbGame, agentId: string): VerbAction {
    const action: VerbAction = {
        id: createActionId(),
        verb: "chess.get_state",
        agent: agentId,
        args: { gameId: game.id },
        result: {},
        timestamp: Date.now(),
    }

    try {
        const fen = toFEN(game.state)
        action.result = {
            fen,
            turn: game.state.turn,
            status: game.status,
            ply: game.history.length,
            inCheck: false,
        }
        game.actionLog.push(action)
    } catch (error) {
        action.result = { ok: false, error: (error as Error).message }
        game.actionLog.push(action)
    }

    return action
}

export function verbGetLegalMoves(game: OpenVerbGame, agentId: string): { action: VerbAction; moves: LegalMove[] } {
    const moves = getLegalMoves(game.state)
    const action: VerbAction = {
        id: createActionId(),
        verb: "chess.get_legal_moves",
        agent: agentId,
        args: { gameId: game.id },
        result: {
            count: moves.length,
            moves: moves.map((m) => m.uci),
        },
        timestamp: Date.now(),
    }
    game.actionLog.push(action)
    return { action, moves }
}

export function verbGetHistory(game: OpenVerbGame, agentId: string): VerbAction {
    const action: VerbAction = {
        id: createActionId(),
        verb: "chess.get_history",
        agent: agentId,
        args: { gameId: game.id },
        result: {
            moves: game.history.map((m) => ({
                san: m.san,
                uci: m.uci,
                ply: m.ply,
            })),
            totalMoves: game.history.length,
        },
        timestamp: Date.now(),
    }
    game.actionLog.push(action)
    return action
}

export function verbMakeMove(
    game: OpenVerbGame,
    agentId: string,
    moveUCI: string,
    reasoning?: string
): { action: VerbAction; success: boolean; error?: string } {
    // Validate: correct agent's turn
    const currentAgent = game.agents[game.state.turn]
    if (currentAgent.id !== agentId) {
        const action: VerbAction = {
            id: createActionId(),
            verb: "chess.make_move",
            agent: agentId,
            args: { gameId: game.id, moveUCI },
            result: { ok: false, error: "Not your turn" },
            timestamp: Date.now(),
            reasoning,
        }
        game.actionLog.push(action)
        return { action, success: false, error: "Not your turn" }
    }

    // Validate: game is still playing
    if (game.status !== "playing") {
        const action: VerbAction = {
            id: createActionId(),
            verb: "chess.make_move",
            agent: agentId,
            args: { gameId: game.id, moveUCI },
            result: { ok: false, error: "Game is over" },
            timestamp: Date.now(),
            reasoning,
        }
        game.actionLog.push(action)
        return { action, success: false, error: "Game is over" }
    }

    const result = makeMove(game.state, moveUCI)
    if (!result) {
        const action: VerbAction = {
            id: createActionId(),
            verb: "chess.make_move",
            agent: agentId,
            args: { gameId: game.id, moveUCI },
            result: { ok: false, error: "Illegal move" },
            timestamp: Date.now(),
            reasoning,
        }
        game.actionLog.push(action)
        return { action, success: false, error: "Illegal move" }
    }

    const moveRecord: MoveRecord = {
        from: result.move.from,
        to: result.move.to,
        san: result.move.san,
        uci: result.move.uci,
        fen: toFEN(result.state),
        ply: game.history.length + 1,
        timestamp: Date.now(),
        piece: result.move.piece,
        captured: result.move.captured,
        promotion: result.move.promotion,
    }

    game.state = result.state
    game.history.push(moveRecord)
    game.status = getGameStatus(result.state)

    const action: VerbAction = {
        id: createActionId(),
        verb: "chess.make_move",
        agent: agentId,
        args: { gameId: game.id, moveUCI },
        result: {
            ok: true,
            san: result.move.san,
            newFen: toFEN(result.state),
            status: game.status,
            ply: game.history.length,
        },
        timestamp: Date.now(),
        reasoning,
    }
    game.actionLog.push(action)

    return { action, success: true }
}

export function verbResign(game: OpenVerbGame, agentId: string): VerbAction {
    const color = game.agents.w.id === agentId ? "w" : "b"
    game.status = color === "w" ? "checkmate_black" : "checkmate_white"

    const action: VerbAction = {
        id: createActionId(),
        verb: "chess.resign",
        agent: agentId,
        args: { gameId: game.id },
        result: {
            ok: true,
            winner: color === "w" ? "black" : "white",
            status: game.status,
        },
        timestamp: Date.now(),
    }
    game.actionLog.push(action)
    return action
}

// Re-export types
export type { GameState, LegalMove, MoveRecord, GameStatus, PieceColor }
