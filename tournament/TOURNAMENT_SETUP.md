# Tournament Setup Guide

This guide outlines the steps required to set up your Firebase project for the Crossword Tournament Solver using Google Authentication and centralized participant management.

## Overview
The Tournament Solver uses **Firebase** for authentication, database (Firestore), and tournament configuration. Both Admins and Participants must sign in with a **Google Account**. Access is strictly controlled via whitelists in Firestore.

---

## Initial Firebase Setup (One-Time)

**CRITICAL (Feb 2026 Update):** All new Firebase projects must now be on the **Blaze (Pay-as-you-go) plan** to enable Firestore and Cloud Storage. You cannot complete the setup on the "Spark" (Free) plan.

### 1. Create a Firebase Project
1.  Go to the [Firebase console](https://console.firebase.google.com/).
2.  Click "Create a new Firebase project" and follow the prompts. (You can disable Gemini and Google Analytics; they are not required for this project).
3.  **Immediately Upgrade:** Once the project is created, click the **"Upgrade"** button in the bottom-left corner and select the **Blaze Plan**.
    *   *Note:* You still get the same "Always Free" quotas. You will not be charged unless you exceed 50,000 reads or 20,000 writes per day.

### 2. Enable Firestore Database
1.  In the left-hand sidebar, click on **"Databases & Storage"** to expand the menu.
2.  Select **"Firestore"**.
3.  Click **"Create database"**.
4.  If prompted for a database edition, choose **"Standard Edition"** (requires Blaze plan).
5. On the next screen, leave the defaults for Database ID and location.
6.  **Important:** Select **"Start in production mode"**. (We will apply custom rules in the next step).
7. Click **Create**.

### 3. Apply Firestore Security Rules
To allow the Admin Dashboard to check your credentials, you must apply the security rules immediately.
1.  In the Firestore Database section, click the **"Rules"** tab.
2.  Delete the existing rules and paste the following:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Checks if the user is in the 'admins' collection
    function isAdmin() {
      return request.auth != null &&
             request.auth.token != null &&
             request.auth.token.email != null &&
             exists(/databases/$(database)/documents/admins/$(request.auth.token.email.lower()));
    }

    // Puzzles & Config: Publicly readable by auth users, only Admin can modify
    match /puzzles/{puzzle} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    match /tournament_config/{config} {
      allow read: if request.auth != null;
      allow write: if isAdmin();
    }

    // Admins list: Users can read their own status, only Admins can manage
    match /admins/{email} {
      allow read: if request.auth != null &&
                     request.auth.token.email != null &&
                     request.auth.token.email.lower() == email.lower();
      allow read, write: if isAdmin();
    }

    // Participants list: Admins manage, Users can read/link their own record
    match /participants/{emailId} {
      allow read: if request.auth != null &&
                     request.auth.token.email != null &&
                     request.auth.token.email.lower() == emailId.lower();

      // Allow users to update their own record (to link their UID/Name)
      allow update: if request.auth != null &&
                       request.auth.token.email != null &&
                       request.auth.token.email.lower() == emailId.lower();

      allow read, write: if isAdmin();
    }

    // Solver Profiles: Users manage their own, Admins can manage all
    match /solvers/{uid} {
      allow read: if request.auth != null;
      allow write: if isAdmin() || (request.auth != null && request.auth.uid == uid);
    }

    // Scores: Publicly readable, Users create their own, Admins can manage all
    match /scores/{scoreId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null && request.auth.uid == request.resource.data.uid;
      allow update, delete: if isAdmin();
    }
  }
}
```
3.  Click **"Publish"**.

### 4. Enable Google Authentication
1.  In the left-hand sidebar, click on **"Security"** to expand the menu.
2.  Select **"Authentication"**.
3.  Click **"Get started"** and go to the **"Sign-in method"** tab.
4.  Enable the **Google** provider.
    *   **Public-facing name:** Enter your tournament name (e.g., "My Crossword Tournament").
    *   **Support email:** Select your Google email from the dropdown.
    *   Click **Save**.
5.  **Authorize Your Domain:**
    *   Still in the **Authentication** section, click the **"Settings"** tab (at the top of the page, next to *Users* and *Sign-in method*).
    *   In the left-side menu of the Settings page, select **"Authorized domains"**.
    *   Click **"Add domain"**.
    *   Enter your website domain (e.g., `your-site.com`).
    *   Click **Add**.
    *   *Note:* `localhost` is usually added by default, but ensure it is present if you are testing locally.

### 5. Custom Domain Verification (Google Cloud Console)
If you are hosting the tournament on a custom domain (not `*.web.app` or `*.firebaseapp.com`), you must verify the domain in the Google Cloud backend.
1.  Go to the [Google Cloud Credentials page](https://console.cloud.google.com/apis/credentials).
2.  Ensure your tournament project is selected in the top dropdown.
3.  Under **"OAuth 2.0 Client IDs"**, click the edit (pencil) icon for **"Web client (auto-created by Google Service)"**.
4.  **Authorized JavaScript origins:** Add `https://your-site.com`.
5.  **Authorized redirect URIs:** Ensure `https://your-project-id.firebaseapp.com/__/auth/handler` is listed (it should be there by default).
6. Click "Save".

