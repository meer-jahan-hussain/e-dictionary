







// 🔥 FIREBASE IMPORTS
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, deleteDoc, doc, updateDoc } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

// 🔥 FIREBASE CONFIG (APNA LAGAO)
const firebaseConfig = {
    apiKey: "AIzaSyC74k6gzZV3skrKpKnXYq5JWX2IEJ3BT80",
  authDomain: "edictionary-7ee43.firebaseapp.com",
  projectId: "edictionary-7ee43",
};


// INIT
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// --------------------------------------------

document.addEventListener('DOMContentLoaded', () => {

    // ---- DOM Elements ----
    const wordGrid = document.getElementById('wordGrid');
    const searchInput = document.getElementById('searchInput');
    const themeToggle = document.getElementById('themeToggle');
    const fabAddWord = document.getElementById('fabAddWord');
    const toastContainer = document.getElementById('toastContainer');

    const passwordModal = document.getElementById('passwordModal');
    const closePasswordModal = document.getElementById('closePasswordModal');
    const passwordForm = document.getElementById('passwordForm');
    const passwordInput = document.getElementById('passwordInput');
    const passwordError = document.getElementById('passwordError');
    const passwordActionText = document.getElementById('passwordActionText');

    const wordModal = document.getElementById('wordModal');
    const closeWordModal = document.getElementById('closeWordModal');
    const wordForm = document.getElementById('wordForm');
    const wordInput = document.getElementById('wordInput');
    const meaningInput = document.getElementById('meaningInput');
    const wordModalTitle = document.getElementById('wordModalTitle');

    // ---- STATE ----
    let dictionary = [];
    let currentAction = null; // 'add', 'edit', 'delete'
    let currentEditId = null; // ID of word being edited or deleted
 // Constant Password
    const SECRET_PASSWORD = 'meer@2012';

    // 🔥 REALTIME SYNC (IMPORTANT)
    onSnapshot(collection(db, "dictionary"), (snapshot) => {
        dictionary = [];
        snapshot.forEach(docSnap => {
            dictionary.push({
                id: docSnap.id,
                ...docSnap.data()
            });
        });
        renderDictionary(searchInput.value);
    });

    // ---- INIT ----
    initTheme();

    // ---- EVENTS ----
    themeToggle.addEventListener('click', toggleTheme);
    searchInput.addEventListener('input', (e) => renderDictionary(e.target.value));

    fabAddWord.addEventListener('click', () => {
        currentAction = 'add';
        currentEditId = null;
        openPasswordModal('add a new word');
    });

    closePasswordModal.addEventListener('click', closeModals);
    closeWordModal.addEventListener('click', closeModals);

    window.addEventListener('click', (e) => {
        if (e.target === passwordModal) closeModals();
        if (e.target === wordModal) closeModals();
    });

    //     // Password Form Submit
    passwordForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredPassword = passwordInput.value;
        
        if (enteredPassword === SECRET_PASSWORD) {
            passwordError.style.display = 'none';
            closeModals();
            
            if (currentAction === 'add') {
                openWordModal('Add Word & Meaning', '', '');
            } else if (currentAction === 'edit') {
                const wordObj = dictionary.find(w => w.id === currentEditId);
                if (wordObj) {
                    openWordModal('Edit Word & Meaning', wordObj.word, wordObj.meaning);
                }
            } else if (currentAction === 'delete') {
                executeDelete(currentEditId);
            }
        } else {
            passwordError.textContent = 'Incorrect password. Please try again.';
            passwordError.style.display = 'block';
            showToast('Authentication failed', 'error');
        }
        passwordInput.value = '';
    });

    // ADD / EDIT
     wordForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const word = wordInput.value.trim();
        const meaning = meaningInput.value.trim();

        if (!word || !meaning) {
            showToast('Word and meaning are required', 'error');
            return;
            }

        const isDuplicate = dictionary.some(
            w => w.word.toLowerCase() === word.toLowerCase() && w.id !== currentEditId
        );

        if (isDuplicate) {
            showToast(`The word "${word}" already exists.`, 'error');
            return;
        }

        if (currentAction === 'add') {
    // Add to Firestore
    addDoc(collection(db, "dictionary"), {
        word: word,
        meaning: meaning
    })
    .then(() => {
        showToast('Word added successfully', 'success');
    })
    .catch((err) => {
        showToast('Error adding word: ' + err.message, 'error');
    });
} else if (currentAction === 'edit') {
    // Update in Firestore
    const docRef = doc(db, "dictionary", currentEditId);
    updateDoc(docRef, {
        word: word,
        meaning: meaning
    })
    .then(() => {
        showToast('Word updated successfully', 'success');
    })
    .catch((err) => {
        showToast('Error updating word: ' + err.message, 'error');
    });
}

