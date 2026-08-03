import { CONFIG_COLLECTION } from './Constants.js';

/**
 * Renders the Divisions management tab.
 * @param {HTMLElement} container - The container to render into.
 * @param {firebase.firestore.Firestore} db - The Firestore database instance.
 */
export async function renderDivisionsTab(container, db) {
    try {
        const doc = await db.collection(CONFIG_COLLECTION).doc('divisions').get();
        let list = doc.exists ? doc.data().list : ['Easier', 'Harder', 'Pairs'];

        function updateUI() {
            let html = `
                <div class="admin-card">
                    <h3>Manage Divisions</h3>
                    <p style="font-size: 0.9em; color: #666; margin-bottom: 15px;">
                        Changes here will only take effect once you click <strong>Save Changes</strong>.
                    </p>
                    <div id="divisionList" class="admin-list" style="box-shadow:none; border:1px solid #eee">
                    ${list.map((div, index) => `
                        <div class="list-item" style="gap: 10px;">
                            <input type="text" class="edit-division-input" data-index="${index}" value="${div}" style="flex-grow: 1; padding: 5px 10px; border: 1px solid #ddd; border-radius: 4px;">
                            <button class="secondary-btn btn-sm btn-danger remove-div-btn" data-index="${index}">Remove</button>
                        </div>`).join('')}
                    </div>
                    <div class="form-group" style="margin-top:20px; display:flex; gap:10px;">
                        <input type="text" id="newDivisionName" placeholder="New division name">
                        <button id="addDivisionBtn" class="primary-btn">Add</button>
                    </div>
                    <div class="action-row">
                        <button id="saveDivisionsBtn" class="primary-btn btn-success">Save Changes</button>
                    </div>
                </div>`;

            container.innerHTML = html;

            // Sync input changes back to our local list
            container.querySelectorAll('.edit-division-input').forEach(input => {
                input.onchange = (e) => {
                    list[parseInt(e.target.dataset.index)] = e.target.value.trim();
                };
            });

            container.querySelector('#addDivisionBtn').onclick = () => {
                const n = container.querySelector('#newDivisionName').value.trim();
                if (n && !list.includes(n)) { 
                    list.push(n); 
                    updateUI(); 
                } else if (!n) {
                    if (window.Toast) window.Toast.error('Please enter a name.');
                    else alert('Please enter a name.');
                } else {
                    if (window.Toast) window.Toast.error('Division already exists.');
                    else alert('Division already exists.');
                }
            };

            container.querySelectorAll('.remove-div-btn').forEach(btn => {
                btn.onclick = () => { 
                    list.splice(parseInt(btn.dataset.index), 1); 
                    updateUI(); 
                };
            });

            container.querySelector('#saveDivisionsBtn').onclick = async () => {
                // Remove empty strings if any
                const cleanList = list.map(d => d.trim()).filter(d => d !== '');
                try {
                    await db.collection(CONFIG_COLLECTION).doc('divisions').set({ list: cleanList });
                    if (window.Toast) window.Toast.success('Divisions saved!');
                    renderDivisionsTab(container, db); // Refresh from DB
                } catch (e) {
                    console.error("Error saving divisions:", e);
                    if (window.Toast) window.Toast.error('Error saving: ' + e.message);
                }
            };
        }

        updateUI();
    } catch (e) { 
        container.innerHTML = `<p class="error">${e.message}</p>`; 
    }
}
