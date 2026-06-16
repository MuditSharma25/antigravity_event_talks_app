/**
 * BigQuery Release Hub - Main Logic File
 * Handles: API fetching, UI rendering, real-time search, category filters,
 * selection states, character counting, and tweet formatting.
 */

// Global State
let allUpdates = [];
let filteredUpdates = [];
let selectedUpdate = null;
let currentFilter = 'all';
let searchQuery = '';

// DOM Elements
const notesContainer = document.getElementById('notes-container');
const refreshBtn = document.getElementById('refresh-btn');
const refreshIcon = document.getElementById('refresh-icon');
const searchInput = document.getElementById('search-input');
const searchClearBtn = document.getElementById('search-clear-btn');
const filterBadgesList = document.getElementById('filter-badges-list');
const feedStatus = document.getElementById('feed-status');
const feedStatusText = document.getElementById('feed-status-text');

// Composer DOM Elements
const tweetTextarea = document.getElementById('tweet-textarea');
const charCounter = document.getElementById('char-counter');
const tweetSubmitBtn = document.getElementById('tweet-submit-btn');
const composerBadge = document.getElementById('composer-selected-badge');
const composerDate = document.getElementById('composer-selected-date');
const toggleDate = document.getElementById('toggle-date');
const toggleLink = document.getElementById('toggle-link');
const toggleTags = document.getElementById('toggle-tags');

// Initialization
document.addEventListener('DOMContentLoaded', () => {
    fetchReleaseNotes();
    setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
    // Refresh Button
    refreshBtn.addEventListener('click', fetchReleaseNotes);

    // Search input
    searchInput.addEventListener('input', (e) => {
        searchQuery = e.target.value.toLowerCase().trim();
        searchClearBtn.style.display = searchQuery ? 'block' : 'none';
        applyFiltersAndRender();
    });

    // Clear search button
    searchClearBtn.addEventListener('click', () => {
        searchInput.value = '';
        searchQuery = '';
        searchClearBtn.style.display = 'none';
        applyFiltersAndRender();
        searchInput.focus();
    });

    // Category Filter Badges
    filterBadgesList.addEventListener('click', (e) => {
        const badge = e.target.closest('.badge-btn');
        if (!badge) return;

        // Toggle active class
        filterBadgesList.querySelectorAll('.badge-btn').forEach(btn => btn.classList.remove('active'));
        badge.classList.add('active');

        currentFilter = badge.getAttribute('data-type');
        applyFiltersAndRender();
    });

    // Composer input (character counter)
    tweetTextarea.addEventListener('input', updateCharCounter);

    // Composer toggles
    toggleDate.addEventListener('change', updateComposerText);
    toggleLink.addEventListener('change', updateComposerText);
    toggleTags.addEventListener('change', updateComposerText);

    // Tweet submit button
    tweetSubmitBtn.addEventListener('click', submitTweet);
}

// Fetch Data from Flask API
async function fetchReleaseNotes() {
    try {
        setLoadingState(true);
        showStatus('Fetching latest release notes from Google Cloud RSS feed...', 'info');

        const response = await fetch('/api/release-notes');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.status === 'success') {
            allUpdates = data.updates;
            filteredUpdates = [...allUpdates];
            
            showStatus(`Successfully loaded ${allUpdates.length} release updates.`, 'success');
            setTimeout(() => hideStatus(), 3000);
            
            applyFiltersAndRender();
        } else {
            throw new Error(data.message || 'Unknown server error');
        }
    } catch (error) {
        console.error('Fetch failed:', error);
        showStatus(`Failed to load updates: ${error.message}`, 'error');
        renderErrorState(error.message);
    } finally {
        setLoadingState(false);
    }
}

// Set loading visual states
function setLoadingState(isLoading) {
    if (isLoading) {
        refreshBtn.classList.add('refreshing');
        refreshBtn.disabled = true;
    } else {
        refreshBtn.classList.remove('refreshing');
        refreshBtn.disabled = false;
    }
}

// Show/Hide Feed Status Alerts
function showStatus(message, type) {
    feedStatus.style.display = 'flex';
    feedStatusText.textContent = message;
    
    // Set colors based on type
    feedStatus.className = 'feed-status-alert';
    if (type === 'error') {
        feedStatus.style.borderColor = 'rgba(239, 68, 68, 0.3)';
        feedStatus.style.color = '#ef4444';
        feedStatus.style.background = 'rgba(239, 68, 68, 0.05)';
    } else if (type === 'success') {
        feedStatus.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        feedStatus.style.color = '#10b981';
        feedStatus.style.background = 'rgba(16, 185, 129, 0.05)';
    } else {
        feedStatus.style.borderColor = 'rgba(0, 242, 254, 0.2)';
        feedStatus.style.color = '#60efff';
        feedStatus.style.background = 'rgba(0, 242, 254, 0.05)';
    }
}

