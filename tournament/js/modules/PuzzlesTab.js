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
                            <button class="secondary-btn btn-sm preview-puzzle-btn" data-id="${puzzle.id}">Preview</button>
                            <button class="secondary-btn btn-sm edit-puzzle-btn" data-id="${puzzle.id}">Edit</button>
                            <button class="secondary-btn btn-sm btn-danger delete-puzzle-btn" data-id="${puzzle.id}">Delete</button>
                        </div>
                    </div>
                `;
            });
        }
        listContainer.innerHTML = listHtml + '</div>';

        container.querySelector('#addPuzzleBtn').onclick = () => renderPuzzleForm(container, db);
        
        container.querySelectorAll('.preview-puzzle-btn').forEach(btn => {
            btn.onclick = () => {
                const p = puzzles.find(p => p.id === btn.dataset.id);
                if (p) previewPuzzle(p);
            };
        });

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

/**
 * Opens a puzzle in the vanilla solver (index.html).
 * @param {object} puzzle - The puzzle document data.
 */
function previewPuzzle(puzzle) {
    const files = getPuzzleFiles(puzzle);
    if (files.length === 0) {
        if (window.Toast) window.Toast.error('No puzzle file configured for this puzzle.');
        else alert('No puzzle file configured for this puzzle.');
        return;
    }

    const uniqueFilenames = [...new Set(files.map(f => f.filename))];
    if (uniqueFilenames.length === 1) {
        openPuzzlePreview(uniqueFilenames[0]);
    } else {
        showDivisionPreviewModal(puzzle, files);
    }
}

/**
 * Extracts all configured files from a puzzle object.
 * @param {object} puzzle - The puzzle data.
 * @returns {Array<{division: string, filename: string}>}
 */
function getPuzzleFiles(puzzle) {
    const files = [];
    if (puzzle.filesByDivision && typeof puzzle.filesByDivision === 'object') {
        for (const [div, file] of Object.entries(puzzle.filesByDivision)) {
            if (file && typeof file === 'string' && file.trim()) {
                files.push({ division: div, filename: file.trim() });
            }
        }
    }
    const fallback = (puzzle.filePath || puzzle.fileName || puzzle.filename || '').trim();
    if (files.length === 0 && fallback) {
        files.push({ division: 'default', filename: fallback });
    } else if (fallback && !files.some(f => f.filename === fallback)) {
        if (!files.some(f => f.division === 'default')) {
            files.unshift({ division: 'default', filename: fallback });
        }
    }
    return files;
}

/**
 * Builds the URL and opens the puzzle in the vanilla solver in a new tab.
 * @param {string} filename - The puzzle filename or path.
 */
function openPuzzlePreview(filename) {
    let puzzleParam;
    if (filename.startsWith('http://') || filename.startsWith('https://')) {
        puzzleParam = filename;
    } else {
        let clean = filename.replace(/^\.?\/+/, '');
        if (clean.startsWith('tournament/puzzles/')) {
            puzzleParam = clean;
        } else if (clean.startsWith('puzzles/')) {
            puzzleParam = 'tournament/' + clean;
        } else {
            puzzleParam = 'tournament/puzzles/' + clean;
        }
    }

    const solverUrl = new URL('../index.html', window.location.href);
    solverUrl.searchParams.set('puzzle', puzzleParam);
    window.open(solverUrl.toString(), '_blank');
}

/**
 * Shows a modal to select which division puzzle to preview when multiple exist.
 * @param {object} puzzle - The puzzle data.
 * @param {Array<{division: string, filename: string}>} files - The list of division files.
 */
function showDivisionPreviewModal(puzzle, files) {
    const modalOverlay = document.createElement('div');
    modalOverlay.className = 'modal-overlay';
    modalOverlay.innerHTML = `
        <div class="edit-score-modal" style="max-width: 450px;">
            <h3>Preview: ${puzzle.name || ('Puzzle #' + puzzle.puzzleNumber)}</h3>
            <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">
                This puzzle has different files for different divisions. Select which version to preview in the vanilla solver:
            </p>
            <div style="display: flex; flex-direction: column; gap: 10px; margin-bottom: 20px;">
                ${files.map(f => `
                    <button type="button" class="secondary-btn preview-div-choice-btn" data-file="${f.filename}" style="display: flex; justify-content: space-between; align-items: center; padding: 10px 15px; text-align: left;">
                        <span><strong>${f.division}</strong></span>
                        <span style="font-size: 0.85em; color: #7f8c8d;">${f.filename}</span>
                    </button>
                `).join('')}
            </div>
            <div class="modal-footer" style="justify-content: flex-end;">
                <button type="button" class="secondary-btn close-preview-btn">Cancel</button>
            </div>
        </div>
    `;
    document.body.appendChild(modalOverlay);

    const close = () => {
        if (modalOverlay.parentNode) {
            modalOverlay.parentNode.removeChild(modalOverlay);
        }
    };

    modalOverlay.querySelector('.close-preview-btn').onclick = close;
    modalOverlay.onclick = (e) => {
        if (e.target === modalOverlay) close();
    };

    modalOverlay.querySelectorAll('.preview-div-choice-btn').forEach(btn => {
        btn.onclick = () => {
            close();
            openPuzzlePreview(btn.dataset.file);
        };
    });
}

