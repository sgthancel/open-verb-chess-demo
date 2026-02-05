// Minimal chess engine — pure TypeScript, no dependencies
// Handles board state, legal move generation, check/checkmate/stalemate detection

export type PieceColor = "w" | "b"
export type PieceType = "p" | "n" | "b" | "r" | "q" | "k"
export type Piece = { color: PieceColor; type: PieceType }
export type Square = Piece | null
export type Board = Square[][]

export interface CastlingRights {
  K: boolean
  Q: boolean
  k: boolean
  q: boolean
}

export interface GameState {
  board: Board
  turn: PieceColor
  castling: CastlingRights
  enPassant: string | null
  halfmoveClock: number
  fullmoveNumber: number
}

export interface MoveRecord {
  from: string
  to: string
  san: string
  uci: string
  fen: string
  ply: number
  timestamp: number
  piece: PieceType
  captured?: PieceType
  promotion?: PieceType
}

const FILES = "abcdefgh"
const RANKS = "87654321"

// --- FEN parsing/serialization ---

export function parseFEN(fen: string): GameState {
  const parts = fen.split(" ")
  const rows = parts[0].split("/")
  const board: Board = []

  for (let r = 0; r < 8; r++) {
    const row: Square[] = []
    for (const ch of rows[r]) {
      if (ch >= "1" && ch <= "8") {
        for (let i = 0; i < parseInt(ch); i++) row.push(null)
      } else {
        const color: PieceColor = ch === ch.toUpperCase() ? "w" : "b"
        const type = ch.toLowerCase() as PieceType
        row.push({ color, type })
      }
    }
    board.push(row)
  }

  const castling: CastlingRights = {
    K: parts[2].includes("K"),
    Q: parts[2].includes("Q"),
    k: parts[2].includes("k"),
    q: parts[2].includes("q"),
  }

  return {
    board,
    turn: parts[1] as PieceColor,
    castling,
    enPassant: parts[3] === "-" ? null : parts[3],
    halfmoveClock: parseInt(parts[4]),
    fullmoveNumber: parseInt(parts[5]),
  }
}

export function toFEN(state: GameState): string {
  let fen = ""
  for (let r = 0; r < 8; r++) {
    let empty = 0
    for (let c = 0; c < 8; c++) {
      const sq = state.board[r][c]
      if (!sq) {
        empty++
      } else {
        if (empty > 0) {
          fen += empty
          empty = 0
        }
        const ch = sq.color === "w" ? sq.type.toUpperCase() : sq.type
        fen += ch
      }
    }
    if (empty > 0) fen += empty
    if (r < 7) fen += "/"
  }

  let castleStr = ""
  if (state.castling.K) castleStr += "K"
  if (state.castling.Q) castleStr += "Q"
  if (state.castling.k) castleStr += "k"
  if (state.castling.q) castleStr += "q"
  if (!castleStr) castleStr = "-"

  return `${fen} ${state.turn} ${castleStr} ${state.enPassant || "-"} ${state.halfmoveClock} ${state.fullmoveNumber}`
}

// --- Coordinate helpers ---

function sqToRC(sq: string): [number, number] {
  return [RANKS.indexOf(sq[1]), FILES.indexOf(sq[0])]
}

function rcToSq(r: number, c: number): string {
  return FILES[c] + RANKS[r]
}

function inBounds(r: number, c: number): boolean {
  return r >= 0 && r < 8 && c >= 0 && c < 8
}

// --- Attack detection ---

function isAttackedBy(board: Board, r: number, c: number, by: PieceColor): boolean {
  // Pawn attacks
  const pawnDir = by === "w" ? 1 : -1
  for (const dc of [-1, 1]) {
    const pr = r + pawnDir
    const pc = c + dc
    if (inBounds(pr, pc)) {
      const p = board[pr][pc]
      if (p && p.color === by && p.type === "p") return true
    }
  }

  // Knight attacks
  const knightMoves = [
    [-2, -1], [-2, 1], [-1, -2], [-1, 2],
    [1, -2], [1, 2], [2, -1], [2, 1],
  ]
  for (const [dr, dc] of knightMoves) {
    const nr = r + dr
    const nc = c + dc
    if (inBounds(nr, nc)) {
      const p = board[nr][nc]
      if (p && p.color === by && p.type === "n") return true
    }
  }

  // King attacks
  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue
      const nr = r + dr
      const nc = c + dc
      if (inBounds(nr, nc)) {
        const p = board[nr][nc]
        if (p && p.color === by && p.type === "k") return true
      }
    }
  }

  // Sliding pieces (bishop/rook/queen)
  const directions = [
    { dr: -1, dc: 0, types: ["r", "q"] },
    { dr: 1, dc: 0, types: ["r", "q"] },
    { dr: 0, dc: -1, types: ["r", "q"] },
    { dr: 0, dc: 1, types: ["r", "q"] },
    { dr: -1, dc: -1, types: ["b", "q"] },
    { dr: -1, dc: 1, types: ["b", "q"] },
    { dr: 1, dc: -1, types: ["b", "q"] },
    { dr: 1, dc: 1, types: ["b", "q"] },
  ]

  for (const { dr, dc, types } of directions) {
    let nr = r + dr
    let nc = c + dc
    while (inBounds(nr, nc)) {
      const p = board[nr][nc]
      if (p) {
        if (p.color === by && types.includes(p.type)) return true
        break
      }
      nr += dr
      nc += dc
    }
  }

  return false
}

