const crypto = require('crypto');

const algorithm = 'aes-256-cbc';
// Key derivation should happen only once, ensure ENCRYPTION_KEY is set
if (!process.env.ENCRYPTION_KEY) {
    throw new Error('ENCRYPTION_KEY environment variable is not set.');
}
const key = crypto.scryptSync(process.env.ENCRYPTION_KEY, 'salt', 32);
// const iv = crypto.randomBytes(16); // Remove this module-scoped IV

const encrypt = (text) => {
    const localIv = crypto.randomBytes(16); // Generate a new IV for each encryption
    const cipher = crypto.createCipheriv(algorithm, key, localIv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${localIv.toString('hex')}:${encrypted}`; // Prepend the new IV
};

const decrypt = (encryptedText) => {
    if (!encryptedText || typeof encryptedText !== 'string' || !encryptedText.includes(':')) {
        // Handle cases where encryptedText might be null, undefined, or malformed
        // This might happen if a field was attempted to be decrypted but was never encrypted
        // or if data corruption occurred.
        // console.error("Invalid encrypted text for decryption:", encryptedText);
        return encryptedText; // Or throw an error, or return null, depending on desired behavior
    }
    const [ivHex, encrypted] = encryptedText.split(':');
    if (!ivHex || !encrypted) {
        // console.error("Malformed encrypted text (missing IV or data):", encryptedText);
        return encryptedText;
    }
    const decipher = crypto.createDecipheriv(algorithm, key, Buffer.from(ivHex, 'hex'));
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};

module.exports = { encrypt, decrypt };