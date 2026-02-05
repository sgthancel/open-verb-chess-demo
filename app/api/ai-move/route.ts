import { generateText, Output } from "ai"
import { openai } from "@ai-sdk/openai"
import { anthropic } from "@ai-sdk/anthropic"
import { z } from "zod"
import { cookies } from "next/headers"

// Parse FEN and create ASCII board visualization
function visualizeBoard(fen: string): string {
  const [position] = fen.split(" ")
  const ranks = position.split("/")

  let board = "  a b c d e f g h\n"
  board += "  ---------------\n"

  ranks.forEach((rank, i) => {
    let row = `${8 - i}|`
    for (const char of rank) {
      if (char >= '1' && char <= '8') {
        row += '. '.repeat(parseInt(char))
      } else {
        row += char + ' '
      }
    }
    board += row + `|${8 - i}\n`
  })

  board += "  ---------------\n"
  board += "  a b c d e f g h"
  return board
}

// Count material and calculate advantage
function analyzeMaterial(fen: string): {
  white: number
  black: number
  advantage: number
  description: string
} {
  const [position] = fen.split(" ")
  const pieceValues: Record<string, number> = {
    'q': 9, 'r': 5, 'b': 3, 'n': 3, 'p': 1,
    'Q': 9, 'R': 5, 'B': 3, 'N': 3, 'P': 1
  }

  let whiteMaterial = 0
  let blackMaterial = 0

  for (const char of position) {
    if (char in pieceValues) {
      if (char === char.toUpperCase()) {
        whiteMaterial += pieceValues[char]
      } else {
        blackMaterial += pieceValues[char]
      }
    }
  }

  const advantage = whiteMaterial - blackMaterial
  let description = ""

  if (advantage > 0) {
    description = `White is ahead by ${advantage} points`
  } else if (advantage < 0) {
    description = `Black is ahead by ${Math.abs(advantage)} points`
  } else {
    description = "Material is equal"
  }

  return { white: whiteMaterial, black: blackMaterial, advantage, description }
}

// List all piece positions
function listPiecePositions(fen: string): string {
  const [position] = fen.split(" ")
  const ranks = position.split("/")
  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']

  const whitePieces: string[] = []
  const blackPieces: string[] = []

  ranks.forEach((rank, rankIndex) => {
    let fileIndex = 0
    for (const char of rank) {
      if (char >= '1' && char <= '8') {
        fileIndex += parseInt(char)
      } else {
        const square = files[fileIndex] + (8 - rankIndex)
        const pieceName = {
          'K': 'King', 'Q': 'Queen', 'R': 'Rook', 'B': 'Bishop', 'N': 'Knight', 'P': 'Pawn',
          'k': 'King', 'q': 'Queen', 'r': 'Rook', 'b': 'Bishop', 'n': 'Knight', 'p': 'Pawn'
        }[char] || char

        if (char === char.toUpperCase()) {
          whitePieces.push(`${pieceName} on ${square}`)
        } else {
          blackPieces.push(`${pieceName} on ${square}`)
        }
        fileIndex++
      }
    }
  })

  return `White pieces: ${whitePieces.join(', ')}\nBlack pieces: ${blackPieces.join(', ')}`
}

// Detect if same moves are repeating
function detectMoveLoop(moveHistory: any[]): string {
  if (moveHistory.length < 4) return ""

  const recent = moveHistory.slice(-4).map((m: any) => m.san)
  if (recent.length === 4 && recent[0] === recent[2] && recent[1] === recent[3]) {
    return `⚠️ LOOP DETECTED: Moves ${recent[0]}-${recent[1]} are repeating! Choose a completely different plan.`
  }

  return ""
}

