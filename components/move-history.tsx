"use client"

import { cn } from "@/lib/utils"
import type { MoveRecord } from "@/lib/chess-engine"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useEffect, useRef } from "react"

interface MoveHistoryProps {
  moves: MoveRecord[]
  className?: string
}

export function MoveHistory({ moves, className }: MoveHistoryProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (bottomRef.current) {
      const scrollContainer = bottomRef.current.closest('[data-radix-scroll-area-viewport]')
      if (scrollContainer) {
        scrollContainer.scrollTo({ top: scrollContainer.scrollHeight, behavior: "smooth" })
      }
    }
  }, [moves.length])

  // Group moves into pairs (white + black)
  const pairs: { number: number; white?: MoveRecord; black?: MoveRecord }[] = []
  for (let i = 0; i < moves.length; i += 2) {
    pairs.push({
      number: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    })
  }

  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      <div className="px-4 py-2.5 border-b border-border flex-shrink-0">
        <h3 className="text-xs font-mono font-semibold text-foreground tracking-wide">
          Move History
        </h3>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-3 py-2">
          {pairs.length === 0 && (
            <div className="py-4 text-center text-muted-foreground text-sm font-mono">
              No moves yet
            </div>
          )}
          {pairs.map((pair) => (
            <div
              key={pair.number}
              className="flex items-center gap-1 py-0.5 text-sm font-mono"
            >
              <span className="w-8 text-muted-foreground text-right text-xs">
                {pair.number}.
              </span>
              {pair.white && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded min-w-[56px] text-center",
                    pair.white.captured
                      ? "text-primary font-semibold"
                      : "text-foreground"
                  )}
                >
                  {pair.white.san}
                </span>
              )}
              {pair.black && (
                <span
                  className={cn(
                    "px-2 py-0.5 rounded min-w-[56px] text-center",
                    pair.black.captured
                      ? "text-primary font-semibold"
                      : "text-foreground"
                  )}
                >
                  {pair.black.san}
                </span>
              )}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  )
}
