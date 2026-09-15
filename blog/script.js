// ============================================
// Marked.js configuration
// ============================================

marked.use({
    gfm: true,
    breaks: true,
    checkboxes: true
});


// ============================================
// Posts configuration
// ============================================

const POSTS = [
    "hello-world",
    "campus-placement-question-papers"
];


// ============================================
// DOM Elements
// ============================================

const home = document.getElementById("home");
const reader = document.getElementById("reader");
const content = document.getElementById("content");
const error = document.getElementById("error");
const progress = document.getElementById("progress");
const year = document.getElementById("year");
const heroTitle = document.getElementById("heroTitle");
const heroSubtitle = document.getElementById("heroSubtitle");
const backButton = document.querySelector(".back");


// ============================================
// Checklist persistence
// ============================================

function getChecklistKey(slug) {
    return `blog-checklist:${slug}`;
}

function loadChecklistState(slug) {
    try {
        return JSON.parse(localStorage.getItem(getChecklistKey(slug))) || [];
    } catch {
        return [];
    }
}

function saveChecklistState(slug, checkboxes) {
    const state = Array.from(checkboxes).map(checkbox => checkbox.checked);

    try {
        localStorage.setItem(
            getChecklistKey(slug),
            JSON.stringify(state)
        );
    } catch (e) {
        console.warn("Could not save checklist state:", e);
    }
}


// ============================================
// Make Markdown checklists interactive
// ============================================

function setupChecklist(slug) {
    const checkboxes = content.querySelectorAll(
        'input[type="checkbox"]'
    );

    if (!checkboxes.length) return;

    // Debug: show actual HTML structure
    const firstCb = checkboxes[0];

    const savedState = loadChecklistState(slug);

    checkboxes.forEach((checkbox, index) => {

        // Restore saved state
        if (savedState[index] !== undefined) {
            checkbox.checked = savedState[index];
        }

        // Allow clicking
        checkbox.removeAttribute("disabled");

        // Remove bullet from this list item
        const li = checkbox.closest("li");
        if (li) {
            li.style.listStyle = "none";
            li.style.marginLeft = "0";
        }

        // Use click to guarantee save
        checkbox.addEventListener("click", () => {
            saveChecklistState(slug, checkboxes);
        });
    });

    // Remove bullets from parent lists
    const list = checkboxes[0]?.closest("ul") || checkboxes[0]?.closest("ol");
    if (list) {
        list.style.listStyle = "none";
        list.style.paddingLeft = "0";
        list.style.marginLeft = "0";
    }
}


// ============================================
// Load home page with all posts
// ============================================