function findKing(board: Board, color: PieceColor): [number, number] {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = board[r][c]
      if (p && p.color === color && p.type === "k") return [r, c]
    }
  }
  return [-1, -1] // Should never happen in valid game
}

function isInCheck(board: Board, color: PieceColor): boolean {
  const [kr, kc] = findKing(board, color)
  return isAttackedBy(board, kr, kc, color === "w" ? "b" : "w")
}

// --- Deep clone board ---

function cloneBoard(board: Board): Board {
  return board.map((row) => row.map((sq) => (sq ? { ...sq } : null)))
}

function cloneState(state: GameState): GameState {
  return {
    board: cloneBoard(state.board),
    turn: state.turn,
    castling: { ...state.castling },
    enPassant: state.enPassant,
    halfmoveClock: state.halfmoveClock,
    fullmoveNumber: state.fullmoveNumber,
  }
}

// --- Move generation ---

interface RawMove {
  fromR: number
  fromC: number
  toR: number
  toC: number
  promotion?: PieceType
}

function generatePseudoLegalMoves(state: GameState): RawMove[] {
  const moves: RawMove[] = []
  const { board, turn, castling, enPassant } = state

  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c]
      if (!piece || piece.color !== turn) continue

      const addMove = (toR: number, toC: number, promo?: PieceType) => {
        moves.push({ fromR: r, fromC: c, toR, toC, promotion: promo })
      }

      switch (piece.type) {
        case "p": {
          const dir = turn === "w" ? -1 : 1
          const startRank = turn === "w" ? 6 : 1
          const promoRank = turn === "w" ? 0 : 7

          // Forward
          if (inBounds(r + dir, c) && !board[r + dir][c]) {
            if (r + dir === promoRank) {
              for (const p of ["q", "r", "b", "n"] as PieceType[]) addMove(r + dir, c, p)
            } else {
              addMove(r + dir, c)
            }
            // Double push
            if (r === startRank && !board[r + 2 * dir][c]) {
              addMove(r + 2 * dir, c)
            }
          }

          // Captures
          for (const dc of [-1, 1]) {
            const nc = c + dc
            if (!inBounds(r + dir, nc)) continue
            const target = board[r + dir][nc]
            const epSq = enPassant ? sqToRC(enPassant) : null

            if (target && target.color !== turn) {
              if (r + dir === promoRank) {
                for (const p of ["q", "r", "b", "n"] as PieceType[]) addMove(r + dir, nc, p)
              } else {
                addMove(r + dir, nc)
              }
            } else if (epSq && epSq[0] === r + dir && epSq[1] === nc) {
              addMove(r + dir, nc)
            }
          }
          break
        }

        case "n": {
          const offsets = [
            [-2, -1], [-2, 1], [-1, -2], [-1, 2],
            [1, -2], [1, 2], [2, -1], [2, 1],
          ]
          for (const [dr, dc] of offsets) {
            const nr = r + dr
            const nc = c + dc
            if (inBounds(nr, nc)) {
              const t = board[nr][nc]
              if (!t || t.color !== turn) addMove(nr, nc)
            }
          }
          break
        }

        case "b":
        case "r":
        case "q": {
          const dirs =
            piece.type === "b"
              ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
              : piece.type === "r"
                ? [[-1, 0], [1, 0], [0, -1], [0, 1]]
                : [[-1, -1], [-1, 1], [1, -1], [1, 1], [-1, 0], [1, 0], [0, -1], [0, 1]]

          for (const [dr, dc] of dirs) {
            let nr = r + dr
            let nc = c + dc
            while (inBounds(nr, nc)) {
              const t = board[nr][nc]
              if (t) {
                if (t.color !== turn) addMove(nr, nc)
                break
              }
              addMove(nr, nc)
              nr += dr
              nc += dc
            }
          }
          break
        }

        case "k": {
          for (let dr = -1; dr <= 1; dr++) {
            for (let dc = -1; dc <= 1; dc++) {
              if (dr === 0 && dc === 0) continue
              const nr = r + dr
              const nc = c + dc
              if (inBounds(nr, nc)) {
                const t = board[nr][nc]
                if (!t || t.color !== turn) addMove(nr, nc)
              }
            }
          }

          // Castling
          const enemy = turn === "w" ? "b" : "w"
          if (turn === "w") {
            if (castling.K && !board[7][5] && !board[7][6] && board[7][7]?.type === "r" && board[7][7]?.color === "w") {
              if (!isAttackedBy(board, 7, 4, enemy) && !isAttackedBy(board, 7, 5, enemy) && !isAttackedBy(board, 7, 6, enemy)) {
                addMove(7, 6)
              }
            }
            if (castling.Q && !board[7][3] && !board[7][2] && !board[7][1] && board[7][0]?.type === "r" && board[7][0]?.color === "w") {
              if (!isAttackedBy(board, 7, 4, enemy) && !isAttackedBy(board, 7, 3, enemy) && !isAttackedBy(board, 7, 2, enemy)) {
                addMove(7, 2)
              }
            }
          } else {
            if (castling.k && !board[0][5] && !board[0][6] && board[0][7]?.type === "r" && board[0][7]?.color === "b") {
              if (!isAttackedBy(board, 0, 4, enemy) && !isAttackedBy(board, 0, 5, enemy) && !isAttackedBy(board, 0, 6, enemy)) {
                addMove(0, 6)
              }
            }
            if (castling.q && !board[0][3] && !board[0][2] && !board[0][1] && board[0][0]?.type === "r" && board[0][0]?.color === "b") {
              if (!isAttackedBy(board, 0, 4, enemy) && !isAttackedBy(board, 0, 3, enemy) && !isAttackedBy(board, 0, 2, enemy)) {
                addMove(0, 2)
              }
            }
          }
          break
        }
      }
    }
  }

  return moves
}

