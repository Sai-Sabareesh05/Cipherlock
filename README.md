# 🔐 Encryption & Hashing Tool

A secure, client-side web application for encryption, decryption, and hashing operations. All processing happens in your browser - your data is never sent to any server.

## Features

### 🔒 Encryption
- **Algorithm**: AES-256 encryption
- **Input**: Plain text and encryption key
- **Output**: Base64-encoded encrypted data
- **Key Strength Indicator**: Visual feedback on key security

### 🔓 Decryption
- **Algorithm**: AES-256 decryption
- **Input**: Encrypted text (Base64) and decryption key
- **Output**: Original plain text
- **Error Handling**: Clear feedback for incorrect keys or invalid data

### 🔑 Hashing
- **Algorithms Supported**:
  - SHA-256 (recommended)
  - SHA-512 (strongest)
  - SHA-1 (legacy)
  - MD5 (legacy, not recommended)
- **Use Case**: Generate fixed-length hashes for data verification
- **One-way**: Hashes cannot be reversed

## Security Features

✅ **Client-side processing** - No data transmission to servers  
✅ **AES-256 encryption** - Military-grade encryption standard  
✅ **Key strength meter** - Visual indicator for password security  
✅ **Multiple hash algorithms** - Choose the right algorithm for your needs  
✅ **Copy to clipboard** - Easy data sharing with automatic notification  
✅ **Error handling** - Clear messages for user guidance  
✅ **Responsive design** - Works on desktop, tablet, and mobile  

## How to Use

### Encryption
1. Navigate to the **Encrypt** tab
2. Enter the text you want to encrypt
3. Create a strong encryption key (minimum 8 characters)
4. Click **Encrypt**
5. Your encrypted text appears in Base64 format
6. Click **Copy** to copy to clipboard

### Decryption
1. Navigate to the **Decrypt** tab
2. Paste the encrypted text (Base64 format)
3. Enter the same key used for encryption
4. Click **Decrypt**
5. Original text is revealed if the key is correct

### Hashing
1. Navigate to the **Hash** tab
2. Enter text to hash
3. Select your preferred hash algorithm (SHA-256 recommended)
4. Click **Hash**
5. Fixed-length hash appears in the output
6. Click **Copy** to copy to clipboard

## Key Strength Levels

- **Weak** 🔴: Less than 8 characters or limited character variety
- **Medium** 🟠: 8-12 characters with mixed case and numbers
- **Strong** 🟢: 12+ characters with uppercase, lowercase, numbers, and special characters

## Technical Stack

- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Cryptography**: CryptoJS 4.1.0
- **Browser Compatibility**: All modern browsers (Chrome, Firefox, Safari, Edge)
- **No Dependencies**: Standalone static webpage

## Installation

1. Clone this repository
2. Open `index.html` in your web browser
3. No server or build process required!

## File Structure

```
.
├── index.html       # Main HTML structure
├── styles.css       # Styling and responsive design
├── script.js        # JavaScript functionality
└── README.md        # This file
```

## Browser Support

| Browser | Support |
|---------|---------|
| Chrome  | ✅ Latest |
| Firefox | ✅ Latest |
| Safari  | ✅ Latest |
| Edge    | ✅ Latest |
| IE 11   | ⚠️ Limited |

## Important Security Notes

⚠️ **Disclaimer**: While this tool uses strong encryption algorithms, it should not be used for production security-critical applications without proper validation and security audits.

⚠️ **Remember Your Key**: There is no "forgot password" - if you lose your encryption key, your data cannot be recovered.

⚠️ **Browser Security**: Keep your browser and system updated for optimal security.

⚠️ **Private Network**: For maximum security, consider using this tool on a private/offline network.

## How It Works

### Encryption Process
1. User enters plaintext and encryption key
2. CryptoJS uses AES-256 algorithm
3. Encrypted data is returned in Base64 format
4. Result is displayed and can be copied

### Decryption Process
1. User enters Base64-encoded encrypted text and key
2. CryptoJS decrypts using the provided key
3. Original plaintext is returned
4. Validation ensures key correctness

### Hashing Process
1. User enters text to hash
2. Selected algorithm processes the input
3. Fixed-length hash is generated
4. Cannot be reversed or decrypted

## Performance

- Encryption/Decryption: < 100ms for typical text
- Hashing: < 10ms for typical text
- All operations happen instantly in your browser

## Privacy

Your data is:
- ✅ Never sent to any server
- ✅ Processed entirely on your device
- ✅ Only stored in your browser while you're using it
- ✅ Cleared when you close the page (unless copied)

## License

This project is provided as-is for educational and personal use.

## Support

For issues or suggestions, please visit the GitHub repository.

---

**Happy Encrypting! 🔐**
