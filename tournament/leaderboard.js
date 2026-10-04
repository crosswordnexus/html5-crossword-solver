/**
 * Shared Leaderboard Logic
 * This file is used by both the Participant Solver and the Admin Dashboard.
 */

window.TournamentLeaderboard = {
    /**
     * Helper to format error messages and linkify Firebase index URLs.
     */
    formatError(error) {
        const msg = typeof error === 'string' ? error : (error.message || 'An unknown error occurred');
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        // Linkify URLs and make them stand out
        return msg.replace(urlRegex, (url) => {
            return `<br><br><strong>Action Required:</strong> Click the link below and then click <strong>"Create Index"</strong> (or "Save") in the Firebase Console:<br><br>` +
                   `<a href="${url}" target="_blank" style="color: #3498db; font-weight: bold; text-decoration: underline; word-break: break-all;">${url}</a>`;
        });
    },

    /**
     * Renders a live leaderboard into the specified container.
     * @param onCellClick Callback function(uid, puzzleId, currentData)
     */
    async render(container, db, division, tournamentPuzzles = null, isMeCallback = null, onCellClick = null) {
        container.innerHTML = `<p>Loading standings for <strong>${division}</strong>...</p>`;

        // LIVE LISTENER: Aggregate scores into a grid
        return db.collection('scores')
            .where('division', '==', division)
            .onSnapshot((scoresSnapshot) => {
                const solverScores = {};
                const discoveredPuzzles = {};
                scoresSnapshot.forEach(doc => {
                    const data = doc.data();
                    if (data.puzzleId && !discoveredPuzzles[data.puzzleId]) {
                        discoveredPuzzles[data.puzzleId] = {
                            id: data.puzzleId,
                            puzzleNumber: data.puzzleNumber ?? 1,
                            name: data.puzzleName || `Puzzle ${data.puzzleNumber || ''}`
                        };
                    }
                    if (!solverScores[data.uid]) {
                        solverScores[data.uid] = {
                            uid: data.uid,
                            name: data.solverName,
                            totalScore: 0,
                            totalTime: 0,
                            puzzles: {}
                        };
                    }
                    solverScores[data.uid].totalScore += data.totalScore;
                    solverScores[data.uid].totalTime += data.timeTaken;
                    solverScores[data.uid].puzzles[data.puzzleId] = {
                        puzzleId: data.puzzleId,
                        puzzleName: data.puzzleName,
                        score: data.totalScore,
                        time: data.timeTaken,
                        correctWords: data.correctWords,
                        totalWords: data.totalWords,
                        isFullyCorrect: data.isFullyCorrect !== undefined ? data.isFullyCorrect : (data.correctWords === data.totalWords && data.totalWords > 0),
                        solverName: data.solverName,
                        submittedGrid: data.submittedGrid,
                        gridWidth: data.gridWidth,
                        gridHeight: data.gridHeight
                    };
                });

                const activePuzzles = (Array.isArray(tournamentPuzzles) && tournamentPuzzles.length > 0)
                    ? tournamentPuzzles
                    : Object.values(discoveredPuzzles).sort((a, b) => (a.puzzleNumber ?? 0) - (b.puzzleNumber ?? 0));

                const leaderboardData = Object.values(solverScores).sort((a, b) => {
                    if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
                    return a.totalTime - b.totalTime;
                });

                if (leaderboardData.length === 0) {
                    container.innerHTML = `<p>No submissions for <strong>${division}</strong> yet.</p>`;
                    return;
                }

                // Generate Table with Dynamic Columns
                let tableHtml = `
                    <table class="leaderboard-table">
                        <thead>
                            <tr>
                                <th class="rank">Rank</th>
                                <th>Solver</th>
                                <th>Total Score</th>
                                ${activePuzzles.map(p => `<th>P${p.puzzleNumber}</th>`).join('')}
                                <th>Total Time</th>
                            </tr>
                        </thead>
                        <tbody id="leaderboard-body">
                `;

                leaderboardData.forEach((entry, index) => {
                    const isMe = isMeCallback ? isMeCallback(entry) : false;
                    tableHtml += `
                        <tr class="${isMe ? 'current-user' : ''}">
                            <td class="rank">${index + 1}</td>
                            <td style="white-space: nowrap;">
                                ${isMe ? `<strong>${entry.name} (You)</strong>` : entry.name}
                            </td>
                            <td class="score-cell">${entry.totalScore}</td>
                            ${activePuzzles.map(p => {
                                const pResult = entry.puzzles[p.id];
                                if (pResult) {
                                    const clickableClass = onCellClick ? 'score-cell-clickable cursor-pointer' : '';
                                    const cleanClass = pResult.isFullyCorrect ? 'clean-solve' : '';
                                    const wordRatio = (pResult.correctWords !== undefined && pResult.totalWords !== undefined)
                                        ? `<div>${pResult.correctWords}/${pResult.totalWords}</div>`
                                        : '';
                                    return `<td class="${clickableClass}" data-uid="${entry.uid}" data-pid="${p.id}" style="font-size: 0.85em; color: #666;">
                                                <div class="puzzle-score ${cleanClass}">${pResult.score}</div>
                                                <div>${Math.floor(pResult.time / 60)}m&nbsp;${pResult.time % 60}s</div>
                                                ${wordRatio}
                                            </td>`;
                                } else {
                                    const clickableClass = onCellClick ? 'score-cell-clickable cursor-pointer score-cell-empty' : '';
                                    const titleAttr = onCellClick ? ' title="Click to enter score"' : '';
                                    return `<td class="${clickableClass}" data-uid="${entry.uid}" data-pid="${p.id}"${titleAttr} style="color: #bbb; text-align: center;">—</td>`;
                                }
                            }).join('')}
                            <td style="white-space: nowrap;">${Math.floor(entry.totalTime / 60)}m ${entry.totalTime % 60}s</td>
                        </tr>
                    `;
                });

                container.innerHTML = tableHtml + '</tbody></table>';

                // Add click listeners to cells if callback provided
                if (onCellClick) {
                    container.querySelectorAll('.score-cell-clickable').forEach(cell => {
                        cell.onclick = () => {
                            const uid = cell.dataset.uid;
                            const pid = cell.dataset.pid;
                            const entry = solverScores[uid];
                            const pMatch = activePuzzles.find(p => p.id === pid);
                            const pData = (entry && entry.puzzles[pid]) ? entry.puzzles[pid] : {
                                isNew: true,
                                puzzleId: pid,
                                puzzleName: pMatch ? (pMatch.name || `Puzzle ${pMatch.puzzleNumber}`) : '',
                                puzzleNumber: pMatch ? (pMatch.puzzleNumber ?? null) : null,
                                solverName: entry ? entry.name : '',
                                division: division,
                                score: '',
                                time: 0
                            };
                            onCellClick(uid, pid, pData);
                        };
                    });
                }

            }, (error) => {
                console.error('Leaderboard error:', error);
                container.innerHTML = `<div class="error-message" style="display:block; text-align:left;">${this.formatError(error)}</div>`;
            });
    },

    /**
     * Exports leaderboard data for a division as a CSV download.
     */
    async exportCsv(db, division, tournamentPuzzles = null) {
        try {
            const scoresSnap = await db.collection('scores')
                .where('division', '==', division)
                .get();

            const solverScores = {};
            const discoveredPuzzles = {};
            scoresSnap.forEach(doc => {
                const data = doc.data();
                if (data.puzzleId && !discoveredPuzzles[data.puzzleId]) {
                    discoveredPuzzles[data.puzzleId] = {
                        id: data.puzzleId,
                        puzzleNumber: data.puzzleNumber ?? 1,
                        name: data.puzzleName || `Puzzle ${data.puzzleNumber || ''}`
                    };
                }
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

            const activePuzzles = (Array.isArray(tournamentPuzzles) && tournamentPuzzles.length > 0)
                ? tournamentPuzzles
                : Object.values(discoveredPuzzles).sort((a, b) => (a.puzzleNumber ?? 0) - (b.puzzleNumber ?? 0));

            const leaderboardData = Object.values(solverScores).sort((a, b) => {
                if (b.totalScore !== a.totalScore) return b.totalScore - a.totalScore;
                return a.totalTime - b.totalTime;
            });

            let csvContent = "Solver Name,Total Score,Total Time (sec)";
            activePuzzles.forEach(p => csvContent += `,Puzzle ${p.puzzleNumber} Score`);
            csvContent += "\n";

            leaderboardData.forEach(entry => {
                const safeName = (entry.name || '').replace(/"/g, '""');
                csvContent += `"${safeName}",${entry.totalScore},${entry.totalTime}`;
                activePuzzles.forEach(p => {
                    csvContent += `,${entry.puzzles[p.id] || 0}`;
                });
                csvContent += "\n";
            });

            const blob = new Blob(["\uFEFF", csvContent], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.setAttribute("href", url);
            link.setAttribute("download", `leaderboard_${division}_${new Date().toISOString().slice(0,10)}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (e) {
            console.error('Export error:', e);
            if (window.Toast) window.Toast.error('Export failed: ' + e.message);
        }
    }
};

