import { CONFIG_COLLECTION } from './Constants.js';

/**
 * Renders the Settings management tab.
 * @param {HTMLElement} container - The container to render into.
 * @param {firebase.firestore.Firestore} db - The Firestore database instance.
 */
export async function renderSettingsTab(container, db) {
    try {
        const metaDoc = await db.collection(CONFIG_COLLECTION).doc('metadata').get();
        const metadata = metaDoc.exists ? metaDoc.data() : { tournamentName: 'Crossword Tournament', color_selected: '#FF4136', color_word: '#FEE300' };
        
        const scoreDoc = await db.collection(CONFIG_COLLECTION).doc('scoring').get();
        const rules = scoreDoc.exists ? scoreDoc.data() : { 
            pointsPerWord: 10, 
            timeBonusPerSecond: 1, 
            completionBonus: 180, 
            overtimePenaltyPer4Seconds: 1, 
            minCorrectPercentageForTimeBonus: 0.5 
        };

        let html = `
            <div class="admin-card">
                <h3>Tournament Branding</h3>
                <form id="metadataForm">
                    <div class="form-group">
                        <label>Tournament Name</label>
                        <input type="text" name="tournamentName" value="${metadata.tournamentName}">
                    </div>
                    <div class="form-row" style="margin-top:15px">
                        <div class="form-group">
                            <label>Primary Color (Selection)</label>
                            <div style="display:flex; gap:10px; align-items:center;">
                                <input type="color" name="color_selected" value="${metadata.color_selected || '#FF4136'}" style="width:50px; height:35px; padding:2px;">
                                <input type="text" value="${metadata.color_selected || '#FF4136'}" readonly style="flex-grow:1; background:#f9f9f9;">
                            </div>
                        </div>
                        <div class="form-group">
                            <label>Secondary Color (Highlight)</label>
                            <div style="display:flex; gap:10px; align-items:center;">
                                <input type="color" name="color_word" value="${metadata.color_word || '#FEE300'}" style="width:50px; height:35px; padding:2px;">
                                <input type="text" value="${metadata.color_word || '#FEE300'}" readonly style="flex-grow:1; background:#f9f9f9;">
                            </div>
                        </div>
                    </div>
                    <div class="action-row"><button type="submit" class="primary-btn btn-success">Save Branding</button></div>
                </form>
            </div>
            <div class="admin-card">
                <h3>Scoring Rules</h3>
                <form id="scoringForm">
                    <div class="form-row">
                        <div class="form-group">
                            <label>
                                Points Per Word
                                <span class="tooltip-container">
                                    <span class="tooltip-icon">i</span>
                                    <span class="tooltip-text">Base points awarded for each correct word in the puzzle.</span>
                                </span>
                            </label>
                            <input type="number" name="pointsPerWord" value="${rules.pointsPerWord}">
                        </div>
                        <div class="form-group">
                            <label>
                                Completion Bonus
                                <span class="tooltip-container">
                                    <span class="tooltip-icon">i</span>
                                    <span class="tooltip-text">Flat bonus score awarded only if the puzzle grid is 100% correct.</span>
                                </span>
                            </label>
                            <input type="number" name="completionBonus" value="${rules.completionBonus}">
                        </div>
                    </div>
                    <div class="form-row" style="margin-top:15px">
                        <div class="form-group">
                            <label>
                                Time Bonus (pts/sec)
                                <span class="tooltip-container">
                                    <span class="tooltip-icon">i</span>
                                    <span class="tooltip-text">Bonus points awarded per second remaining under the limit. Only awarded for 100% correct puzzles.</span>
                                </span>
                            </label>
                            <input type="number" name="timeBonusPerSecond" value="${rules.timeBonusPerSecond}">
                        </div>
                        <div class="form-group">
                            <label>
                                Overtime Penalty
                                <span class="tooltip-container">
                                    <span class="tooltip-icon">i</span>
                                    <span class="tooltip-text">Points deducted for every 4 seconds that a solver exceeds the puzzle's time limit.</span>
                                </span>
                            </label>
                            <input type="number" name="overtimePenaltyPer4Seconds" value="${rules.overtimePenaltyPer4Seconds}">
                        </div>
                    </div>
                    <div class="form-group" style="margin-top:15px">
                        <label>
                            Min Accuracy for Time Bonus
                            <span class="tooltip-container">
                                <span class="tooltip-icon">i</span>
                                <span class="tooltip-text">The minimum accuracy ratio (e.g., 0.5 is 50%, 1.0 is 100%) required to qualify for any time bonus.</span>
                            </span>
                        </label>
                        <input type="number" step="0.1" name="minCorrectPercentageForTimeBonus" value="${rules.minCorrectPercentageForTimeBonus}">
                    </div>
                    <div class="action-row"><button type="submit" class="primary-btn btn-success">Save Rules</button></div>
                </form>
            </div>
        `;
        
        container.innerHTML = html;

        container.querySelector('#metadataForm').onsubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            try {
                await db.collection(CONFIG_COLLECTION).doc('metadata').set({ 
                    tournamentName: fd.get('tournamentName'),
                    color_selected: fd.get('color_selected'),
                    color_word: fd.get('color_word')
                });
                if (window.Toast) window.Toast.success('Branding updated!');
            } catch (err) {
                if (window.Toast) window.Toast.error('Update failed: ' + err.message);
            }
        };

        container.querySelector('#scoringForm').onsubmit = async (e) => {
            e.preventDefault();
            const fd = new FormData(e.target);
            try {
                await db.collection(CONFIG_COLLECTION).doc('scoring').set({
                    pointsPerWord: parseInt(fd.get('pointsPerWord')), 
                    completionBonus: parseInt(fd.get('completionBonus')),
                    timeBonusPerSecond: parseInt(fd.get('timeBonusPerSecond')), 
                    overtimePenaltyPer4Seconds: parseInt(fd.get('overtimePenaltyPer4Seconds')),
                    minCorrectPercentageForTimeBonus: parseFloat(fd.get('minCorrectPercentageForTimeBonus'))
                });
                if (window.Toast) window.Toast.success('Scoring rules updated!');
            } catch (err) {
                if (window.Toast) window.Toast.error('Update failed: ' + err.message);
            }
        };
    } catch (e) { 
        container.innerHTML = `<p class="error">${e.message}</p>`; 
    }
}
