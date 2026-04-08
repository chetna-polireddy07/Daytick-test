// State Management
let habits = JSON.parse(localStorage.getItem('habits')) || [];
let history = JSON.parse(localStorage.getItem('history')) || {};
let currentTheme = localStorage.getItem('theme') || 'light';
let profile = JSON.parse(localStorage.getItem('profile')) || { name: '', email: '', password: '', bio: '', target: 5, showAiTips: true };
let isAuthenticated = sessionStorage.getItem('auth') === 'true';

const habitEmojis = {
    'water': '💧', 'skin': '🧴', 'face': '✨', 'read': '📖', 'book': '📚', 'run': '🏃‍♂️', 'gym': '🏋️‍♂️', 
    'workout': '💪', 'meditat': '🧘', 'sleep': '🛌', 'code': '💻', 'study': '📝', 'walk': '🚶‍♀️'
};

const quotes = [
    "Small steps every day.",
    "Believe you can and you're halfway there.",
    "Make today count.",
    "Discipline equals freedom.",
    "Focus on the process, not the outcome.",
    "Keep pushing, you're doing great!",
    "Dream big, start small.",
    "A year from now you'll wish you had started today."
];

const aiSuggestionsDict = {
    'skin': 'Drink at least 8 glasses of water today for clear skin!',
    'face': 'Remember your sunscreen!',
    'study': 'Try the Pomodoro technique: 25 mins work, 5 mins break.',
    'read': 'Reading 20 pages a day is 30 books a year.',
    'book': 'Immerse yourself—no distractions for 15 mins.',
    'run': 'Hydrate and stretch your calves before you start!',
    'water': 'Keep a bottle on your desk for constant hydration.',
    'gym': 'Protein within 30 minutes post-workout maximizes gains!',
    'workout': 'Log your weights to track progressive overload.',
    'sleep': 'Keep your room dark and cool for deep recovery.',
    'meditat': 'Focus on your breath. Inhale for 4s, exhale for 6s.',
    'code': 'Take breaks using the 20-20-20 rule for your eyes.',
    'habit': 'Consistency is more important than intensity.'
};

// Dates Utility
const getTodayDateString = () => {
    const today = new Date();
    // Use local date string YYYY-MM-DD
    const offset = today.getTimezoneOffset();
    const date = new Date(today.getTime() - (offset*60*1000));
    return date.toISOString().split('T')[0];
};

const getPastDays = (numDays) => {
    const days = [];
    for (let i = numDays - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const offset = d.getTimezoneOffset();
        const date = new Date(d.getTime() - (offset*60*1000));
        days.push(date.toISOString().split('T')[0]);
    }
    return days;
};

// DOM Elements
const body = document.documentElement;
const themeToggleBtn = document.getElementById('themeToggleBtn');
const viewTitle = document.getElementById('viewTitle');
const currentDateDisplay = document.getElementById('currentDateDisplay');
const navItems = document.querySelectorAll('.nav-item');
const views = document.querySelectorAll('.view-section');

// Modal Elements
const habitModal = document.getElementById('habitModal');
const addHabitBtn = document.getElementById('addHabitBtn');
const emptyAddBtn = document.getElementById('emptyAddBtn');
const closeModalBtn = document.getElementById('closeModalBtn');
const habitForm = document.getElementById('habitForm');
const habitNameInput = document.getElementById('habitName');
const habitCategorySelect = document.getElementById('habitCategory');

// Dashboard Elements
const habitsList = document.getElementById('habitsList');
const emptyHabits = document.getElementById('emptyHabits');
const dailyProgressCircle = document.getElementById('dailyProgressCircle');
const dailyProgressText = document.getElementById('dailyProgressText');
const weeklyChart = document.getElementById('weeklyChart');
const weeklyProgressText = document.getElementById('weeklyProgressText');

// History Elements
const historyGrid = document.getElementById('historyGrid');

// Profile Elements
const profileForm = document.getElementById('profileForm');
const profileNameInput = document.getElementById('profileName');
const profileEmailInput = document.getElementById('profileEmail');
const profileBioInput = document.getElementById('profileBio');
const profileTargetInput = document.getElementById('profileTarget');
const profilePicPreview = document.getElementById('profilePicPreview');

