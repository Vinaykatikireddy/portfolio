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

const POSTS_DIR = "posts/";


// ============================================
// Auto-discover posts in the posts/ folder
// ============================================

async function listPosts() {
    try {
        const response = await fetch(POSTS_DIR);

        if (response.ok) {
            const text = await response.text();
            const isJSON = (response.headers.get("content-type") || "")
                .includes("json");

            let names;

            if (isJSON) {
                const entries = JSON.parse(text);
                entries.sort((a, b) =>
                    String(b.mtime || "").localeCompare(String(a.mtime || ""))
                );
                names = entries
                    .filter(e => e.type !== "directory")
                    .map(e => e.name);
            } else {
                const doc = new DOMParser()
                    .parseFromString(text, "text/html");
                names = [...doc.querySelectorAll("a")]
                    .map(a => a.getAttribute("href") || "");
            }

            const slugs = names
                .map(href =>
                    decodeURIComponent(href)
                        .split("/")
                        .pop()
                        .split("?")[0]
                )
                .filter(name => name.endsWith(".md"))
                .map(name => name.slice(0, -3))
                .filter(slug => slug && slug !== "index");

            if (slugs.length) return slugs;
        }
    } catch (e) {
        console.warn("Could not list posts:", e);
    }

    return [];
}


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
const encryptBanner = document.getElementById("encryptBanner");
const postFilters = document.getElementById("postFilters");
const filterPublic = document.getElementById("filterPublic");
const filterLocked = document.getElementById("filterLocked");
const filterEmpty = document.getElementById("filterEmpty");

