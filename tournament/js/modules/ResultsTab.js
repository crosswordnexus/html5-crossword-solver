import { SCORES_COLLECTION } from './Constants.js';

/**
 * Renders the Recent Results tab.
 * @param {HTMLElement} container - The container to render into.
 * @param {firebase.firestore.Firestore} db - The Firestore database instance.
 */
export async function renderResultsTab(container, db) {
    try {
        const querySnapshot = await db.collection(SCORES_COLLECTION)
            .orderBy('submittedAt', 'desc')
            .limit(150)
            .get();

        const results = [];
        let html = `
            <div class="admin-section-header">
                <h2>Recent Results</h2>
                <button id="exportResultsBtn" class="secondary-btn btn-sm">Export CSV</button>
            </div>
            <div class="admin-card" style="padding:0">
                <table class="results-table">
                    <thead>
                        <tr>
                            <th>Solver</th>
                            <th>Division</th>
                            <th>Puzzle</th>
                            <th>Score</th>
                            <th>Correct</th>
                            <th>Time</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        querySnapshot.forEach(doc => {
            const data = doc.data();
            results.push(data);
            html += `
                <tr>
                    <td>
                        <strong>${data.solverName}</strong><br>
                        <small>${data.submittedAt?.toDate().toLocaleString() || 'N/A'}</small>
                    </td>
                    <td>${data.division}</td>
                    <td>#${data.puzzleNumber}: ${data.puzzleName}</td>
                    <td><strong class="score-cell">${data.totalScore}</strong></td>
                    <td>${data.correctWords}/${data.totalWords}</td>
                    <td>${Math.floor(data.timeTaken/60)}m ${data.timeTaken%60}s</td>
                </tr>
            `;
        });

        if (results.length === 0) {
            html += '<tr><td colspan="6" class="empty-state">No results found.</td></tr>';
        }

        container.innerHTML = html + '</tbody></table></div>';

        container.querySelector('#exportResultsBtn').onclick = () => {
            const headers = ['Solver', 'Division', 'Puzzle ID', 'Puzzle Name', 'Score', 'Correct', 'Total', 'Time', 'Submitted'];
            const csvRows = [headers.join(',')];
            
            results.forEach(r => {
                const row = [
                    `"${r.solverName}"`,
                    `"${r.division}"`,
                    `"${r.puzzleId}"`,
                    `"${r.puzzleName}"`,
                    r.totalScore,
                    r.correctWords,
                    r.totalWords,
                    r.timeTaken,
                    r.submittedAt?.toDate().toISOString() || ''
                ];
                csvRows.push(row.join(','));
            });

            const csvContent = csvRows.join('\n');
            const blob = new Blob([csvContent], { type: 'text/csv' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'results.csv';
            a.click();
            window.URL.revokeObjectURL(url);
        };
    } catch (e) {
        container.innerHTML = `<p class="error">${e.message}</p>`;
    }
}