// Initialize Icons
lucide.createIcons();

// Setup Theme
const applyTheme = (theme) => {
    body.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
};

themeToggleBtn.addEventListener('click', () => {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
});

applyTheme(currentTheme);

// Initialize App
const init = () => {
    // Auth Check
    const authOverlay = document.getElementById('authOverlay');
    if (!isAuthenticated) {
        authOverlay.classList.remove('hidden');
        if (profile.password) {
            document.getElementById('authName').parentElement.style.display = 'none';
            document.getElementById('authEmail').parentElement.style.display = 'none';
            document.getElementById('authName').removeAttribute('required');
            document.getElementById('authEmail').removeAttribute('required');
            document.querySelector('#authOverlay h2').textContent = `Welcome back, ${profile.name.split(' ')[0]}!`;
            document.querySelector('#authOverlay p').textContent = "Enter your 4-digit PIN to unlock.";
        } else if (profile.email && !profile.password) {
            document.querySelector('#authOverlay h2').textContent = `Create a PIN`;
            document.querySelector('#authOverlay p').textContent = "Please secure your profile with 4 numbers.";
        }
        return;
    } else {
        authOverlay.classList.add('hidden');
    }
    
    // Admin Check
    const adminNavBtn = document.getElementById('adminNavBtn');
    if (adminNavBtn) {
        const checkEmail = (profile.email || '').toLowerCase();
        adminNavBtn.style.display = (checkEmail === 'admin@daytick.com') ? 'flex' : 'none';
    }

    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    currentDateDisplay.textContent = new Date().toLocaleDateString('en-US', options);
    
    // Auto-seed mock feedback for Community view if empty
    let existingReviews = JSON.parse(localStorage.getItem('reviews'));
    if (!existingReviews || existingReviews.length === 0) {
        localStorage.setItem('reviews', JSON.stringify(mockFeedbacks));
    }
    
    // Ensure today's history exists
    const today = getTodayDateString();
    if (!history[today]) {
        history[today] = [];
        saveData();
    }
    
    // Load profile to inputs
    if(profileNameInput) profileNameInput.value = profile.name;
    if(profileEmailInput) profileEmailInput.value = profile.email || '';
    if(profileBioInput) profileBioInput.value = profile.bio;
    if(profileTargetInput) profileTargetInput.value = profile.target || 5;
    
    const aiToggle = document.getElementById('profileAiToggle');
    if(aiToggle && typeof profile.showAiTips !== 'undefined') {
        aiToggle.checked = profile.showAiTips;
    } else if (aiToggle) {
        aiToggle.checked = true;
    }

    // Prefill feedback name
    const feedbackName = document.getElementById('feedbackName');
    if(feedbackName && profile.name) feedbackName.value = profile.name;

    // Update greeting if name exists
    if(profile.name) {
        document.getElementById('viewTitle').textContent = `Hi, ${profile.name.split(' ')[0]}!`;
    }
    
    updateProfileImages();
    
    // Maintain visually selected option status
    const avatarOptionsArr = document.querySelectorAll('.avatar-option');
    if (avatarOptionsArr.length > 0) {
        avatarOptionsArr.forEach(img => img.classList.remove('selected'));
        const activeSrc = profile.avatar || 'https://api.dicebear.com/7.x/notionists/svg?seed=Felix&backgroundColor=f0f0f0';
        let found = false;
        avatarOptionsArr.forEach(img => {
            if (img.src === activeSrc) {
                img.classList.add('selected');
                found = true;
            }
        });
        if (!found) avatarOptionsArr[0].classList.add('selected');
    }
    
    // Set motivational quote (one per day)
    let quoteCache = JSON.parse(localStorage.getItem('quoteCache')) || { date: '', quote: '' };
    if (quoteCache.date !== today) {
        quoteCache.date = today;
        quoteCache.quote = quotes[Math.floor(Math.random() * quotes.length)];
        localStorage.setItem('quoteCache', JSON.stringify(quoteCache));
    }
    const qDisplay = document.getElementById('quoteDisplay');
    if (qDisplay) qDisplay.textContent = `"${quoteCache.quote}"`;
    
    renderHabits();
    renderProgress();
};