closeModals();
    });

 // ---- Functions ----

    function initTheme() {
        const savedTheme = localStorage.getItem('eDictTheme');
        const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
            document.documentElement.setAttribute('data-theme', 'dark');
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        }
    }

    function toggleTheme() {
        if (document.documentElement.getAttribute('data-theme') === 'dark') {
            document.documentElement.removeAttribute('data-theme');
            localStorage.setItem('eDictTheme', 'light');
            themeToggle.innerHTML = '<i class="fa-solid fa-moon"></i>';
        } else {
            document.documentElement.setAttribute('data-theme', 'dark');
            localStorage.setItem('eDictTheme', 'dark');
            themeToggle.innerHTML = '<i class="fa-solid fa-sun"></i>';
        }
    }

    function renderDictionary(filterText = '') {
        wordGrid.innerHTML = '';
        const lowerFilter = filterText.toLowerCase();
        
        // Filter case-insensitive, then Sort alphabetically case-insensitive
        const filteredSortedDict = dictionary
            .filter(w => w.word.toLowerCase().includes(lowerFilter))
            .sort((a, b) => a.word.toLowerCase().localeCompare(b.word.toLowerCase()));

        if (filteredSortedDict.length === 0) {
            wordGrid.innerHTML = `
                <div class="empty-state">
                    <i class="fa-solid fa-folder-open"></i>
                    <p>${filterText ? 'No words found matching "' + filterText + '"' : 'The dictionary is empty. Add a word to get started!'}</p>
                </div>
            `;
            return;
        }

        filteredSortedDict.forEach(item => {
            const card = document.createElement('div');
            card.className = 'word-card';
            
            // Highlight search term
            const displayWord = highlightText(item.word, filterText);
            
            card.innerHTML = `
                <div class="word-header">
                    <div class="word-title">${displayWord}</div>
                </div>
                <div class="word-meaning">${escapeHTML(item.meaning)}</div>
                <div class="word-actions">
                    <button class="icon-btn edit-btn" aria-label="Edit" data-id="${item.id}" title="Edit word">
                        <i class="fa-solid fa-pen"></i>
                    </button>
                    <button class="icon-btn delete-btn" aria-label="Delete" data-id="${item.id}" title="Delete word">
                        <i class="fa-solid fa-trash-can"></i>
                    </button>
                </div>
            `;
            wordGrid.appendChild(card);
        });

        // Attach listeners to new buttons
        document.querySelectorAll('.edit-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentAction = 'edit';
                currentEditId = e.currentTarget.getAttribute('data-id');
                openPasswordModal('edit this word');
            });
        });

        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                currentAction = 'delete';
                currentEditId = e.currentTarget.getAttribute('data-id');
                openPasswordModal('delete this word');
            });
        });
    }

    function highlightText(text, filter) {
        if (!filter) return escapeHTML(text);
        const regex = new RegExp(`(${escapeRegExp(filter)})`, 'gi');
        // Prevent XSS while highlighting by carefully escaping
        const escapedParts = text.split(regex).map((part, i) => {
            if (i % 2 === 1) { // Matched part
                return `<mark style="background-color: rgba(16, 185, 129, 0.3); color: inherit; padding: 0 2px; border-radius: 3px;">${escapeHTML(part)}</mark>`;
            }
            return escapeHTML(part);
        });
        return escapedParts.join('');
    }

 function executeDelete(id) {
    const docRef = doc(db, "dictionary", id);
    deleteDoc(docRef)
    .then(() => {
        showToast('Word deleted successfully', 'success');
    })
    .catch((err) => {
        showToast('Error deleting word: ' + err.message, 'error');
    });
}

    function openPasswordModal(actionText) {
        passwordActionText.textContent = actionText;
        passwordInput.value = '';
        passwordError.style.display = 'none';
        
        passwordModal.classList.add('show');
        setTimeout(() => passwordInput.focus(), 100);
    }

    function openWordModal(title, wordVal, meaningVal) {
        wordModalTitle.innerHTML = `<i class="fa-solid fa-pen-to-square"></i> ${title}`;
        wordInput.value = wordVal;
        meaningInput.value = meaningVal;
        
        wordModal.classList.add('show');
        setTimeout(() => wordInput.focus(), 100);
    }

    function closeModals() {
        passwordModal.classList.remove('show');
        wordModal.classList.remove('show');
    }

   

    function showToast(message, type = 'success') {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icon = type === 'success' ? 'fa-circle-check' : 'fa-circle-exclamation';
        
        toast.innerHTML = `
            <div class="toast-icon">
                <i class="fa-solid ${icon}"></i>
            </div>
            <div class="toast-message">${escapeHTML(message)}</div>
        `;
        
        toastContainer.appendChild(toast);
        
        setTimeout(() => {
            if (toastContainer.contains(toast)) {
                toastContainer.removeChild(toast);
            }
        }, 3000);
    }

    // UTILS
    function escapeHTML(str) {
        return str.replace(/[&<>'"]/g, 
            tag => ({
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                "'": '&#39;',
                '"': '&quot;'
            }[tag] || tag)
        );
    }

    function escapeRegExp(string) {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
});
