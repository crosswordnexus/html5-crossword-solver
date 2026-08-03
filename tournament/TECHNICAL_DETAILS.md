# Tournament Technical Details

This document outlines the architecture and implementation details of the Tournament Solver extension.

## 1. Architecture Overview
The Tournament Solver is a client-side web application that uses **Firebase** for all backend services. 
- **Authentication:** Google OAuth 2.0.
- **Database:** Firestore (NoSQL).
- **Hosting:** Static file hosting (GitHub Pages, S3, etc.).
- **Modularity:** The Admin Dashboard uses **Native ES Modules**.

The system is split into three primary components:
1.  **Admin Dashboard (`admin.html`/`admin.js`):** A modular SPA (Single Page Application) where each tab is an isolated ES module located in `js/modules/`.
2.  **Participant Dashboard (`index.html`/`tournament.js`):** Puzzle list, profile setup, and division-specific standings.
3.  **Solver Bridge (`solve.html`):** A specialized wrapper for the core solver (`js/crosswords.js`) that handles tournament-specific timing and submission.

---

## 2. Directory Structure (Tournament)
- `admin.js`: The main entry point and router for the Admin Dashboard.
- `js/modules/`:
    - `Constants.js`: Centralized Firestore collection names.
    - `PuzzlesTab.js`: Logic for adding/editing puzzle metadata.
    - `ParticipantsTab.js`: CSV processing and participant whitelisting.
    - `LeaderboardTab.js`: Live standings and manual score overrides.
    - `ResultsTab.js`: Exportable history of all submissions.
    - `DivisionsTab.js`: Management of tournament tiers.
    - `SettingsTab.js`: Branding and scoring rule configuration.

---

## 2. Data Model (Firestore)

### `admins/` (Collection)
- **Document ID:** Email address (lowercase).
- **Purpose:** Whitelist for access to `admin.html`.
- **Fields:** `{ role: "admin" }`.

### `participants/` (Collection)
- **Document ID:** Email address (lowercase).
- **Purpose:** The master whitelist of authorized solvers.
- **Fields:** `{ email, division, name, uid }`.
- *Note:* The `uid` is linked only after the participant first signs in.

### `puzzles/` (Collection)
- **Document ID:** Auto-generated.
- **Purpose:** Metadata for tournament puzzles.
- **Fields:**
  - `puzzleNumber`: Used for sorting in the UI.
  - `filename`: The path to the file in `tournament/puzzles/`.
  - `status`: `0` (Hidden), `1` (Locked), `2` (Open), `3` (Closed).
  - `isWarmup`: Boolean. Warmup puzzles don't count toward the total score.

### `solvers/` (Collection)
- **Document ID:** Firebase Auth `uid`.
- **Purpose:** Public profiles for participants.
- **Fields:** `{ name, displayName }`.

### `scores/` (Collection)
- **Document ID:** `${uid}_${puzzleId}`.
- **Purpose:** Records of puzzle attempts and completions.
- **Fields:**
  - `status`: `started` or `submitted`.
  - `startTime`: Firestore Timestamp.
  - `finishTime`: Firestore Timestamp.
  - `seconds`: Total time elapsed.
  - `isCorrect` / `isFullyCorrect`: Boolean (all cells match solution).
  - `score`: Calculated point value.
  - `bonus`: Calculated time bonus.
  - `submittedGrid`: String (the serialized grid: `_` for blanks, `.` for blocks, `*` for rebuses, uppercase letters).
  - `gridWidth`: Integer.
  - `gridHeight`: Integer.

---

## 3. The Puzzle Lifecycle
Puzzles follow a specific state machine controlled by the `status` field in the `puzzles` collection:

1.  **Hidden (0):** Puzzle is not visible to participants.
2.  **Locked (1):** Puzzle title and metadata are visible, but the "Solve" button is disabled.
3.  **Open (2):** Participants can click "Solve". This creates a `scores` document with `status: "started"` and a `startTime`.
4.  **Closed (3):** Participants can no longer start the puzzle, but those who have already started can finish.

### Timer API & Persistence (`js/crosswords.js`)
The core engine provides two methods for external control of the clock:
- `startTimer()`: Resumes or starts the puzzle timer.
- `stopTimer(shouldFocus)`: Stops the timer and syncs the final time. If `shouldFocus` is true (default false), it returns focus to the grid (desktop only).

#### Tournament Auto-Save:
To prevent solvers from closing the solver window to reset their elapsed time, the timer tick loop in `startTimer()` automatically calls `this.saveGameImmediate()` every **5 seconds** when `tournament_mode` is enabled. This saves both the current grid layout and the elapsed timer value to `localStorage`. When the page is re-opened, the engine restores the timer to the exact elapsed second.

#### Warm-up Puzzle Lifecycle:
Because warm-up puzzles are client-side only and not submitted to Firestore, completed warm-ups are tracked via `localStorage` (saved in the `completed_warmups` list). Completed warm-up puzzles will show a **"Review Warm-up"** button on the dashboard allowing participants to reopen and review their finished grid.

---

## 4. Scoring & Migration Logic
Scoring is calculated client-side in `solve.html` and verified (optionally) by the admin. The default rules are:

- **Base Points:** 10 points per correct word (Across + Down).
- **Completion Bonus:** A flat bonus for finishing the grid perfectly.
- **Time Bonus:** `(TargetTime - ElapsedSeconds) * BonusMultiplier`. 
  - *Condition:* Awarded if the solver's accuracy (correct words / total words) meets or exceeds the configured minimum accuracy percentage (default is 50%).
- **Overtime Penalty:** Deductions applied if the solver exceeds the `TargetTime`.

Settings are managed in `tournament_config/scoring`.

### Division Migration
When an admin reassigns a participant to a new division in the Admin Dashboard, the system performs an atomic batch update:
1.  Updates the participant's whitelist document.
2.  Updates the participant's solver profile.
3.  Migrates all existing score records for that participant to the new division.

---

## 5. Security & Authorization
Security is enforced via **Firestore Security Rules**.
- **Admins:** Have read/write access to all collections.
- **Participants:**
  - Can only read puzzles where `status > 0`.
  - Can only write to their own `scores` and `solvers` documents.
  - Authorization is checked by comparing the Google Auth email against the `participants` whitelist collection.

---

## 6. Shared Components
- **`leaderboard.js`:** A reusable class that renders a real-time grid of scores, listening for updates across all participants in a specific division.
- **`toast.js`:** A simple notification system used across the tournament UI. Bound to `window.Toast` to ensure compatibility inside the ES Module architecture of the Admin Dashboard tabs.
- **`firebase-config.js`:** (Not tracked) Contains the project's API keys and identifiers.
