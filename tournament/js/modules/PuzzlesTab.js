import { PUZZLES_COLLECTION, CONFIG_COLLECTION } from './Constants.js';

/**
 * Renders the Puzzles management tab.
 * @param {HTMLElement} container - The container to render into.
 * @param {firebase.firestore.Firestore} db - The Firestore database instance.
 */
export async function renderPuzzlesTab(container, db) {
    try {
        container.innerHTML = `
            <div id="index-check-status"></div>
            <div class="admin-section-header">
                <h2>Manage Puzzles</h2>
                <button id="addPuzzleBtn" class="primary-btn">Add New Puzzle</button>
            </div>
            <div id="puzzles-list-container"></div>
        `;

        const indexCheckContainer = container.querySelector('#index-check-status');
        const listContainer = container.querySelector('#puzzles-list-container');

        // PROACTIVE INDEX CHECK
        const checkQueries = [
            db.collection(PUZZLES_COLLECTION).where('status', 'in', ['available', 'locked']).orderBy('puzzleNumber', 'asc').limit(1).get(),
            db.collection(PUZZLES_COLLECTION).where('isWarmup', '==', false).orderBy('puzzleNumber', 'asc').limit(1).get()
        ];

        Promise.all(checkQueries).catch(err => {
            if (err.message && err.message.includes('index') && window.TournamentLeaderboard) {
                indexCheckContainer.innerHTML = `<div class="admin-card" style="border: 2px solid #e74c3c;">
                    <h3 style="color:#e74c3c; border-bottom-color:#e74c3c;">Database Index Missing</h3>
                    ${window.TournamentLeaderboard.formatError(err)}
                </div>`;
            }
        });

        const querySnapshot = await db.collection(PUZZLES_COLLECTION).orderBy('puzzleNumber', 'asc').get();
        const puzzles = [];
        querySnapshot.forEach(doc => puzzles.push({ id: doc.id, ...doc.data() }));

        let listHtml = `<div class="admin-list">`;

        if (puzzles.length === 0) {
            listHtml += '<div class="empty-state">No puzzles found.</div>';
        } else {
            puzzles.forEach(puzzle => {
                listHtml += `
                    <div class="list-item">
                        <div class="list-item-info">
                            <h4>#${puzzle.puzzleNumber}: ${puzzle.name} ${puzzle.isWarmup ? '<span class="warmup-tag">(Warm-up)</span>' : ''}</h4>
                            <p>Author: ${puzzle.author} | Status: <strong>${puzzle.status}</strong></p>
                        </div>
                        <div class="list-item-actions">
                            <button class="secondary-btn btn-sm edit-puzzle-btn" data-id="${puzzle.id}">Edit</button>
                            <button class="secondary-btn btn-sm btn-danger delete-puzzle-btn" data-id="${puzzle.id}">Delete</button>
                        </div>
                    </div>
                `;
            });
        }
        listContainer.innerHTML = listHtml + '</div>';

        container.querySelector('#addPuzzleBtn').onclick = () => renderPuzzleForm(container, db);
        
        container.querySelectorAll('.edit-puzzle-btn').forEach(btn => {
            btn.onclick = () => {
                const p = puzzles.find(p => p.id === btn.dataset.id);
                renderPuzzleForm(container, db, p);
            };
        });

        container.querySelectorAll('.delete-puzzle-btn').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('Delete this puzzle?')) {
                    try {
                        await db.collection(PUZZLES_COLLECTION).doc(btn.dataset.id).delete();
                        if (window.Toast) window.Toast.success('Puzzle deleted!');
                        renderPuzzlesTab(container, db);
                    } catch (err) {
                        if (window.Toast) window.Toast.error('Delete failed: ' + err.message);
                    }
                }
            };
        });
    } catch (e) { 
        container.innerHTML = `<p class="error">${e.message}</p>`; 
    }
}

