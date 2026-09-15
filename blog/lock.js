// ============================================
// AES-based PIN Lock System
// ============================================

const Lock = (() => {

    const MASTER_SECRET = "vinay-blog-lock-2026";
    const ALGO = "AES-GCM";
    const KEY_LENGTH = 256;
    const IV_LENGTH = 12;
    const PBKDF2_ITERATIONS = 100000;

    let derivedKey = null;


    async function getKey() {
        if (derivedKey) return derivedKey;

        const enc = new TextEncoder();
        const keyMaterial = await crypto.subtle.importKey(
            "raw",
            enc.encode(MASTER_SECRET),
            "PBKDF2",
            false,
            ["deriveKey"]
        );

        derivedKey = await crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: enc.encode("blog-lock-salt"),
                iterations: PBKDF2_ITERATIONS,
                hash: "SHA-256"
            },
            keyMaterial,
            { name: ALGO, length: KEY_LENGTH },
            false,
            ["encrypt", "decrypt"]
        );

        return derivedKey;
    }


    async function encrypt(pin) {
        const key = await getKey();
        const enc = new TextEncoder();
        const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));

        const ct = await crypto.subtle.encrypt(
            { name: ALGO, iv },
            key,
            enc.encode(pin)
        );

        const buf = new Uint8Array(iv.length + ct.byteLength);
        buf.set(iv, 0);
        buf.set(new Uint8Array(ct), iv.length);

        return btoa(String.fromCharCode(...buf));
    }


    async function verify(pin, hash) {
        try {
            const key = await getKey();
            const dec = new TextDecoder();

            const raw = Uint8Array.from(atob(hash), c => c.charCodeAt(0));
            const iv = raw.slice(0, IV_LENGTH);
            const ct = raw.slice(IV_LENGTH);

            const pt = await crypto.subtle.decrypt(
                { name: ALGO, iv },
                key,
                ct
            );

            return pin === dec.decode(pt);
        } catch {
            return false;
        }
    }


    function getLockHash(md) {
        const lines = md.trim().split("\n");
        const last = lines[lines.length - 1].trim();
        const m = last.match(/^LOCK-PIN:\s*(.+)$/);
        return m ? m[1] : null;
    }


    async function generate(pin) {
        const hash = await encrypt(pin);
        return "LOCK-PIN: " + hash;
    }

    return { encrypt, verify, getLockHash, generate };

})();

// Console helper: Lock.generate("1234") → paste output as last line of .md file
window.Lock = Lock;
