// Global Variables
let currentFlashcardIndex = 0;
let flashcards = [];
let quizData = [];
let currentQuizIndex = 0;
let quizScore = 0;
let diaryAutoSave;

// Access Control
const ACCESS_CODE = '203040';

// Initialize App
window.onload = function() {
    // Set theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'light';
    document.body.className = savedTheme;
    updateThemeIcon();
    
    // Initialize data
    initializeFlashcards();
    initializeQuizData();
    loadNotes();
    loadDiary();
    
    // Check if user was previously authenticated
    const isAuthenticated = sessionStorage.getItem('healhub_authenticated');
    if (isAuthenticated) {
        showDashboard();
    }
};

// Theme Toggle Functions
function toggleTheme() {
    const currentTheme = document.body.classList.contains('dark') ? 'light' : 'dark';
    document.body.className = currentTheme;
    localStorage.setItem('theme', currentTheme);
    updateThemeIcon();
}

function updateThemeIcon() {
    const themeIcon = document.getElementById('theme-icon');
    const isDark = document.body.classList.contains('dark');
    themeIcon.textContent = isDark ? '☀️' : '🌙';
}

// Access Control Functions
function checkAccess() {
    const inputCode = document.getElementById('access-code').value;
    const errorMsg = document.getElementById('error-msg');
    
    if (inputCode === ACCESS_CODE) {
        sessionStorage.setItem('healhub_authenticated', 'true');
        showDashboard();
    } else {
        errorMsg.classList.remove('error-hidden');
        document.getElementById('access-code').value = '';
        setTimeout(() => {
            errorMsg.classList.add('error-hidden');
        }, 3000);
    }
}

// Allow Enter key for access code
document.addEventListener('DOMContentLoaded', function() {
    const accessInput = document.getElementById('access-code');
    if (accessInput) {
        accessInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkAccess();
            }
        });
    }
});

// Navigation Functions
function showDashboard() {
    document.getElementById('access-lock').classList.add('hidden');
    document.getElementById('dashboard').classList.remove('hidden');
    hideAllModules();
}

function hideAllModules() {
    const modules = ['notes-module', 'flashcards-module', 'quiz-module', 'diary-module'];
    modules.forEach(moduleId => {
        document.getElementById(moduleId).classList.add('hidden');
    });
}

function backToDashboard() {
    hideAllModules();
    document.getElementById('dashboard').classList.remove('hidden');
}

// Module Navigation
function openNotes() {
    hideAllModules();
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('notes-module').classList.remove('hidden');
    loadNotes();
}

function openFlashcards() {
    hideAllModules();
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('flashcards-module').classList.remove('hidden');
    initializeFlashcards();
    showFlashcard();
}

function openQuiz() {
    hideAllModules();
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('quiz-module').classList.remove('hidden');
    resetQuiz();
}

function openDiary() {
    hideAllModules();
    document.getElementById('dashboard').classList.add('hidden');
    document.getElementById('diary-module').classList.remove('hidden');
    loadDiary();
    setupDiaryAutoSave();
}

// Notes Module Functions
function saveNote() {
    const title = document.getElementById('note-title').value.trim();
    const content = document.getElementById('note-content').value.trim();
    
    if (!title || !content) {
        alert('Please fill in both title and content');
        return;
    }
    
    const notes = JSON.parse(localStorage.getItem('healhub_notes') || '[]');
    const newNote = {
        id: Date.now(),
        title: title,
        content: content,
        date: new Date().toLocaleDateString()
    };
    
    notes.push(newNote);
    localStorage.setItem('healhub_notes', JSON.stringify(notes));
    
    // Clear form
    document.getElementById('note-title').value = '';
    document.getElementById('note-content').value = '';
    
    loadNotes();
}

