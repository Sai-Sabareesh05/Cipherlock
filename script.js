// Simple Caesar Cipher with custom shift (using password hash)
function generateShiftFromPassword(password) {
    let shift = 0;
    for (let i = 0; i < password.length; i++) {
        shift += password.charCodeAt(i);
    }
    return shift % 256;
}

// Encrypt using XOR cipher (same encryption/decryption method)
function xorEncrypt(text, password) {
    let result = '';
    const shift = generateShiftFromPassword(password);
    
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ shift);
    }
    
    // Convert to base64 for safe transmission
    return btoa(result);
}

// Decrypt using XOR cipher (same method)
function xorDecrypt(encodedText, password) {
    try {
        const result = atob(encodedText);
        let decrypted = '';
        const shift = generateShiftFromPassword(password);
        
        for (let i = 0; i < result.length; i++) {
            decrypted += String.fromCharCode(result.charCodeAt(i) ^ shift);
        }
        
        return decrypted;
    } catch (error) {
        throw new Error('Invalid encrypted format or corrupted data');
    }
}

// Encrypt Message
function encryptMessage() {
    const plaintext = document.getElementById('plaintext').value;
    const password = document.getElementById('encrypt-password').value;

    if (!plaintext.trim()) {
        showAlert('ciphertext', 'Please enter a message to encrypt', 'error');
        return;
    }

    if (!password.trim() || password.length < 8) {
        showAlert('ciphertext', 'Encryption key must be at least 8 characters', 'error');
        return;
    }

    try {
        const encrypted = xorEncrypt(plaintext, password);
        document.getElementById('ciphertext').value = encrypted;
        showAlert('ciphertext', '✓ MESSAGE ENCRYPTED SUCCESSFULLY', 'success');
    } catch (error) {
        showAlert('ciphertext', 'Encryption failed: ' + error.message, 'error');
    }
}

// Decrypt Message
function decryptMessage() {
    const ciphertext = document.getElementById('encrypted-message').value;
    const password = document.getElementById('decrypt-password').value;

    if (!ciphertext.trim()) {
        showAlert('decrypted-message', 'Please paste an encrypted message', 'error');
        return;
    }

    if (!password.trim()) {
        showAlert('decrypted-message', 'Please enter the decryption key', 'error');
        return;
    }

    try {
        const decrypted = xorDecrypt(ciphertext, password);
        
        if (!decrypted) {
            showAlert('decrypted-message', 'Decryption failed - incorrect key or invalid data', 'error');
            return;
        }

        document.getElementById('decrypted-message').value = decrypted;
        showAlert('decrypted-message', '✓ MESSAGE DECRYPTED SUCCESSFULLY', 'success');
    } catch (error) {
        showAlert('decrypted-message', '✗ Decryption failed: ' + error.message, 'error');
    }
}

// Switch Tabs
function switchTab(tabId, button) {
    // Hide all tabs
    const allTabs = document.querySelectorAll('.tab-content');
    allTabs.forEach(tab => tab.classList.remove('active'));

    // Remove active class from all buttons
    const allButtons = document.querySelectorAll('.tab-btn');
    allButtons.forEach(btn => btn.classList.remove('active'));

    // Show selected tab
    document.getElementById(tabId).classList.add('active');
    button.classList.add('active');
}

// Copy to Clipboard
function copyToClipboard(elementId) {
    const element = document.getElementById(elementId);
    
    if (!element.value.trim()) {
        showAlert(elementId, 'Nothing to copy', 'warning');
        return;
    }

    if (navigator.clipboard) {
        navigator.clipboard.writeText(element.value).then(() => {
            showAlert(elementId, '✓ Copied to clipboard', 'success');
        }).catch(() => {
            fallbackCopy(element);
        });
    } else {
        fallbackCopy(element);
    }
}

// Fallback Copy
function fallbackCopy(element) {
    element.select();
    element.setSelectionRange(0, 99999);
    
    try {
        document.execCommand('copy');
        showAlert(element.id, '✓ Copied to clipboard', 'success');
    } catch (error) {
        showAlert(element.id, 'Failed to copy', 'error');
    }
}

// Show Alert Messages
function showAlert(elementId, message, type) {
    const element = document.getElementById(elementId);
    const alertId = elementId + '-alert';
    
    // Remove existing alert
    const existingAlert = document.getElementById(alertId);
    if (existingAlert) {
        existingAlert.remove();
    }

    // Create alert element
    const alert = document.createElement('div');
    alert.id = alertId;
    alert.className = `alert alert-${type}`;
    alert.textContent = message;

    // Insert before the element
    element.parentNode.insertBefore(alert, element);

    // Auto-remove alert after 3 seconds
    setTimeout(() => {
        if (alert.parentNode) {
            alert.remove();
        }
    }, 3000);
}

// Update Key Strength Indicator
function updateKeyStrength(elementId) {
    const key = document.getElementById(elementId).value;
    const strengthBar = document.getElementById('strength-bar');
    const strengthText = document.getElementById('strength-text');
    
    let strength = 0;
    let strengthLevel = 'WEAK';

    // Check password strength
    if (key.length >= 8) strength++;
    if (key.length >= 12) strength++;
    if (/[a-z]/.test(key)) strength++;
    if (/[A-Z]/.test(key)) strength++;
    if (/[0-9]/.test(key)) strength++;
    if (/[!@#$%^&*]/.test(key)) strength++;

    // Determine strength level
    if (strength <= 2) {
        strengthLevel = 'WEAK';
        strengthBar.className = 'strength-bar weak';
    } else if (strength <= 4) {
        strengthLevel = 'MEDIUM';
        strengthBar.className = 'strength-bar medium';
    } else {
        strengthLevel = 'STRONG';
        strengthBar.className = 'strength-bar strong';
    }

    strengthText.textContent = strengthLevel;
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('encrypt-password').addEventListener('keyup', function() {
        updateKeyStrength('encrypt-password');
    });

    // Allow Ctrl+Enter to encrypt/decrypt
    document.getElementById('plaintext').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') encryptMessage();
    });

    document.getElementById('encrypted-message').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') decryptMessage();
    });

    console.log('CIPHER Encryption Tool loaded successfully!');
});
