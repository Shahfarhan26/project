import API from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login-form');
    
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            
            try {
                // Show loading state
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Logging in...';
                
                // Send login request
                const response = await API.post('/api/auth/login', {
                    username,
                    password
                });
                
                if (response.token) {
                    // Save token and redirect
                    localStorage.setItem('authToken', response.token);
                    localStorage.setItem('user', JSON.stringify({
                        username: response.username,
                        license_verified: response.license_verified
                    }));
                    
                    // Check license status
                    if (response.license_verified) {
                        window.location.href = '/';
                    } else {
                        // Show license pending message
                        loginForm.innerHTML = `
                            <div class="auth-message">
                                <h3>License Under Review</h3>
                                <p>Your firearms license is being verified by our team.</p>
                                <p>You'll receive an email notification once approved (typically within 24-48 hours).</p>
                                <p>Contact <a href="mailto:licenses@ironarsenal.com">licenses@ironarsenal.com</a> for questions.</p>
                            </div>
                        `;
                    }
                } else {
                    showLoginError(response.message || 'Invalid username or password');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Login';
                }
            } catch (error) {
                console.error('Login error:', error);
                showLoginError('Connection error. Please try again.');
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Login';
            }
        });
    }
});

function showLoginError(message) {
    const errorElement = document.getElementById('login-error') || createErrorElement();
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

function createErrorElement() {
    const errorElement = document.createElement('div');
    errorElement.id = 'login-error';
    errorElement.className = 'error-message';
    document.getElementById('login-form').prepend(errorElement);
    return errorElement;
}

// Password visibility toggle
document.querySelector('.password-toggle')?.addEventListener('click', (e) => {
    const passwordInput = document.getElementById('password');
    const icon = e.target;
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        icon.classList.remove('fa-eye');
        icon.classList.add('fa-eye-slash');
    } else {
        passwordInput.type = 'password';
        icon.classList.remove('fa-eye-slash');
        icon.classList.add('fa-eye');
    }
});