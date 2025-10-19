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
    // ----- refs -----
    const seal = $(".seal");
    const nameEl = $(".name"); // si usas .hero-name cámbialo aquí
    const letterStage = $(".letter-stage");
    const hero = $(".hero");
    const letter = $(".letter");
    /** @type {HTMLAudioElement|null} */
    const audio = $("#bgMusic");

    if (!seal || !letterStage || !hero || !letter || !audio) return;

    // ----- fade helper (no pausa en 0) -----
    let fadeId = 0;
    const fadeTo = (target, step = 0.05, everyMs = 90) => {
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

    // ----- click sello: habilita audio y hace scroll suave -----
    seal.addEventListener("click", () => {
        if (nameEl) {
            nameEl.classList.remove("is-typing");
            void nameEl.offsetWidth; // reflow
            nameEl.classList.add("is-typing");
        }

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
            if (p < 1) requestAnimationFrame(animateScroll);
        };
        requestAnimationFrame(animateScroll);

        audioArmed = true;
        // regla nueva: siempre suena salvo en top
        const targetVol = scrollY === 0 ? 0 : 1;
        audio.volume = targetVol; // set inmediato
        try { audio.play(); } catch {}
    });

    // ----- decor y música en scroll -----
    const decorMax = innerHeight * 0.35;
    const updateDecor = () => setVar("--decor-opacity", String(1 - clamp01(scrollY / decorMax)));

    let ticking = false;
    const onScroll = () => {
        if (ticking) return;
        ticking = true;
        requestAnimationFrame(() => {
            // opacidad decoración
            updateDecor();

            // clase para estilos dependientes de scroll
            document.body.classList.toggle("scrolled", window.scrollY > 0);

            // regla de volumen: armado => 0 en top, 1 fuera de top
            if (audioArmed) {
                const want = scrollY === 0 ? 0 : 1;
                if (Math.abs(audio.volume - want) > 0.01) {
                    fadeTo(want);
                }
            }
            ticking = false;
        });
    };

    // init estado inicial
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
