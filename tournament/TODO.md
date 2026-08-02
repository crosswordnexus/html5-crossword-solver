# Tournament Dashboard TODO

## ✅ Completed (March 2026)
- **Admin Custom Branding:** Allow admins to configure the solver's primary/secondary color scheme from the Settings tab.
- **Persistent Admin Tab:** Ensure the Admin dashboard stays on the same tab when the page is refreshed (e.g., via localStorage or URL hash).
- **Manual Participant Entry:** Added a UI to authorize individual users manually (email + division) without requiring a CSV upload.
- **Custom Domain Auth:** Documented Google Cloud Console verification for custom domains.
- **Robust Security Rules:** Implemented verified production-ready Firestore rules.
- **Modern UI Feedback:** Replaced all browser `alert()` calls with a non-intrusive Toast notification system.
- **Persistent Footer:** Added attribution, logout link, and dark mode toggle.
- **Dark Mode:** Implemented a persistent dark mode toggle for the participant dashboard.
- **Leaderboard UX:** Moved division filter to a more prominent left-aligned position.
- **Sign-Out Flow:** Added a stable "Log Out" link to both Admin and Participant views.

## ✅ Completed (April 2026)
- **Modular Admin Dashboard:** Refactored the 800-line `admin.js` into clean ES modules located in `js/modules/`.
- **Division Score Migration:** When reassigning a participant to a new division, all their previous scores are now automatically migrated in Firestore.
- **Enhanced Submission Flow:**
    - Added a warning for blank squares when clicking Submit.
    - Updated the success modal to show real-time score, accuracy, and time spent.
- **Improved Solver Dashboard:** Solvers can now see their score and time for each submitted puzzle on the main list.
- **Timer Engine Refactor:** Centralized timer logic into formal `startTimer()` and `stopTimer()` methods in the core engine.

## ✅ Completed (July 2026)
- **Leaderboard Export:** Added button to export the final leaderboard as a CSV for official archiving.

## ✅ Completed (August 2026)
- **Leaderboard Layout Update:** Moved the "Total Score" column to appear immediately after the Solver name column.
- **Clean Solve Visuals & Ratios:** Highlighted clean solves in gold (`#d4af37`) on the leaderboard and added correct/total word count ratios (e.g. `69/71`) directly under the puzzle time cells.
- **Post-Submission Freeze & Check:** Enabled a post-submit check to slash incorrect letters and froze keyboard/pointer interactions to prevent post-submit editing.
- **Timer Security Patch:** Fixed a bug in the toggle logic to prevent restarting the timer after it had stopped.
- **Double Submission Prevention:** Updated Firestore security rules documentation to restrict score submissions to document creation (`create`) only.
- **Grid Archiving Logs:** Serialized the final grid as a flat string along with the width and height, and stored it inside the Firestore score document.
- **Dark Mode Readability:** Added CSS overrides for `.score-card` under dark mode to fix text visibility on the submission result panel.
- **Puzzle List Stats:** Added correct/total word counts to the solver's home puzzle list display format.

## 🚀 Near-Term Tasks
- **Searchable/Sortable Leaderboards:** Add pure JavaScript client-side search and sorting (by name, total score, total time) to the shared leaderboard without adding external libraries.
- **Test Submission Functionality** Make sure that when the Firestore rules are updated, a user cannot submit twice.

## 🛠 Maintenance
- **Dependency Audit:** Check if Firebase SDK v9+ (Modular) should be adopted (currently using v8 compatibility mode).
- **Mobile Styling:** Further refine the leaderboard grid for very narrow mobile screens.
