document.addEventListener('DOMContentLoaded', () => {
    // Check if we're on login or register page
    const isLoginPage = document.getElementById('loginSubmit');
    const isRegisterPage = document.getElementById('registerSubmit');
    
    if (isLoginPage) {
        handleLoginPage();
    } else if (isRegisterPage) {
        handleRegisterPage();
    }
});

// Common functions for both pages
function showError(head, body) {
    const showErrorDiv = document.getElementById('showError');
    
    // Create error element
    const errorElement = document.createElement('div');
    errorElement.className = 'errors';
    
    // Create error HTML
    errorElement.innerHTML = `
        <p class="errorHead">${head}:</p>
        <p class="errorBody">${body}</p>
        <button class="error-close" onclick="dismissError(this)">×</button>
    `;
    
    // Append error to showError div
    showErrorDiv.appendChild(errorElement);
    
    // Show the error container
    showErrorDiv.style.display = 'block';
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        if (errorElement.parentNode) {
            dismissError(errorElement.querySelector('.error-close'));
        }
    }, 5000);
}

function dismissError(closeButton) {
    const errorElement = closeButton.parentElement;
    const showErrorDiv = document.getElementById('showError');
    
    // Add fade-out animation
    errorElement.style.animation = 'fadeOut 0.3s ease-out';
    
    setTimeout(() => {
        if (errorElement.parentNode) {
            errorElement.remove();
        }
        
        // Hide container if no errors left
        if (showErrorDiv.children.length === 0) {
            showErrorDiv.style.display = 'none';
        }
    }, 300);
}

function showFieldError(inputElement, message) {
    const formGroup = inputElement.parentElement;
    let errorElement = formGroup.querySelector('.error-message');
    
    if (!errorElement) {
        errorElement = document.createElement('div');
        errorElement.className = 'error-message';
        formGroup.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    inputElement.classList.add('error');
}

function clearFieldError(inputElement) {
    const formGroup = inputElement.parentElement;
    const errorElement = formGroup.querySelector('.error-message');
    if (errorElement) {
        errorElement.remove();
    }
    inputElement.classList.remove('error');
}

function validateField(inputElement, regex, errorMessage) {
    if (!regex.test(inputElement.value)) {
        showFieldError(inputElement, errorMessage);
        return false;
    }
    clearFieldError(inputElement);
    return true;
}

// Make functions globally accessible
window.dismissError = dismissError;
window.showError = showError;

// LOGIN PAGE FUNCTIONALITY
function handleLoginPage() {
    const loginForm = document.forms['register']; // Note: your login form is named 'register'
    const loginSubmit = document.getElementById('loginSubmit');

    if (!loginForm || !loginSubmit) {
        console.error("Login form or submit button not found.");
        return;
    }

    // Validation patterns for login
    const loginPatterns = {
        usernameOrEmail: /^[^\s@]+@[^\s@]+\.[^\s@]+$|^[a-zA-Z0-9_]{3,30}$/,
        password: /^.{1,}$/ // At least 1 character for login (less strict than registration)
    };

    const loginErrorMessages = {
        usernameOrEmail: 'Please enter a valid username or email address',
        password: 'Please enter your password'
    };

    function handleLoginSubmit(e) {
        e.preventDefault();
        
        const usernameOrEmail = loginForm['usernameOrEmail'];
        const password = loginForm['password'];

        let isValid = true;
        
        // Validate username/email
        if (!usernameOrEmail.value.trim()) {
            showFieldError(usernameOrEmail, loginErrorMessages.usernameOrEmail);
            isValid = false;
        } else {
            clearFieldError(usernameOrEmail);
        }
        
        // Validate password
        if (!password.value.trim()) {
            showFieldError(password, loginErrorMessages.password);
            isValid = false;
        } else {
            clearFieldError(password);
        }

        if (isValid) {
            // Disable submit button to prevent double submission
            loginSubmit.disabled = true;
            loginSubmit.textContent = 'Logging in...';
            
            fetch('/login-in', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    usernameOrEmail: usernameOrEmail.value,
                    password: password.value
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log("Login successful:", data);
                if(data.result != 'Invalid Credentials') {
                    window.location.href = '/home';
                } else {
                    showError('Login Failed', data.result);
                }
            })
            .catch(error => {
                console.error("Login error:", error);
                showError('Login Failed', 'Unable to complete login. Please try again.');
            })
            .finally(() => {
                // Re-enable submit button
                loginSubmit.disabled = false;
                loginSubmit.textContent = 'Log In';
            });
        } else {
            showError('Validation Error', 'Please fix the errors in the form and try again.');
        }
    }

    // Add event listeners for login
    loginSubmit.addEventListener('click', handleLoginSubmit);

    // Real-time validation for login form
    const loginInputs = loginForm.querySelectorAll('input');
    loginInputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.name === 'usernameOrEmail') {
                if (input.value.trim()) {
                    clearFieldError(input);
                }
            } else if (input.name === 'password') {
                if (input.value.trim()) {
                    clearFieldError(input);
                }
            }
        });
    });
}