function hideStatus() {
    feedStatus.style.display = 'none';
}

// Apply Filters & Search
function applyFiltersAndRender() {
    filteredUpdates = allUpdates.filter(update => {
        // Filter by category
        const matchesCategory = currentFilter === 'all' || 
            update.type.toLowerCase() === currentFilter.toLowerCase();
            
        // Filter by search query
        const textToSearch = `${update.title || ''} ${update.type || ''} ${update.date || ''} ${update.content || ''}`.toLowerCase();
        const matchesSearch = textToSearch.includes(searchQuery);
        
        return matchesCategory && matchesSearch;
    });
    
    renderUpdatesList();
}

// Render the updates list inside notesContainer
function renderUpdatesList() {
    notesContainer.innerHTML = '';
    
    if (filteredUpdates.length === 0) {
        renderNoResultsState();
        return;
    }
    
    filteredUpdates.forEach(update => {
        const isSelected = selectedUpdate && selectedUpdate.id === update.id;
        const card = document.createElement('article');
        card.className = `note-card ${isSelected ? 'selected' : ''}`;
        card.setAttribute('data-id', update.id);
        card.id = `card-${update.id}`;
        
        // Map types to lowercase for styling
        let badgeClass = 'badge-other';
        const typeLower = update.type.toLowerCase();
        if (typeLower.includes('feature')) badgeClass = 'badge-feature';
        else if (typeLower.includes('change')) badgeClass = 'badge-changed';
        else if (typeLower.includes('deprecat')) badgeClass = 'badge-deprecated';
        else if (typeLower.includes('issue')) badgeClass = 'badge-issue';
        
        card.innerHTML = `
            <div class="note-header">
                <div class="note-meta">
                    <span class="note-date">${update.date}</span>
                    <span class="note-badge ${badgeClass}">${update.type}</span>
                </div>
                <div class="note-select-container">
                    <label class="checkbox-custom" for="select-${update.id}" aria-label="Select update to tweet">
                        <input 
                            type="checkbox" 
                            id="select-${update.id}" 
                            ${isSelected ? 'checked' : ''}
                            onchange="handleSelectChange('${update.id}', this.checked)"
                        >
                        <span class="checkmark"></span>
                    </label>
                </div>
            </div>
            
            <div class="note-body">
                ${update.content}
            </div>
            
            <div class="note-footer">
                <a href="${update.link}" target="_blank" rel="noopener noreferrer" class="official-link">
                    <span>View Docs</span>
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                        <polyline points="15 3 21 3 21 9"></polyline>
                        <line x1="10" y1="14" x2="21" y2="3"></line>
                    </svg>
                </a>
                <button class="tweet-action-btn" onclick="selectForTweet('${update.id}')">
                    <svg class="twitter-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                    <span>${isSelected ? 'Selected' : 'Compose Tweet'}</span>
                </button>
            </div>
        `;
        
        // Allow card click selection too
        card.addEventListener('click', (e) => {
            // Check if click was on link or checkbox
            if (e.target.closest('a') || e.target.closest('.checkbox-custom') || e.target.closest('.tweet-action-btn')) {
                return;
            }
            selectForTweet(update.id);
        });

        notesContainer.appendChild(card);
    });
}

// Render States (Error, Empty)
function renderErrorState(message) {
    notesContainer.innerHTML = `
        <div class="no-results" style="border-color: rgba(239, 68, 68, 0.2);">
            <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="12" y1="8" x2="12" y2="12"></line>
                <line x1="12" y1="16" x2="12.01" y2="16"></line>
            </svg>
            <h3 style="color: #ef4444;">Unable to Fetch Release Notes</h3>
            <p>${message}</p>
            <button class="btn btn-secondary" style="margin-top: 15px;" onclick="fetchReleaseNotes()">Try Again</button>
        </div>
    `;
}

function renderNoResultsState() {
    notesContainer.innerHTML = `
        <div class="no-results">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
            </svg>
            <h3>No updates match your filters</h3>
            <p>Try clearing your search query or selecting a different release note type.</p>
        </div>
    `;
}

// Handle checkbox triggers
window.handleSelectChange = function(id, isChecked) {
    if (isChecked) {
        selectForTweet(id);
    } else {
        if (selectedUpdate && selectedUpdate.id === id) {
            clearComposer();
        }
    }
};

