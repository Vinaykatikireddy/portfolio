const menuBtn = document.querySelector(".menu-btn");
const navMenu = document.querySelector(".nav-menu");
if (menuBtn && navMenu) {
  const setMenuState = (open) => {
    navMenu.classList.toggle("active", open);
    const icon = menuBtn.querySelector("i");
    icon.classList.toggle("fa-bars", !open);
    icon.classList.toggle("fa-xmark", open);
    menuBtn.setAttribute("aria-expanded", String(open));
  };
  menuBtn.addEventListener("click", () => setMenuState(!navMenu.classList.contains("active")));
  document.querySelectorAll(".nav-menu a").forEach(link => {
    link.addEventListener("click", () => setMenuState(false));
  });
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") setMenuState(false);
  });
}

const header = document.querySelector(".header");
if (header) {
  window.addEventListener("scroll", () => {
    header.classList.toggle("scrolled", window.scrollY > 50);
  });
}

let cursorStroke = "#17170d";
let cursorBg = "#ffffff";
function syncCursorColors() {
  try {
    const style = getComputedStyle(document.documentElement);
    const text = style.getPropertyValue("--text").trim();
    const bg = style.getPropertyValue("--bg").trim();
    if (text) cursorStroke = text;
    if (bg) cursorBg = bg;
  } catch (e) {}
}

const themeToggle = document.getElementById("themeToggle");
function applyTheme(theme, persist) {
  document.documentElement.setAttribute("data-theme", theme);
  if (persist) {
    try { localStorage.setItem("theme", theme); } catch (e) {}
  }
  if (themeToggle) {
    const icon = themeToggle.querySelector("i");
    icon.classList.toggle("fa-moon", theme !== "dark");
    icon.classList.toggle("fa-sun", theme === "dark");
    themeToggle.setAttribute("aria-label", theme === "dark" ? "Switch to light mode" : "Switch to dark mode");
  }
  syncCursorColors();
}
applyTheme(document.documentElement.getAttribute("data-theme") || "light", false);
if (themeToggle) {
  themeToggle.addEventListener("click", () => {
    const next = document.documentElement.getAttribute("data-theme") === "dark" ? "light" : "dark";
    applyTheme(next, true);
  });
}

const sections = document.querySelectorAll("section[id]");
const navLinks = document.querySelectorAll(".nav-menu a");
function updateActiveLink() {
  let currentSection = "";
  sections.forEach(section => {
    const sectionTop = section.offsetTop - 150;
    const sectionHeight = section.offsetHeight;
    if (window.scrollY >= sectionTop && window.scrollY < sectionTop + sectionHeight) {
      currentSection = section.getAttribute("id");
    }
  });
  navLinks.forEach(link => {
    link.classList.toggle("active-link", link.getAttribute("href") === `#${currentSection}`);
  });
}
window.addEventListener("scroll", updateActiveLink);
updateActiveLink();

const revealTargets = document.querySelectorAll(".project-card, .skill-card, .timeline-card");
revealTargets.forEach(el => {
  const cls = [...el.classList].find(c => /^(skill|project|timeline)-card$/.test(c));
  const siblings = el.parentElement ? [...el.parentElement.children].filter(c => c.classList.contains(cls)) : [];
  const pos = siblings.indexOf(el);
  const delay = pos > 0 ? Math.min(pos, 11) * 45 : 0;
  if (delay) el.style.transitionDelay = `${delay}ms`;
  el.dataset.revealDelay = String(delay);
});
if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add("show");
        revealObserver.unobserve(el);
        const delay = parseInt(el.dataset.revealDelay || "0", 10);
        if (delay) setTimeout(() => { el.style.transitionDelay = ""; }, delay + 700);
      }
    });
  }, { threshold: 0.15 });
  revealTargets.forEach(el => revealObserver.observe(el));
  document.querySelectorAll(".section").forEach(el => revealObserver.observe(el));
} else {
  revealTargets.forEach(el => el.classList.add("show"));
}

