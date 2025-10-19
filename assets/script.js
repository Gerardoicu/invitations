// ===== util =====
const $ = (s, r = document) => r.querySelector(s);
const setVar = (n, v) => document.documentElement.style.setProperty(n, v);
const clamp01 = x => Math.max(0, Math.min(1, x));
const pad2 = n => String(n).padStart(2, "0");

// ===== forzar inicio en top =====
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
const toTop = () => requestAnimationFrame(() => scrollTo(0, 0));
addEventListener("load", toTop);
addEventListener("pageshow", toTop);

document.addEventListener("DOMContentLoaded", () => {
    const seal = $(".seal");
    const nameEl = $(".name"); // o .hero-name
    const letterStage = $(".letter-stage");
    const hero = $(".hero");
    const letter = $(".letter");
    /** @type {HTMLAudioElement|null} */
    const audio = $("#bgMusic");
    if (!seal || !letterStage || !hero || !letter || !audio) return;

    // ---- fade helper ----
    let fadeId = 0;
    const fadeTo = (target, step = 0.1, everyMs = 30) => {
        clearInterval(fadeId);
        try { audio.play(); } catch {}
        fadeId = setInterval(() => {
            const dir = target > audio.volume ? 1 : -1;
            const next = +(audio.volume + dir * step).toFixed(3);
            audio.volume = dir > 0 ? Math.min(next, target) : Math.max(next, target);
            if (audio.volume === target) clearInterval(fadeId);
        }, everyMs);
    };

    let audioArmed = false;
    let isAnimating = false; // <- evita silenciar durante el scroll programado

    // ----- click sello -----
    seal.addEventListener("click", async () => {
        if (nameEl) {
            nameEl.classList.remove("is-typing");
            void nameEl.offsetWidth;
            nameEl.classList.add("is-typing");
        }

        // Reproduce YA y audible
        audioArmed = true;
        clearInterval(fadeId);
        audio.volume = 1;
        // Opcional: fuerza decodificación y arranque en 0s
        try { audio.currentTime = 0; } catch {}
        try { await audio.play(); } catch {}

        // Marca animación para no silenciar por "top"
        isAnimating = true;

        // scroll suave ~2.5s
        const targetY = letterStage.offsetTop;
        const startY = window.scrollY;
        const diff = targetY - startY;
        const duration = 2500;
        const t0 = performance.now();

        const animateScroll = (t) => {
            const p = Math.min((t - t0) / duration, 1);
            const ease = p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
            window.scrollTo(0, startY + diff * ease);
            if (p < 1) {
                requestAnimationFrame(animateScroll);
            } else {
                // terminó la animación
                isAnimating = false;
                onScroll(); // ajusta estado final
            }
        };
        requestAnimationFrame(animateScroll);
    });

    // ----- decor y música en scroll -----
    const decorMax = innerHeight * 0.35;
    const updateDecor = () => setVar("--decor-opacity", String(1 - clamp01(scrollY / decorMax)));

    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            updateDecor();
            document.body.classList.toggle("scrolled", window.scrollY > 0);

            if (audioArmed) {
                const atTop = window.scrollY === 0;
                // mientras animamos, mantener audible
                const want = (atTop && !isAnimating) ? 0 : 1;
                // cambios rápidos y sin “lag”
                if (Math.abs(audio.volume - want) > 0.01) {
                    // primera vez a 1 ya se hizo inmediato; aquí usa fade para transiciones
                    fadeTo(want);
                }
            }
            ticking = false;
        });
    };

    // init
    updateDecor();
    document.body.classList.toggle("scrolled", window.scrollY > 0);

    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", () => setTimeout(updateDecor, 50), { passive: true });
    addEventListener("load", onScroll);
    addEventListener("pageshow", onScroll);
});

// ===== countdown =====
const targetDate = new Date("December 13, 2025 16:30:00").getTime();
function updateCountdown() {
    const now = Date.now();
    const diff = targetDate - now;
    const byId = id => document.getElementById(id);

    if (diff <= 0) {
        const c = byId("countdown");
        if (c) c.innerHTML = "<p>¡Hoy es el gran día! 🎉</p>";
        clearInterval(timer);
        return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);

    if (byId("days"))    byId("days").textContent = pad2(d);
    if (byId("hours"))   byId("hours").textContent = pad2(h);
    if (byId("minutes")) byId("minutes").textContent = pad2(m);
    if (byId("seconds")) byId("seconds").textContent = pad2(s);
}
const timer = setInterval(updateCountdown, 1000);
updateCountdown();
