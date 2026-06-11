/**
 * -------------------------------------------------------------
 * Alex Morgan Portfolio Script
 * -------------------------------------------------------------
 */

document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const htmlElement = document.documentElement;
    const themeToggleBtn = document.getElementById('theme-toggle');
    const mobileNavToggle = document.querySelector('.mobile-nav-toggle');
    const navbar = document.querySelector('.navbar');
    const header = document.querySelector('.header');
    const navLinks = document.querySelectorAll('.nav-link');
    const sections = document.querySelectorAll('section');
    const statsNumbers = document.querySelectorAll('.stat-number');
    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const projectCards = document.querySelectorAll('.project-card');
    const contactForm = document.getElementById('contact-form');
    const scrollToTopBtn = document.getElementById('scroll-to-top');

    // --- 1. Theme Management (Dark / Light Mode Toggle) ---
    const currentTheme = localStorage.getItem('theme') || 'dark';
    htmlElement.setAttribute('data-theme', currentTheme);

    themeToggleBtn.addEventListener('click', () => {
        let theme = htmlElement.getAttribute('data-theme');
        let newTheme = theme === 'dark' ? 'light' : 'dark';
        
        htmlElement.setAttribute('data-theme', newTheme);
        localStorage.setItem('theme', newTheme);
    });

    // --- 2. Mobile Navigation Toggle ---
    mobileNavToggle.addEventListener('click', () => {
        const isOpened = mobileNavToggle.getAttribute('aria-expanded') === 'true';
        mobileNavToggle.setAttribute('aria-expanded', !isOpened);
        navbar.classList.toggle('open');
        document.body.classList.toggle('no-scroll');
    });

    // Close menu when clicking a link
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            mobileNavToggle.setAttribute('aria-expanded', 'false');
            navbar.classList.remove('open');
            document.body.classList.remove('no-scroll');
        });
    });

    // --- 3. Header Scroll Event & Scroll-To-Top Button Visibility ---
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('header-scrolled');
        } else {
            header.classList.remove('header-scrolled');
        }

        if (window.scrollY > 600) {
            scrollToTopBtn.classList.add('visible');
        } else {
            scrollToTopBtn.classList.remove('visible');
        }
    });

    scrollToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });

    // --- 4. IntersectionObserver: Active Navbar Links ---
    const navObserverOptions = {
        root: null,
        rootMargin: '-30% 0px -60% 0px', // Trigger highlights when element covers center area
        threshold: 0
    };

    const navObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, navObserverOptions);

    sections.forEach(section => {
        navObserver.observe(section);
    });

    // --- 5. IntersectionObserver: Animated Stats Counter ---
    const statsObserverOptions = {
        root: null,
        threshold: 0.1
    };

    const statsObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                animateCounters();
                observer.unobserve(entry.target); // Run once
            }
        });
    }, statsObserverOptions);

    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        statsObserver.observe(statsSection);
    }

    // --- 5b. Skills Tab Switching Logic ---
    tabButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active classes
            tabButtons.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => {
                content.classList.remove('active');
                content.style.opacity = '0';
                content.style.transform = 'translateY(15px)';
            });

            // Add active class to clicked button
            button.classList.add('active');

            // Find and display target content
            const targetTab = button.getAttribute('data-tab');
            const targetContent = document.getElementById(targetTab);
            
            if (targetContent) {
                targetContent.classList.add('active');
                // Small delay to trigger smooth transition animation
                setTimeout(() => {
                    targetContent.style.opacity = '1';
                    targetContent.style.transform = 'translateY(0)';
                }, 50);

                // If switching to tech skills, animate progress bars
                if (targetTab === 'tech') {
                    const fills = targetContent.querySelectorAll('.progress-bar-fill');
                    fills.forEach(fill => {
                        const originalWidth = fill.getAttribute('style').match(/width:\s*(\d+%)/)[1];
                        fill.style.width = '0';
                        setTimeout(() => {
                            fill.style.width = originalWidth;
                        }, 100);
                    });
                }
            }
        });
    });

    function animateCounters() {
        statsNumbers.forEach(counter => {
            const target = parseInt(counter.getAttribute('data-target'), 10);
            const duration = 2000; // 2 seconds total animation
            const startTime = performance.now();

            function updateCount(currentTime) {
                const elapsed = currentTime - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease out quadratically
                const easeValue = progress * (2 - progress);
                const currentCount = Math.floor(easeValue * target);

                counter.textContent = currentCount;

                if (progress < 1) {
                    requestAnimationFrame(updateCount);
                } else {
                    counter.textContent = target; // Ensure exact final value
                }
            }

            requestAnimationFrame(updateCount);
        });
    }

    // --- 6. Projects Filtering System ---
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Remove active status
            filterButtons.forEach(btn => {
                btn.classList.remove('active');
                btn.setAttribute('aria-selected', 'false');
            });

            button.classList.add('active');
            button.setAttribute('aria-selected', 'true');

            const filterValue = button.getAttribute('data-filter');

            projectCards.forEach(card => {
                const cardCategory = card.getAttribute('data-category');
                
                // Card transitions
                card.style.opacity = '0';
                card.style.transform = 'scale(0.95) translateY(10px)';
                
                setTimeout(() => {
                    if (filterValue === 'all' || cardCategory === filterValue) {
                        card.classList.remove('hide');
                        setTimeout(() => {
                            card.style.opacity = '1';
                            card.style.transform = 'scale(1) translateY(0)';
                        }, 50);
                    } else {
                        card.classList.add('hide');
                    }
                }, 300); // Syncs with transition times
            });
        });
    });

    // --- 7. Testimonial Carousel Mechanism ---
    const carouselTrack = document.getElementById('carousel-track');
    const testimonials = document.querySelectorAll('.testimonial-card');
    const prevBtn = document.getElementById('prev-testimonial');
    const nextBtn = document.getElementById('next-testimonial');
    const dotsContainer = document.getElementById('carousel-dots');
    
    let currentIndex = 0;
    const slideCount = testimonials.length;

    // Generate indicator dots
    for (let i = 0; i < slideCount; i++) {
        const dot = document.createElement('button');
        dot.classList.add('carousel-dot');
        if (i === 0) dot.classList.add('active');
        dot.setAttribute('aria-label', `Navigate to testimonial slide ${i + 1}`);
        dot.addEventListener('click', () => goToSlide(i));
        dotsContainer.appendChild(dot);
    }

    const dots = document.querySelectorAll('.carousel-dot');

    function updateCarousel() {
        carouselTrack.style.transform = `translateX(-${currentIndex * 100}%)`;
        dots.forEach((dot, index) => {
            dot.classList.toggle('active', index === currentIndex);
        });
    }

    function goToSlide(index) {
        currentIndex = index;
        updateCarousel();
    }

    function nextSlide() {
        currentIndex = (currentIndex + 1) % slideCount;
        updateCarousel();
    }

    function prevSlide() {
        currentIndex = (currentIndex - 1 + slideCount) % slideCount;
        updateCarousel();
    }

    nextBtn.addEventListener('click', nextSlide);
    prevBtn.addEventListener('click', prevSlide);

    // Auto play carousel interval (5s)
    let autoPlayInterval = setInterval(nextSlide, 5000);

    // Pause autoplay on interaction
    const resetAutoplay = () => {
        clearInterval(autoPlayInterval);
        autoPlayInterval = setInterval(nextSlide, 7000);
    };

    nextBtn.addEventListener('click', resetAutoplay);
    prevBtn.addEventListener('click', resetAutoplay);
    dots.forEach(dot => dot.addEventListener('click', resetAutoplay));

    // Touch Support for swipe gestures on mobile
    let touchStartX = 0;
    let touchEndX = 0;

    carouselTrack.addEventListener('touchstart', (e) => {
        touchStartX = e.changedTouches[0].screenX;
        resetAutoplay();
    }, { passive: true });

    carouselTrack.addEventListener('touchend', (e) => {
        touchEndX = e.changedTouches[0].screenX;
        handleSwipe();
    }, { passive: true });

    function handleSwipe() {
        const threshold = 50; // swipe minimum distance
        if (touchStartX - touchEndX > threshold) {
            nextSlide(); // swiped left
        } else if (touchEndX - touchStartX > threshold) {
            prevSlide(); // swiped right
        }
    }

    // --- 8. Contact Form Handling & Custom Validation ---
    contactForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        let isValid = true;
        const statusElement = document.getElementById('form-status');
        
        // Inputs list to check
        const fields = [
            { id: 'form-name', errorId: 'name-error', validate: val => val.trim() !== '' },
            { id: 'form-email', errorId: 'email-error', validate: val => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val.trim()) },
            { id: 'form-subject', errorId: 'subject-error', validate: val => val.trim() !== '' },
            { id: 'form-message', errorId: 'message-error', validate: val => val.trim() !== '' }
        ];

        fields.forEach(field => {
            const input = document.getElementById(field.id);
            const errorSpan = document.getElementById(field.errorId);
            const parent = input.parentElement;

            if (!field.validate(input.value)) {
                parent.classList.add('invalid');
                isValid = false;
            } else {
                parent.classList.remove('invalid');
            }

            // Real-time input cleaning
            input.addEventListener('input', () => {
                if (field.validate(input.value)) {
                    parent.classList.remove('invalid');
                }
            });
        });

        if (isValid) {
            // Mock submission state loading
            contactForm.classList.add('loading');
            statusElement.style.display = 'none';

            setTimeout(() => {
                contactForm.classList.remove('loading');
                statusElement.textContent = "Message sent successfully! Thank you for connecting.";
                statusElement.className = "form-status success";
                statusElement.style.display = "block";
                
                // Clear fields
                contactForm.reset();
                
                // Mute notification after 5s
                setTimeout(() => {
                    statusElement.style.display = "none";
                }, 5000);

            }, 1800); // 1.8 seconds mock server latency
        } else {
            statusElement.textContent = "Please fill in all fields correctly.";
            statusElement.className = "form-status error";
            statusElement.style.display = "block";
        }
    });
});
