/**
 * Tournament Solver Dashboard
 * Manages participant registration, real-time puzzle status, and standings.
 */

// Firestore Collection Constants
const SOLVERS_COLLECTION = 'solvers';
const PUZZLES_COLLECTION = 'puzzles';
const CONFIG_COLLECTION = 'tournament_config';
const SCORES_COLLECTION = 'scores';
const PARTICIPANTS_COLLECTION = 'participants'; // Authorized users from CSV

document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        try {
            const auth = firebase.auth();
            const db = firebase.firestore();

            let currentSolver = null;
            let puzzleListenerUnsubscribe = null;
            let activeView = 'setup'; 
            
            const tournamentAppDiv = document.getElementById('tournament-app');
            const tournamentContentDiv = document.getElementById('tournament-content');
            const loginDiv = document.getElementById('solver-login');

            let scoringRules = { pointsPerWord: 10, timeBonusPerSecond: 1, completionBonus: 180, overtimePenaltyPer4Seconds: 1, minCorrectPercentageForTimeBonus: 0.5 };
            let branding = { color_selected: '#FF4136', color_word: '#FEE300' };

            async function fetchScoringRules() {
                try {
                    const doc = await db.collection(CONFIG_COLLECTION).doc('scoring').get();
                    if (doc.exists) scoringRules = { ...scoringRules, ...doc.data() };
                } catch (e) {}
            }

            // --- Dark Mode Logic ---
            const dmToggle = document.getElementById('darkModeToggle');
            if (dmToggle) {
                const savedDM = localStorage.getItem('tournamentDarkMode') === 'true';
                dmToggle.checked = savedDM;
                if (savedDM) document.body.classList.add('dark-mode');
                
                dmToggle.onchange = (e) => {
                    const isDark = e.target.checked;
                    localStorage.setItem('tournamentDarkMode', isDark);
                    if (isDark) document.body.classList.add('dark-mode');
                    else document.body.classList.remove('dark-mode');
                };
            }

            // --- Logout Link ---
            const signOutLink = document.getElementById('signOutLink');
            if (signOutLink) {
                signOutLink.onclick = async (e) => {
                    e.preventDefault();
                    if (confirm('Log out of the tournament?')) await auth.signOut();
                };
            }

            /**
             * Entry Point: Handle Google Sign-in and Authorization Check
             */
            async function initSolver() {
                await fetchScoringRules();
                
                // Fetch tournament name and branding
                try {
                    const metaDoc = await db.collection(CONFIG_COLLECTION).doc('metadata').get();
                    if (metaDoc.exists) {
                        const data = metaDoc.data();
                        if (data.tournamentName) document.getElementById('loginTournamentName').textContent = data.tournamentName;
                        if (data.color_selected) branding.color_selected = data.color_selected;
                        if (data.color_word) branding.color_word = data.color_word;
                    }
                } catch (e) {}

                auth.onAuthStateChanged(async (user) => {
                    if (user && !user.isAnonymous) {
                        // Check if this Google user is authorized in the 'participants' collection
                        try {
                            const partDoc = await db.collection(PARTICIPANTS_COLLECTION).doc(user.email.toLowerCase()).get();
                            
                            if (partDoc.exists) {
                                // User IS authorized. Now check for their profile.
                                const solverRef = db.collection(SOLVERS_COLLECTION).doc(user.uid);
                                const solverDoc = await solverRef.get();
                                const authData = partDoc.data();

                                if (solverDoc.exists && solverDoc.data().name) {
                                    // Profile complete
                                    const sData = solverDoc.data();
                                    currentSolver = { uid: user.uid, name: sData.name, displayName: sData.displayName, division: authData.division, email: user.email };
                                    
                                    // Update participants doc with UID if it's missing (link the account)
                                    if (!authData.uid) {
                                        await partDoc.ref.update({ uid: user.uid, name: sData.name });
                                    }

                                    loginDiv.style.display = 'none';
                                    tournamentAppDiv.style.display = 'block';
                                    renderPuzzleList();
                                } else {
                                    // Authorized but needs to set a name
                                    loginDiv.style.display = 'none';
                                    tournamentAppDiv.style.display = 'block';
                                    renderSetupUI(user, authData);
                                }
                            } else {
                                // Not in the authorized list
                                showLoginError(`Account ${user.email} is not authorized for this tournament.`);
                                await auth.signOut();
                            }
                            } catch (e) { 
                                console.error('Auth check error:', e);
                                let errorMsg = "Error checking authorization.";
                                if (e.code === 'permission-denied') {
                                    errorMsg += " Permission denied. Check your Firestore rules and ensure your email is in the 'participants' collection.";
                                }
                                showLoginError(errorMsg);
                                Toast.error(errorMsg);
                                await auth.signOut();
                            }
                    } else {
                        // Show login screen
                        tournamentAppDiv.style.display = 'none';
                        loginDiv.style.display = 'block';
                        initLoginForm();
                    }
                });
            }

            function initLoginForm() {
                const btn = document.getElementById('googleSignInBtn');
                btn.onclick = async () => {
                    const provider = new firebase.auth.GoogleAuthProvider();
                    try { await auth.signInWithPopup(provider); } catch (e) { showLoginError(e.message); }
                };
            }

            function showLoginError(msg) {
                const errorDiv = document.getElementById('loginError');
                errorDiv.textContent = msg; errorDiv.style.display = 'block';
            }

            /**
             * VIEW: Participant Setup (Name entry ONLY - Division is pre-assigned)
             */
            async function renderSetupUI(user, authData) {
                activeView = 'setup';
                tournamentContentDiv.innerHTML = `
                    <div class="setup-container">
                        <h2>Finish Registration</h2>
                        <p>You are authorized for the <strong>${authData.division}</strong> division.</p>
                        <div id="setupError" class="error-message"></div>
                        <div class="form-group">
                            <label for="solverName">Leaderboard Nickname:</label>
                            <input type="text" id="solverName" placeholder="Enter your display name" maxlength="30">
                        </div>
                        <div class="setup-actions">
                            <button id="completeSetupBtn" class="primary-btn">Start Tournament</button>
                        </div>
                    </div>
                `;

                document.getElementById('completeSetupBtn').onclick = async () => {
                    const name = document.getElementById('solverName').value.trim();
                    if (!name) return;

                    const displayName = `${name} (#${user.uid.substring(0, 4)})`;
                    try {
                        // Create Solver Profile
                        await db.collection(SOLVERS_COLLECTION).doc(user.uid).set({
                            name, displayName, email: user.email.toLowerCase(),
                            division: authData.division, uid: user.uid,
                            createdAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                        // Link Participant entry
                        await db.collection(PARTICIPANTS_COLLECTION).doc(user.email.toLowerCase()).update({
                            uid: user.uid, name: name
                        });

                        currentSolver = { uid: user.uid, name, displayName, division: authData.division, email: user.email };
                        renderPuzzleList();
                    } catch (e) { Toast.error('Save failed: ' + e.message); }
                };
            }

            function calculateScore(xw, puzzleData, timeTakenSeconds) {
                let cCount, tWords;
                if (xw.words && Array.isArray(xw.words)) {
                    tWords = xw.words.length; cCount = xw.words.filter(w => w.isCorrect()).length;
                } else if (xw.words) {
                    const ws = Object.values(xw.words); tWords = ws.length; cCount = ws.filter(w => w.isCorrect()).length;
                } else { tWords = 0; cCount = 0; }

                const isFull = cCount === tWords && tWords > 0;
                const limit = puzzleData.timeLimitSeconds || 0;
                let score = cCount * scoringRules.pointsPerWord;
                if (isFull) score += scoringRules.completionBonus;

                let bonus = 0, penalty = 0;
                if (timeTakenSeconds <= limit) {
                    if ((cCount/tWords) >= scoringRules.minCorrectPercentageForTimeBonus) 
                        bonus = (limit - timeTakenSeconds) * scoringRules.timeBonusPerSecond;
                } else {
                    penalty = Math.floor((timeTakenSeconds - limit) / 4) * scoringRules.overtimePenaltyPer4Seconds;
                }
                return { totalScore: Math.max(0, score + bonus - penalty), correctWords: cCount, totalWords: tWords, timeTaken: timeTakenSeconds, timeLimit: limit, timeBonus: bonus, overtimePenalty: penalty, isFullyCorrect: isFull };
            }

            async function submitPuzzle(puzzleData, scoreInfo) {
                if (!currentSolver) return;
                if (puzzleData.isWarmup) {
                    try {
                        const completed = JSON.parse(localStorage.getItem('completed_warmups') || '[]');
                        if (!completed.includes(puzzleData.id)) {
                            completed.push(puzzleData.id);
                            localStorage.setItem('completed_warmups', JSON.stringify(completed));
                        }
                    } catch (e) {}
                    showSubmissionResult(scoreInfo, true);
                    return;
                }
                try {
                    await db.collection(SCORES_COLLECTION).doc(`${currentSolver.uid}_${puzzleData.id}`).set({
                        uid: currentSolver.uid, solverName: currentSolver.displayName, division: currentSolver.division,
                        puzzleId: puzzleData.id, puzzleName: puzzleData.name, puzzleNumber: puzzleData.puzzleNumber,
                        ...scoreInfo, submittedAt: firebase.firestore.FieldValue.serverTimestamp()
                    });
                    showSubmissionResult(scoreInfo);
                } catch (e) { Toast.error('Error: ' + e.message); }
            }

            function showSubmissionResult(scoreInfo, isWarmup = false) {
                activeView = 'result';
                tournamentContentDiv.innerHTML = `
                    <div class="submission-result">
                        <h2>${isWarmup ? 'Warm-up Complete!' : 'Puzzle Submitted!'}</h2>
                        <div class="score-card">
                            <p class="total-score">Total Score: <span>${scoreInfo.totalScore}</span></p>
                            <p>Correct: ${scoreInfo.correctWords}/${scoreInfo.totalWords} | Time: ${Math.floor(scoreInfo.timeTaken/60)}m ${scoreInfo.timeTaken%60}s</p>
                        </div>
                        <div class="puzzle-actions" style="justify-content:center"><button id="backToList">Puzzle List</button><button id="viewLeaders" class="secondary-btn">Leaderboard</button></div>
                    </div>
                `;
                document.getElementById('backToList').onclick = renderPuzzleList;
                document.getElementById('viewLeaders').onclick = () => renderLeaderboard();
            }

            async function renderLeaderboard(selectedDivision = currentSolver.division) {
                activeView = 'leaderboard';
                if (puzzleListenerUnsubscribe) { puzzleListenerUnsubscribe(); puzzleListenerUnsubscribe = null; }

                tournamentContentDiv.innerHTML = `
                    <div class="leaderboard-header">
                        <h2>Leaderboard</h2>
                        <div class="nav-actions">
                            <button id="backPuz">Back to Puzzles</button>
                        </div>
                    </div>
                    <div class="leaderboard-controls" style="margin-bottom: 20px;">
                        <label for="divFilter" style="font-weight: bold; margin-right: 10px;">Division:</label>
                        <select id="divFilter" style="padding: 5px 10px; border-radius: 4px; border: 1px solid #ccc;"></select>
                    </div>
                    <div id="leaderboard-content" style="overflow-x:auto">
                        <p>Loading...</p>
                    </div>
                `;
                document.getElementById('backPuz').onclick = renderPuzzleList;
                
                try {
                    const puzzlesSnapshot = await db.collection(PUZZLES_COLLECTION).where('isWarmup', '==', false).orderBy('puzzleNumber', 'asc').get();
                    const tPuzzles = []; puzzlesSnapshot.forEach(doc => tPuzzles.push({ id: doc.id, ...doc.data() }));
                    const divDoc = await db.collection(CONFIG_COLLECTION).doc('divisions').get();
                    const avDivs = (divDoc.exists && divDoc.data().list) ? divDoc.data().list : ['Easier', 'Harder', 'Pairs'];
                    const filter = document.getElementById('divFilter');
                    avDivs.forEach(div => {
                        const opt = document.createElement('option'); opt.value = div; opt.textContent = `${div} Division`;
                        opt.selected = (div === selectedDivision); filter.appendChild(opt);
                    });
                    filter.onchange = (e) => renderLeaderboard(e.target.value);

                    // LIVE LISTENER: Aggregate scores into a grid using shared logic
                    puzzleListenerUnsubscribe = await TournamentLeaderboard.render(
                        document.getElementById('leaderboard-content'),
                        db,
                        selectedDivision,
                        tPuzzles,
                        (entry) => (entry.name === currentSolver.displayName) // Highlight current user
                    );
                } catch (e) {
                    document.getElementById('leaderboard-content').innerHTML = 
                        `<div class="error-message" style="display:block;">${TournamentLeaderboard.formatError(e)}</div>`;
                }
            }

            window.addEventListener('message', async (event) => {
                if (event.data && event.data.type === 'CROSSWORD_SOLVED') {
                    const { puzzleId, timeTakenSeconds, correctWords, totalWords, submittedGrid, gridWidth, gridHeight } = event.data;
                    try {
                        const pDoc = await db.collection(PUZZLES_COLLECTION).doc(puzzleId).get();
                        if (pDoc.exists) {
                            const scoreInfo = calculateScore({ words: Array(parseInt(correctWords)).fill({ isCorrect:()=>true }).concat(Array(Math.max(0, parseInt(totalWords)-parseInt(correctWords))).fill({ isCorrect:()=>false })) }, pDoc.data(), parseInt(timeTakenSeconds));
                            if (submittedGrid) {
                                scoreInfo.submittedGrid = submittedGrid;
                                scoreInfo.gridWidth = gridWidth;
                                scoreInfo.gridHeight = gridHeight;
                            }
                            await submitPuzzle({ id: pDoc.id, ...pDoc.data() }, scoreInfo);
                        }
                    } catch (e) {}
                }
            });

            async function loadPuzzle(puzzleData) {
                let filename = null;
                if (puzzleData.filesByDivision && currentSolver.division) filename = puzzleData.filesByDivision[currentSolver.division] || puzzleData.filesByDivision.default;
                if (!filename) filename = puzzleData.filePath || puzzleData.fileName;
                if (!filename) return Toast.error('File not found.');

                // Automatically prepend directory if not already present
                let path = filename;
                if (!path.startsWith('./') && !path.startsWith('../')) {
                    path = './puzzles/' + filename;
                }

                const url = new URL('solve.html', window.location.href);
                url.searchParams.set('puzzle', path);

                const config = { 
                    tournament_mode: true, 
                    puzzle_id: puzzleData.id, 
                    time_limit: puzzleData.timeLimitSeconds, 
                    is_warmup: !!puzzleData.isWarmup,
                    color_selected: branding.color_selected,
                    color_word: branding.color_word,
                    scoring: scoringRules
                };

                url.searchParams.set('config', btoa(JSON.stringify(config)));
                window.open(url.toString(), '_blank');
            }
            async function renderPuzzleList() {
                if (!currentSolver) return;
                activeView = 'puzzles';
                if (puzzleListenerUnsubscribe) { puzzleListenerUnsubscribe(); puzzleListenerUnsubscribe = null; }

                let tName = 'Tournament Solver';
                try {
                    const mDoc = await db.collection(CONFIG_COLLECTION).doc('metadata').get();
                    if (mDoc.exists && mDoc.data().tournamentName) { tName = mDoc.data().tournamentName; document.title = tName; }
                } catch (e) {}

                tournamentContentDiv.innerHTML = `
                    <h1>${tName}</h1>
                    <div class="solver-info">
                        <div style="display:flex;justify-content:space-between;align-items:flex-start"><h2>Welcome, ${currentSolver.displayName}!</h2><div style="font-size:0.8em;color:#27ae60;font-weight:bold"><span class="status-dot"></span>Live</div></div>
                        <div class="solver-meta"><div>Division: <strong>${currentSolver.division}</strong> | ID: <code>${currentSolver.uid.substring(0,8)}...</code></div><button id="vLeader" class="secondary-btn">View Leaderboard</button></div>
                    </div>
                    <div id="wSection" class="puzzle-section"></div>
                    <div id="tSection" class="puzzle-section"></div>
                `;
                document.getElementById('vLeader').onclick = () => renderLeaderboard();

                puzzleListenerUnsubscribe = db.collection(PUZZLES_COLLECTION).where('status', 'in', ['available', 'locked']).orderBy('puzzleNumber', 'asc').onSnapshot(async (snap) => {
                    if (activeView !== 'puzzles') return;
                    let subs = new Map();
                    try {
                        const sSnap = await db.collection(SCORES_COLLECTION).where('uid', '==', currentSolver.uid).get();
                        sSnap.forEach(doc => {
                            const data = doc.data();
                            subs.set(data.puzzleId, data);
                        });
                    } catch (e) {}

                    const ws = [], ts = [];
                    snap.forEach(doc => { const p = { id: doc.id, ...doc.data() }; if (p.isWarmup) ws.push(p); else ts.push(p); });

                    const wS = document.getElementById('wSection'), tS = document.getElementById('tSection');
                    if (ws.length > 0) {
                        wS.innerHTML = `<h3>Warm-up Puzzle${ws.length>1?'s':''}</h3><ul class="puzzle-list"></ul>`;
                        const ul = wS.querySelector('ul');
                        let completedWarmups = [];
                        try {
                            completedWarmups = JSON.parse(localStorage.getItem('completed_warmups') || '[]');
                        } catch (e) {}

                        ws.forEach(p => {
                            const isS = subs.has(p.id) || completedWarmups.includes(p.id);
                            const isL = p.status === 'locked', li = document.createElement('li');
                            li.className = `${isS?'submitted':''} ${isL?'locked':''}`;
                            li.innerHTML = `<div class="puzzle-info"><span class="puz-name">${p.name}</span><span class="puz-author">by ${p.author}</span><span class="puz-time">(${p.timeLimitSeconds/60}m)</span></div><div class="puzzle-status">${isS?'<button data-id="'+p.id+'" class="start-puzzle-btn resume-btn">Review Warm-up</button>':isL?'<span class="status-tag locked">Locked</span>':'<button data-id="'+p.id+'" class="start-puzzle-btn">Start Warm-up</button>'}</div>`;
                            ul.appendChild(li);
                        });
                    } else wS.innerHTML = '';

                    if (ts.length > 0) {
                        tS.innerHTML = `<h3>Tournament Puzzle${ts.length>1?'s':''}</h3><ul class="puzzle-list"></ul>`;
                        const ul = tS.querySelector('ul');
                        ts.forEach(p => {
                            const scoreData = subs.get(p.id);
                            const isS = !!scoreData, isL = p.status === 'locked', li = document.createElement('li');
                            li.className = `${isS?'submitted':''} ${isL?'locked':''}`;
                            
                            let statusHtml = '';
                            if (isS) {
                                const statsText = `${scoreData.totalScore} pts` + 
                                    ((scoreData.correctWords !== undefined && scoreData.totalWords !== undefined) ? ` | ${scoreData.correctWords}/${scoreData.totalWords}` : '') + 
                                    ` | ${Math.floor(scoreData.timeTaken/60)}m ${scoreData.timeTaken%60}s`;
                                statusHtml = `
                                    <div class="submission-stats">
                                        <span class="status-tag">Submitted</span>
                                        <div class="score-summary">${statsText}</div>
                                    </div>
                                `;
                            } else if (isL) {
                                statusHtml = '<span class="status-tag locked">Locked</span>';
                            } else {
                                statusHtml = '<button data-id="'+p.id+'" class="start-puzzle-btn">Start Puzzle</button>';
                            }

                            li.innerHTML = `<div class="puzzle-info"><span class="puz-num">#${p.puzzleNumber}</span><span class="puz-name">${p.name}</span><span class="puz-author">by ${p.author}</span><span class="puz-time">(${p.timeLimitSeconds/60}m)</span></div><div class="puzzle-status">${statusHtml}</div>`;
                            ul.appendChild(li);
                        });
                    } else tS.innerHTML = `<h3>Tournament Puzzles</h3><p>No puzzles yet.</p>`;

                    document.querySelectorAll('.start-puzzle-btn').forEach(btn => {
                        btn.onclick = async () => {
                            const pDoc = await db.collection(PUZZLES_COLLECTION).doc(btn.dataset.id).get();
                            if (pDoc.exists) loadPuzzle({ id: pDoc.id, ...pDoc.data() });
                        };
                    });
                });
            }

            initSolver();
        } catch (e) { console.error(e); }
    }
});