const heroSubtitle = document.querySelector(".hero-subtitle");
if (heroSubtitle) {
  const titles = ["Cybersecurity Researcher", "Linux Enthusiast", "Full Stack Developer", "Problem Solver", "Web developer"];
  let titleIndex = 0, charIndex = 0, deleting = false;
  function typeEffect() {
    const currentTitle = titles[titleIndex];
    if (!deleting) {
      heroSubtitle.textContent = currentTitle.substring(0, charIndex + 1);
      charIndex++;
      if (charIndex === currentTitle.length) { deleting = true; setTimeout(typeEffect, 1500); return; }
    } else {
      heroSubtitle.textContent = currentTitle.substring(0, charIndex - 1);
      charIndex--;
      if (charIndex === 0) { deleting = false; titleIndex = (titleIndex + 1) % titles.length; }
    }
    setTimeout(typeEffect, deleting ? 40 : 80);
  }
  typeEffect();
}

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener("click", function (e) {
    const target = document.querySelector(this.getAttribute("href"));
    if (!target) return;
    e.preventDefault();
    window.scrollTo({ top: target.offsetTop - 80, behavior: "smooth" });
  });
});

const glow = document.createElement("div");
glow.className = "cursor-glow";
document.body.appendChild(glow);
window.addEventListener("mousemove", e => {
  glow.style.left = `${e.clientX}px`;
  glow.style.top = `${e.clientY}px`;
});

const canvas = document.getElementById("cursor-trail");
const ctx = canvas.getContext("2d");
let w = canvas.width = window.innerWidth;
let h = canvas.height = window.innerHeight;
const MOBILE_BREAKPOINT = 768;
let isMobile = window.innerWidth <= MOBILE_BREAKPOINT;
let isCursorVisible = false;
const mouse = { x: w / 2, y: h / 2 };
const trail = [];
const trailLength = 35;

function resetTrail(x, y) {
  trail.length = 0;
  for (let i = 0; i < trailLength; i++) trail.push({ x, y });
}
resetTrail(mouse.x, mouse.y);

function updateMobileState() {
  isMobile = window.innerWidth <= MOBILE_BREAKPOINT || window.matchMedia("(pointer: coarse)").matches;
  canvas.style.display = isMobile ? "none" : "block";
  if (isMobile) { isCursorVisible = false; ctx.clearRect(0, 0, w, h); }
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
  if (!isCursorVisible) { resetTrail(mouse.x, mouse.y); isCursorVisible = true; }
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
  if (!isCursorVisible || isMobile || trail.length === 0) { requestAnimationFrame(animate); return; }
  trail[0].x += (mouse.x - trail[0].x) * 0.35;
  trail[0].y += (mouse.y - trail[0].y) * 0.35;
  for (let i = 1; i < trail.length; i++) {
    trail[i].x += (trail[i - 1].x - trail[i].x) * 0.9;
    trail[i].y += (trail[i - 1].y - trail[i].y) * 0.9;
  }
  ctx.globalCompositeOperation = "source-over";
  ctx.globalAlpha = 1;
  trail.forEach((p, i) => {
    const t = 1 - i / trail.length;
    const r = 9 * t;
    if (r < 0.4) return;
    ctx.globalAlpha = 0.1 + 0.72 * t;
    ctx.fillStyle = cursorStroke;
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.globalAlpha = 1;
  const head = trail[0];
  ctx.beginPath();
  ctx.strokeStyle = cursorBg;
  ctx.lineWidth = 2.5;
  ctx.arc(head.x, head.y, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.fillStyle = cursorStroke;
  ctx.arc(head.x, head.y, 4.5, 0, Math.PI * 2);
  ctx.fill();
  requestAnimationFrame(animate);
}
animate();

const logo = document.getElementById("logoText");
if (logo) {
  const names = [logo.innerText, '$ <span id="terminalCursor">_</span>'];
  let index = 0;
  function switchLogo() {
    logo.classList.add("glitch");
    setTimeout(() => {
      index = (index + 1) % names.length;
      logo.innerHTML = names[index];
      logo.setAttribute("data-text", names[index].replace(/<[^>]*>/g, "").trim() || " ");
      logo.classList.remove("glitch");
    }, 300);
  }
  let t = 3000;
  (function f() { switchLogo(); setTimeout(f, t = t === 3000 ? 5000 : 3000); })();
}

const scrollTopBtn = document.getElementById("scrollTopBtn");
const hero = document.getElementById("home");
if (scrollTopBtn && hero) {
  window.addEventListener("scroll", () => {
    scrollTopBtn.classList.toggle("visible", window.scrollY > hero.offsetHeight);
  });
  scrollTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

