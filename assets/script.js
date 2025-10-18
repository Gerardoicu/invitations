// ----- util -----
const $ = (s, r = document) => r.querySelector(s);
const setVar = (n, v) => document.documentElement.style.setProperty(n, v);
const clamp01 = x => Math.max(0, Math.min(1, x));
const pad2 = n => String(n).padStart(2, "0");

// ----- restaurar scroll arriba -----
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
const toTop = () => requestAnimationFrame(() => scrollTo(0, 0));
addEventListener("load", toTop);
addEventListener("pageshow", toTop);

document.addEventListener("DOMContentLoaded", () => {
    // ----- refs -----
    const seal = $(".seal");
    const nameEl = $(".name");
    const letterStage = $(".letter-stage");
    const hero = $(".hero");
    const letter = $(".letter");
    const audio = /** @type {HTMLAudioElement|null} */ ($("#bgMusic"));

    if (!seal || !letterStage || !hero || !letter || !audio) return;

    // ----- niveles discretos -----
    const VOL_LEVELS = [0.0, 0.75, 1.0]; // 0 → 75 → 100
    let volStage = 0;        // 0..2
    let audioArmed = false;  // tras primer click

    // ----- fade helper (sin pausar en 0) -----
    let fadeId = 0;
    function fadeTo(target = VOL_LEVELS[volStage], step = 0.05, everyMs = 90) {
        clearInterval(fadeId);
        try { audio.play(); } catch {}
        fadeId = setInterval(() => {
            const dir = target > audio.volume ? 1 : -1;
            const next = +(audio.volume + dir * step).toFixed(3);
            audio.volume = dir > 0 ? Math.min(next, target) : Math.max(next, target);
            if (audio.volume === target) clearInterval(fadeId);
        }, everyMs);
    }

    // ----- click sello: arma audio, volumen 0, scroll a carta -----
    seal.addEventListener("click", () => {
        if (nameEl) {
            nameEl.classList.remove("is-typing");
            void nameEl.offsetWidth; // reflow
            nameEl.classList.add("is-typing");
        }

        // Scroll suave y MUY lento (2.5 segundos)
        const targetY = letterStage.offsetTop;
        const startY = window.scrollY;
        const diff = targetY - startY;
        const duration = 2500; // milisegundos
        const startTime = performance.now();

        function animateScroll(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // Función de suavizado (ease-in-out)
            const eased = progress < 0.5
                ? 2 * progress * progress
                : 1 - Math.pow(-2 * progress + 2, 2) / 2;

            window.scrollTo(0, startY + diff * eased);

            if (progress < 1) {
                requestAnimationFrame(animateScroll);
            }
        }

        requestAnimationFrame(animateScroll);

        audioArmed = true;
        volStage = 0;
        audio.volume = 0;
        try {
            audio.play();
        } catch {}
    });

    // ----- decor fade con scroll -----
    const max = innerHeight * 0.35;
    const decorOnScroll = () => setVar("--decor-opacity", String(1 - clamp01(scrollY / max)));
    decorOnScroll();

    // ----- volumen por dirección de scroll con escalones -----
    let lastY = scrollY;
    const volOnScroll = () => {
        if (!audioArmed) return;

        // tope superior: siempre 0 y resetea etapa
        if (scrollY === 0) {
            if (volStage !== 0 || audio.volume !== 0) {
                volStage = 0;
                fadeTo(VOL_LEVELS[0]);
            }
            lastY = scrollY;
            return;
        }

        const dy = scrollY - lastY;
        lastY = scrollY;
        if (Math.abs(dy) < 2) return; // ignora micro-movimientos

        if (dy > 0 && volStage < 2) {        // scroll abajo → sube etapa
            volStage++;
            fadeTo(VOL_LEVELS[volStage]);
        } else if (dy < 0 && volStage > 0) { // scroll arriba → baja etapa
            volStage--;
            fadeTo(VOL_LEVELS[volStage]);
        }
    };

    const onScroll = () => {
        requestAnimationFrame(() => {
            decorOnScroll();
            volOnScroll();
        });
    };

    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", () => setTimeout(decorOnScroll, 50), { passive: true });

    // Nota: sin IntersectionObserver; nunca se pausa automáticamente.
});

// ----- countdown -----
const targetDate = new Date("December 13, 2025 16:30:00").getTime();
function updateCountdown() {
    const now = Date.now();
    const diff = targetDate - now;
    if (diff <= 0) {
        const c = document.getElementById("countdown");
        if (c) c.innerHTML = "<p>¡Hoy es el gran día! 🎉</p>";
        clearInterval(timer);
        return;
    }
    const d = Math.floor(diff / 86400000);
    const h = Math.floor((diff % 86400000) / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    const s = Math.floor((diff % 60000) / 1000);
    const byId = id => document.getElementById(id);
    if (byId("days"))    byId("days").textContent = pad2(d);
    if (byId("hours"))   byId("hours").textContent = pad2(h);
    if (byId("minutes")) byId("minutes").textContent = pad2(m);
    if (byId("seconds")) byId("seconds").textContent = pad2(s);
}
const timer = setInterval(updateCountdown, 1000);
updateCountdown();

(() => {
    const updateFlap = () => {
        if (window.scrollY > 0) document.body.classList.add('scrolled');
        else document.body.classList.remove('scrolled');
    };
    updateFlap();
    addEventListener('scroll', updateFlap, { passive: true });
    addEventListener('load', updateFlap);
    addEventListener('pageshow', updateFlap);
})();
const setScrolled = () => document.body.classList.toggle('scrolled', window.scrollY > 0);
window.addEventListener('scroll', setScrolled, { passive: true });
window.addEventListener('load', setScrolled);