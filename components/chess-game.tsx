"use client"

import { useState, useCallback, useRef, useEffect } from "react"
import { ChessBoard } from "@/components/chess-board"
import { ActionLog } from "@/components/action-log"
import { MoveHistory } from "@/components/move-history"
import { GameControls, type GameMode } from "@/components/game-controls"
import { CapturedPieces } from "@/components/captured-pieces"
import {
  createOpenVerbGame,
  verbGetState,
  verbGetLegalMoves,
  verbMakeMove,
  verbGetHistory,
  type OpenVerbGame,
  type VerbAction,
} from "@/lib/openverb"
import { getLegalMoves, toFEN, type LegalMove } from "@/lib/chess-engine"

export function ChessGame() {
  const [game, setGame] = useState<OpenVerbGame>(() =>
    createOpenVerbGame(
      { id: "human", name: "You", type: "human" },
      { id: "ai-black", name: "AI (Black)", type: "ai", model: "gpt-4o-mini" }
    )
  )
  const [mode, setMode] = useState<GameMode>("human-vs-ai")
  const [whiteModel, setWhiteModel] = useState("gpt-4o-mini")
  const [blackModel, setBlackModel] = useState("claude-3-haiku-20240307")
  const [isRunning, setIsRunning] = useState(false)
  const [isThinking, setIsThinking] = useState(false)
  const [actionLog, setActionLog] = useState<VerbAction[]>([])
  const abortRef = useRef(false)
  const gameRef = useRef(game)

  // Keep ref in sync
  useEffect(() => {
    gameRef.current = game
  }, [game])

  const legalMoves: LegalMove[] = game.status === "playing" ? getLegalMoves(game.state) : []

  const lastMove =
    game.history.length > 0
      ? { from: game.history[game.history.length - 1].from, to: game.history[game.history.length - 1].to }
      : null

  const resetGame = useCallback(() => {
    abortRef.current = true
    setIsRunning(false)
    setIsThinking(false)

    const whiteAgent =
      mode === "ai-vs-ai"
        ? { id: "ai-white", name: `AI White`, type: "ai" as const, model: whiteModel }
        : { id: "human", name: "You", type: "human" as const }

    const blackAgent = {
      id: "ai-black",
      name: `AI Black`,
      type: "ai" as const,
      model: blackModel,
    }

    const newGame = createOpenVerbGame(whiteAgent, blackAgent)
    setGame(newGame)
    setActionLog([])
    gameRef.current = newGame
  }, [mode, whiteModel, blackModel])

  const requestAIMove = useCallback(
    async (currentGame: OpenVerbGame) => {
      if (currentGame.status !== "playing") return
      if (abortRef.current) return

      const currentAgent = currentGame.agents[currentGame.state.turn]
      if (currentAgent.type !== "ai") return

      setIsThinking(true)

      try {
        // Execute OpenVerb read verbs
        const stateAction = verbGetState(currentGame, currentAgent.id)
        const { action: movesAction, moves } = verbGetLegalMoves(currentGame, currentAgent.id)
        const historyAction = verbGetHistory(currentGame, currentAgent.id)

        setActionLog((prev) => [...prev, stateAction, movesAction, historyAction])

        if (moves.length === 0 || abortRef.current) {
          setIsThinking(false)
          return
        }

        // Call AI API
        const response = await fetch("/api/ai-move", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fen: toFEN(currentGame.state),
            legalMoves: moves.map((m) => m.uci),
            moveHistory: currentGame.history.map((m) => ({ ply: m.ply, san: m.san })),
            model: currentAgent.model,
            color: currentGame.state.turn,
          }),
        })

        if (abortRef.current) {
          setIsThinking(false)
          return
        }

        const { move: moveUCI, reasoning } = await response.json()

        // Execute OpenVerb make_move verb
        const { action: moveAction } = verbMakeMove(currentGame, currentAgent.id, moveUCI, reasoning)
        setActionLog((prev) => [...prev, moveAction])

        // Update state
        setGame({ ...currentGame })
        gameRef.current = currentGame
      } catch (err) {
        console.error("AI move error:", err)
      } finally {
        setIsThinking(false)
      }
    },
    []
  )

  // Handle human move
  const handleHumanMove = useCallback(
    (uci: string) => {
      if (game.status !== "playing") return
      if (mode === "ai-vs-ai") return

      const currentAgent = game.agents[game.state.turn]
      if (currentAgent.type !== "human") return

      const { action } = verbMakeMove(game, currentAgent.id, uci, "Human move")
      setActionLog((prev) => [...prev, action])
      setGame({ ...game })
      gameRef.current = game

      // Trigger AI response with updated game state
      if (game.status === "playing") {
        setTimeout(() => requestAIMove(gameRef.current), 500)
      }
    },
    [game, mode, requestAIMove]
  )

  // AI vs AI game loop
  const runAIvsAI = useCallback(async () => {
    abortRef.current = false
    setIsRunning(true)

    const currentGame = gameRef.current

    const loop = async () => {
      let g = currentGame
      while (g.status === "playing" && !abortRef.current) {
        await requestAIMove(g)
        g = gameRef.current
        // Small delay between moves for visual effect
        await new Promise((resolve) => setTimeout(resolve, 1000))
      }
      setIsRunning(false)
    }

    loop()
  }, [requestAIMove])

  const handleStart = useCallback(() => {
    abortRef.current = false
    if (mode === "ai-vs-ai") {
      runAIvsAI()
    } else {
      // In human-vs-ai mode, if AI plays white, make first move
      setIsRunning(true)
      if (game.agents.w.type === "ai") {
        requestAIMove(game)
      }
    }
  }, [mode, game, runAIvsAI, requestAIMove])

  const handlePause = useCallback(() => {
    abortRef.current = true
    setIsRunning(false)
  }, [])

  const handleModeChange = useCallback(
    (newMode: GameMode) => {
      setMode(newMode)
      // Reset on mode change
      abortRef.current = true
      setIsRunning(false)
      setIsThinking(false)

      const whiteAgent =
        newMode === "ai-vs-ai"
          ? { id: "ai-white", name: `AI White`, type: "ai" as const, model: whiteModel }
          : { id: "human", name: "You", type: "human" as const }

      const blackAgent = {
        id: "ai-black",
        name: `AI Black`,
        type: "ai" as const,
        model: blackModel,
      }

      const newGame = createOpenVerbGame(whiteAgent, blackAgent)
      setGame(newGame)
      setActionLog([])
      gameRef.current = newGame
    },
    [whiteModel, blackModel]
  )

  const isHumanTurn =
    mode === "human-vs-ai" &&
    game.status === "playing" &&
    game.agents[game.state.turn].type === "human" &&
    !isThinking

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border px-4 py-2.5 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded bg-primary flex items-center justify-center">
            <span className="text-primary-foreground font-mono font-bold text-xs">OV</span>
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground font-mono tracking-tight">
              OpenVerb Chess
            </h1>
            <p className="text-[11px] text-muted-foreground font-mono">
              AI agents playing through the OpenVerb protocol
            </p>
          </div>
        </div>
        <a
          href="/about"
          className="text-xs font-mono text-muted-foreground hover:text-primary transition-colors"
        >
          How it works
        </a>
      </header>

      {/* Main Content - fixed height, no scroll */}
      <main className="flex-1 flex flex-col lg:flex-row min-h-0">
        {/* Left: Board + inline controls */}
        <div className="flex-1 flex flex-col items-center justify-center gap-3 p-4 min-h-0">
          {/* Agent labels */}
          <div className="flex items-center gap-4 w-full max-w-lg justify-between">
            <div className="flex items-center gap-2">
              <div className="w-3.5 h-3.5 rounded-sm bg-[hsl(40,30%,92%)] border border-border" />
              <span className="text-xs font-mono text-foreground">
                {game.agents.w.name}
                {game.agents.w.model && (
                  <span className="text-muted-foreground ml-1 text-[10px]">
                    ({game.agents.w.model.split("/").pop()})
                  </span>
                )}
              </span>
              {game.state.turn === "w" && game.status === "playing" && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
            </div>
            {isThinking && (
              <div className="flex items-center gap-1.5 text-[11px] font-mono text-primary">
                <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
                Thinking...
              </div>
            )}
            <div className="flex items-center gap-2">
              {game.state.turn === "b" && game.status === "playing" && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
              )}
              <span className="text-xs font-mono text-foreground">
                {game.agents.b.name}
                {game.agents.b.model && (
                  <span className="text-muted-foreground ml-1 text-[10px]">
                    ({game.agents.b.model.split("/").pop()})
                  </span>
                )}
              </span>
              <div className="w-3.5 h-3.5 rounded-sm bg-[hsl(220,20%,15%)] border border-border" />
            </div>
          </div>

          {/* Board with captured pieces on sides */}
          <div className="flex items-center gap-4">
            {/* White captured pieces - left side */}
            <div className="flex flex-col gap-1 items-center min-w-[40px]">
              <span className="text-[10px] text-muted-foreground mb-1">Lost</span>
              {(() => {
                const [position] = toFEN(game.state).split(" ")
                const startingPieces: Record<string, number> = { 'Q': 1, 'R': 2, 'B': 2, 'N': 2, 'P': 8 }
                const currentPieces: Record<string, number> = { 'Q': 0, 'R': 0, 'B': 0, 'N': 0, 'P': 0 }
                for (const char of position) if (char in currentPieces) currentPieces[char]++
                const whiteCaptured: string[] = []
                const pieceSymbols: Record<string, string> = { 'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙' }
                for (const piece of ['Q', 'R', 'B', 'N', 'P']) {
                  const captured = startingPieces[piece] - currentPieces[piece]
                  for (let i = 0; i < captured; i++) whiteCaptured.push(pieceSymbols[piece])
                }
                return whiteCaptured.length > 0 ? whiteCaptured.map((p, i) => (
                  <span key={i} className="text-2xl text-white drop-shadow-md">{p}</span>
                )) : <span className="text-xs text-muted-foreground">-</span>
              })()}
            </div>

            {/* Chess Board */}
            <ChessBoard
              board={game.state.board}
              turn={game.state.turn}
              legalMoves={legalMoves}
              onMove={handleHumanMove}
              lastMove={lastMove}
              disabled={!isHumanTurn}
              perspective="w"
            />

            {/* Black captured pieces - right side */}
            <div className="flex flex-col gap-1 items-center min-w-[40px]">
              <span className="text-[10px] text-muted-foreground mb-1">Lost</span>
              {(() => {
                const [position] = toFEN(game.state).split(" ")
                const startingPieces: Record<string, number> = { 'q': 1, 'r': 2, 'b': 2, 'n': 2, 'p': 8 }
                const currentPieces: Record<string, number> = { 'q': 0, 'r': 0, 'b': 0, 'n': 0, 'p': 0 }
                for (const char of position) if (char in currentPieces) currentPieces[char]++
                const blackCaptured: string[] = []
                const pieceSymbols: Record<string, string> = { 'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟' }
                for (const piece of ['q', 'r', 'b', 'n', 'p']) {
                  const captured = startingPieces[piece] - currentPieces[piece]
                  for (let i = 0; i < captured; i++) blackCaptured.push(pieceSymbols[piece])
                }
                return blackCaptured.length > 0 ? blackCaptured.map((p, i) => (
                  <span key={i} className="text-2xl text-black drop-shadow-md">{p}</span>
                )) : <span className="text-xs text-muted-foreground">-</span>
              })()}
            </div>
          </div>

          {/* Compact inline controls below the board */}
          <div className="w-full max-w-lg">
            <GameControls
              mode={mode}
              onModeChange={handleModeChange}
              whiteModel={whiteModel}
              blackModel={blackModel}
              onWhiteModelChange={setWhiteModel}
              onBlackModelChange={setBlackModel}
              status={game.status}
              isRunning={isRunning || isThinking}
              onStart={handleStart}
              onReset={resetGame}
              onPause={handlePause}
            />
          </div>
        </div>

        {/* Right sidebar: Action Log + History with internal scroll */}
        <aside className="w-full lg:w-96 border-l border-border flex flex-col bg-card min-h-0">
          <div className="flex-1 flex flex-col min-h-0">
            <div className="flex-[3] min-h-0 border-b border-border">
              <ActionLog actions={actionLog} />
            </div>
            <div className="flex-[2] min-h-0">
              <MoveHistory moves={game.history} />
            </div>
          </div>
        </aside>
      </main>
    </div>
  )
}