// --- Apply move (mutates a clone) ---

function applyRawMove(state: GameState, move: RawMove): GameState {
  const next = cloneState(state)
  const { board, castling } = next
  const piece = board[move.fromR][move.fromC]!
  const captured = board[move.toR][move.toC]

  // En passant capture
  if (piece.type === "p" && state.enPassant) {
    const [epR, epC] = sqToRC(state.enPassant)
    if (move.toR === epR && move.toC === epC) {
      board[move.fromR][epC] = null
    }
  }

  // Move piece
  board[move.toR][move.toC] = move.promotion
    ? { color: piece.color, type: move.promotion }
    : { ...piece }
  board[move.fromR][move.fromC] = null

  // Castling rook move
  if (piece.type === "k") {
    if (move.toC - move.fromC === 2) {
      board[move.fromR][5] = board[move.fromR][7]
      board[move.fromR][7] = null
    } else if (move.fromC - move.toC === 2) {
      board[move.fromR][3] = board[move.fromR][0]
      board[move.fromR][0] = null
    }
  }

  // Update castling rights
  if (piece.type === "k") {
    if (piece.color === "w") {
      castling.K = false
      castling.Q = false
    } else {
      castling.k = false
      castling.q = false
    }
  }
  if (piece.type === "r") {
    if (move.fromR === 7 && move.fromC === 7) castling.K = false
    if (move.fromR === 7 && move.fromC === 0) castling.Q = false
    if (move.fromR === 0 && move.fromC === 7) castling.k = false
    if (move.fromR === 0 && move.fromC === 0) castling.q = false
  }
  if (captured?.type === "r") {
    if (move.toR === 7 && move.toC === 7) castling.K = false
    if (move.toR === 7 && move.toC === 0) castling.Q = false
    if (move.toR === 0 && move.toC === 7) castling.k = false
    if (move.toR === 0 && move.toC === 0) castling.q = false
  }

  // En passant square
  if (piece.type === "p" && Math.abs(move.toR - move.fromR) === 2) {
    next.enPassant = rcToSq((move.fromR + move.toR) / 2, move.fromC)
  } else {
    next.enPassant = null
  }

  // Halfmove clock
  if (piece.type === "p" || captured) {
    next.halfmoveClock = 0
  } else {
    next.halfmoveClock++
  }

  // Fullmove number
  if (state.turn === "b") next.fullmoveNumber++

  // Switch turn
  next.turn = state.turn === "w" ? "b" : "w"

  return next
}

// --- Legal move generation ---

export interface LegalMove {
  from: string
  to: string
  uci: string
  san: string
  piece: PieceType
  captured?: PieceType
  promotion?: PieceType
}

