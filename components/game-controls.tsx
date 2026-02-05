"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import type { GameStatus } from "@/lib/chess-engine"

export type GameMode = "human-vs-ai" | "ai-vs-ai"

interface GameControlsProps {
  mode: GameMode
  onModeChange: (mode: GameMode) => void
  whiteModel: string
  blackModel: string
  onWhiteModelChange: (model: string) => void
  onBlackModelChange: (model: string) => void
  status: GameStatus
  isRunning: boolean
  onStart: () => void
  onReset: () => void
  onPause: () => void
  className?: string
}

const AI_MODELS = [
  { value: "gpt-4o-mini", label: "GPT-4o Mini" },
  { value: "gpt-4o", label: "GPT-4o" },
  { value: "claude-3-haiku-20240307", label: "Claude 3 Haiku" },
]






function getStatusText(status: GameStatus): string {
  switch (status) {
    case "playing":
      return "In Progress"
    case "checkmate_white":
      return "White Wins (Checkmate)"
    case "checkmate_black":
      return "Black Wins (Checkmate)"
    case "stalemate":
      return "Draw (Stalemate)"
    case "draw_50":
      return "Draw (50-Move Rule)"
    case "draw_insufficient":
      return "Draw (Insufficient Material)"
    default:
      return "Unknown"
  }
}

function getStatusColor(status: GameStatus): string {
  if (status === "playing") return "text-primary"
  if (status.startsWith("checkmate")) return "text-primary"
  return "text-muted-foreground"
}

export function GameControls({
  mode,
  onModeChange,
  whiteModel,
  blackModel,
  onWhiteModelChange,
  onBlackModelChange,
  status,
  isRunning,
  onStart,
  onReset,
  onPause,
  className,
}: GameControlsProps) {
  const isGameOver = status !== "playing"

  return (
    <div className={cn("bg-card border border-border rounded-lg px-4 py-3", className)}>
      {/* Row 1: Status + Mode + Actions */}
      <div className="flex items-center gap-3 flex-wrap">
        {/* Status */}
        <div className="flex items-center gap-1.5 mr-1">
          <div
            className={cn(
              "w-2 h-2 rounded-full flex-shrink-0",
              status === "playing"
                ? isRunning
                  ? "bg-primary animate-pulse"
                  : "bg-muted-foreground"
                : "bg-primary"
            )}
          />
          <span className={cn("font-mono text-xs font-semibold whitespace-nowrap", getStatusColor(status))}>
            {getStatusText(status)}
          </span>
        </div>

        <div className="w-px h-5 bg-border flex-shrink-0" />

        {/* Mode toggle */}
        <div className="flex gap-1">
          <Button
            variant={mode === "human-vs-ai" ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange("human-vs-ai")}
            className="font-mono text-[11px] h-7 px-2.5"
            disabled={isRunning}
          >
            Human vs AI
          </Button>
          <Button
            variant={mode === "ai-vs-ai" ? "default" : "outline"}
            size="sm"
            onClick={() => onModeChange("ai-vs-ai")}
            className="font-mono text-[11px] h-7 px-2.5"
            disabled={isRunning}
          >
            AI vs AI
          </Button>
        </div>

        <div className="w-px h-5 bg-border flex-shrink-0" />

        {/* Model selectors inline */}
        {mode === "ai-vs-ai" && (
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-mono text-muted-foreground uppercase">W:</span>
            <Select value={whiteModel} onValueChange={onWhiteModelChange} disabled={isRunning}>
              <SelectTrigger className="font-mono text-[11px] h-7 w-[130px] bg-secondary border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {AI_MODELS.map((m) => (
                  <SelectItem key={m.value} value={m.value} className="font-mono text-xs">
                    {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="flex items-center gap-1.5">
          <span className="text-[10px] font-mono text-muted-foreground uppercase">
            {mode === "human-vs-ai" ? "VS:" : "B:"}
          </span>
          <Select value={blackModel} onValueChange={onBlackModelChange} disabled={isRunning}>
            <SelectTrigger className="font-mono text-[11px] h-7 w-[130px] bg-secondary border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {AI_MODELS.map((m) => (
                <SelectItem key={m.value} value={m.value} className="font-mono text-xs">
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Spacer to push actions right */}
        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex gap-1.5 flex-shrink-0">
          {!isRunning && !isGameOver && (
            <Button onClick={onStart} size="sm" className="font-mono text-[11px] h-7 px-3">
              {status === "playing" ? "Start" : "New Game"}
            </Button>
          )}
          {isRunning && (
            <Button onClick={onPause} variant="outline" size="sm" className="font-mono text-[11px] h-7 px-3 bg-transparent">
              Pause
            </Button>
          )}
          <Button onClick={onReset} variant="outline" size="sm" className="font-mono text-[11px] h-7 px-3 bg-transparent">
            Reset
          </Button>
        </div>
      </div>
    </div>
  )
}