const saveData = () => {
    localStorage.setItem('habits', JSON.stringify(habits));
    localStorage.setItem('history', JSON.stringify(history));
    localStorage.setItem('profile', JSON.stringify(profile));
};

// Auth Form Submit
const authForm = document.getElementById('authForm');
if (authForm) {
    authForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const enteredPin = document.getElementById('authPassword').value.trim();
        const errorMsg = document.getElementById('authErrorMsg');

        if (profile.password) {
            // Returning user unlocking
            if (enteredPin === profile.password) {
                sessionStorage.setItem('auth', 'true');
                isAuthenticated = true;
                errorMsg.classList.add('hidden');
                document.getElementById('authOverlay').classList.add('hidden');
                init();
            } else {
                errorMsg.textContent = "Incorrect PIN. Please try again.";
                errorMsg.classList.remove('hidden');
            }
        } else {
            // New user registration or legacy migration
            if (document.getElementById('authName').value) {
                profile.name = document.getElementById('authName').value.trim();
                profile.email = document.getElementById('authEmail').value.trim().toLowerCase();
            }
            profile.password = enteredPin;
            saveData();
            
            sessionStorage.setItem('auth', 'true');
            isAuthenticated = true;
            document.getElementById('authOverlay').classList.add('hidden');
            init();
        }
    });
}

profileForm.addEventListener('submit', (e) => {
    e.preventDefault();
    profile.name = profileNameInput.value.trim();
    if(profileEmailInput) profile.email = profileEmailInput.value.trim().toLowerCase();
    profile.bio = profileBioInput.value.trim();
    profile.target = parseInt(profileTargetInput.value) || 5;
    const aiToggle = document.getElementById('profileAiToggle');
    if(aiToggle) profile.showAiTips = aiToggle.checked;
    
    saveData();
    updateProfileImages();
    
    // Re-trigger admin check dynamically
    const adminNavBtn = document.getElementById('adminNavBtn');
    if (adminNavBtn) {
        const checkEmail = (profile.email || '').toLowerCase();
        adminNavBtn.style.display = (checkEmail === 'admin@daytick.com') ? 'flex' : 'none';
    }
    
    if(profile.name) {
        document.getElementById('viewTitle').textContent = `Hi, ${profile.name.split(' ')[0]}!`;
        const feedbackName = document.getElementById('feedbackName');
        if(feedbackName) feedbackName.value = profile.name;
    }
    alert('Profile successfully saved!');
});

function updateProfileImages() {
    const defaultPic = profile.name 
        ? `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=6366f1&color=fff`
        : "https://ui-avatars.com/api/?name=User&background=6366f1&color=fff";
        
    const picSrc = profile.picture || defaultPic;
    
    if(profilePicPreview) profilePicPreview.src = picSrc;
    
    const profileNavItem = document.querySelector('.nav-item[data-view="profile"]');
    if (profileNavItem) {
        profileNavItem.innerHTML = `<img src="${picSrc}" style="width: 22px; height: 22px; border-radius: 50%; object-fit: cover;"> Profile`;
    }
}

// Attach listeners to preset avatars
const presetAvatars = document.querySelectorAll('.preset-avatar');
presetAvatars.forEach(av => {
    av.addEventListener('click', () => {
        profile.picture = av.src;
        saveData();
        updateProfileImages();
        
        // Optional: flash border to indicate active
        presetAvatars.forEach(a => a.style.borderColor = 'transparent');
        av.style.borderColor = 'var(--primary-color)';
    });
});

const logoutBtn = document.getElementById('logoutBtn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', () => {
        sessionStorage.removeItem('auth');
        window.location.reload();
    });
}

// Navigation Rules
navItems.forEach(item => {
    item.addEventListener('click', () => {
        navItems.forEach(n => n.classList.remove('active'));
        item.classList.add('active');
        
        const viewName = item.getAttribute('data-view');
        views.forEach(v => v.classList.add('hidden'));
        document.getElementById(`${viewName}View`).classList.remove('hidden');
        
        if (viewName === 'dashboard') {
            viewTitle.textContent = profile.name ? `Hi, ${profile.name.split(' ')[0]}!` : "Today's Habits";
            addHabitBtn.style.display = 'flex';
            renderHabits();
            renderProgress();
        } else if (viewName === 'history') {
            viewTitle.textContent = "Habit History";
            addHabitBtn.style.display = 'none';
            renderHistory();
        } else if (viewName === 'profile') {
            viewTitle.textContent = "Your Profile";
            addHabitBtn.style.display = 'none';
        } else if (viewName === 'feedback') {
            viewTitle.textContent = "Feedback & Reviews";
            addHabitBtn.style.display = 'none';
        } else if (viewName === 'admin') {
            viewTitle.textContent = "Admin Control Panel";
            addHabitBtn.style.display = 'none';
            renderAdminReviews();
        }
    });
});