// REGISTER PAGE FUNCTIONALITY
function handleRegisterPage() {
    const registerForm = document.forms['register'];
    const registerSubmit = document.getElementById('registerSubmit');

    if (!registerForm || !registerSubmit) {
        console.error("Register form or submit button not found.");
        return;
    }

    const regexPatterns = {
        fullName: /^[a-zA-Z\s]{2,30}$/,
        username: /^[a-zA-Z0-9_]{3,30}$/,
        email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        mobile: /^\+?[\d\s-]{10,}$/,
        password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
    };

    const errorMessages = {
        fullName: 'Full name must be 2-30 characters and contain only letters and spaces',
        username: 'Username must be 3-30 characters and contain only letters, numbers, or underscores',
        email: 'Please enter a valid email address',
        mobile: 'Please enter a valid mobile number (minimum 10 digits)',
        password: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character',
        confirmPassword: 'Passwords do not match',
        currency: 'Please select a currency'
    };

    function validateConfirmPassword(password, confirmPassword) {
        if (password.value !== confirmPassword.value) {
            showFieldError(confirmPassword, errorMessages.confirmPassword);
            return false;
        }
        clearFieldError(confirmPassword);
        return true;
    }

    function handleRegisterSubmit(e) {
        e.preventDefault();
        
        const fullName = registerForm['full-name'];
        const username = registerForm['username'];
        const email = registerForm['email'];
        const mobile = registerForm['mobNumber'];
        const password = registerForm['password'];
        const confirmPassword = registerForm['confirm-password'];
        const currency = registerForm['currency'];

        let isValid = true;
        isValid &= validateField(fullName, regexPatterns.fullName, errorMessages.fullName);
        isValid &= validateField(username, regexPatterns.username, errorMessages.username);
        isValid &= validateField(email, regexPatterns.email, errorMessages.email);
        isValid &= validateField(mobile, regexPatterns.mobile, errorMessages.mobile);
        isValid &= validateField(password, regexPatterns.password, errorMessages.password);
        isValid &= validateConfirmPassword(password, confirmPassword);

        if (!currency.value) {
            showFieldError(currency, errorMessages.currency);
            isValid = false;
        } else {
            clearFieldError(currency);
        }

        if (isValid) {
            // Disable submit button to prevent double submission
            registerSubmit.disabled = true;
            registerSubmit.textContent = 'Creating Account...';
            
            fetch('/registration', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    fullName: fullName.value,
                    username: username.value,
                    email: email.value,
                    mobile: mobile.value,
                    password: password.value,
                    currency: currency.value
                })
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                console.log("Registration successful:", data);
                if(data.result == 'Account Created'){
                    window.location.href = '/home';
                }
                else{
                    showError('Error: ', data.result);
                }
            })
            .catch(error => {
                console.error("Registration error:", error);
                showError('Registration Failed', 'Unable to complete registration. Please try again.');
            })
            .finally(() => {
                // Re-enable submit button
                registerSubmit.disabled = false;
                registerSubmit.textContent = 'Register';
            });
        } else {
            showError('Validation Error', 'Please fix the errors in the form and try again.');
        }
    }

    // Add event listeners for registration
    registerSubmit.addEventListener('click', handleRegisterSubmit);

    // Real-time validation for registration form
    const registerInputs = registerForm.querySelectorAll('input, select');
    registerInputs.forEach(input => {
        input.addEventListener('input', () => {
            if (input.name === 'full-name') {
                validateField(input, regexPatterns.fullName, errorMessages.fullName);
            } else if (input.name === 'username') {
                validateField(input, regexPatterns.username, errorMessages.username);
            } else if (input.name === 'email') {
                validateField(input, regexPatterns.email, errorMessages.email);
            } else if (input.name === 'mobNumber') {
                validateField(input, regexPatterns.mobile, errorMessages.mobile);
            } else if (input.name === 'password') {
                validateField(input, regexPatterns.password, errorMessages.password);
            } else if (input.name === 'confirm-password') {
                validateConfirmPassword(registerForm['password'], input);
            } else if (input.name === 'currency') {
                if (input.value) {
                    clearFieldError(input);
                }
            }
        });
    });
}