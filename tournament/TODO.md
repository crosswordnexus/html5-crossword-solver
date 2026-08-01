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

## 🚀 Near-Term Tasks
- **Timer Bug Investigation:** Investigate reports of the timer continuing to tick after submission on some browsers (potential caching or sync issue).
- **Searchable/Sortable Leaderboards:** Add pure JavaScript client-side search and sorting (by name, total score, total time) to the shared leaderboard without adding external libraries.

## 🛠 Maintenance
- **Dependency Audit:** Check if Firebase SDK v9+ (Modular) should be adopted (currently using v8 compatibility mode).
- **Mobile Styling:** Further refine the leaderboard grid for very narrow mobile screens.
