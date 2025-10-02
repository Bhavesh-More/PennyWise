// Cookie utility functions
function setCookie(name, value, days) {
    const expires = new Date();
    expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
    document.cookie = name + '=' + value + ';expires=' + expires.toUTCString() + ';path=/';
}

function getCookie(name) {
    const nameEQ = name + '=';
    const ca = document.cookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) === 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}

function deleteCookie(name) {
    document.cookie = name + '=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
}

// Dark mode functions
function initializeDarkMode() {
    const darkModeStatus = getCookie('darkMode');
    
    // If cookie doesn't exist, set default to 'off'
    if (darkModeStatus === null) {
        setCookie('darkMode', 'off', 365); // Store for 1 year
        document.body.classList.remove('dark-mode');
    } else if (darkModeStatus === 'on') {
        document.body.classList.add('dark-mode');
    } else {
        document.body.classList.remove('dark-mode');
    }
    
    // Update the toggle UI to reflect current state
    updateDarkModeToggle();
}

function updateDarkModeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const darkModeStatus = getCookie('darkMode');
        themeToggle.checked = (darkModeStatus === 'on');
        // Add event listener for real-time toggle
        themeToggle.addEventListener('change', function() {
            const isDarkMode = this.checked;
            document.body.classList.toggle('dark-mode', isDarkMode);
            setCookie('darkMode', isDarkMode ? 'on' : 'off', 365);
        });
    }
}

// Main initialization
document.addEventListener('DOMContentLoaded', function() {
    initializeDarkMode(); // Initialize dark mode first
    initializeProfileSection();
    initializeErrorMessages();
});

// Initialize profile section functionality
function initializeProfileSection() {
    const settingsSection = document.getElementById('settings');
    if (settingsSection) {
        const observer = new MutationObserver(function(mutations) {
            mutations.forEach(function(mutation) {
                if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
                    if (settingsSection.classList.contains('active')) {
                        setupProfileCards();
                    }
                }
            });
        });

        observer.observe(settingsSection, { attributes: true });
        
        if (settingsSection.classList.contains('active')) {
            setupProfileCards();
        }
    }
}

// Setup click handlers for profile cards
function setupProfileCards() {
    const profileCard = document.getElementById('profile-card');
    const updateProfileCard = document.getElementById('update-profile-card');
    const settingsCard = document.getElementById('settings-card');
    const updateProfileForm = document.getElementById('updateProfileForm');
    const settingsForm = document.getElementById('settingsForm');

    if (profileCard && !profileCard.hasAttribute('data-listener')) {
        profileCard.addEventListener('click', showProfileInfo);
        profileCard.setAttribute('data-listener', 'true');
    }

    if (updateProfileCard && !updateProfileCard.hasAttribute('data-listener')) {
        updateProfileCard.addEventListener('click', showUpdateProfileForm);
        updateProfileCard.setAttribute('data-listener', 'true');
    }

    if (settingsCard && !settingsCard.hasAttribute('data-listener')) {
        settingsCard.addEventListener('click', showSettingsForm);
        settingsCard.setAttribute('data-listener', 'true');
    }

    // Add form event listeners
    if (updateProfileForm && !updateProfileForm.hasAttribute('data-listener')) {
        updateProfileForm.addEventListener('submit', handleUpdateProfileSubmit);
        updateProfileForm.setAttribute('data-listener', 'true');
    }

    if (settingsForm && !settingsForm.hasAttribute('data-listener')) {
        settingsForm.addEventListener('submit', handleSettingsSubmit);
        settingsForm.setAttribute('data-listener', 'true');
    }
}

// Utility functions for showing/hiding elements
function showElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.remove('disabled');
        element.style.animation = 'fadeIn 0.5s ease-out';
    }
}

function hideElement(elementId) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.add('disabled');
    }
}

function hideAllForms() {
    hideElement('profile-info-display');
    hideElement('update-profile-form');
    hideElement('settings-form');
    hideElement('loading-indicator');
    hideElement('success-message');
    hideElement('error-message');
}