let postEntries = [];


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
    postEntries = [];
    postFilters.style.display = "none";
    filterEmpty.style.display = "none";
    home.innerHTML = `<p class="posts-loading">loading...</p>`;

    const slugs = await listPosts();

    if (!slugs.length) {
        home.innerHTML = `<p class="posts-loading">No posts yet.</p>`;
        return;
    }

    const postResults = await Promise.all(
        slugs.map(async (slug) => {
            try {
                const response = await fetch(POSTS_DIR + slug + ".md");

                if (!response.ok) {
                    throw new Error("Post not found");
                }

                const md = await response.text();
                const encrypted = Lock.isEncrypted(md);

                let title, body;

                if (encrypted) {
                    title = slug.replace(/-/g, " ");
                    body = "This post is encrypted. Enter PIN to view";
                } else {
                    title =
                        (md.match(/^# (.+)$/m) || [])[1] ||
                        slug.replace(/-/g, " ");
                    body = md
                        .replace(/^# .+$/m, "")
                        .replace(/[#>*`_\-\[\]\(\)!]/g, "")
                        .replace(/\n+/g, " ")
                        .trim()
                        .substring(0, 160);
                }

                // Create card
                const card = document.createElement("article");
                card.className = "card" + (encrypted ? " locked" : "");

                card.innerHTML = `
                    <h3>${encrypted ? "🔒 " : ""}${escapeHTML(title)}</h3>
                    <p>${escapeHTML(body)}...</p>
                    <small>${encrypted ? "Enter PIN to view →" : "Read article →"}</small>
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

                return { encrypted, card };

            } catch (e) {
                console.warn(slug + " missing", e);
                return null;
            }
        })
    );

    const validPosts = postResults.filter(Boolean);

    home.innerHTML = "";

    if (!validPosts.length) {
        home.innerHTML = `<p class="posts-loading">No posts yet.</p>`;
        return;
    }

    const fragment = document.createDocumentFragment();
    validPosts.forEach(entry => {
        fragment.appendChild(entry.card);
        postEntries.push(entry);
    });

    home.appendChild(fragment);

    postFilters.style.display = "";

    renderHome();
}


// ============================================
// Public / locked post filters
// ============================================

function renderHome() {
    const showPublic = filterPublic.checked;
    const showLocked = filterLocked.checked;

    let visible = 0;

    for (const entry of postEntries) {
        const show = entry.encrypted ? showLocked : showPublic;
        entry.card.style.display = show ? "" : "none";
        if (show) visible++;
    }

    filterEmpty.style.display =
        postEntries.length && !visible ? "block" : "none";
}

filterPublic.onchange = renderHome;
filterLocked.onchange = renderHome;


// ============================================
// Load a single post
// ============================================

async function loadPost(slug) {
    home.style.display = "none";
    reader.style.display = "block";
    encryptBanner.style.display = "none";
    postFilters.style.display = "none";
    filterEmpty.style.display = "none";

    content.style.display = "block";
    content.className = "loading";
    content.innerHTML = "Loading article...";

    error.style.display = "none";

    try {
        const response = await fetch(POSTS_DIR + slug + ".md");

        if (!response.ok) {
            throw new Error("Post not found");
        }

        const rawMd = await response.text();
        const encrypted = Lock.isEncrypted(rawMd);
        let md;

        if (encrypted) {
            const overlay = document.createElement("div");
            overlay.className = "pin-overlay";
            overlay.innerHTML = `
                <div class="pin-modal">
                    <div class="pin-icon">🔒</div>
                    <h3>This post is encrypted</h3>
                    <p>Enter PIN (4–10 letters or digits)</p>
                    <input
                        type="password"
                        class="pin-input"
                        maxlength="10"
                        pattern="[A-Za-z0-9]*"
                        placeholder="4-10 chars"
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

                let checking = false;

                async function autoCheck() {
                    if (checking) return;
                    checking = true;
                    try {
                        while (true) {
                            const val = input.value;
                            if (!val) break;
                            let res;
                            try {
                                res = await Lock.decryptContent(Lock.getEncryptedContent(rawMd), val);
                            } catch {
                                if (input.value === val) break;
                                continue;
                            }
                            if (input.value !== val) continue;
                            md = res;
                            overlay.remove();
                            resolve(val);
                            break;
                        }
                    } finally {
                        checking = false;
                    }
                }

                async function trySubmit() {
                    const val = input.value;
                    if (!/^[A-Za-z0-9]{4,10}$/.test(val)) {
                        errorEl.style.display = "block";
                        errorEl.textContent = "Enter 4–10 letters or digits";
                        input.focus();
                        return;
                    }
                    submitBtn.disabled = true;
                    submitBtn.textContent = "...";

                    try {
                        const encryptedData = Lock.getEncryptedContent(rawMd);
                        md = await Lock.decryptContent(encryptedData, val);
                        overlay.remove();
                        resolve(val);
                    } catch {
                        errorEl.style.display = "block";
                        errorEl.textContent = "Wrong PIN";
                        submitBtn.disabled = false;
                        submitBtn.textContent = "Unlock";
                        input.focus();
                    }
                }

                submitBtn.onclick = trySubmit;
                input.onkeydown = (e) => { if (e.key === "Enter") { e.preventDefault(); trySubmit(); } };
                input.oninput = () => {
                    const cleaned = input.value.replace(/[^A-Za-z0-9]/g, "");
                    if (cleaned !== input.value) input.value = cleaned;
                    errorEl.style.display = "none";
                    autoCheck();
                };
            });

            if (pin === null) {
                showHome();
                return;
            }
        } else {
            md = rawMd;
        }

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
    encryptBanner.style.display = "";
    postFilters.style.display = postEntries.length ? "" : "none";

    renderHome();

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

function readSlug() {
    const slug =
        new URLSearchParams(location.search).get("post") || "";

    return slug.replace(/[^A-Za-z0-9_-]/g, "");
}

window.onpopstate = () => {

    const slug = readSlug();

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

const initialSlug = readSlug();

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
// Theme toggle (shared with portfolio — same "theme" key)
// ============================================

const themeToggle = document.getElementById("themeToggle");

function applyTheme(theme, persist) {
    document.documentElement.setAttribute("data-theme", theme);

    if (persist) {
        try { localStorage.setItem("theme", theme); } catch (e) { }
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
        metaTheme.setAttribute("content", theme === "dark" ? "#000000" : "#ffffff");
    }

    if (themeToggle) {
        const icon = themeToggle.querySelector("i");
        icon.classList.toggle("fa-moon", theme !== "dark");
        icon.classList.toggle("fa-sun", theme === "dark");
        themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
    }
}

applyTheme(document.documentElement.getAttribute("data-theme") || "light", false);

if (themeToggle) {
    themeToggle.addEventListener("click", () => {
        const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
        applyTheme(next, true);
    });
}


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
