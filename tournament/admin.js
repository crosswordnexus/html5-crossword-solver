/**
 * Tournament Admin Dashboard
 * Handles puzzle management, participant authorization (CSV), scoring, and results.
 */

import { 
    SOLVERS_COLLECTION, PUZZLES_COLLECTION, CONFIG_COLLECTION, 
    SCORES_COLLECTION, ADMINS_COLLECTION, PARTICIPANTS_COLLECTION 
} from './js/modules/Constants.js';
import { renderDivisionsTab } from './js/modules/DivisionsTab.js';
import { renderSettingsTab } from './js/modules/SettingsTab.js';
import { renderResultsTab } from './js/modules/ResultsTab.js';
import { renderParticipantsTab } from './js/modules/ParticipantsTab.js';
import { renderPuzzlesTab } from './js/modules/PuzzlesTab.js';
import { renderLeaderboardTab } from './js/modules/LeaderboardTab.js';

let db;
let auth;
let currentTab = localStorage.getItem('adminCurrentTab') || 'puzzles';

const adminContent = document.getElementById('admin-content');
const loginDiv = document.getElementById('admin-login');
const appDiv = document.getElementById('admin-app');

/**
 * Initialization: Connects to Firebase and sets up the Admin authorization listener.
 */
document.addEventListener('DOMContentLoaded', () => {
    if (typeof firebase !== 'undefined') {
        db = firebase.firestore();
        auth = firebase.auth();
        
        auth.onAuthStateChanged(async (user) => {
            if (user && !user.isAnonymous) {
                try {
                    // Check if this Google user is in the 'admins' collection
                    const adminDoc = await db.collection(ADMINS_COLLECTION).doc(user.email.toLowerCase()).get();
                    if (adminDoc.exists) {
                        loginDiv.style.display = 'none';
                        appDiv.style.display = 'block';
                        initTabs();
                        loadTab(currentTab);
                    } else {
                        showLoginError(`Account ${user.email} is not authorized for Admin access.`);
                        await auth.signOut();
                    }
                } catch (e) {
                    showLoginError("Error checking authorization. Ensure your Security Rules are applied.");
                    await auth.signOut();
                }
            } else {
                appDiv.style.display = 'none';
                loginDiv.style.display = 'block';
                initLoginForm();
            }
        });
    } else {
        adminContent.innerHTML = '<p class="error">Firebase SDK not loaded.</p>';
    }
});

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

function initTabs() {
    const nav = document.querySelector('.admin-nav');
    const newNav = nav.cloneNode(true);
    nav.parentNode.replaceChild(newNav, nav);

    document.querySelectorAll('.tab-btn').forEach(btn => {
        if (btn.dataset.tab === currentTab) btn.classList.add('active');
        else btn.classList.remove('active');

        btn.addEventListener('click', () => {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentTab = btn.dataset.tab;
            localStorage.setItem('adminCurrentTab', currentTab);
            loadTab(currentTab);
        });
    });

    const signOutBtn = document.getElementById('adminSignOutBtn');
    if (signOutBtn) {
        signOutBtn.onclick = async () => {
            if (confirm('Sign out of admin dashboard?')) await auth.signOut();
        };
    }
}

async function loadTab(tab) {
    adminContent.innerHTML = '<div class="loading">Loading section...</div>';
    switch (tab) {
        case 'puzzles': renderPuzzlesTab(adminContent, db); break;
        case 'leaderboard': renderLeaderboardTab(adminContent, db); break;
        case 'participants': renderParticipantsTab(adminContent, db); break;
        case 'divisions': renderDivisionsTab(adminContent, db); break;
        case 'settings': renderSettingsTab(adminContent, db); break;
        case 'results': renderResultsTab(adminContent, db); break;
    }
}