// Modal Rules
const openModal = (habitId = null) => {
    habitModal.classList.remove('hidden');
    
    if (habitId && typeof habitId === 'string') {
        const habit = habits.find(h => h.id === habitId);
        if(habit) {
            document.getElementById('editingHabitId').value = habitId;
            habitNameInput.value = habit.name;
            habitCategorySelect.value = habit.category;
            document.getElementById('habitNote').value = habit.note || '';
            document.querySelector('#habitModal h2').textContent = 'Edit Habit';
        }
    } else {
        document.getElementById('editingHabitId').value = '';
        habitNameInput.value = '';
        habitCategorySelect.value = '';
        document.getElementById('habitNote').value = '';
        document.querySelector('#habitModal h2').textContent = 'Create New Habit';
    }
    
    habitNameInput.focus();
};

const closeModal = () => {
    habitModal.classList.add('hidden');
    habitForm.reset();
    document.getElementById('editingHabitId').value = '';
};

addHabitBtn.addEventListener('click', () => openModal(null));
emptyAddBtn.addEventListener('click', () => openModal(null));
closeModalBtn.addEventListener('click', closeModal);

habitModal.addEventListener('click', (e) => {
    if (e.target === habitModal) closeModal();
});

// Habit Logic
const generateId = () => Math.random().toString(36).substr(2, 9);

habitForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = habitNameInput.value.trim();
    const category = habitCategorySelect.value;
    const note = document.getElementById('habitNote').value.trim();
    const editingId = document.getElementById('editingHabitId').value;
    
    if (name && category) {
        if (editingId) {
            const habit = habits.find(h => h.id === editingId);
            if(habit) {
                habit.name = name;
                habit.category = category;
                habit.note = note;
                saveData();
                closeModal();
                renderHabits();
                renderProgress();
            }
        } else {
            const newHabit = {
                id: generateId(),
                name,
                category,
                note,
                createdAt: getTodayDateString()
            };
            
            habits.push(newHabit);
            saveData();
            closeModal();
            renderHabits(newHabit.id);
            renderProgress();
        }
    }
});

const calculateStreak = (habitId) => {
    let streak = 0;
    const today = getTodayDateString();
    const pastDays = getPastDays(365).reverse(); // from today backwards

    for (const date of pastDays) {
        if (history[date] && history[date].includes(habitId)) {
            streak++;
        } else if (date !== today && new Date(date) >= new Date(habits.find(h => h.id === habitId).createdAt)) {
            // broke the streak (ignore days before habit creation)
            break;
        }
    }
    return streak;
};

const toggleHabit = (habitId) => {
    const today = getTodayDateString();
    if (!history[today]) history[today] = [];
    
    const index = history[today].indexOf(habitId);
    if (index > -1) {
        history[today].splice(index, 1);
    } else {
        history[today].push(habitId);
        // Confetti!
        if (typeof confetti === 'function') {
            confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
        }
    }
    
    saveData();
    renderHabits();
    renderProgress();
};

const deleteHabit = (habitId) => {
    if(confirm("Are you sure you want to delete this habit? All history will be lost.")) {
        habits = habits.filter(h => h.id !== habitId);
        // Clean up history
        Object.keys(history).forEach(date => {
            history[date] = history[date].filter(id => id !== habitId);
        });
        saveData();
        renderHabits();
        renderProgress();
    }
}

const getCategoryEmoji = (category) => {
    const defaultEmojis = { 'Study': '📚', 'Health': '🧘‍♀️', 'Fitness': '🏋️‍♂️', 'Skill': '🎸', 'Other': '✨' };
    return defaultEmojis[category] || '✨';
};