function loadNotes() {
    const notes = JSON.parse(localStorage.getItem('healhub_notes') || '[]');
    const notesList = document.getElementById('notes-list');
    
    if (notes.length === 0) {
        notesList.innerHTML = '<p style="text-align: center; opacity: 0.7;">No notes yet. Create your first note above!</p>';
        return;
    }
    
    notesList.innerHTML = notes.map(note => `
        <div class="note-item">
            <h4>${note.title}</h4>
            <p>${note.content}</p>
            <small style="opacity: 0.7;">Created: ${note.date}</small>
            <div class="note-actions">
                <button onclick="editNote(${note.id})">Edit</button>
                <button onclick="deleteNote(${note.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function editNote(id) {
    const notes = JSON.parse(localStorage.getItem('healhub_notes') || '[]');
    const note = notes.find(n => n.id === id);
    
    if (note) {
        document.getElementById('note-title').value = note.title;
        document.getElementById('note-content').value = note.content;
        deleteNote(id);
    }
}

function deleteNote(id) {
    if (confirm('Are you sure you want to delete this note?')) {
        let notes = JSON.parse(localStorage.getItem('healhub_notes') || '[]');
        notes = notes.filter(note => note.id !== id);
        localStorage.setItem('healhub_notes', JSON.stringify(notes));
        loadNotes();
    }
}

// Flashcards Module Functions
function initializeFlashcards() {
    // Sample medical flashcards - can be expanded
    const defaultFlashcards = [
        { question: "What is the normal resting heart rate for adults?", answer: "60-100 beats per minute" },
        { question: "What does 'tachycardia' mean?", answer: "Fast heart rate (>100 bpm at rest)" },
        { question: "What is the medical term for high blood pressure?", answer: "Hypertension" },
        { question: "What does 'bradycardia' mean?", answer: "Slow heart rate (<60 bpm at rest)" },
        { question: "What is the normal body temperature?", answer: "98.6°F (37°C)" },
        { question: "What does 'hypoxia' mean?", answer: "Low oxygen levels in tissues" },
        { question: "What is the medical term for difficulty breathing?", answer: "Dyspnea" },
        { question: "What does 'tachypnea' mean?", answer: "Rapid breathing rate" }
    ];
    
    // Load from localStorage or use default
    flashcards = JSON.parse(localStorage.getItem('healhub_flashcards')) || defaultFlashcards;
    
    // Save default flashcards if none exist
    if (!localStorage.getItem('healhub_flashcards')) {
        localStorage.setItem('healhub_flashcards', JSON.stringify(defaultFlashcards));
    }
    
    currentFlashcardIndex = 0;
}

function showFlashcard() {
    if (flashcards.length === 0) {
        document.getElementById('flashcard-front').innerHTML = '<p>No flashcards available</p>';
        document.getElementById('card-counter').textContent = '0/0';
        return;
    }
    
    const currentCard = flashcards[currentFlashcardIndex];
    document.getElementById('flashcard-front').innerHTML = `<p>${currentCard.question}</p>`;
    document.getElementById('flashcard-back').innerHTML = `<p>${currentCard.answer}</p>`;
    
    // Reset to front view
    document.getElementById('flashcard-front').classList.remove('hidden');
    document.getElementById('flashcard-back').classList.add('hidden');
    
    // Update counter
    document.getElementById('card-counter').textContent = `${currentFlashcardIndex + 1}/${flashcards.length}`;
}

function flipCard() {
    const front = document.getElementById('flashcard-front');
    const back = document.getElementById('flashcard-back');
    
    if (front.classList.contains('hidden')) {
        // Show front
        front.classList.remove('hidden');
        back.classList.add('hidden');
    } else {
        // Show back
        front.classList.add('hidden');
        back.classList.remove('hidden');
    }
}

function nextCard() {
    if (flashcards.length === 0) return;
    currentFlashcardIndex = (currentFlashcardIndex + 1) % flashcards.length;
    showFlashcard();
}

function prevCard() {
    if (flashcards.length === 0) return;
    currentFlashcardIndex = (currentFlashcardIndex - 1 + flashcards.length) % flashcards.length;
    showFlashcard();
}

// Quiz Module Functions
function initializeQuizData() {
    // Sample medical quiz questions
    const defaultQuizData = [
        {
            question: "What is the largest organ in the human body?",
            options: ["Heart", "Liver", "Skin", "Brain"],
            correct: 2
        },
        {
            question: "How many chambers does a human heart have?",
            options: ["2", "3", "4", "5"],
            correct: 2
        },
        {
            question: "What is the medical term for the voice box?",
            options: ["Pharynx", "Larynx", "Trachea", "Esophagus"],
            correct: 1
        },
        {
            question: "Which blood type is known as the universal donor?",
            options: ["A+", "B+", "AB+", "O-"],
            correct: 3
        },
        {
            question: "What does CPR stand for?",
            options: ["Cardiac Pressure Relief", "Cardiopulmonary Resuscitation", "Chest Pressure Revival", "Cardiac Pulse Recovery"],
            correct: 1
        }
    ];
    
    // Load from localStorage or use default
    quizData = JSON.parse(localStorage.getItem('healhub_quiz')) || defaultQuizData;
    
    // Save default quiz if none exists
    if (!localStorage.getItem('healhub_quiz')) {
        localStorage.setItem('healhub_quiz', JSON.stringify(defaultQuizData));
    }
}

function startQuiz() {
    currentQuizIndex = 0;
    quizScore = 0;
    document.getElementById('quiz-results').classList.add('hidden');
    showQuizQuestion();
}

function showQuizQuestion() {
    if (currentQuizIndex >= quizData.length) {
        showQuizResults();
        return;
    }
    
    const question = quizData[currentQuizIndex];
    const quizContainer = document.getElementById('quiz-container');
    
    quizContainer.innerHTML = `
        <div class="quiz-question">
            <h3>Question ${currentQuizIndex + 1} of ${quizData.length}</h3>
            <p style="font-size: 1.1rem; margin: 20px 0;">${question.question}</p>
            <div class="quiz-options">
                ${question.options.map((option, index) => `
                    <div class="quiz-option" onclick="selectAnswer(${index})">
                        ${String.fromCharCode(65 + index)}. ${option}
                    </div>
                `).join('')}
            </div>
        </div>
    `;
}

function selectAnswer(selectedIndex) {
    const question = quizData[currentQuizIndex];
    const options = document.querySelectorAll('.quiz-option');
    
    // Remove previous selections
    options.forEach(option => option.classList.remove('selected'));
    
    // Mark selected option
    options[selectedIndex].classList.add('selected');
    
    // Check if correct
    if (selectedIndex === question.correct) {
        quizScore++;
    }
    
    // Move to next question after a delay
    setTimeout(() => {
        currentQuizIndex++;
        showQuizQuestion();
    }, 1000);
}

function showQuizResults() {
    document.getElementById('quiz-container').innerHTML = '';
    document.getElementById('final-score').textContent = quizScore;
    document.getElementById('total-questions').textContent = quizData.length;
    document.getElementById('quiz-results').classList.remove('hidden');
}

function resetQuiz() {
    currentQuizIndex = 0;
    quizScore = 0;
    document.getElementById('quiz-results').classList.add('hidden');
    
    const quizContainer = document.getElementById('quiz-container');
    quizContainer.innerHTML = `
        <div class="quiz-question">
            <h3>Ready to test your medical knowledge?</h3>
            <p>This quiz contains ${quizData.length} questions about basic medical concepts.</p>
            <button onclick="startQuiz()" class="primary-btn">Start Quiz</button>
        </div>
    `;
}

// Diary Module Functions
function setupDiaryAutoSave() {
    const diaryText = document.getElementById('diary-text');
    const diaryStatus = document.getElementById('diary-status');
    
    // Clear existing interval
    if (diaryAutoSave) {
        clearInterval(diaryAutoSave);
    }
    
    // Set up auto-save every 2 seconds
    diaryAutoSave = setInterval(() => {
        const content = diaryText.value.trim();
        if (content) {
            saveDiaryEntry(content);
            diaryStatus.textContent = 'Auto-saved ✓';
            diaryStatus.style.color = 'var(--accent-color)';
        } else {
            diaryStatus.textContent = 'Start writing...';
            diaryStatus.style.color = 'var(--text-color)';
        }
    }, 2000);
    
    // Also save on input for immediate feedback
    diaryText.addEventListener('input', () => {
        diaryStatus.textContent = 'Typing...';
        diaryStatus.style.color = '#ff9500';
    });
}

function saveDiaryEntry(content) {
    const today = new Date().toDateString();
    let entries = JSON.parse(localStorage.getItem('healhub_diary') || '[]');
    
    // Check if entry for today already exists
    const existingEntryIndex = entries.findIndex(entry => entry.date === today);
    
    if (existingEntryIndex !== -1) {
        // Update existing entry
        entries[existingEntryIndex].content = content;
        entries[existingEntryIndex].timestamp = new Date().toISOString();
    } else {
        // Create new entry
        const newEntry = {
            id: Date.now(),
            date: today,
            content: content,
            timestamp: new Date().toISOString()
        };
        entries.unshift(newEntry); // Add to beginning
    }
    
    localStorage.setItem('healhub_diary', JSON.stringify(entries));
}

function loadDiary() {
    const entries = JSON.parse(localStorage.getItem('healhub_diary') || '[]');
    const diaryList = document.getElementById('diary-list');
    const diaryText = document.getElementById('diary-text');
    
    // Load today's entry if it exists
    const today = new Date().toDateString();
    const todayEntry = entries.find(entry => entry.date === today);
    
    if (todayEntry) {
        diaryText.value = todayEntry.content;
    } else {
        diaryText.value = '';
    }
    
    // Load previous entries (excluding today's)
    const previousEntries = entries.filter(entry => entry.date !== today);
    
    if (previousEntries.length === 0) {
        diaryList.innerHTML = '<p style="text-align: center; opacity: 0.7;">No previous entries yet.</p>';
        return;
    }
    
    diaryList.innerHTML = previousEntries.map(entry => `
        <div class="diary-entry">
            <div class="diary-entry-date">${entry.date}</div>
            <div class="diary-entry-text">${entry.content}</div>
            <div class="diary-entry-actions">
                <button onclick="editDiaryEntry(${entry.id})">Edit</button>
                <button onclick="deleteDiaryEntry(${entry.id})">Delete</button>
            </div>
        </div>
    `).join('');
}

function editDiaryEntry(id) {
    const entries = JSON.parse(localStorage.getItem('healhub_diary') || '[]');
    const entry = entries.find(e => e.id === id);
    
    if (entry) {
        const diaryText = document.getElementById('diary-text');
        diaryText.value = entry.content;
        diaryText.focus();
        
        // Scroll to top
        window.scrollTo({ top: 0, behavior: 'smooth' });
        
        // Delete the old entry
        deleteDiaryEntry(id, false);
    }
}

function deleteDiaryEntry(id, confirm = true) {
    if (confirm && !window.confirm('Are you sure you want to delete this diary entry?')) {
        return;
    }
    
    let entries = JSON.parse(localStorage.getItem('healhub_diary') || '[]');
    entries = entries.filter(entry => entry.id !== id);
    localStorage.setItem('healhub_diary', JSON.stringify(entries));
    loadDiary();
}

// Keyboard Shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + S to save note (when in notes module)
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        const notesModule = document.getElementById('notes-module');
        if (!notesModule.classList.contains('hidden')) {
            e.preventDefault();
            saveNote();
        }
    }
    
    // Escape key to go back to dashboard
    if (e.key === 'Escape') {
        backToDashboard();
    }
    
    // Arrow keys for flashcard navigation
    const flashcardsModule = document.getElementById('flashcards-module');
    if (!flashcardsModule.classList.contains('hidden')) {
        if (e.key === 'ArrowLeft') {
            e.preventDefault();
            prevCard();
        } else if (e.key === 'ArrowRight') {
            e.preventDefault();
            nextCard();  
        } else if (e.key === ' ') {
            e.preventDefault();
            flipCard();
        }
    }
});

// Utility Functions
function formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Clean up on page unload
window.addEventListener('beforeunload', function() {
    if (diaryAutoSave) {
        clearInterval(diaryAutoSave);
    }
});

// Export/Import Functions (Bonus Features)
function exportData() {
    const data = {
        notes: JSON.parse(localStorage.getItem('healhub_notes') || '[]'),
        diary: JSON.parse(localStorage.getItem('healhub_diary') || '[]'),
        flashcards: JSON.parse(localStorage.getItem('healhub_flashcards') || '[]'),
        quiz: JSON.parse(localStorage.getItem('healhub_quiz') || '[]'),
        exportDate: new Date().toISOString()
    };
    
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `healhub-backup-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    
    URL.revokeObjectURL(url);
}

// Console welcome message
console.log(`
🏥 HealHub - Future Doctor's Study Companion
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Welcome to HealHub! Your journey to medical excellence starts here.

Available keyboard shortcuts:
• Escape: Return to dashboard
• Ctrl/Cmd + S: Save note (when in notes module)
• Arrow keys: Navigate flashcards
• Spacebar: Flip flashcard

Happy Birthday Prince Bhaiya! 🩺
`);

// Initialize tooltips and help text
function showHelp() {
    alert(`HealHub Help:

📝 Notes: Create and organize your study notes
📚 Flashcards: Review key medical concepts
🧠 Quiz: Test your knowledge with practice questions
📓 Diary: Track your learning journey

Keyboard Shortcuts:
• Escape: Back to dashboard
• Ctrl/Cmd+S: Save note
• Arrow keys: Navigate flashcards
• Space: Flip flashcard

All your data is saved locally on your device.`);
}
