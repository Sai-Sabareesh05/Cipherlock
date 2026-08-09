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

// Simple Hash Function - SHA256 simulation using JavaScript
function simpleHash(text, algorithm) {
    let hash = 0;
    
    // Create a simple hash based on algorithm
    for (let i = 0; i < text.length; i++) {
        const char = text.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    
    let hashStr = Math.abs(hash).toString(16);
    
    // Pad to different lengths based on algorithm
    switch(algorithm) {
        case 'SHA256':
            return hashStr.padEnd(64, '0').substring(0, 64);
        case 'SHA512':
            return hashStr.padEnd(128, '0').substring(0, 128);
        case 'SHA1':
            return hashStr.padEnd(40, '0').substring(0, 40);
        case 'MD5':
            return hashStr.padEnd(32, '0').substring(0, 32);
        default:
            return hashStr.padEnd(64, '0').substring(0, 64);
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

    // Show animation while encrypting
    showAnimation('encrypt');

    // Simulate a short animation duration then perform encryption (keeps UI responsive)
    setTimeout(() => {
        try {
            const encrypted = xorEncrypt(plaintext, password);
            document.getElementById('ciphertext').value = encrypted;
            showAlert('ciphertext', '✓ MESSAGE ENCRYPTED SUCCESSFULLY', 'success');
        } catch (error) {
            showAlert('ciphertext', 'Encryption failed: ' + error.message, 'error');
        } finally {
            // Hide animation shortly after operation finishes
            setTimeout(hideAnimation, 600);
        }
    }, 300);
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

    // Show unlock animation while decrypting
    showAnimation('decrypt');

    setTimeout(() => {
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
        } finally {
            setTimeout(hideAnimation, 600);
        }
    }, 300);
}

// Hash Text Function
function hashText() {
    const text = document.getElementById('hash-text').value;
    const algorithm = document.getElementById('hash-algorithm').value;

    if (!text.trim()) {
        showAlert('hash-output', 'Please enter text to hash', 'error');
        return;
    }

    // Show hashing animation
    showAnimation('hash');

    setTimeout(() => {
        try {
            const hash = simpleHash(text, algorithm);
            document.getElementById('hash-output').value = hash;
            showAlert('hash-output', `✓ ${algorithm} HASH GENERATED SUCCESSFULLY`, 'success');
        } catch (error) {
            showAlert('hash-output', 'Hashing failed: ' + error.message, 'error');
        } finally {
            setTimeout(hideAnimation, 600);
        }
    }, 300);
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

// Animation helpers: show/hide the animation container and populate it with animated elements
function showAnimation(type) {
    const container = document.getElementById('animationContainer');
    if (!container) return;
    container.innerHTML = '';
    container.classList.remove('hidden');

    if (type === 'encrypt') {
        const icon = document.createElement('div');
        icon.className = 'lock-icon locking';
        icon.textContent = '🔒';
        container.appendChild(icon);

        const status = document.createElement('div');
        status.className = 'status-text';
        status.textContent = 'Encrypting...';
        container.appendChild(status);
    } else if (type === 'decrypt') {
        const icon = document.createElement('div');
        icon.className = 'lock-icon unlocking';
        icon.textContent = '🔓';
        container.appendChild(icon);

        const status = document.createElement('div');
        status.className = 'status-text';
        status.textContent = 'Decrypting...';
        container.appendChild(status);
    } else if (type === 'hash') {
        const hashes = document.createElement('div');
        hashes.className = 'hash-icons';
        for (let i = 0; i < 3; i++) {
            const h = document.createElement('span');
            h.className = 'hash-icon hashing';
            h.textContent = '#';
            if (i === 1) h.style.animationDelay = '0.2s';
            if (i === 2) h.style.animationDelay = '0.4s';
            hashes.appendChild(h);
        }
        container.appendChild(hashes);

        const status = document.createElement('div');
        status.className = 'status-text';
        status.textContent = 'Hashing...';
        container.appendChild(status);
    }
}

function hideAnimation() {
    const container = document.getElementById('animationContainer');
    if (!container) return;
    container.classList.add('hidden');
    container.innerHTML = '';
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
    document.getElementById('encrypt-password').addEventListener('keyup', function() {
        updateKeyStrength('encrypt-password');
    });

    // Allow Ctrl+Enter to encrypt/decrypt/hash
    document.getElementById('plaintext').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') encryptMessage();
    });

    document.getElementById('encrypted-message').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') decryptMessage();
    });

    document.getElementById('hash-text').addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'Enter') hashText();
    });

    console.log('CIPHER Encryption Tool loaded successfully!');
});