// Profile Information Functions
function showProfileInfo() {
    hideAllForms();
    showLoadingIndicator();

    fetch('/show-profile-info', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({})
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        hideLoadingIndicator();
        
        if (data.success) {
            populateProfileInfo(data.userInfo);
            showElement('profile-info-display');
        } else {
            showErrorMessage(data.error || 'Failed to load profile information');
        }
    })
    .catch(error => {
        hideLoadingIndicator();
        console.error('Error fetching profile info:', error);
        showErrorMessage('Failed to load profile information. Please try again.');
    });
}

function populateProfileInfo(userInfo) {
    // Format date
    let formattedDate = 'Not available';
    if (userInfo.dateOfCreation) {
        const date = new Date(userInfo.dateOfCreation);
        formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    // Currency symbols
    const currencySymbols = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'AUD': 'A$',
        'CAD': 'C$'
    };

    const currencySymbol = currencySymbols[userInfo.currency] || userInfo.currency;

    // Update profile information in the existing HTML
    document.getElementById('profile-user-id').textContent = `#${userInfo.id}`;
    document.getElementById('profile-full-name').textContent = userInfo.fullName || 'Not provided';
    document.getElementById('profile-username').textContent = userInfo.username || 'Not provided';
    document.getElementById('profile-mobile').textContent = userInfo.mobileNumber || 'Not provided';
    document.getElementById('profile-email').textContent = userInfo.email || 'Not provided';
    document.getElementById('profile-currency').textContent = `${userInfo.currency} (${currencySymbol})`;
    document.getElementById('profile-created-date').textContent = formattedDate;
}

function closeProfileInfo() {
    hideElement('profile-info-display');
}

// Update Profile Form Functions
function showUpdateProfileForm() {
    hideAllForms();
    showLoadingIndicator();
    
    fetch('/get-user-profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify({})
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        hideLoadingIndicator();
        if (data.success) {
            populateUpdateProfileForm(data.profile);
            showElement('update-profile-form');
        } else {
            showErrorMessage(data.error || 'Failed to load profile data for editing');
        }
    })
    .catch(error => {
        hideLoadingIndicator();
        console.error('Error fetching profile for update:', error);
        showErrorMessage('Failed to load profile data. Please try again.');
    });
}

function populateUpdateProfileForm(profileData) {
    document.getElementById('update-fullName').value = profileData.fullName || '';
    document.getElementById('update-username').value = profileData.username || '';
    document.getElementById('update-email').value = profileData.email || '';
    document.getElementById('update-currency').value = profileData.currency || 'INR';
}

function closeUpdateProfileForm() {
    hideElement('update-profile-form');
}

// Settings Form Functions
function showSettingsForm() {
    hideAllForms();
    showElement('settings-form');
    
    // Set the toggle to reflect current dark mode status
    updateDarkModeToggle();
}

function closeSettingsForm() {
    hideElement('settings-form');
}

// Form Submission Handlers
function handleSettingsSubmit(event) {
    event.preventDefault();
    
    const themeToggle = document.getElementById('theme-toggle').checked;
    const notificationToggle = document.getElementById('notification-toggle').checked;
    const compactToggle = document.getElementById('compact-toggle').checked;

    // Handle dark mode with cookie persistence
    document.body.classList.toggle('dark-mode', themeToggle);
    setCookie('darkMode', themeToggle ? 'on' : 'off', 365);

    // Handle compact view
    document.body.classList.toggle('compact-view', compactToggle);

    showSuccessMessage('Settings updated successfully!');
    setTimeout(() => {
        hideElement('success-message');
        closeSettingsForm();
    }, 2000);
}

function handleUpdateProfileSubmit(event) {
    event.preventDefault();
    
    const formData = new FormData(event.target);
    const updateData = {
        fullName: formData.get('fullName'),
        username: formData.get('username'),
        email: formData.get('email'),
        currency: formData.get('currency')
    };

    if (!updateData.fullName || !updateData.username || !updateData.email || !updateData.currency) {
        showErrorMessage('All fields are required');
        return;
    }

    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Updating...';
    submitBtn.disabled = true;

    fetch('/update-profile', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Requested-With': 'XMLHttpRequest'
        },
        body: JSON.stringify(updateData)
    })
    .then(response => {
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            showSuccessMessage(data.message || 'Profile updated successfully!');
            
            // Update UI elements
            const usernameElements = document.querySelectorAll('.dashboard-greeting');
            usernameElements.forEach(element => {
                if (element.textContent.includes('Hello,')) {
                    element.innerHTML = `Hello, ${updateData.username}<br>Here's a quick overview of your finances.`;
                }
            });
            
            updateCurrencyDisplay(updateData.currency);
            
            setTimeout(() => {
                hideElement('success-message');
                closeUpdateProfileForm();
            }, 2000);
        } else {
            showErrorMessage(data.error || 'Failed to update profile');
        }
    })
    .catch(error => {
        console.error('Error updating profile:', error);
        showErrorMessage('Failed to update profile. Please try again.');
    })
    .finally(() => {
        submitBtn.innerHTML = originalText;
        submitBtn.disabled = false;
    });
}