const getDynamicEmoji = (habit) => {
    const text = habit.name.toLowerCase();
    for (const [key, emoji] of Object.entries(habitEmojis)) {
        if (text.includes(key)) return emoji;
    }
    return getCategoryEmoji(habit.category);
};

const renderHabits = (newId = null) => {
    if (habits.length === 0) {
        emptyHabits.classList.remove('hidden');
        habitsList.innerHTML = '';
        return;
    }
    
    emptyHabits.classList.add('hidden');
    habitsList.innerHTML = '';
    
    const today = getTodayDateString();
    const completedToday = history[today] || [];
    
    // Sort so uncompleted are at top
    const sortedHabits = [...habits].sort((a, b) => {
        const aDone = completedToday.includes(a.id);
        const bDone = completedToday.includes(b.id);
        if(aDone === bDone) return 0;
        return aDone ? 1 : -1;
    });

    sortedHabits.forEach(habit => {
        const isCompleted = completedToday.includes(habit.id);
        const streak = calculateStreak(habit.id);
        
        let aiTip = '';
        if(!isCompleted && profile.showAiTips !== false) {
            const hText = (habit.name + " " + (habit.note||'')).toLowerCase();
            for (const [key, msg] of Object.entries(aiSuggestionsDict)) {
                if (hText.includes(key)) {
                    aiTip = `<div class="ai-suggestion"><i data-lucide="sparkles" style="width: 14px; height: 14px; color: #a855f7;"></i> AI: ${msg}</div>`;
                    break;
                }
            }
        }
        
        const dynamicEmoji = getDynamicEmoji(habit);
        
        const item = document.createElement('div');
        item.className = `habit-item ${isCompleted ? 'completed' : ''} ${habit.id === newId ? 'new-habit-anim' : ''}`;
        
        item.innerHTML = `
            <div class="checkbox-wrapper" onclick="toggleHabit('${habit.id}')">
                ${isCompleted ? '<i data-lucide="check" style="width: 18px;"></i>' : ''}
            </div>
            <div class="habit-info">
                <div class="habit-title">${dynamicEmoji} ${escapeHTML(habit.name)}</div>
                ${habit.note ? `<div class="habit-note">${escapeHTML(habit.note)}</div>` : ''}
                ${aiTip}
                <div class="habit-meta">
                    <span class="category-tag">${habit.category}</span>
                    ${streak > 0 ? `<span class="streak-info"><i data-lucide="flame" style="width: 14px; height: 14px;"></i> ${streak}</span>` : ''}
                </div>
            </div>
            <div class="habit-actions">
                <button class="icon-btn edit-btn" onclick="openModal('${habit.id}')" title="Edit Habit">
                    <i data-lucide="edit-2"></i>
                </button>
                <button class="icon-btn delete-btn" onclick="deleteHabit('${habit.id}')" title="Delete Habit">
                    <i data-lucide="trash-2"></i>
                </button>
            </div>
        `;
        
        habitsList.appendChild(item);
    });
    
    lucide.createIcons();
};

