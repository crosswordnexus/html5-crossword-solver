import { PARTICIPANTS_COLLECTION, CONFIG_COLLECTION, SOLVERS_COLLECTION, SCORES_COLLECTION } from './Constants.js';

/**
 * Renders the Participants management tab.
 * @param {HTMLElement} container - The container to render into.
 * @param {firebase.firestore.Firestore} db - The Firestore database instance.
 */
export async function renderParticipantsTab(container, db) {
    try {
        const querySnapshot = await db.collection(PARTICIPANTS_COLLECTION).orderBy('email', 'asc').limit(250).get();
        const participants = [];
        querySnapshot.forEach(doc => participants.push({ id: doc.id, ...doc.data() }));

        const divDoc = await db.collection(CONFIG_COLLECTION).doc('divisions').get();
        const divisions = divDoc.exists ? divDoc.data().list : ['Easier', 'Harder', 'Pairs'];

        let html = `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div class="admin-card" style="margin-bottom: 0;">
                    <h3>Authorize Participants (CSV)</h3>
                    <p>Upload a CSV file with columns: <code>email, division</code></p>
                    <div class="form-group">
                        <input type="file" id="csvFileInput" accept=".csv" style="margin-bottom:10px">
                        <button id="uploadCsvBtn" class="primary-btn">Process CSV & Authorize</button>
                    </div>
                    <div id="uploadStatus" style="font-size:0.9em; margin-top:10px"></div>
                </div>

                <div class="admin-card" style="margin-bottom: 0;">
                    <h3>Manual Add</h3>
                    <p>Add a single participant by email.</p>
                    <div class="form-group">
                        <label>Email Address</label>
                        <input type="email" id="manualEmail" placeholder="user@example.com" style="margin-bottom:10px">
                    </div>
                    <div class="form-group">
                        <label>Division</label>
                        <select id="manualDivision" style="margin-bottom:10px">
                            ${divisions.map(d => `<option value="${d}">${d}</option>`).join('')}
                        </select>
                    </div>
                    <button id="manualAddBtn" class="primary-btn">Add Participant</button>
                </div>
            </div>

            <div class="admin-section-header">
                <h2>Authorized Participants (${participants.length})</h2>
            </div>
        `;

        container.innerHTML = html + `
            <div class="admin-card" style="padding:0">
                <table class="results-table">
                    <thead><tr><th>Email</th><th>Division</th><th>Status</th><th>Actions</th></tr></thead>
                    <tbody>
        ` + (participants.length === 0 ? '<tr><td colspan="4" class="empty-state">No participants authorized.</td></tr>' : 
            participants.map(p => {
                const isLinked = !!p.uid;
                return `
                    <tr>
                        <td><strong>${p.email}</strong></td>
                        <td>
                            <select class="change-division-select" data-email="${p.email}">
                                ${divisions.map(d => `<option value="${d}" ${p.division === d ? 'selected' : ''}>${d}</option>`).join('')}
                            </select>
                        </td>
                        <td>
                            <span class="status-tag" style="background-color:${isLinked ? '#2ecc71' : '#95a5a6'}">
                                ${isLinked ? 'Linked (' + (p.name || 'No Name') + ')' : 'Pending Login'}
                            </span>
                        </td>
                        <td><button class="secondary-btn btn-sm btn-danger delete-participant-btn" data-email="${p.email}">Remove</button></td>
                    </tr>
                `;
            }).join('')) + `</tbody></table></div>`;

        // Manual Add logic
        container.querySelector('#manualAddBtn').onclick = async () => {
            const email = container.querySelector('#manualEmail').value.trim().toLowerCase();
            const division = container.querySelector('#manualDivision').value;
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

            if (!email || !emailRegex.test(email)) {
                if (window.Toast) window.Toast.error('Please enter a valid email.');
                return;
            }
            
            try {
                await db.collection(PARTICIPANTS_COLLECTION).doc(email).set({
                    email, division, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }, { merge: true });
                if (window.Toast) window.Toast.success('Participant added!');
                renderParticipantsTab(container, db);
            } catch (e) { 
                if (window.Toast) window.Toast.error('Error: ' + e.message);
            }
        };

        container.querySelector('#uploadCsvBtn').onclick = () => {
            const fileInput = container.querySelector('#csvFileInput');
            const statusDiv = container.querySelector('#uploadStatus');
            if (!fileInput.files.length) {
                if (window.Toast) window.Toast.error('Select a CSV file.');
                return;
            }
            
            const reader = new FileReader();
            reader.onload = async (e) => {
                const rows = e.target.result.split('\n').map(r => r.split(',').map(c => c.trim()));
                const batch = db.batch();
                let count = 0;
                let skippedEmails = 0;
                let invalidDivisions = [];
                
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

                for (let i = 0; i < rows.length; i++) {
                    let [email, div] = rows[i];
                    if (!email) continue;

                    // 1. Validate Email
                    if (!emailRegex.test(email)) {
                        if (!email.toLowerCase().includes('email')) skippedEmails++;
                        continue;
                    }

                    // 2. Validate Division
                    const officialDiv = divisions.find(d => d.toLowerCase() === (div || '').toLowerCase());
                    
                    if (officialDiv) {
                        const ref = db.collection(PARTICIPANTS_COLLECTION).doc(email.toLowerCase());
                        batch.set(ref, { 
                            email: email.toLowerCase(), 
                            division: officialDiv,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        }, { merge: true });
                        count++;
                    } else {
                        invalidDivisions.push(`Row ${i+1}: "${div}" is not a valid division for ${email}`);
                    }
                }
                
                if (count > 0 || invalidDivisions.length > 0) {
                    let statusHtml = '';
                    if (count > 0) {
                        try {
                            await batch.commit();
                            statusHtml += `<div style="color:#27ae60; font-weight:bold;">Authorized ${count} users successfully.</div>`;
                        } catch (err) {
                            statusHtml += `<div style="color:#e74c3c;">Batch error: ${err.message}</div>`;
                        }
                    }
                    if (skippedEmails > 0) {
                        statusHtml += `<div style="color:#7f8c8d;">Skipped ${skippedEmails} non-email rows (headers/empty).</div>`;
                    }
                    if (invalidDivisions.length > 0) {
                        statusHtml += `<div style="color:#e74c3c; margin-top:10px;"><strong>Errors (${invalidDivisions.length}):</strong><br>` + 
                                      `<ul style="max-height:100px; overflow-y:auto; margin:5px 0; padding-left:20px;">` + 
                                      invalidDivisions.map(err => `<li>${err}</li>`).join('') + 
                                      `</ul></div>`;
                    }
                    statusDiv.innerHTML = statusHtml;
                    if (count > 0) setTimeout(() => renderParticipantsTab(container, db), 5000);
                } else {
                    statusDiv.innerHTML = `<span style="color:#e74c3c">No valid data found in file.</span>`;
                }
            };
            reader.readAsText(fileInput.files[0]);
        };

        container.querySelectorAll('.change-division-select').forEach(sel => {
            sel.onchange = async (e) => {
                const email = e.target.dataset.email;
                const newDiv = e.target.value;
                try {
                    // 1. Update the participant's whitelist record
                    await db.collection(PARTICIPANTS_COLLECTION).doc(email).update({ division: newDiv });
                    
                    // 2. Update the solver's profile and scores (if they have logged in)
                    const solverSnap = await db.collection(SOLVERS_COLLECTION).where('email', '==', email).get();
                    if (!solverSnap.empty) {
                        const b = db.batch();
                        let uid = null;
                        
                        solverSnap.forEach(d => {
                            uid = d.id;
                            b.update(d.ref, { division: newDiv });
                        });

                        // 3. Migrate all existing scores for this solver
                        if (uid) {
                            const scoresSnap = await db.collection(SCORES_COLLECTION).where('uid', '==', uid).get();
                            scoresSnap.forEach(sDoc => {
                                b.update(sDoc.ref, { division: newDiv });
                            });
                        }
                        
                        await b.commit();
                        if (window.Toast) window.Toast.success('Division and previous scores updated!');
                    } else {
                        if (window.Toast) window.Toast.success('Participant division updated!');
                    }
                } catch (err) {
                    console.error("Division update failed:", err);
                    if (window.Toast) window.Toast.error('Update failed: ' + err.message);
                }
            };
        });

        container.querySelectorAll('.delete-participant-btn').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('Remove ' + btn.dataset.email + '?')) {
                    try {
                        await db.collection(PARTICIPANTS_COLLECTION).doc(btn.dataset.email).delete();
                        if (window.Toast) window.Toast.success('Participant removed!');
                        renderParticipantsTab(container, db);
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
