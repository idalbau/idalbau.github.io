// Logica per il Cookie Banner e Inizializzazione
document.addEventListener("DOMContentLoaded", function () {
    const banner = document.getElementById("cookieBanner");
    if (banner && !localStorage.getItem("cookieAccettati")) {
        banner.style.display = "block";
    }

    // Inizializza le animazioni Reveal al caricamento
    initReveal();

    // Inizializza il Menu Mobile
    initMobileMenu();

    // Inizializza Slideshow Hero
    initHeroSlideshow();

    // Inizializza il Gestore dello Scroll (Header e Progress Bar)
    initScrollHandler();
});

window.accettaCookie = function() {
    localStorage.setItem("cookieAccettati", "true");
    const banner = document.getElementById("cookieBanner");
    if (banner) banner.style.display = "none";
};

window.rifiutaCookie = function() {
    localStorage.setItem("cookieAccettati", "false");
    const banner = document.getElementById("cookieBanner");
    if (banner) banner.style.display = "none";
};

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
            e.preventDefault(); // Prevent synthetic click on checkbox to avoid double-firing & immediate closing
            const isActive = navLinks.classList.toggle('active');
            document.body.classList.toggle('menu-open', isActive);
            
            // Sync checkbox state programmatically if it exists
            const checkbox = document.getElementById('mobile-menu-toggle');
            if (checkbox) {
                checkbox.checked = isActive;
            }
        });

        // Close drawer when clicking outside
        document.addEventListener('click', function (e) {
            if (navLinks.classList.contains('active') && !navLinks.contains(e.target) && !e.target.closest('.mobile-toggle')) {
                navLinks.classList.remove('active');
                document.body.classList.remove('menu-open');
                
                // Sync checkbox state programmatically if it exists
                const checkbox = document.getElementById('mobile-menu-toggle');
                if (checkbox) {
                    checkbox.checked = false;
                }
            }
        });

        // Close drawer when clicking a standard navigation link (but not the dropdown toggle)
        const links = navLinks.querySelectorAll('a:not(.dropdown > a)');
        links.forEach(link => {
            link.addEventListener('click', function () {
                if (window.innerWidth <= 900) {
                    navLinks.classList.remove('active');
                    document.body.classList.remove('menu-open');
                    
                    // Sync checkbox state programmatically if it exists
                    const checkbox = document.getElementById('mobile-menu-toggle');
                    if (checkbox) {
                        checkbox.checked = false;
                    }
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

window.moveSlider = function(element) {
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
};

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
                // Shrinking Header Toggling with Hysteresis to prevent jitter loop
                if (window.scrollY > 120) {
                    header.classList.add('scrolled');
                } else if (window.scrollY < 20) {
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