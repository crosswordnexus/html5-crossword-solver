import { PUZZLES_COLLECTION, CONFIG_COLLECTION, SCORES_COLLECTION } from './Constants.js';

let leaderboardUnsubscribe = null;

/**
 * Renders the Live Leaderboard tab.
 * @param {HTMLElement} container - The container to render into.
 * @param {firebase.firestore.Firestore} db - The Firestore database instance.
 */
export async function renderLeaderboardTab(container, db, selectedDivision = null) {
    if (leaderboardUnsubscribe) { 
        leaderboardUnsubscribe(); 
        leaderboardUnsubscribe = null; 
    }

    try {
        // Fetch Puzzles first for column headers
        const pSnap = await db.collection(PUZZLES_COLLECTION)
            .where('isWarmup', '==', false)
            .orderBy('puzzleNumber', 'asc')
            .get();
            
        const tournamentPuzzles = []; 
        pSnap.forEach(doc => tournamentPuzzles.push({ id: doc.id, ...doc.data() }));

        // Fetch Divisions for filter
        const divDoc = await db.collection(CONFIG_COLLECTION).doc('divisions').get();
        const divisions = divDoc.exists ? divDoc.data().list : ['Easier', 'Harder', 'Pairs'];
        
        if (!selectedDivision) selectedDivision = divisions[0];

        container.innerHTML = `
            <div class="leaderboard-header">
                <h2>Live Leaderboard</h2>
                <div style="display: flex; gap: 10px;">
                    <select id="adminLeaderboardFilter"></select>
                    <button id="exportCsvBtn" class="primary-btn btn-sm">Export CSV</button>
                </div>
            </div>
            <div id="admin-leaderboard-container" style="overflow-x:auto;"></div>
        `;

        const filter = container.querySelector('#adminLeaderboardFilter');
        divisions.forEach(d => {
            const opt = document.createElement('option'); 
            opt.value = d; 
            opt.textContent = d + ' Division';
            opt.selected = (d === selectedDivision); 
            filter.appendChild(opt);
        });
        
        filter.onchange = (e) => renderLeaderboardTab(container, db, e.target.value);

        // CSV Export functionality
        container.querySelector('#exportCsvBtn').onclick = () => {
            if (!window.TournamentLeaderboard || !window.TournamentLeaderboard.getCurrentData) {
                // Since Leaderboard.js doesn't expose data, we'll need to refactor it or re-fetch here.
                // For simplicity now, let's just trigger a re-fetch of the data for export.
                exportLeaderboardData(db, selectedDivision, tournamentPuzzles);
                return;
            }
            exportLeaderboardData(db, selectedDivision, tournamentPuzzles);
        };

        const leaderboardContainer = container.querySelector('#admin-leaderboard-container');
        
        if (window.TournamentLeaderboard) {
            leaderboardUnsubscribe = await window.TournamentLeaderboard.render(
                leaderboardContainer, 
                db, 
                selectedDivision, 
                tournamentPuzzles,
                null, // No "You" highlighting in admin view
                (uid, pid, pData) => openScoreEditModal(uid, pid, pData, db) // Handle cell clicks
            );
        } else {
            leaderboardContainer.innerHTML = '<p class="error">Leaderboard component not loaded.</p>';
        }

    } catch (e) { 
        if (window.TournamentLeaderboard) {
            container.innerHTML = `<div class="error-message" style="display:block; text-align:left;">${window.TournamentLeaderboard.formatError(e)}</div>`; 
        } else {
            container.innerHTML = `<p class="error">${e.message}</p>`;
        }
    }
}

