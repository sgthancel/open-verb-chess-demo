"use client"

import { cn } from "@/lib/utils"
import type { Board, LegalMove, PieceColor, Square } from "@/lib/chess-engine"
import { useState, useCallback } from "react"

const FILES = "abcdefgh"
const RANKS = "87654321"

function rcToSq(r: number, c: number): string {
  return FILES[c] + RANKS[r]
}

const PIECE_SYMBOLS: Record<string, string> = {
  wp: "\u2659",
  wn: "\u2658",
  wb: "\u2657",
  wr: "\u2656",
  wq: "\u2655",
  wk: "\u2654",
  bp: "\u265F",
  bn: "\u265E",
  bb: "\u265D",
  br: "\u265C",
  bq: "\u265B",
  bk: "\u265A",
}

function PieceDisplay({ piece }: { piece: Square }) {
  if (!piece) return null
  const symbol = PIECE_SYMBOLS[piece.color + piece.type]
  return (
    <span
      className={cn(
        "text-3xl md:text-4xl leading-none select-none drop-shadow-md",
        piece.color === "w" ? "text-[hsl(40,30%,95%)]" : "text-[hsl(220,20%,12%)]"
      )}
      style={{ textShadow: piece.color === "w" ? "0 1px 2px rgba(0,0,0,0.4)" : "0 1px 2px rgba(255,255,255,0.15)" }}
    >
      {symbol}
    </span>
  )
}

interface ChessBoardProps {
  board: Board
  turn: PieceColor
  legalMoves: LegalMove[]
  onMove?: (uci: string) => void
  lastMove?: { from: string; to: string } | null
  disabled?: boolean
  perspective?: PieceColor
}

export function ChessBoard({
  board,
  turn,
  legalMoves,
  onMove,
  lastMove,
  disabled = false,
  perspective = "w",
}: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null)

  const movesForSelected = selectedSquare
    ? legalMoves.filter((m) => m.from === selectedSquare)
    : []

  const handleSquareClick = useCallback(
    (sq: string, r: number, c: number) => {
      if (disabled) return

      // If a square is already selected, try to move
      if (selectedSquare) {
        const move = movesForSelected.find((m) => m.to === sq)
        if (move) {
          onMove?.(move.uci)
          setSelectedSquare(null)
          return
        }
      }

      // Select a new piece
      const piece = board[r][c]
      if (piece && piece.color === turn) {
        setSelectedSquare(sq)
      } else {
        setSelectedSquare(null)
      }
    },
    [selectedSquare, movesForSelected, board, turn, disabled, onMove]
  )

  const rows = perspective === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]
  const cols = perspective === "w" ? [0, 1, 2, 3, 4, 5, 6, 7] : [7, 6, 5, 4, 3, 2, 1, 0]

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="border-2 border-border rounded-lg overflow-hidden shadow-2xl">
        {rows.map((r) => (
          <div key={r} className="flex">
            {cols.map((c) => {
              const sq = rcToSq(r, c)
              const isLight = (r + c) % 2 === 0
              const isSelected = selectedSquare === sq
              const isTarget = movesForSelected.some((m) => m.to === sq)
              const isLastMove = lastMove && (lastMove.from === sq || lastMove.to === sq)
              const piece = board[r][c]

              return (
                <button
                  key={sq}
                  type="button"
                  onClick={() => handleSquareClick(sq, r, c)}
                  className={cn(
                    "w-12 h-12 md:w-16 md:h-16 flex items-center justify-center relative transition-colors duration-100",
                    isLight
                      ? "bg-[hsl(var(--board-light))]"
                      : "bg-[hsl(var(--board-dark))]",
                    isSelected && "bg-[hsl(var(--board-selected))] !bg-opacity-80",
                    isLastMove && !isSelected && "bg-[hsl(var(--board-highlight))] bg-opacity-30",
                    !disabled && piece && piece.color === turn && "cursor-pointer",
                    !disabled && isTarget && "cursor-pointer"
                  )}
                  style={
                    isSelected
                      ? { backgroundColor: "hsl(200 70% 55% / 0.6)" }
                      : isLastMove
                        ? { backgroundColor: `hsl(142 60% 50% / ${isLight ? "0.25" : "0.3"})` }
                        : undefined
                  }
                  disabled={disabled && !piece}
                  aria-label={`Square ${sq}${piece ? `, ${piece.color === "w" ? "white" : "black"} ${piece.type}` : ""}`}
                >
                  <PieceDisplay piece={piece} />

                  {/* Move target indicator */}
                  {isTarget && !piece && (
                    <div className="absolute w-3 h-3 md:w-4 md:h-4 rounded-full bg-[hsl(var(--board-highlight))] opacity-50" />
                  )}
                  {isTarget && piece && (
                    <div className="absolute inset-0 border-4 border-[hsl(var(--board-highlight))] opacity-60 rounded-sm" />
                  )}

                  {/* Coordinate labels */}
                  {c === (perspective === "w" ? 0 : 7) && (
                    <span
                      className={cn(
                        "absolute top-0.5 left-1 text-[10px] font-mono font-bold leading-none",
                        isLight ? "text-[hsl(var(--board-dark))]" : "text-[hsl(var(--board-light))]"
                      )}
                      style={{ opacity: 0.7 }}
                    >
                      {RANKS[r]}
                    </span>
                  )}
                  {r === (perspective === "w" ? 7 : 0) && (
                    <span
                      className={cn(
                        "absolute bottom-0.5 right-1 text-[10px] font-mono font-bold leading-none",
                        isLight ? "text-[hsl(var(--board-dark))]" : "text-[hsl(var(--board-light))]"
                      )}
                      style={{ opacity: 0.7 }}
                    >
                      {FILES[c]}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}
