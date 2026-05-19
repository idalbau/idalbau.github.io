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

    // Inizializza Slideshow Hero
    initHeroSlideshow();

    // Inizializza il Gestore dello Scroll (Header e Progress Bar)
    initScrollHandler();
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
    const mobileToggle = document.querySelector('.mobile-toggle');
    const navLinks = document.getElementById('navLinks');
    
    if (mobileToggle && navLinks) {
        // Toggle mobile drawer
        mobileToggle.addEventListener('click', function (e) {
            e.stopPropagation();
            const isActive = navLinks.classList.toggle('active');
            document.body.classList.toggle('menu-open', isActive);
        });

        // Close drawer when clicking outside
        document.addEventListener('click', function (e) {
            if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !e.target.closest('.mobile-toggle')) {
                navLinks.classList.remove('active');
                document.body.classList.remove('menu-open');
            }
        });

        // Close drawer when clicking a standard navigation link (but not the dropdown toggle)
        const links = navLinks.querySelectorAll('a:not(.dropdown > a)');
        links.forEach(link => {
            link.addEventListener('click', function () {
                if (window.innerWidth <= 900) {
                    navLinks.classList.remove('active');
                    document.body.classList.remove('menu-open');
                }
            });
        });
    }

    // Handle mobile dropdown click
    const dropdowns = document.querySelectorAll('.dropdown');
    dropdowns.forEach(dropdown => {
        const triggers = dropdown.querySelectorAll('a:not(.dropdown-content a)');
        triggers.forEach(trigger => {
            trigger.addEventListener('click', function (e) {
                if (window.innerWidth <= 900) {
                    e.preventDefault();
                    e.stopPropagation();
                    dropdown.classList.toggle('open');
                }
            });
        });
    });
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

// Hero Background Slideshow Logic
function initHeroSlideshow() {
    const slides = document.querySelectorAll('.hero-slide');
    if (slides.length <= 1) return;
    
    let currentSlide = 0;
    const slideInterval = 5000; // Change image every 5 seconds
    
    setInterval(() => {
        slides[currentSlide].classList.remove('active');
        currentSlide = (currentSlide + 1) % slides.length;
        slides[currentSlide].classList.add('active');
    }, slideInterval);
}

// Throttled scroll handler for premium shrinking header and dynamic progress indicator
function initScrollHandler() {
    const header = document.querySelector('header');
    if (!header) return;

    // Programmatically create and append the scroll progress bar to keep HTML clean & DRY
    let progress = document.getElementById('idal-scroll-progress');
    if (!progress) {
        progress = document.createElement('div');
        progress.id = 'idal-scroll-progress';
        header.appendChild(progress);
    }

    let ticking = false;

    window.addEventListener('scroll', function () {
        if (!ticking) {
            window.requestAnimationFrame(function () {
                // Shrinking Header Toggling
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }

                // Scroll Progress Calculation
                const winScroll = document.body.scrollTop || document.documentElement.scrollTop;
                const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
                const scrolled = height > 0 ? (winScroll / height) * 100 : 0;
                progress.style.width = scrolled + '%';

                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}