// Select an update to compose tweet
window.selectForTweet = function(id) {
    const update = allUpdates.find(u => u.id === id);
    if (!update) return;

    selectedUpdate = update;
    
    // Update card visual active classes
    document.querySelectorAll('.note-card').forEach(card => {
        card.classList.remove('selected');
        const chk = card.querySelector('input[type="checkbox"]');
        if (chk) chk.checked = false;
    });

    const activeCard = document.getElementById(`card-${id}`);
    if (activeCard) {
        activeCard.classList.add('selected');
        const activeChk = activeCard.querySelector(`input[id="select-${id}"]`);
        if (activeChk) activeChk.checked = true;
    }

    // Load into Composer
    composerBadge.textContent = update.type;
    composerBadge.className = 'composer-card-badge active';
    composerDate.textContent = update.date;

    // Apply color coordinates to composer badge
    let badgeClass = 'badge-other';
    const typeLower = update.type.toLowerCase();
    if (typeLower.includes('feature')) badgeClass = 'badge-feature';
    else if (typeLower.includes('change')) badgeClass = 'badge-changed';
    else if (typeLower.includes('deprecat')) badgeClass = 'badge-deprecated';
    else if (typeLower.includes('issue')) badgeClass = 'badge-issue';

    // Remove any previous color badge classes
    composerBadge.className = `composer-card-badge active ${badgeClass}`;

    updateComposerText();
    
    // Enable submit
    tweetSubmitBtn.disabled = false;
    
    // Focus & Scroll to Composer on small screens
    if (window.innerWidth <= 992) {
        document.getElementById('sidebar-panel').scrollIntoView({ behavior: 'smooth' });
    }
};

// Clear Composer
function clearComposer() {
    selectedUpdate = null;
    composerBadge.textContent = 'No Update Selected';
    composerBadge.className = 'composer-card-badge';
    composerDate.textContent = '';
    tweetTextarea.value = '';
    tweetSubmitBtn.disabled = true;
    updateCharCounter();
    
    // Remove card selection visual class
    document.querySelectorAll('.note-card').forEach(card => {
        card.classList.remove('selected');
        const chk = card.querySelector('input[type="checkbox"]');
        if (chk) chk.checked = false;
    });
}

// Generate formatted tweet text based on settings
function updateComposerText() {
    if (!selectedUpdate) return;
    
    const options = {
        includeDate: toggleDate.checked,
        includeLink: toggleLink.checked,
        includeTags: toggleTags.checked
    };
    
    tweetTextarea.value = generateTweetFormat(selectedUpdate, options);
    updateCharCounter();
}

// String-HTML Stripping and Formatting Core
function generateTweetFormat(update, options) {
    const temp = document.createElement('div');
    temp.innerHTML = update.content;
    
    // Structure list bullet points
    const listItems = temp.querySelectorAll('li');
    listItems.forEach(li => {
        li.textContent = '• ' + li.textContent.trim() + '\n';
    });
    
    // Handle code blocks
    const codeBlocks = temp.querySelectorAll('code');
    codeBlocks.forEach(code => {
        code.textContent = '`' + code.textContent.trim() + '`';
    });

    let rawText = temp.innerText || temp.textContent || '';
    
    // Normalize newlines
    rawText = rawText.replace(/\n\s*\n/g, '\n').trim();
    
    let header = "";
    if (options.includeDate && update.date) {
        header += `[${update.date}] `;
    }
    header += `BigQuery ${update.type}: `;
    
    let footer = "";
    if (options.includeTags) {
        footer += "\n#BigQuery #GoogleCloud";
    }
    
    // X (Twitter) treats links as 23 characters exactly.
    const urlLength = 23;
    let linkStr = "";
    if (options.includeLink && update.link) {
        linkStr = " " + update.link;
    }
    
    // Calculate space for body
    let staticLength = header.length + footer.length;
    if (options.includeLink && update.link) {
        staticLength += 1 + urlLength; // 1 space + 23 characters
    }
    
    const maxBodyLength = 280 - staticLength;
    let bodyText = rawText;
    
    if (bodyText.length > maxBodyLength) {
        bodyText = bodyText.substring(0, maxBodyLength - 3).trim() + "...";
    }
    
    return header + bodyText + (options.includeLink && update.link ? linkStr : "") + footer;
}

// Update Character Count progress bar and UI
function updateCharCounter() {
    const text = tweetTextarea.value;
    
    // Twitter URL shortening calculation:
    // Any URL is counted as exactly 23 characters.
    const urlRegex = /https?:\/\/[^\s]+/g;
    let computedLength = text.length;
    
    const urls = text.match(urlRegex) || [];
    urls.forEach(url => {
        computedLength = computedLength - url.length + 23;
    });
    
    charCounter.textContent = `${computedLength} / 280`;
    
    // Styling warnings
    charCounter.className = 'char-counter';
    if (computedLength > 280) {
        charCounter.classList.add('danger');
        tweetSubmitBtn.disabled = true;
    } else if (computedLength > 250) {
        charCounter.classList.add('warning');
        tweetSubmitBtn.disabled = false;
    } else {
        tweetSubmitBtn.disabled = text.length === 0;
    }
}

// Tweet Intent opener
function submitTweet() {
    const tweetText = tweetTextarea.value;
    if (!tweetText || tweetText.length === 0) return;
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
}
