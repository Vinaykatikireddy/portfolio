// ============================================
// AES-GCM Markdown Decryption
// ============================================

const Lock = (() => {

    const ALGO = "AES-GCM";
    const KEY_LENGTH = 256;
    const IV_LENGTH = 12;
    const PBKDF2_ITERATIONS = 100000;
    const SALT = "blog-lock-salt";


    async function deriveKey(pin) {
        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            enc.encode(pin),
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        return crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: enc.encode(SALT),
                iterations: PBKDF2_ITERATIONS,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: ALGO, length: KEY_LENGTH },
            false,
            ["decrypt"]
        );
    }


    function isEncrypted(md) {
        return md.trimStart().startsWith("ENCRYPTED-CONTENT:");
    }


    function getEncryptedContent(md) {
        const m = md.match(/^ENCRYPTED-CONTENT:\s*\n([A-Za-z0-9+/=\s]+)/m);
        return m ? m[1].replace(/\s/g, "") : null;
    }


    async function decryptContent(encryptedBase64, pin) {
        const key = await deriveKey(pin);
        const raw = Uint8Array.from(atob(encryptedBase64), c => c.charCodeAt(0));
        const iv = raw.slice(0, IV_LENGTH);
        const ctWithAuthTag = raw.slice(IV_LENGTH);

        const pt = await crypto.subtle.decrypt(
            { name: ALGO, iv },
            key,
            ctWithAuthTag
        );

        return new TextDecoder().decode(pt);
    }


    return { isEncrypted, getEncryptedContent, decryptContent };

})();

window.Lock = Lock;
