import API from './api.js';

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const licenseImageInput = document.getElementById('license-image');
    const licensePreview = document.getElementById('license-preview');

    // License image preview
    licenseImageInput?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (event) => {
                licensePreview.innerHTML = `
                    <div class="preview-container">
                        <img src="${event.target.result}" alt="License Preview">
                        <button type="button" class="btn-remove" aria-label="Remove image">
                            &times;
                        </button>
                    </div>
                `;
                
                // Add remove image handler
                licensePreview.querySelector('.btn-remove').addEventListener('click', () => {
                    licensePreview.innerHTML = '';
                    licenseImageInput.value = '';
                });
            };
            reader.readAsDataURL(file);
        }
    });

    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Form validation
            if (!validateForm()) return;
            
            const formData = new FormData();
            formData.append('full_name', document.getElementById('fullname').value);
            formData.append('username', document.getElementById('username').value);
            formData.append('email', document.getElementById('email').value);
            formData.append('password', document.getElementById('password').value);
            formData.append('license_number', document.getElementById('license-number').value);
            
            const licenseFile = licenseImageInput.files[0];
            if (licenseFile) {
                formData.append('license_image', licenseFile);
            }

            try {
                // Show loading state
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                submitBtn.disabled = true;
                submitBtn.textContent = 'Registering...';
                
                // Submit registration
                const response = await API.upload('/api/auth/register', formData);
                
                if (response.success) {
                    // Show success message
                    registerForm.innerHTML = `
                        <div class="auth-message success">
                            <h3>Registration Submitted</h3>
                            <p>Your account is pending license verification.</p>
                            <p>Our team will review your documents within 24-48 hours.</p>
                            <p>You'll receive an email notification once approved.</p>
                            <a href="/login.html" class="btn">Go to Login</a>
                        </div>
                    `;
                } else {
                    showRegistrationError(response.message || 'Registration failed');
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Register';
                }
            } catch (error) {
                console.error('Registration error:', error);
                showRegistrationError(error.message || 'Connection error. Please try again.');
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                submitBtn.disabled = false;
                submitBtn.textContent = 'Register';
            }
        });
    }
});

function validateForm() {
    const password = document.getElementById('password').value;
    const licenseNumber = document.getElementById('license-number').value;
    const licenseFile = document.getElementById('license-image').files[0];
    let isValid = true;

    // Clear previous errors
    document.querySelectorAll('.error-message').forEach(el => el.remove());

    // Password validation (min 8 chars, 1 number, 1 special char)
    if (password.length < 8) {
        showFieldError('password', 'Password must be at least 8 characters');
        isValid = false;
    } else if (!/\d/.test(password)) {
        showFieldError('password', 'Password must contain at least 1 number');
        isValid = false;
    } else if (!/[!@#$%^&*]/.test(password)) {
        showFieldError('password', 'Password must contain at least 1 special character');
        isValid = false;
    }

    // License number validation (alphanumeric)
    if (!/^[a-zA-Z0-9]{8,20}$/.test(licenseNumber)) {
        showFieldError('license-number', 'License number must be 8-20 alphanumeric characters');
        isValid = false;
    }

    // License file validation
    if (!licenseFile) {
        showFieldError('license-image', 'License image is required');
        isValid = false;
    } else if (licenseFile.size > 5 * 1024 * 1024) { // 5MB
        showFieldError('license-image', 'File size must be less than 5MB');
        isValid = false;
    } else if (!['image/jpeg', 'image/png', 'application/pdf'].includes(licenseFile.type)) {
        showFieldError('license-image', 'Only JPG, PNG, or PDF files allowed');
        isValid = false;
    }

    return isValid;
}

function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    const errorElement = document.createElement('div');
    errorElement.className = 'error-message';
    errorElement.textContent = message;
    errorElement.id = `${fieldId}-error`;
    
    // Insert after the field
    field.parentNode.insertBefore(errorElement, field.nextSibling);
}

function showRegistrationError(message) {
    const errorElement = document.getElementById('register-error') || createErrorElement();
    errorElement.textContent = message;
    errorElement.style.display = 'block';
    
    // Auto-hide after 5 seconds
    setTimeout(() => {
        errorElement.style.display = 'none';
    }, 5000);
}

function createErrorElement() {
    const errorElement = document.createElement('div');
    errorElement.id = 'register-error';
    errorElement.className = 'error-message';
    document.getElementById('register-form').prepend(errorElement);
    return errorElement;
}