// MOBILE NAVIGATION
const menuBtn = document.querySelector(".menu-btn");
const navMenu = document.querySelector(".nav-menu");

if (menuBtn && navMenu) {
    menuBtn.addEventListener("click", () => {
        navMenu.classList.toggle("active");

        const icon = menuBtn.querySelector("i");

        if (navMenu.classList.contains("active")) {
            icon.classList.remove("fa-bars");
            icon.classList.add("fa-xmark");
        } else {
            icon.classList.remove("fa-xmark");
            icon.classList.add("fa-bars");
        }
    });

    document.querySelectorAll(".nav-menu a").forEach(link => {
        link.addEventListener("click", () => {
            navMenu.classList.remove("active");

            const icon = menuBtn.querySelector("i");
            icon.classList.remove("fa-xmark");
            icon.classList.add("fa-bars");
        });
    });
}

const header = document.querySelector(".header");

window.addEventListener("scroll", () => {
    if (window.scrollY > 50) {
        header.classList.add("scrolled");
    } else {
        header.classList.remove("scrolled");
    }
});

const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-menu a");

function updateActiveLink() {

    let currentSection = "";

    sections.forEach(section => {

        const sectionTop = section.offsetTop - 150;
        const sectionHeight = section.offsetHeight;

        if (
            window.scrollY >= sectionTop &&
            window.scrollY < sectionTop + sectionHeight
        ) {
            currentSection = section.getAttribute("id");
        }
    });

    navLinks.forEach(link => {

        link.classList.remove("active-link");

        if (
            link.getAttribute("href") ===
            `#${currentSection}`
        ) {
            link.classList.add("active-link");
        }
    });
}

window.addEventListener("scroll", updateActiveLink);
updateActiveLink();

const revealElements = document.querySelectorAll(
    ".section, .project-card, .skill-card, .timeline-card"
);

const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add("show");
            }
        });
    }, { threshold: 0.15 }
);

revealElements.forEach(element => {
    revealObserver.observe(element);
});

const heroSubtitle = document.querySelector(".hero-subtitle");

if (heroSubtitle) {
    const titles = [
        "Cybersecurity Researcher",
        "Linux Enthusiast",
        "Full Stack Developer",
        "Problem Solver",
        "Web developer"
    ];

    let titleIndex = 0;
    let charIndex = 0;
    let deleting = false;

    function typeEffect() {
        const currentTitle = titles[titleIndex];

        if (!deleting) {
            heroSubtitle.textContent = currentTitle.substring(0, charIndex + 1);
            charIndex++;

            if (charIndex === currentTitle.length) {
                deleting = true;
                setTimeout(typeEffect, 1500);
                return;
            }
        } else {
            heroSubtitle.textContent = currentTitle.substring(0, charIndex - 1);
            charIndex--;

            if (charIndex === 0) {
                deleting = false;
                titleIndex++;
                if (titleIndex >= titles.length) {
                    titleIndex = 0;
                }
            }
        }

        setTimeout( typeEffect, deleting ? 40 : 80 );
    }
    typeEffect();
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener("click", function (e) {
        const target = document.querySelector(
            this.getAttribute("href")
        );

        if (!target) return;

        e.preventDefault();
        window.scrollTo({
            top: target.offsetTop - 80,
            behavior: "smooth"
        });
    });
});

// CURSOR GLOW EFFECT
const glow = document.createElement("div");
glow.className = "cursor-glow";
document.body.appendChild(glow);
window.addEventListener("mousemove", (e) => {
    glow.style.left = `${e.clientX}px`;
    glow.style.top = `${e.clientY}px`;
});

// CURSOR TAIL
const canvas = document.getElementById("cursor-trail");
const ctx = canvas.getContext("2d");

let index = 0;
let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;

const MOBILE_BREAKPOINT = 768;

let isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
let isCursorVisible = false;

const mouse = {
    x: w/2,
    y: h/2
};

const trail = [];
const trailLength = 35;

function resetTrail(x, y) {
    trail.length = 0;

    for (let i = 0; i < trailLength; i++) {
        trail.push({ x, y });
    }
}

resetTrail(mouse.x, mouse.y);

function updateMobileState() {
    isMobile = window.innerWidth <= MOBILE_BREAKPOINT || window.matchMedia("(pointer: coarse)").matches;

    canvas.style.display = isMobile ? "none" : "block";

    if (isMobile) {
        isCursorVisible = false;
        ctx.clearRect(0, 0, w, h);
    }
}

updateMobileState();

window.addEventListener("resize", () => {
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;

    updateMobileState();
});

window.addEventListener("mousemove", e => {
    if (isMobile) return;

    mouse.x = e.clientX;
    mouse.y = e.clientY;

    if (!isCursorVisible) {
        resetTrail(mouse.x, mouse.y);
        isCursorVisible = true;
    }
});

document.documentElement.addEventListener("mouseleave", () => {
    isCursorVisible = false;
    trail.length = 0;
    ctx.clearRect(0, 0, w, h);
});

window.addEventListener("blur", () => {
    isCursorVisible = false;
    trail.length = 0;
    ctx.clearRect(0, 0, w, h);
});

function animate() {
    ctx.clearRect(0, 0, w, h);

    if (!isCursorVisible || isMobile || trail.length === 0) {
        requestAnimationFrame(animate);
        return;
    }

    trail[0].x += (mouse.x - trail[0].x) * 0.35;
    trail[0].y += (mouse.y - trail[0].y) * 0.35;

    for (let i = 1; i < trail.length; i++) {
        trail[i].x += (trail[i - 1].x - trail[i].x) * 0.9;
        trail[i].y += (trail[i - 1].y - trail[i].y) * 0.9;
    }

    ctx.globalCompositeOperation = "lighter";

    trail.forEach((p, i) => {
        const hue = 210 - (i / trail.length) * 90;

        ctx.beginPath();

        ctx.fillStyle = `hsla(
            ${hue},
            100%,
            60%,
            ${1 - i / trail.length}
        )`;

        ctx.arc(
            p.x,
            p.y,
            9 * (1 - i / trail.length),
            0,
            Math.PI * 2
        );

        ctx.fill();
    });

    requestAnimationFrame(animate);
}

animate();

// LOGO EFFECT
const logo = document.getElementById("logoText");
const names = ["Vinay", '$ <span id="terminalCursor">_</span>'];

function switchLogo() {
    logo.classList.add("glitch");

    setTimeout(() => {
        index = (index + 1) % names.length;

        logo.innerHTML = names[index];
        logo.setAttribute("data-text", names[index]);

        logo.classList.remove("glitch");
    }, 300); // glitch duration
}
// Change every 3, 5 seconds
let t = 3000; (function f(){ switchLogo(); setTimeout(f, t = t === 3000 ? 5000 : 3000); })();

console.log(`
██╗   ██╗██╗███╗   ██╗ █████╗ ██╗   ██╗
██║   ██║██║████╗  ██║██╔══██╗╚██╗ ██╔╝
██║   ██║██║██╔██╗ ██║███████║ ╚████╔╝
╚██╗ ██╔╝██║██║╚██╗██║██╔══██║  ╚██╔╝
 ╚████╔╝ ██║██║ ╚████║██║  ██║   ██║
  ╚═══╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝   ╚═╝

Portfolio Loaded Successfully
`);