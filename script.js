// Logica per il Cookie Banner e Inizializzazione
document.addEventListener("DOMContentLoaded", function () {
    const banner = document.getElementById("cookieBanner");
    if (banner && !localStorage.getItem("cookieAccettati")) {
        banner.style.display = "block";
    }

    // Inizializza la lingua salvata (di default 'it')
    const savedLang = localStorage.getItem("siteLanguage") || "it";
    setLang(savedLang);

    // Inizializza le animazioni Reveal al caricamento
    initReveal();

    // Inizializza il Menu Mobile
    initMobileMenu();
});

function accettaCookie() {
    localStorage.setItem("cookieAccettati", "true");
    const banner = document.getElementById("cookieBanner");
    if (banner) banner.style.display = "none";
}

function rifiutaCookie() {
    localStorage.setItem("cookieAccettati", "false");
    const banner = document.getElementById("cookieBanner");
    if (banner) banner.style.display = "none";
}

// Sistema Bilingue Dinamico
function setLang(lang) {
    localStorage.setItem("siteLanguage", lang);

    const btnIt = document.getElementById('btn-it');
    const btnDe = document.getElementById('btn-de');
    if (btnIt) btnIt.classList.toggle('active', lang === 'it');
    if (btnDe) btnDe.classList.toggle('active', lang === 'de');

    document.documentElement.lang = lang;

    const elementsIT = document.querySelectorAll('.lang-it');
    const elementsDE = document.querySelectorAll('.lang-de');

    elementsIT.forEach(el => {
        el.style.display = (lang === 'it') ? '' : 'none';
    });
    elementsDE.forEach(el => {
        el.style.display = (lang === 'de') ? '' : 'none';
    });
}

// Reveal Animations Logic
function initReveal() {
    const reveals = document.querySelectorAll('.reveal');
    
    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                revealObserver.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1
    });

    reveals.forEach(reveal => {
        revealObserver.observe(reveal);
    });
}

// Mobile Menu Logic
function initMobileMenu() {
    // Toggling mobile menu if needed
    // Currently handled via inline onclick for simplicity in this small project
}

function moveSlider(element) {
    const container = element.closest('.ba-slider');
    if (!container) return;
    
    const beforeImage = container.querySelector('.ba-before');
    const handle = container.querySelector('.slider-handle');
    const value = element.value;
    
    if (beforeImage) {
        beforeImage.style.clipPath = `polygon(0 0, ${value}% 0, ${value}% 100%, 0 100%)`;
    }
    if (handle) {
        handle.style.left = value + '%';
    }
}