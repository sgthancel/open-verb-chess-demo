"use client"

interface CapturedPiecesProps {
    fen: string
}

export function CapturedPieces({ fen }: CapturedPiecesProps) {
    const getCapturedPieces = (fen: string) => {
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

        const pieceSymbols: Record<string, string> = {
            'Q': '♕', 'R': '♖', 'B': '♗', 'N': '♘', 'P': '♙',
            'q': '♛', 'r': '♜', 'b': '♝', 'n': '♞', 'p': '♟'
        }

        // Check white pieces captured by black
        for (const piece of ['Q', 'R', 'B', 'N', 'P']) {
            const captured = startingPieces[piece] - currentPieces[piece]
            for (let i = 0; i < captured; i++) {
                whiteCaptured.push(pieceSymbols[piece])
            }
        }

        // Check black pieces captured by white
        for (const piece of ['q', 'r', 'b', 'n', 'p']) {
            const captured = startingPieces[piece] - currentPieces[piece]
            for (let i = 0; i < captured; i++) {
                blackCaptured.push(pieceSymbols[piece])
            }
        }

        return { whiteCaptured, blackCaptured }
    }

    const { whiteCaptured, blackCaptured } = getCapturedPieces(fen)

    return (
        <div className="space-y-3 rounded-lg border border-border bg-card p-4">
            <h3 className="text-sm font-semibold">Captured Pieces</h3>

            <div className="space-y-2">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-24">
                        White Lost:
                    </span>
                    <div className="flex flex-wrap gap-1">
                        {whiteCaptured.length > 0 ? (
                            whiteCaptured.map((piece, i) => (
                                <span key={i} className="text-2xl text-white drop-shadow-md">
                                    {piece}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-muted-foreground w-24">
                        Black Lost:
                    </span>
                    <div className="flex flex-wrap gap-1">
                        {blackCaptured.length > 0 ? (
                            blackCaptured.map((piece, i) => (
                                <span key={i} className="text-2xl text-black drop-shadow-md">
                                    {piece}
                                </span>
                            ))
                        ) : (
                            <span className="text-xs text-muted-foreground">None</span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