async function exportLeaderboardData(db, division, tournamentPuzzles) {
    try {
        const scoresSnap = await db.collection(SCORES_COLLECTION)
            .where('division', '==', division)
            .get();

        const solverScores = {};
        scoresSnap.forEach(doc => {
            const data = doc.data();
            if (!solverScores[data.uid]) {
                solverScores[data.uid] = { 
                    name: data.solverName, 
                    totalScore: 0, 
                    totalTime: 0, 
                    puzzles: {} 
                };
            }
            solverScores[data.uid].totalScore += data.totalScore;
            solverScores[data.uid].totalTime += data.timeTaken;
            solverScores[data.uid].puzzles[data.puzzleId] = data.totalScore;
        });

        const leaderboardData = Object.values(solverScores).sort((a, b) => b.totalScore - a.totalScore);

        let csvContent = "data:text/csv;charset=utf-8,Solver Name,Total Score,Total Time (sec)";
        tournamentPuzzles.forEach(p => csvContent += `,Puzzle ${p.puzzleNumber} Score`);
        csvContent += "\n";

        leaderboardData.forEach(entry => {
            csvContent += `"${entry.name}",${entry.totalScore},${entry.totalTime}`;
            tournamentPuzzles.forEach(p => {
                csvContent += `,${entry.puzzles[p.id] || 0}`;
            });
            csvContent += "\n";
        });

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `leaderboard_${division}_${new Date().toISOString().slice(0,10)}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    } catch (e) {
        if (window.Toast) window.Toast.error('Export failed: ' + e.message);
    }
}

/**
 * Opens a modal to override or delete a specific score entry.
 */
function openScoreEditModal(uid, pid, pData, db) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    
    const minutes = Math.floor(pData.time / 60);
    const seconds = pData.time % 60;

    modalOverlay.innerHTML = `
        <div class="edit-score-modal">
            <h3>Override Score</h3>
            <p style="font-size:0.9em; margin-bottom:20px;">
                <strong>Puzzle:</strong> ${pData.puzzleName}<br>
                <strong>Original Correct:</strong> ${pData.correctWords} / ${pData.totalWords}
            </p>
            
            <form id="scoreEditForm">
                <div class="form-row">
                    <div class="form-group">
                        <label>Total Score</label>
                        <input type="number" id="editTotalScore" value="${pData.score}" required>
                    </div>
                </div>
                <div class="form-row" style="margin-top:10px">
                    <div class="form-group">
                        <label>Time (Minutes)</label>
                        <input type="number" id="editTimeMin" value="${minutes}" min="0">
                    </div>
                    <div class="form-group">
                        <label>Time (Seconds)</label>
                        <input type="number" id="editTimeSec" value="${seconds}" min="0" max="59">
                    </div>
                </div>

                <div style="margin-top:20px; padding:10px; background:#fdf2f2; border-radius:6px; border:1px solid #f8d7da;">
                    <label style="display:flex; align-items:flex-start; gap:10px; font-size:0.85em; cursor:pointer;">
                        <input type="checkbox" id="confirmOverride" style="margin-top:3px;">
                        <span>I confirm that I want to manually override this participant's official score.</span>
                    </label>
                </div>

                <div class="modal-footer">
                    <button type="button" id="deleteScoreBtn" class="secondary-btn btn-danger" style="margin-right:auto">Delete Entry</button>
                    <button type="button" id="cancelEditBtn" class="secondary-btn">Cancel</button>
                    <button type="submit" class="primary-btn">Save Changes</button>
                </div>
            </form>
        </div>
    `;

    document.body.appendChild(modalOverlay);

    const close = () => document.body.removeChild(modalOverlay);
    modalOverlay.querySelector('#cancelEditBtn').onclick = close;

    // Handle Deletion
    modalOverlay.querySelector('#deleteScoreBtn').onclick = async () => {
        if (confirm('Permanently delete this score entry? This cannot be undone.')) {
            try {
                await db.collection(SCORES_COLLECTION).doc(`${uid}_${pid}`).delete();
                if (window.Toast) window.Toast.success('Score deleted.');
                close();
            } catch (e) { 
                if (window.Toast) window.Toast.error('Delete failed: ' + e.message); 
            }
        }
    };

    // Handle Save
    modalOverlay.querySelector('#scoreEditForm').onsubmit = async (e) => {
        e.preventDefault();
        
        if (!modalOverlay.querySelector('#confirmOverride').checked) {
            if (window.Toast) window.Toast.error('Please check the confirmation box to apply changes.');
            return;
        }

        const newScore = parseInt(modalOverlay.querySelector('#editTotalScore').value);
        const newMin = parseInt(modalOverlay.querySelector('#editTimeMin').value) || 0;
        const newSec = parseInt(modalOverlay.querySelector('#editTimeSec').value) || 0;
        const newTotalSeconds = (newMin * 60) + newSec;

        try {
            // NOTE: Using window.firebase.firestore if available
            const FieldValue = (window.firebase && window.firebase.firestore) ? 
                                window.firebase.firestore.FieldValue : null;

            await db.collection(SCORES_COLLECTION).doc(`${uid}_${pid}`).update({
                totalScore: newScore,
                timeTaken: newTotalSeconds,
                isManuallyOverridden: true,
                overriddenAt: FieldValue ? FieldValue.serverTimestamp() : new Date()
            });
            if (window.Toast) window.Toast.success('Score updated!');
            close();
        } catch (err) {
            if (window.Toast) window.Toast.error('Update failed: ' + err.message);
        }
    };
}
