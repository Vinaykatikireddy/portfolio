// Marked.js configuration
marked.setOptions({
    gfm: true,
    breaks: true
});

// Posts configuration
const POSTS = [
    "hello-world",
    "campus-placement-question-papers"
];

// DOM Elements
const home = document.getElementById("home");
const reader = document.getElementById("reader");
const content = document.getElementById("content");
const error = document.getElementById("error");
const progress = document.getElementById("progress");
const year = document.getElementById("year");
const heroTitle = document.getElementById("heroTitle");
const heroSubtitle = document.getElementById("heroSubtitle");
const backButton = document.querySelector(".back");

// Load home page with all posts
async function loadHome() {
    home.innerHTML = "";

    for (const slug of POSTS) {
        try {
            const md = await fetch(slug + ".md").then(r => {
                if (!r.ok) throw "";
                return r.text();
            });

            const title = (md.match(/^# (.+)$/m) || [])[1] || slug.replace(/-/g, " ");
            const body = md
                .replace(/^# .+$/m, "")
                .replace(/[#>*`_\-\[\]\(\)!]/g, "")
                .replace(/\n+/g, " ")
                .trim()
                .substring(0, 160);

            const card = document.createElement("article");
            card.className = "card";
            card.innerHTML = `
                <h3>${title}</h3>
                <p>${body}...</p>
                <small>Read article →</small>
            `;

            card.onclick = () => {
                history.pushState({}, '', "?post=" + slug);
                loadPost(slug);
            };

            home.appendChild(card);
        } catch (e) {
            console.warn(slug + " missing");
        }
    }
}

// Load a single post
async function loadPost(slug) {
    home.style.display = "none";
    reader.style.display = "block";

    content.style.display = "block";
    content.className = "loading";
    content.innerHTML = "Loading article...";
    error.style.display = "none";

    try {
        const md = await fetch(slug + ".md").then(r => {
            if (!r.ok) throw "";
            return r.text();
        });

        content.className = "";
        content.innerHTML = marked.parse(md);

        const h1 = content.querySelector("h1");
        document.title = (h1 ? h1.textContent : slug) + " • Vinay";
        heroTitle.textContent = h1 ? h1.textContent : slug;

        const first = content.querySelector("p");
        heroSubtitle.textContent = first ? first.textContent.slice(0, 160) : "";

        content.querySelectorAll("img").forEach(img => {
            img.loading = "lazy";
            img.decoding = "async";
        });

        content.querySelectorAll("a").forEach(a => {
            if (a.hostname && a.hostname !== location.hostname) {
                a.target = "_blank";
                a.rel = "noopener noreferrer";
            }
        });

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });

    } catch {
        content.style.display = "none";
        error.style.display = "block";
        heroTitle.textContent = "Post not found";
        heroSubtitle.textContent = "The requested article doesn't exist.";
    }
}

// Show home page
function showHome() {
    history.replaceState({}, '', location.pathname);
    reader.style.display = "none";
    home.style.display = "grid";
    document.title = "Vinay • Blog";
    heroTitle.textContent = "Welcome to my blog";
    heroSubtitle.textContent = "Browse articles written in Markdown with a distraction-free reading experience.";
    window.scrollTo({
        top: 0,
        behavior: "smooth"
    });
}

// Back button click handler
backButton.onclick = (e) => {
    e.preventDefault();
    showHome();
};

// Handle browser back/forward navigation
window.onpopstate = () => {
    const slug = new URLSearchParams(location.search).get("post");
    if (slug) {
        loadPost(slug);
    } else {
        showHome();
    }
};

// Initialize the blog
const slug = new URLSearchParams(location.search).get("post");
if (slug) {
    loadPost(slug);
} else {
    loadHome();
}

// Set current year in footer
year.textContent = new Date().getFullYear();

// Update progress bar on scroll
window.addEventListener("scroll", () => {
    const h = document.documentElement.scrollHeight - document.documentElement.clientHeight;
    progress.style.width = (scrollY / h * 100) + "%";
});