async function renderPuzzleForm(container, db, puzzle = null) {
    const isEdit = !!puzzle;
    let divisions = ['default'];
    try {
        const divDoc = await db.collection(CONFIG_COLLECTION).doc('divisions').get();
        if (divDoc.exists) divisions = [...divDoc.data().list, 'default'];
    } catch (e) {}

    let html = `
        <div class="admin-card">
            <h3>${isEdit ? 'Edit' : 'Add'} Puzzle</h3>
            <form id="puzzleForm">
                <div class="form-row">
                    <div class="form-group"><label>Puzzle Name</label><input type="text" name="name" value="${puzzle?.name || ''}" required></div>
                    <div class="form-group"><label>Author</label><input type="text" name="author" value="${puzzle?.author || ''}" required></div>
                </div>
                <div class="form-row" style="margin-top:15px">
                    <div class="form-group"><label>Puzzle Number</label><input type="number" name="puzzleNumber" value="${puzzle?.puzzleNumber || 0}" required></div>
                    <div class="form-group"><label>Time Limit (s)</label><input type="number" name="timeLimitSeconds" value="${puzzle?.timeLimitSeconds || 900}" required></div>
                </div>
                <div class="form-row" style="margin-top:15px">
                    <div class="form-group">
                        <label>Status</label>
                        <select name="status">
                            <option value="available" ${puzzle?.status === 'available' ? 'selected' : ''}>Available</option>
                            <option value="locked" ${puzzle?.status === 'locked' ? 'selected' : ''}>Locked</option>
                            <option value="hidden" ${puzzle?.status === 'hidden' ? 'selected' : ''}>Hidden</option>
                        </select>
                    </div>
                    <div class="form-group" style="display:flex; align-items:center; padding-top:20px; gap:10px;">
                        <input type="checkbox" name="isWarmup" id="isWarmup" ${puzzle?.isWarmup ? 'checked' : ''}>
                        <label for="isWarmup">Warm-up</label>
                    </div>
                </div>
                <div class="form-group" style="margin-top:15px">
                    <label>Puzzle Filenames</label>
                    <div class="mapping-help">
                        Enter only the <strong>filename</strong> (e.g., <code>puzzle1.ipuz</code>).
                        Make sure the file is uploaded to the <code>tournament/puzzles/</code> folder.
                        The <strong>default</strong> filename is used for all divisions unless overridden.
                    </div>
                    <div class="division-mapping">
                        ${divisions.map(div => `
                            <div class="mapping-row ${div === 'default' ? 'default-row' : ''}">
                                <label>${div}:</label>
                                <input type="text" id="input_${div}" name="file_${div}" value="${puzzle?.filesByDivision?.[div] || (div === 'default' ? (puzzle?.filePath || puzzle?.fileName || '') : '')}" placeholder="filename.ipuz">
                                <button type="button" class="secondary-btn btn-sm check-path-btn" data-input="input_${div}">Check</button>
                            </div>
                        `).join('')}
                    </div>
                </div>
                <div class="action-row"><button type="button" id="cancelPuzzleBtn" class="secondary-btn">Cancel</button><button type="submit" class="primary-btn">${isEdit ? 'Update' : 'Create'}</button></div>
            </form>
        </div>
    `;
    container.innerHTML = html;

    container.querySelectorAll('.check-path-btn').forEach(btn => {
        btn.onclick = async () => {
            let filename = container.querySelector('#' + btn.dataset.input).value.trim();
            if (!filename) return;
            
            let path = filename;
            if (!path.startsWith('./') && !path.startsWith('../')) {
                path = './puzzles/' + filename;
            }

            btn.textContent = '...';
            try {
                const res = await fetch(path, { method: 'HEAD' });
                if (res.ok) { btn.textContent = 'Found!'; btn.className = 'secondary-btn btn-sm check-path-btn path-valid'; }
                else { btn.textContent = 'Missing'; btn.className = 'secondary-btn btn-sm check-path-btn path-invalid'; }
            } catch (e) { btn.textContent = 'Error'; btn.className = 'secondary-btn btn-sm check-path-btn path-invalid'; }
        };
    });

    container.querySelector('#cancelPuzzleBtn').onclick = () => renderPuzzlesTab(container, db);
    
    container.querySelector('#puzzleForm').onsubmit = async (e) => {
        e.preventDefault();
        const fd = new FormData(e.target);
        const files = {};
        divisions.forEach(d => { const v = fd.get(`file_${d}`); if (v) files[d] = v; });
        
        const data = {
            name: fd.get('name'), 
            author: fd.get('author'), 
            puzzleNumber: parseInt(fd.get('puzzleNumber')),
            timeLimitSeconds: parseInt(fd.get('timeLimitSeconds')), 
            status: fd.get('status'), 
            isWarmup: fd.get('isWarmup') === 'on',
            filesByDivision: files, 
            filePath: files.default || Object.values(files)[0] || '', 
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };

        try {
            if (isEdit) await db.collection(PUZZLES_COLLECTION).doc(puzzle.id).update(data);
            else await db.collection(PUZZLES_COLLECTION).add({ ...data, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
            if (window.Toast) window.Toast.success(isEdit ? 'Puzzle updated!' : 'Puzzle created!');
            renderPuzzlesTab(container, db);
        } catch (err) {
            if (window.Toast) window.Toast.error('Save failed: ' + err.message);
        }
    };
}