async function loadHome() {
    home.innerHTML = "";

    for (const slug of POSTS) {
        try {
            const response = await fetch(slug + ".md");

            if (!response.ok) {
                throw new Error("Post not found");
            }

            const md = await response.text();
            const locked = Lock.getLockHash(md) !== null;

            // Extract title
            const title =
                (md.match(/^# (.+)$/m) || [])[1] ||
                slug.replace(/-/g, " ");

            // Generate preview text
            const body = md
                .replace(/^# .+$/m, "")
                .replace(/LOCK-PIN:\s*.+$/, "")
                .replace(/[#>*`_\-\[\]\(\)!]/g, "")
                .replace(/\n+/g, " ")
                .trim()
                .substring(0, 160);

            // Create card
            const card = document.createElement("article");
            card.className = "card" + (locked ? " locked" : "");

            card.innerHTML = `
                <h3>${locked ? "🔒 " : ""}${escapeHTML(title)}</h3>
                <p>${escapeHTML(body)}...</p>
                <small>${locked ? "Enter PIN to view →" : "Read article →"}</small>
            `;

            // Open article
            card.onclick = () => {
                history.pushState(
                    {},
                    "",
                    "?post=" + encodeURIComponent(slug)
                );

                loadPost(slug);
            };

            home.appendChild(card);

        } catch (e) {
            console.warn(slug + " missing");
        }
    }
}


// ============================================
// Load a single post
// ============================================

async function loadPost(slug) {
    home.style.display = "none";
    reader.style.display = "block";

    content.style.display = "block";
    content.className = "loading";
    content.innerHTML = "Loading article...";

    error.style.display = "none";

    try {
        const response = await fetch(slug + ".md");

        if (!response.ok) {
            throw new Error("Post not found");
        }

        const rawMd = await response.text();
        const lockHash = Lock.getLockHash(rawMd);

        // If locked, prompt for PIN
        if (lockHash) {
            const overlay = document.createElement("div");
            overlay.className = "pin-overlay";
            overlay.innerHTML = `
                <div class="pin-modal">
                    <div class="pin-icon">🔒</div>
                    <h3>This post is locked</h3>
                    <p>Enter 4-digit PIN to view</p>
                    <input
                        type="password"
                        class="pin-input"
                        maxlength="4"
                        inputmode="numeric"
                        pattern="[0-9]*"
                        placeholder="••••"
                        autofocus
                    />
                    <div class="pin-error" style="display:none"></div>
                    <div class="pin-actions">
                        <button class="pin-btn pin-cancel">Cancel</button>
                        <button class="pin-btn pin-submit">Unlock</button>
                    </div>
                </div>
            `;
            document.body.appendChild(overlay);

            const input = overlay.querySelector(".pin-input");
            const errorEl = overlay.querySelector(".pin-error");
            const cancelBtn = overlay.querySelector(".pin-cancel");
            const submitBtn = overlay.querySelector(".pin-submit");

            input.focus();

            const pin = await new Promise((resolve) => {
                cancelBtn.onclick = () => { overlay.remove(); resolve(null); };
                overlay.onclick = (e) => {
                    if (e.target === overlay) { overlay.remove(); resolve(null); }
                };

                async function trySubmit() {
                    const val = input.value.trim();
                    if (val.length !== 4 || !/^\d{4}$/.test(val)) {
                        errorEl.style.display = "block";
                        errorEl.textContent = "Enter 4 digits";
                        input.value = "";
                        input.focus();
                        return;
                    }
                    submitBtn.disabled = true;
                    submitBtn.textContent = "...";
                    const ok = await Lock.verify(val, lockHash);
                    if (ok) {
                        overlay.remove();
                        resolve(val);
                    } else {
                        errorEl.style.display = "block";
                        errorEl.textContent = "Incorrect PIN";
                        input.value = "";
                        submitBtn.disabled = false;
                        submitBtn.textContent = "Unlock";
                        input.focus();
                    }
                }

                submitBtn.onclick = trySubmit;
                input.onkeydown = (e) => { if (e.key === "Enter") trySubmit(); };
            });

            if (pin === null) {
                showHome();
                return;
            }
        }

        // Strip LOCK-PIN line before rendering
        const md = rawMd.replace(/\n?LOCK-PIN:\s*.+$/, "");

        // Render Markdown
        content.className = "";
        content.innerHTML = marked.parse(md);


        // ========================================
        // Article title
        // ========================================

        const h1 = content.querySelector("h1");

        const title = h1
            ? h1.textContent
            : slug.replace(/-/g, " ");

        document.title = title + " • Vinay";

        heroTitle.textContent = title;


        // ========================================
        // Article subtitle
        // ========================================

        const first = content.querySelector("p");

        heroSubtitle.textContent = first
            ? first.textContent.slice(0, 160)
            : "";


        // ========================================
        // Optimize images
        // ========================================

        content.querySelectorAll("img").forEach(img => {
            img.loading = "lazy";
            img.decoding = "async";
        });


        // ========================================
        // External links
        // ========================================

        content.querySelectorAll("a").forEach(a => {
            if (
                a.hostname &&
                a.hostname !== location.hostname
            ) {
                a.target = "_blank";
                a.rel = "noopener noreferrer";
            }
        });


        // ========================================
        // Interactive Markdown checklists
        // ========================================

        setupChecklist(slug);


        // ========================================
        // Scroll to top
        // ========================================

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    } catch (e) {

        console.error("Failed to load post:", e);

        content.style.display = "none";

        error.style.display = "block";

        heroTitle.textContent = "Post not found";

        heroSubtitle.textContent =
            "The requested article doesn't exist.";
    }
}


// ============================================
// Show home page
// ============================================

function showHome() {

    history.replaceState(
        {},
        "",
        location.pathname
    );

    reader.style.display = "none";

    home.style.display = "grid";

    document.title = "Vinay • Blog";

    heroTitle.textContent = "Welcome to my blog";

    heroSubtitle.textContent =
        "Browse articles written in Markdown with a distraction-free reading experience.";

    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}


// ============================================
// Back button
// ============================================

backButton.onclick = (e) => {

    e.preventDefault();

    showHome();
};


// ============================================
// Browser back / forward navigation
// ============================================

window.onpopstate = () => {

    const slug =
        new URLSearchParams(location.search).get("post");

    if (slug) {
        loadPost(slug);
    } else {
        showHome();
    }
};


// ============================================
// HTML escaping
// ============================================

function escapeHTML(text) {
    const div = document.createElement("div");

    div.textContent = text;

    return div.innerHTML;
}


// ============================================
// Initialize blog
// ============================================

const initialSlug =
    new URLSearchParams(location.search).get("post");

if (initialSlug) {

    loadPost(initialSlug);

} else {

    loadHome();
}


// ============================================
// Footer year
// ============================================

year.textContent = new Date().getFullYear();


// ============================================
// Reading progress bar
// ============================================

window.addEventListener("scroll", () => {

    const height =
        document.documentElement.scrollHeight -
        document.documentElement.clientHeight;

    if (height <= 0) {
        progress.style.width = "0%";
        return;
    }

    const percentage =
        (window.scrollY / height) * 100;

    progress.style.width =
        Math.min(100, Math.max(0, percentage)) + "%";
});