"use client"

import { cn } from "@/lib/utils"
import type { VerbAction } from "@/lib/openverb"
import { useEffect, useRef } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"

function VerbBadge({ verb }: { verb: string }) {
  const colors: Record<string, string> = {
    "chess.make_move": "bg-primary/20 text-primary",
    "chess.get_state": "bg-[hsl(200,70%,55%)]/20 text-[hsl(200,70%,55%)]",
    "chess.get_legal_moves": "bg-[hsl(200,70%,55%)]/20 text-[hsl(200,70%,55%)]",
    "chess.get_history": "bg-[hsl(200,70%,55%)]/20 text-[hsl(200,70%,55%)]",
    "chess.resign": "bg-destructive/20 text-destructive",
  }

  return (
    <span
      className={cn(
        "px-2 py-0.5 rounded text-[11px] font-mono font-semibold",
        colors[verb] || "bg-muted text-muted-foreground"
      )}
    >
      {verb}
    </span>
  )
}

function StatusDot({ success }: { success: boolean }) {
  return (
    <span
      className={cn(
        "w-2 h-2 rounded-full inline-block flex-shrink-0",
        success ? "bg-primary" : "bg-destructive"
      )}
    />
  )
}

interface ActionLogProps {
  actions: VerbAction[]
  className?: string
}

export function ActionLog({ actions, className }: ActionLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [actions.length])

  return (
    <div className={cn("flex flex-col h-full overflow-hidden", className)}>
      <div className="px-4 py-2.5 border-b border-border flex items-center gap-2 flex-shrink-0">
        <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
        <h3 className="text-xs font-mono font-semibold text-foreground tracking-wide">
          OpenVerb Action Log
        </h3>
        <span className="text-[10px] font-mono text-muted-foreground ml-auto">
          {actions.length} actions
        </span>
      </div>
      <ScrollArea className="flex-1 min-h-0">
        <div className="px-3 py-2 flex flex-col gap-1.5">
          {actions.length === 0 && (
            <div className="py-8 text-center text-muted-foreground text-sm font-mono">
              Waiting for actions...
            </div>
          )}
          {actions.map((action, i) => {
            const isOk = (action.result as Record<string, unknown>).ok !== false
            const isMoveVerb = action.verb === "chess.make_move"
            const san = isMoveVerb && isOk ? (action.result as Record<string, unknown>).san : null

            return (
              <div
                key={action.id || i}
                className={cn(
                  "rounded-md px-3 py-2 text-xs font-mono transition-all",
                  isMoveVerb
                    ? "bg-secondary/80 border border-border"
                    : "bg-transparent"
                )}
              >
                <div className="flex items-center gap-2">
                  <StatusDot success={isOk} />
                  <VerbBadge verb={action.verb} />
                  <span className="text-muted-foreground">
                    {action.agent}
                  </span>
                  {san && (
                    <span className="text-primary font-bold ml-auto">
                      {san as string}
                    </span>
                  )}
                </div>
                {action.reasoning && (
                  <p className="mt-1 text-muted-foreground text-[11px] leading-relaxed pl-4 border-l-2 border-border ml-1">
                    {action.reasoning}
                  </p>
                )}
                {!isOk && (action.result as Record<string, unknown>).error && (
                  <p className="mt-1 text-destructive text-[11px] pl-4">
                    Error: {(action.result as Record<string, unknown>).error as string}
                  </p>
                )}
              </div>
            )
          })}
          <div ref={bottomRef} />
        </div>
      </ScrollArea>
    </div>
  )
}