function generateSAN(state: GameState, move: RawMove, allMoves: RawMove[]): string {
  const piece = state.board[move.fromR][move.fromC]!
  const captured = state.board[move.toR][move.toC]
  const toSq = rcToSq(move.toR, move.toC)

  // Castling
  if (piece.type === "k") {
    if (move.toC - move.fromC === 2) return "O-O"
    if (move.fromC - move.toC === 2) return "O-O-O"
  }

  let san = ""

  if (piece.type === "p") {
    const isCapture = captured || (state.enPassant && toSq === state.enPassant)
    if (isCapture) {
      san += FILES[move.fromC] + "x"
    }
    san += toSq
    if (move.promotion) san += "=" + move.promotion.toUpperCase()
  } else {
    san += piece.type.toUpperCase()

    // Disambiguation
    const samePieceMoves = allMoves.filter(
      (m) =>
        m !== move &&
        state.board[m.fromR][m.fromC]?.type === piece.type &&
        m.toR === move.toR &&
        m.toC === move.toC
    )

    if (samePieceMoves.length > 0) {
      const sameFile = samePieceMoves.some((m) => m.fromC === move.fromC)
      const sameRank = samePieceMoves.some((m) => m.fromR === move.fromR)

      if (!sameFile) {
        san += FILES[move.fromC]
      } else if (!sameRank) {
        san += RANKS[move.fromR]
      } else {
        san += FILES[move.fromC] + RANKS[move.fromR]
      }
    }

    if (captured) san += "x"
    san += toSq
  }

  // Check/checkmate
  const nextState = applyRawMove(state, move)
  if (isInCheck(nextState.board, nextState.turn)) {
    const nextMoves = getLegalMoves(nextState)
    san += nextMoves.length === 0 ? "#" : "+"
  }

  return san
}

export function getLegalMoves(state: GameState): LegalMove[] {
  const pseudoMoves = generatePseudoLegalMoves(state)
  const legalRaw: RawMove[] = []

  for (const move of pseudoMoves) {
    const next = applyRawMove(state, move)
    if (!isInCheck(next.board, state.turn)) {
      legalRaw.push(move)
    }
  }

  return legalRaw.map((move) => {
    const piece = state.board[move.fromR][move.fromC]!
    const captured = state.board[move.toR][move.toC]
    // Check en passant capture
    let capturedType = captured?.type
    if (piece.type === "p" && !captured && state.enPassant) {
      const [epR, epC] = sqToRC(state.enPassant)
      if (move.toR === epR && move.toC === epC) {
        capturedType = "p"
      }
    }

    return {
      from: rcToSq(move.fromR, move.fromC),
      to: rcToSq(move.toR, move.toC),
      uci: rcToSq(move.fromR, move.fromC) + rcToSq(move.toR, move.toC) + (move.promotion || ""),
      san: generateSAN(state, move, legalRaw),
      piece: piece.type,
      captured: capturedType,
      promotion: move.promotion,
    }
  })
}

// --- Game status ---

export type GameStatus =
  | "playing"
  | "checkmate_white"
  | "checkmate_black"
  | "stalemate"
  | "draw_50"
  | "draw_insufficient"

export function getGameStatus(state: GameState): GameStatus {
  const moves = getLegalMoves(state)

  if (moves.length === 0) {
    if (isInCheck(state.board, state.turn)) {
      return state.turn === "w" ? "checkmate_black" : "checkmate_white"
    }
    return "stalemate"
  }

  if (state.halfmoveClock >= 100) return "draw_50"

  // Insufficient material
  const pieces: Piece[] = []
  for (const row of state.board) {
    for (const sq of row) {
      if (sq) pieces.push(sq)
    }
  }
  if (pieces.length === 2) return "draw_insufficient" // K vs K
  if (pieces.length === 3) {
    const nonKing = pieces.find((p) => p.type !== "k")
    if (nonKing && (nonKing.type === "b" || nonKing.type === "n")) return "draw_insufficient"
  }

  return "playing"
}

// --- Make move by UCI ---

export function makeMove(
  state: GameState,
  uci: string
): { state: GameState; move: LegalMove } | null {
  const legalMoves = getLegalMoves(state)
  const move = legalMoves.find((m) => m.uci === uci)
  if (!move) return null

  const [fromR, fromC] = sqToRC(move.from)
  const [toR, toC] = sqToRC(move.to)

  const newState = applyRawMove(state, {
    fromR,
    fromC,
    toR,
    toC,
    promotion: move.promotion,
  })

  return { state: newState, move }
}

// --- Initial position ---

export const STARTING_FEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1"

export function createGame(): GameState {
  return parseFEN(STARTING_FEN)
}
