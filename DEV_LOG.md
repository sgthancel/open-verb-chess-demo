# Development Log: Building OpenVerb Chess

This document tracks the iterative development process of the OpenVerb Chess demo. It showcases the "OpenVerb" pattern: combining a Generative AI planner with a deterministic, type-safe execution engine.

## 🧵 The Journey

### Phase 1: Foundation
- **Objective**: Create a functional chess engine with a clean UI.
- **Key Actions**:
    - Implemented a custom chess rules engine (`lib/chess-engine.ts`) supporting UCI/SAN notation.
    - Built a responsive `ChessBoard` component with move validation.
    - Established the **OpenVerb Registry**: Defining verbs like `chess.make_move`, `chess.get_state`, and `chess.get_legal_moves`.

### Phase 2: AI Integration
- **Objective**: Connect LLMs (GPT-4o, Claude) to the Verb Registry.
- **Key Actions**:
    - Developed an API route (`/api/ai-move`) that acts as the **Planner**.
    - Enhanced the AI context: Instead of just raw FEN, we provided ASCII board visualizations, material counts, and piece lists to help the AI "see" the position.
    - Implemented **Move Reasoning**: Forcing the AI to explain its strategic intent before selecting a move.

### Phase 3: Solving Hallucinations & Loops
- **Objective**: Improve AI play quality and reliability.
- **Key Actions**:
    - Observed issues with material blindness and repetitive "shuffling" moves (e.g., Bishop oscillating).
    - Added **Loop Detection**: The system now warns the AI if it detects 2-move or 3-move repetitions.
    - Refined the **System Prompt**: Adding explicit strategic guidelines for opening, middlegame, and endgame.

### Phase 4: UI Refinement & Transparency
- **Objective**: Make the AI's internal state visible to the user.
- **Key Actions**:
    - Added an **Action Log**: Showing every Verb call made by the AI.
    - Implemented **Captured Pieces Display**: Tracking material advantage visually.
    - Added **Move History**: Providing a full algebraic notation log.

### Phase 5: Guardrails & Open Source
- **Objective**: Prepare for responsible public deployment.
- **Key Actions**:
    - **Silent Rate Limiting**: Added a backend delay (2s) to prevent API spam without breaking UI flow.
    - **Usage Caps**: Implemented a daily limit of 50 AI moves per user via cookies.
    - **Documentation**: Created technical deep-dives (`OPENVERB_CONCEPTS.md`) and contribution guidelines.

## 🛠️ Lessons Learned

1.  **AI Boards**: LLMs follow game state much better when "shown" an ASCII representation rather than just raw FEN notation.
2.  **Verb Execution**: Strictly separating the *Plan* (JSON) from the *Execution* (Code) prevents the AI from making illegal moves and makes the system 100% deterministic.
3.  **Silent Throttling**: Preventing "Please Wait" error popups by silently delaying the API response provides a much smoother UX for high-speed AI interactions.

---

*This project was built as a collaborative pair-programming project between a developer and an AI Agent.*