### 6. Authorize the Super-Admin (Firestore)
Access to the Admin Dashboard is restricted to emails found in the `admins` collection.
1.  In the Firebase console, go to **Firestore Database** (under **Databases & Storage**).
2.  Click **"Start collection"**.
3.  **Collection ID:** `admins`
4.  **Document ID:** (Your Google Email, e.g., `admin-name@gmail.com`)
5.  **Field:** `role`
6.  **Type:** `string`
7.  **Value (String):** `admin`
8.  Click **Save**.
9. **NOTE:** If you want to add other admins, you'll need to repeat this process -- click "Add document" and use the relevant email address.

### 6. Register Your Web App & Get Config
1.  Navigate back to the **Project Overview** (home icon at the top of the left sidebar).
2.  Click the **"+ Add app"** button.
3.  Click the **Web icon (</>)** to register a new web app.
4.  **App nickname:** Enter a name (e.g., "Tournament Solver").
5.  **Firebase Hosting:** You can leave the "Also set up Firebase Hosting" checkbox **unchecked**.
6.  Click **"Register app"**.
7.  Copy the `firebaseConfig` object provided (it will be a block of code starting with `// Import the functions`).
8.  In the `tournament/` folder, rename `firebase-config.example.js` to `firebase-config.js`.
9.  Paste your config in this file.
10. Delete the line that reads `import { initializeApp } from "firebase/app";`
11. Delete the last line (`const app = initializeApp(firebaseConfig);`)
12. Add the following line at the bottom: `firebase.initializeApp(firebaseConfig);`

### 7. Create Required Firestore Indices
To enable the live puzzle list and the detailed leaderboard, you must create composite indices in Firestore.
1.  Open the Admin dashboard (`admin.html`) in your browser.
2.  If an index is missing, a **red error message** will appear directly on the page with a link.
3.  Click the link in the error message.
4.  In the Firebase console, click **"Create Index"** (or **"Save"**).
5.  Wait for the status to become "Enabled" (usually 3-5 minutes).
6.  **Note:** The red error message in the dashboard will persist until the index is fully built. It is okay to continue setting up other tasks while the index builds in the background.
7.  You may need to do this twice: once for the **Puzzles** tab and once for the **Leaderboard** tab.

---

## Web Server & Puzzle Hosting

Since this is a "static" application, you must upload the files to a web server for participants to access them.

### 1. Preparing Your Files
You need to upload the **entire project folder** to your web server (via FTP, CPanel, or GitHub Pages). Ensure the following structure remains intact:
*   `tournament/index.html` (The dashboard)
*   `tournament/admin.html` (Your control panel)
*   `tournament/puzzles/` (**Place your .ipuz or .puz files here**)
*   `js/`, `css/`, `lib/` (Required folders for the solver to work)

### 2. Uploading Puzzles
Every time you have a new puzzle for the tournament:
1.  Upload the file (e.g., `round1.ipuz`) into the **`tournament/puzzles/`** folder on your server.
2.  Go to your **Admin Dashboard > Puzzles** tab.
3.  Add the puzzle metadata and enter the filename (`round1.ipuz`).
4.  Click **"Check"** to make sure the dashboard can "see" the file you just uploaded.

### 3. Sharing the Link
*   **For Participants:** Send them the link to the `tournament/` folder (e.g., `https://your-site.com/tournament/`).
*   **For Yourself:** Access the admin panel at `tournament/admin.html`.

---

## Administrative Tasks

### 1. Managing Divisions
1.  Open **`tournament/admin.html`** and sign in.
2.  Go to the **Divisions** tab.
3.  Define your tournament tiers (e.g., `Harder`, `Easier`).

### 2. Authorize Participants (CSV)
1.  Go to the **Participants** tab.
2.  Upload a CSV with headers: `email, division`. (Typos in divisions will be flagged).

### 3. Managing Puzzles
1.  Place puzzle files in **`tournament/puzzles/`**.
2.  In the Admin UI, go to the **Puzzles** tab to add metadata and use the **"Check"** button to verify paths.

### 4. Tournament Settings
1.  Set your **Tournament Title** and **Scoring Rules** in the **Settings** tab.

### 5. Viewing Results
1.  The **Results** tab shows a live feed of all submissions.
2.  The **Leaderboard** on the admin page provides a live grid of all standings.

---

### Hosting at Domain Root (Apache / .htaccess)
If you want to host the tournament directly at your domain root (e.g., `https://tournament.crosswordnexus.com/` instead of `/tournament/`), you can use Apache's `mod_rewrite` to internally map your URLs while keeping the required parent assets (`js/`, `css/`, `lib/`) active.

A pre-configured template for this is provided in `_htaccess.txt`. To use it:
1. Ensure the entire project directory (including `tournament/`, `js/`, `css/`, and `lib/`) is uploaded to your web server.
2. Rename `_htaccess.txt` (located inside the `tournament` directory) to `.htaccess`, and place it in the **root directory** of your domain (the folder containing both `tournament/` and the sibling `js/` directory).
3. This will internally map root requests (like `https://tournament.crosswordnexus.com/` and `/admin.html`) directly into the `tournament` folder while safely serving the root dependencies.
