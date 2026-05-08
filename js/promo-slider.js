// Slider de promociones con scroll nativo y snap.
// Los puntos se sincronizan con el scroll. Auto-avance cada 5 segundos.

(function () {
    const track = document.getElementById('slider-track');
    const dots  = Array.from(document.querySelectorAll('.promo-dot'));
    if (!track || !dots.length) return;

    const slides     = Array.from(track.querySelectorAll('.promo-slide'));
    const INTERVAL   = 5000;
    let current      = 0;
    let timer        = null;
    let isScrolling  = false;

    // Ir a un slide específico con scroll suave
    function goTo(index) {
        const total = slides.length;
        current = ((index % total) + total) % total;
        const slideWidth = track.clientWidth;
        track.scrollTo({ left: current * slideWidth, behavior: 'smooth' });
        updateDots(current);
    }

    // Actualizar puntos indicadores
    function updateDots(index) {
        dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }

    // Sincronizar puntos con el scroll (IntersectionObserver)
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
                const idx = slides.indexOf(entry.target);
                if (idx !== -1) {
                    current = idx;
                    updateDots(idx);
                }
            }
        });
    }, { root: track, threshold: 0.5 });

    slides.forEach(slide => observer.observe(slide));

    // Clic en puntos
    dots.forEach((dot, i) => {
        dot.addEventListener('click', () => {
            goTo(i);
            resetTimer();
        });
    });

    // Swipe táctil — el scroll nativo ya lo maneja, solo reseteamos el timer
    track.addEventListener('touchstart', () => resetTimer(), { passive: true });

    // Auto-avance
    function startTimer() {
        timer = setInterval(() => goTo(current + 1), INTERVAL);
    }

    function resetTimer() {
        clearInterval(timer);
        startTimer();
    }

    startTimer();
})();