// Progress Calculations
const renderProgress = () => {
    if (habits.length === 0) {
        dailyProgressCircle.setAttribute('stroke-dasharray', '0, 100');
        dailyProgressText.textContent = '0% Completed';
        weeklyChart.innerHTML = '<p style="color: var(--text-secondary); font-size: 13px;">Add habits to see progress</p>';
        weeklyProgressText.textContent = "Start tracking!";
        return;
    }
    
    const today = getTodayDateString();
    const completedToday = (history[today] || []).length;
    let percentage = 0;
    
    if(habits.length > 0) {
        percentage = Math.round((completedToday / habits.length) * 100);
    }
    
    dailyProgressCircle.setAttribute('stroke-dasharray', `${percentage}, 100`);
    dailyProgressText.textContent = `${percentage}% Completed`;
    
    // Weekly Chart
    const past7Days = getPastDays(7);
    weeklyChart.innerHTML = '';
    
    let totalWeeklyHabits = 0;
    let completedWeeklyHabits = 0;

    past7Days.forEach(date => {
        const activeHabits = habits.filter(h => new Date(h.createdAt) <= new Date(date));
        const activeHabitsCount = activeHabits.length;
        const completedCount = (history[date] || []).filter(id => activeHabits.some(h => h.id === id)).length;
        
        totalWeeklyHabits += activeHabitsCount;
        completedWeeklyHabits += completedCount;

        const p = activeHabitsCount > 0 ? Math.round((completedCount / activeHabitsCount) * 100) : 0;
        
        const dayLabel = new Date(date).toLocaleDateString('en-US', { weekday: 'short' })[0];
        
        const barContainer = document.createElement('div');
        barContainer.className = 'bar-container';
        barContainer.innerHTML = `
            <div class="bar ${p > 0 ? 'filled' : ''}" style="height: ${Math.max(p, 5)}%; opacity: ${p / 100 + 0.2}"></div>
            <span class="day-label">${dayLabel}</span>
        `;
        weeklyChart.appendChild(barContainer);
    });

    const weeklyPercentage = totalWeeklyHabits > 0 ? Math.round((completedWeeklyHabits / totalWeeklyHabits) * 100) : 0;
    if(weeklyPercentage >= 80) weeklyProgressText.textContent = "Excellent consistency!";
    else if(weeklyPercentage >= 50) weeklyProgressText.textContent = "You're doing great!";
    else weeklyProgressText.textContent = "Keep building momentum!";

    // Daily Report Logic
    const dailyReportCard = document.getElementById('dailyReportCard');
    const dailyReportText = document.getElementById('dailyReportText');
    if (dailyReportCard) {
        dailyReportCard.style.display = 'block';
        if (habits.length === 0) {
            dailyReportText.innerHTML = "You haven't set any habits yet. Add some to start generating your productivity report!";
        } else if (completedToday === 0) {
            dailyReportText.innerHTML = `You have <strong>${habits.length}</strong> tasks pending for today. Let's start building momentum!`;
        } else if (completedToday === habits.length) {
            dailyReportText.innerHTML = `Incredible! You completed all <strong>${habits.length}</strong> habits today. Time to relax! 🚀`;
        } else {
            dailyReportText.innerHTML = `You have completed <strong>${completedToday}</strong> out of <strong>${habits.length}</strong> habits today. Keep up the solid progress!`;
        }
    }
};