// Calculate captured pieces
function getCapturedPieces(fen: string): {
  whiteCaptured: string[]
  blackCaptured: string[]
  description: string
} {
  const [position] = fen.split(" ")

  // Starting material count
  const startingPieces: Record<string, number> = {
    'Q': 1, 'R': 2, 'B': 2, 'N': 2, 'P': 8,
    'q': 1, 'r': 2, 'b': 2, 'n': 2, 'p': 8
  }

  // Count current pieces
  const currentPieces: Record<string, number> = {
    'Q': 0, 'R': 0, 'B': 0, 'N': 0, 'P': 0,
    'q': 0, 'r': 0, 'b': 0, 'n': 0, 'p': 0
  }

  for (const char of position) {
    if (char in currentPieces) {
      currentPieces[char]++
    }
  }

  // Calculate captured pieces
  const whiteCaptured: string[] = []
  const blackCaptured: string[] = []

  const pieceNames: Record<string, string> = {
    'Q': 'Queen', 'R': 'Rook', 'B': 'Bishop', 'N': 'Knight', 'P': 'Pawn',
    'q': 'Queen', 'r': 'Rook', 'b': 'Bishop', 'n': 'Knight', 'p': 'Pawn'
  }

  // Check white pieces captured by black
  for (const piece of ['Q', 'R', 'B', 'N', 'P']) {
    const captured = startingPieces[piece] - currentPieces[piece]
    for (let i = 0; i < captured; i++) {
      whiteCaptured.push(pieceNames[piece])
    }
  }

  // Check black pieces captured by white
  for (const piece of ['q', 'r', 'b', 'n', 'p']) {
    const captured = startingPieces[piece] - currentPieces[piece]
    for (let i = 0; i < captured; i++) {
      blackCaptured.push(pieceNames[piece])
    }
  }

  let description = ""
  if (whiteCaptured.length > 0) {
    description += `White has lost: ${whiteCaptured.join(', ')}\n`
  }
  if (blackCaptured.length > 0) {
    description += `Black has lost: ${blackCaptured.join(', ')}`
  }
  if (whiteCaptured.length === 0 && blackCaptured.length === 0) {
    description = "No pieces captured yet"
  }

  return { whiteCaptured, blackCaptured, description: description.trim() }
}

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()

    // 1. Rate Limiting (Throttle) - 2 seconds between AI moves
    const lastRequest = cookieStore.get("last_ai_move_time")
    const now = Date.now()
    if (lastRequest) {
      const lastTime = parseInt(lastRequest.value)
      if (now - lastTime < 2000) {
        await new Promise(resolve => setTimeout(resolve, 2000 - (now - lastTime)))
      }
    }

    // 2. Demo Usage Cap - 50 AI moves per day
    const usage = cookieStore.get("demo_chess_usage")
    const count = usage ? parseInt(usage.value) : 0
    if (count >= 50) {
      return Response.json({
        move: null,
        reasoning: "Demo limit reached (50 moves/day). Please fork the repo at github.com/yourusername/open-verb-chess-demo to continue playing."
      }, { status: 403 })
    }

    const { fen, legalMoves, moveHistory, model, color } = await req.json()

    // 3. Input Guardrails
    if (!fen || typeof fen !== "string") {
      return Response.json({ error: "FEN is required" }, { status: 400 })
    }
    if (!Array.isArray(legalMoves) || legalMoves.length === 0) {
      return Response.json({ error: "Legal moves required" }, { status: 400 })
    }
    if (legalMoves.length > 218) { // Max possible legal moves in chess
      return Response.json({ error: "Invalid legal moves count" }, { status: 400 })
    }
    if (!color || (color !== "w" && color !== "b")) {
      return Response.json({ error: "Valid color required (w or b)" }, { status: 400 })
    }
    if (!model || typeof model !== "string") {
      return Response.json({ error: "Model is required" }, { status: 400 })
    }

    // Format move history for context
    const historyText =
      moveHistory && moveHistory.length > 0
        ? moveHistory
          .map(
            (m: { ply: number; san: string }, i: number) =>
              `${Math.floor(i / 2) + 1}${i % 2 === 0 ? "." : "..."} ${m.san}`
          )
          .join(" ")
        : "Game just started, no moves yet."

    // Get last few moves for immediate context
    const recentMoves = moveHistory && moveHistory.length > 0
      ? moveHistory.slice(-6).map((m: { san: string }) => m.san).join(", ")
      : "none"

    // Analyze the position
    const boardVisualization = visualizeBoard(fen)
    const material = analyzeMaterial(fen)
    const piecePositions = listPiecePositions(fen)
    const loopWarning = detectMoveLoop(moveHistory)
    const captured = getCapturedPieces(fen)

    const systemPrompt = `You are an expert chess engine playing as ${color === "w" ? "White" : "Black"}.

CRITICAL RULES:
1. You MUST select EXACTLY ONE move from the legal moves list provided
2. NEVER EVER move the same piece back and forth (e.g., Bf8-Be7-Bf8 is FORBIDDEN)
3. If you moved a piece on your last turn, strongly prefer moving a DIFFERENT piece this turn
4. Look at the ACTUAL board visualization - only pieces shown on the board exist
5. Do NOT hallucinate about pieces that aren't on the board
6. If you're repeating moves, you will LOSE - choose something new!

CHESS STRATEGY:
- Look for forcing moves: checks, captures, threats
- If ahead in material: trade pieces and simplify
- If behind in material: avoid trades, create complications
- Develop all pieces before moving the same piece twice
- Don't shuffle pieces aimlessly - every move should have a purpose

Your move MUST be in UCI format from the legal moves list.
Provide brief, tactical reasoning based on what you SEE on the board.`

    const userPrompt = `CURRENT BOARD POSITION:
${boardVisualization}

MATERIAL COUNT:
White: ${material.white} points | Black: ${material.black} points
${material.description}

CAPTURED PIECES:
${captured.description}

PIECE POSITIONS:
${piecePositions}

GAME HISTORY:
Recent moves: ${recentMoves}
Full game: ${historyText}

${loopWarning ? `\n${loopWarning}\n` : ''}

LEGAL MOVES YOU CAN MAKE:
${legalMoves.join(", ")}

ANALYSIS CHECKLIST:
1. What pieces are attacking/defending key squares?
2. Is there a check, capture, or immediate threat available?
3. What is your opponent threatening on their next move?
4. Can you improve your worst-placed piece?
5. Are you repeating moves? If so, find a NEW plan!

Based on the board visualization and material count above, choose the BEST move from the legal moves list.
Your move:`

    // Determine which provider to use based on model name
    let aiModel
    if (model.startsWith("gpt-")) {
      aiModel = openai(model)
    } else if (model.startsWith("claude-")) {
      aiModel = anthropic(model)
    } else {
      // Fallback for unknown models
      const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)]
      return Response.json({
        move: randomMove,
        reasoning: "Unknown model type, playing randomly.",
      })
    }

    try {
      const result = await generateText({
        model: aiModel,
        system: systemPrompt,
        prompt: userPrompt,
        maxOutputTokens: 300,
        temperature: 0.4,
        output: Output.object({
          schema: z.object({
            move: z.string().describe("The chosen move in UCI format from the legal moves list"),
            reasoning: z
              .string()
              .describe("Brief explanation of why this move was chosen (1-2 sentences)"),
          }),
        }),
      })

      const output = result.output

      if (!output) {
        // Fallback: pick a random legal move
        const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)]
        const response = Response.json({
          move: randomMove,
          reasoning: "AI could not determine best move, playing randomly.",
        })
        response.headers.append("Set-Cookie", `last_ai_move_time=${Date.now()}; Path=/; HttpOnly; SameSite=Strict`)
        response.headers.append("Set-Cookie", `demo_chess_usage=${count + 1}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`)
        return response
      }

      // Validate the move is actually legal
      if (!legalMoves.includes(output.move)) {
        // Try to find a close match
        const closestMove =
          legalMoves.find((m: string) => m.startsWith(output.move.slice(0, 4))) ||
          legalMoves[Math.floor(Math.random() * legalMoves.length)]
        const response = Response.json({
          move: closestMove,
          reasoning: output.reasoning + " (move corrected to valid option)",
        })
        response.headers.append("Set-Cookie", `last_ai_move_time=${Date.now()}; Path=/; HttpOnly; SameSite=Strict`)
        response.headers.append("Set-Cookie", `demo_chess_usage=${count + 1}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`)
        return response
      }

      const response = Response.json({
        move: output.move,
        reasoning: output.reasoning,
      })
      response.headers.append("Set-Cookie", `last_ai_move_time=${Date.now()}; Path=/; HttpOnly; SameSite=Strict`)
      response.headers.append("Set-Cookie", `demo_chess_usage=${count + 1}; Path=/; HttpOnly; SameSite=Strict; Max-Age=86400`)
      return response
    } catch (error) {
      // Log the error for debugging
      console.error("AI move error:", error)
      // Fallback on any error
      const randomMove = legalMoves[Math.floor(Math.random() * legalMoves.length)]
      return Response.json({
        move: randomMove,
        reasoning: "Fallback: random move selected due to API error.",
      })
    }
  } catch (error) {
    console.error("Chess AI route error:", error)
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to generate move" },
      { status: 500 }
    )
  }
}