// Utility Functions
function updateCurrencyDisplay(currency) {
    const currencySymbols = {
        'INR': '₹',
        'USD': '$',
        'EUR': '€',
        'GBP': '£',
        'JPY': '¥',
        'AUD': 'A$',
        'CAD': 'C$'
    };
    
    const currencySymbol = currencySymbols[currency] || currency;
    
    const currencyElements = document.querySelectorAll('[data-currency]');
    currencyElements.forEach(element => {
        element.textContent = currencySymbol;
    });
    
    const expenseCards = document.querySelectorAll('.expense-card');
    expenseCards.forEach(card => {
        const spans = card.querySelectorAll('.expense-details span');
        spans.forEach(span => {
            if (span.textContent.includes('₹') || span.textContent.includes('$') || 
                span.textContent.includes('€') || span.textContent.includes('£') || 
                span.textContent.includes('¥')) {
                span.textContent = currencySymbol + '0';
            }
        });
    });
}

// Message Functions
function showLoadingIndicator() {
    showElement('loading-indicator');
}

function hideLoadingIndicator() {
    hideElement('loading-indicator');
}

function showSuccessMessage(message) {
    hideElement('error-message');
    document.getElementById('success-text').textContent = message;
    showElement('success-message');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideElement('success-message');
    }, 5000);
}

function showErrorMessage(message) {
    hideElement('success-message');
    document.getElementById('error-text').textContent = message;
    showElement('error-message');
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        hideElement('error-message');
    }, 5000);
}

// Initialize error messages (for backward compatibility)
function initializeErrorMessages() {
    const showErrorDiv = document.getElementById('showError');
    if (showErrorDiv) {
        window.showMainError = function(message) {
            showErrorDiv.innerHTML = `
                <div class="error-alert">
                    <i class="fas fa-exclamation-triangle"></i>
                    <span>${message}</span>
                    <button class="close-error" onclick="hideMainError()">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            `;
            showErrorDiv.style.display = 'block';
            
            setTimeout(() => {
                hideMainError();
            }, 5000);
        };
        
        window.hideMainError = function() {
            showErrorDiv.style.display = 'none';
            showErrorDiv.innerHTML = '';
        };
    }
}

// Quick toggle function for dark mode
function quickToggleDarkMode() {
    const currentStatus = getCookie('darkMode');
    
    if (currentStatus === 'on') {
        document.body.classList.remove('dark-mode');
        setCookie('darkMode', 'off', 365);
    } else {
        document.body.classList.add('dark-mode');
        setCookie('darkMode', 'on', 365);
    }
    
    // Update the toggle if the settings form is open
    updateDarkModeToggle();
}

// Logout function
function logout() {
    // Clear all cookies
    document.cookie.split(";").forEach(function(c) { 
        document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
    });
    
    // Clear session storage
    sessionStorage.clear();
    
    // Clear local storage (if any)
    localStorage.clear();
    
    // Redirect to home page
    window.location.href = '/';
}

// Make functions globally available
window.showProfileInfo = showProfileInfo;
window.closeProfileInfo = closeProfileInfo;
window.showUpdateProfileForm = showUpdateProfileForm;
window.closeUpdateProfileForm = closeUpdateProfileForm;
window.showSettingsForm = showSettingsForm;
window.closeSettingsForm = closeSettingsForm;
window.quickToggleDarkMode = quickToggleDarkMode;
window.logout = logout;

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        showProfileInfo,
        closeProfileInfo,
        showUpdateProfileForm,
        closeUpdateProfileForm,
        showSettingsForm,
        closeSettingsForm,
        showSuccessMessage,
        showErrorMessage,
        quickToggleDarkMode,
        logout
    };
}