const renderAdminReviews = () => {
    const list = document.getElementById('adminReviewsList');
    if (!list) return;
    
    const reviews = JSON.parse(localStorage.getItem('reviews')) || [];
    if (reviews.length === 0) {
        list.innerHTML = '<p style="color: var(--text-secondary);">No feedback received yet.</p>';
        return;
    }
    
    list.innerHTML = reviews.reverse().map(r => `
        <div style="background: var(--surface-solid); border: 1px solid var(--border-color); padding: 16px; border-radius: 12px; animation: fadeInModal 0.2s ease;">
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px;">
                <div>
                    <strong style="color: var(--primary-color);">${escapeHTML(r.name || 'Anonymous User')}</strong>
                    ${r.isHidden ? '<span style="background: #ef444420; color: #ef4444; padding: 2px 6px; border-radius: 4px; font-size: 11px; margin-left: 8px;">HIDDEN</span>' : ''}
                </div>
                <span style="color: #f59e0b; font-size: 16px;">${'★'.repeat(Math.min(5, parseInt(r.rating) || 5))}</span>
            </div>
            <p style="color: var(--text-primary); font-size: 15px; margin-bottom: 12px; line-height: 1.5;">"${escapeHTML(r.text)}"</p>
            <div style="display: flex; justify-content: space-between; align-items: center;">
                <div style="font-size: 12px; color: var(--text-secondary); opacity: 0.8;"><i data-lucide="clock" style="width: 12px; height: 12px; display: inline; margin-bottom: -2px;"></i> ${new Date(r.date).toLocaleString()}</div>
                <div style="display: flex; gap: 8px;">
                    <button class="secondary-btn" onclick="toggleHideReview('${r.id}')" style="padding: 4px 10px; font-size: 12px;">
                        <i data-lucide="${r.isHidden ? 'eye' : 'eye-off'}" style="width: 14px; height: 14px;"></i> ${r.isHidden ? 'Restore' : 'Hide'}
                    </button>
                    <button class="secondary-btn" onclick="deleteReview('${r.id}')" style="padding: 4px 10px; font-size: 12px; color: #ef4444; border-color: #ef444440;">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i> Delete
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
};

window.toggleHideReview = (id) => {
    let reviews = JSON.parse(localStorage.getItem('reviews')) || [];
    const index = reviews.findIndex(r => r.id === id);
    if(index > -1) {
        reviews[index].isHidden = !reviews[index].isHidden;
        localStorage.setItem('reviews', JSON.stringify(reviews));
        renderAdminReviews();
        if (typeof renderCommunityFeedback === 'function') renderCommunityFeedback();
    }
};

window.deleteReview = (id) => {
    if(!confirm('Delete this review permanently from the system?')) return;
    let reviews = JSON.parse(localStorage.getItem('reviews')) || [];
    reviews = reviews.filter(r => r.id !== id);
    localStorage.setItem('reviews', JSON.stringify(reviews));
    renderAdminReviews();
    if (typeof renderCommunityFeedback === 'function') renderCommunityFeedback();
};

const mockFeedbacks = [
    { id: 'mock_1', name: "Sarah Connor", rating: 5, text: "Absolutely love the new minimalistic aesthetic! The confetti when finishing a habit is a huge motivator.", date: new Date(Date.now() - 86400000 * 2).toISOString(), isHidden: false },
    { id: 'mock_2', name: "David Chen", rating: 4, text: "The AI suggestions are a nice touch. I wish we could sync this across devices though.", date: new Date(Date.now() - 86400000 * 1.5).toISOString(), isHidden: false },
    { id: 'mock_3', name: "Emma Watson", rating: 5, text: "Simple, fast, and does exactly what it needs to without the bloat.", date: new Date(Date.now() - 3600000 * 5).toISOString(), isHidden: false },
    { id: 'mock_4', name: "Jessica L.", rating: 3, text: "It's good but I accidentally cleared my browser cache and lost everything.", date: new Date(Date.now() - 3600000 * 2).toISOString(), isHidden: false }
];

const mockBtn = document.getElementById('generateMockReviews');
if (mockBtn) {
    mockBtn.addEventListener('click', () => {
        let currentReviews = JSON.parse(localStorage.getItem('reviews')) || [];
        const newFeedbacks = mockFeedbacks.filter(m => !currentReviews.some(cr => cr.name === m.name));
        
        if (newFeedbacks.length > 0) {
            currentReviews = [...currentReviews, ...newFeedbacks];
            localStorage.setItem('reviews', JSON.stringify(currentReviews));
            renderAdminReviews();
            alert("Simulated user feedbacks successfully loaded!");
        } else {
            alert("Simulated feedbacks are already in the feed.");
        }
    });
}

const renderHistory = () => {
    historyGrid.innerHTML = '';
    const pastDays = getPastDays(14).reverse(); // Last 14 days
    
    if (habits.length === 0) {
        historyGrid.innerHTML = '<p style="color: var(--text-secondary); grid-column: 1/-1;">No habit data available yet.</p>';
        return;
    }

    pastDays.forEach(date => {
        const activeHabits = habits.filter(h => new Date(h.createdAt) <= new Date(date));
        if(activeHabits.length === 0) return; // Skip days before user created first habit
        
        const completedList = history[date] || [];
        const percent = Math.round((completedList.length / activeHabits.length) * 100);
        
        const friendlyDate = date === getTodayDateString() ? 'Today' : new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        
        let habitsHtml = activeHabits.map(habit => {
            const isDone = completedList.includes(habit.id);
            return `
                <div class="history-habit-item ${isDone ? 'done' : 'missed'}">
                    <i data-lucide="${isDone ? 'check-circle-2' : 'circle'}" style="width: 14px; height: 14px;"></i>
                    ${escapeHTML(habit.name)}
                </div>
            `;
        }).join('');

        const card = document.createElement('div');
        card.className = 'history-day-card glass';
        card.innerHTML = `
            <div class="history-date">
                <span>${friendlyDate}</span>
                <span class="history-completion-rate">${percent}%</span>
            </div>
            <div class="history-habits-list">
                ${habitsHtml}
            </div>
        `;
        historyGrid.appendChild(card);
    });
    
    lucide.createIcons();
}

// Utils
function escapeHTML(str) {
    const p = document.createElement('p');
    p.appendChild(document.createTextNode(str));
    return p.innerHTML;
}

// Run
window.addEventListener('load', init);
