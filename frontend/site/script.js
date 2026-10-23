document.addEventListener('DOMContentLoaded', () => {
    // Navigation Menu Toggle
    const menuToggle = document.querySelector('.menu-toggle');
    const navLinks = document.querySelector('.nav-links');
    const navOverlay = document.getElementById('navOverlay');

    const closeMenu = () => {
        menuToggle?.classList.remove('active');
        navLinks?.classList.remove('open');
        navOverlay?.classList.remove('active');
        document.body.classList.remove('menu-open');
        menuToggle?.setAttribute('aria-expanded', 'false');
        menuToggle?.setAttribute('aria-label', 'Open menu');
    };

    const openMenu = () => {
        menuToggle?.classList.add('active');
        navLinks?.classList.add('open');
        navOverlay?.classList.add('active');
        document.body.classList.add('menu-open');
        menuToggle?.setAttribute('aria-expanded', 'true');
        menuToggle?.setAttribute('aria-label', 'Close menu');
    };

    menuToggle?.addEventListener('click', () => {
        if (navLinks?.classList.contains('open')) {
            closeMenu();
        } else {
            openMenu();
        }
    });

    navOverlay?.addEventListener('click', closeMenu);

    navLinks?.querySelectorAll('a').forEach(link => {
        link.addEventListener('click', closeMenu);
    });

    window.addEventListener('resize', () => {
        if (window.innerWidth > 768) {
            closeMenu();
        }
    });

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');
        question.addEventListener('click', () => {
            faqItems.forEach(otherItem => {
                if (otherItem !== item && otherItem.classList.contains('active')) {
                    otherItem.classList.remove('active');
                }
            });
            item.classList.toggle('active');
        });
    });

    // Smooth Scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;

            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                targetElement.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
            }
        });
    });

    // Active Scroll-Spy for Navigation Links
    const trackedSections = document.querySelectorAll('section[id]');
    const navAnchors = document.querySelectorAll('.nav-links a:not(.nav-cta)');

    const updateActiveNav = () => {
        let currentId = '';
        const scrollPos = window.scrollY + 140;

        trackedSections.forEach(sec => {
            const top = sec.offsetTop;
            const height = sec.offsetHeight;
            if (scrollPos >= top && scrollPos < top + height) {
                currentId = sec.getAttribute('id');
            }
        });

        if (window.scrollY < 200) {
            currentId = 'main-content';
        }

        if (currentId) {
            navAnchors.forEach(a => {
                const href = a.getAttribute('href');
                if (href === `#${currentId}` || (currentId === 'main-content' && (href === '#main-content' || href === '#'))) {
                    a.classList.add('active');
                } else {
                    a.classList.remove('active');
                }
            });
        }
    };

    window.addEventListener('scroll', updateActiveNav, { passive: true });

    // Booking Type Slot Sync
    const typeSelect = document.getElementById('consultationType');
    const timeSelect = document.getElementById('appointmentTime');

    const clinicSlots = `
        <option value="">Select Time Slot</option>
        <option value="10:00 AM">10:00 AM - 10:30 AM</option>
        <option value="11:00 AM">11:00 AM - 11:30 AM</option>
        <option value="12:00 PM">12:00 PM - 12:30 PM</option>
        <option value="01:00 PM">01:00 PM - 01:30 PM</option>
    `;
    const videoSlots = `
        <option value="">Select Video Slot</option>
        <option value="10:00 AM - 10:30 AM">10:00 AM - 10:30 AM</option>
        <option value="11:30 AM - 12:00 PM">11:30 AM - 12:00 PM</option>
        <option value="12:30 PM - 01:00 PM">12:30 PM - 01:00 PM</option>
    `;

    if (typeSelect && timeSelect) {
        typeSelect.addEventListener('change', (e) => {
            timeSelect.innerHTML = e.target.value === 'Online Video Consult' ? videoSlots : clinicSlots;
        });
    }

    // ===========================================================================
    // Results Lightbox Modal
    // ===========================================================================
    const resultModal = document.getElementById('resultModal');
    const modalImg = document.getElementById('modalImg');
    const modalClose = document.querySelector('.modal-close');
    const modalBackdrop = document.querySelector('.modal-backdrop');
    const modalPrev = document.querySelector('.modal-prev');
    const modalNext = document.querySelector('.modal-next');
    const cleanCards = document.querySelectorAll('.result-card');

    let currentIndex = 0;
    const cardsArray = Array.from(cleanCards);

    const updateModalImg = (index) => {
        if (index < 0 || index >= cardsArray.length) return;
        currentIndex = index;
        const img = cardsArray[index].querySelector('img');
        if (img && modalImg) {
            modalImg.setAttribute('src', img.getAttribute('src'));
            modalImg.setAttribute('alt', img.getAttribute('alt') || 'Result view');
        }
    };

    const openModal = (index) => {
        updateModalImg(index);
        resultModal?.classList.add('active');
        resultModal?.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        resultModal?.classList.remove('active');
        resultModal?.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    };

    cleanCards.forEach((card, idx) => {
        card.addEventListener('click', () => openModal(idx));
    });

    modalClose?.addEventListener('click', closeModal);
    modalBackdrop?.addEventListener('click', closeModal);

    modalPrev?.addEventListener('click', (e) => {
        e.stopPropagation();
        const prevIdx = (currentIndex - 1 + cardsArray.length) % cardsArray.length;
        updateModalImg(prevIdx);
    });

    modalNext?.addEventListener('click', (e) => {
        e.stopPropagation();
        const nextIdx = (currentIndex + 1) % cardsArray.length;
        updateModalImg(nextIdx);
    });

    document.addEventListener('keydown', (e) => {
        if (!resultModal?.classList.contains('active')) return;
        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') modalPrev?.click();
        if (e.key === 'ArrowRight') modalNext?.click();
    });

    // ==========================================================================
    // Review Navigation (Desktop + Mobile arrows)
    // ==========================================================================
    const reviewSlider = document.querySelector('.review-slider');
    const reviewPrevBtn = document.querySelector('.review-nav-prev');
    const reviewNextBtn = document.querySelector('.review-nav-next');
    const reviewMobPrev = document.querySelector('.review-mob-prev');
    const reviewMobNext = document.querySelector('.review-mob-next');

    if (reviewSlider) {
        const scrollAmount = 380; // card width + gap

        const scrollPrev = () => reviewSlider.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
        const scrollNext = () => reviewSlider.scrollBy({ left: scrollAmount, behavior: 'smooth' });

        reviewPrevBtn?.addEventListener('click', scrollPrev);
        reviewNextBtn?.addEventListener('click', scrollNext);
        reviewMobPrev?.addEventListener('click', scrollPrev);
        reviewMobNext?.addEventListener('click', scrollNext);
    }

    // ==========================================================================
    // Read More Toggle
    // ==========================================================================
    document.querySelectorAll('.read-more-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const body = btn.previousElementSibling;
            const isOpen = body.classList.contains('expanded');
            if (isOpen) {
                body.classList.remove('expanded');
                body.classList.add('truncated');
                btn.classList.remove('open');
                btn.innerHTML = 'Read More <i class="fa-solid fa-chevron-down"></i>';
            } else {
                body.classList.add('expanded');
                body.classList.remove('truncated');
                btn.classList.add('open');
                btn.innerHTML = 'Read Less <i class="fa-solid fa-chevron-up"></i>';
            }
        });
    });

    // ==========================================================================
    // Scroll-Reveal Animations (IntersectionObserver)
    // ==========================================================================
    const tagForAnim = (selector, cls, delayPrefix) => {
        document.querySelectorAll(selector).forEach((el, i) => {
            el.classList.add(cls);
            if (delayPrefix) el.classList.add(`anim-d${Math.min(i + 1, 6)}`);
        });
    };

    tagForAnim('.section-title', 'anim-ready');
    tagForAnim('.service-card', 'anim-ready', true);
    tagForAnim('.info-card', 'anim-ready', true);
    tagForAnim('.review-card', 'anim-ready', true);
    tagForAnim('.result-card', 'anim-ready', true);
    tagForAnim('.faq-item', 'anim-ready', true);
    tagForAnim('.about-image', 'anim-left');
    tagForAnim('.about-content', 'anim-right');
    tagForAnim('.booking-form-col', 'anim-left');
    tagForAnim('.booking-info-col', 'anim-right');

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('anim-visible');
                revealObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.12 });

    document.querySelectorAll('.anim-ready, .anim-left, .anim-right').forEach(el => {
        revealObserver.observe(el);
    });

    // ==========================================================================
    // Appointment Booking
    // ==========================================================================
    const API_URL = 'https://anarva-clinic.onrender.com';

    // Wake the backend (Render free tier sleeps when idle)
    fetch(`${API_URL}/health`).catch(() => {});

    const bookingForm = document.getElementById('bookingForm');
    const formStatus = document.getElementById('formStatus');
    const undoBtn = document.getElementById('undoBtn');
    let previousFormData = null;

    if (bookingForm) {
        bookingForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = document.getElementById('submitBtn');
            const originalBtnText = submitBtn.innerHTML;

            // Store previous form data for undo
            previousFormData = {
                fullName: document.getElementById('patientName').value,
                email: document.getElementById('patientEmail').value,
                phone: document.getElementById('patientPhone').value,
                consultationType: document.getElementById('consultationType').value,
                preferredDate: document.getElementById('appointmentDate').value,
                preferredTime: document.getElementById('appointmentTime').value,
                concern: document.getElementById('patientConcern').value
            };

            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving Appointment...';
            submitBtn.disabled = true;

            const formData = { ...previousFormData };

            try {
                const response = await fetch(`${API_URL}/api/appointments`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        patient_name: formData.fullName,
                        patient_phone: formData.phone,
                        specialist: 'Dr. Ajith Kumar',
                        date: formData.preferredDate,
                        time_slot: formData.preferredTime,
                        type: formData.consultationType,
                        notes: `Email: ${formData.email}\nConcern: ${formData.concern}`
                    })
                });

                if (!response.ok) {
                    const errText = await response.text();
                    console.error('Server said:', response.status, errText);
                    throw new Error(`Status ${response.status}: ${errText}`);
                }

                // Online consultation: send details to the clinic on WhatsApp
                if (formData.consultationType === 'Online Video Consult') {
                    const message = encodeURIComponent(
                        `*New Online Consultation Booking*\n\n` +
                        `*Name:* ${formData.fullName}\n` +
                        `*Phone:* ${formData.phone}\n` +
                        `*Email:* ${formData.email}\n` +
                        `*Date:* ${formData.preferredDate}\n` +
                        `*Time:* ${formData.preferredTime}\n` +
                        `*Concern:* ${formData.concern || 'Not specified'}\n\n` +
                        `Please confirm my appointment.`
                    );
                    window.open(`https://wa.me/919902430424?text=${message}`, '_blank');
                }

                formStatus.className = 'form-status-msg success';
                formStatus.innerHTML = '<i class="fa-solid fa-circle-check"></i> Appointment request saved. The clinic team will confirm your slot.';
                bookingForm.reset();
                if (timeSelect) timeSelect.innerHTML = clinicSlots;
            } catch (err) {
                console.error('Submission Error:', err);
                formStatus.className = 'form-status-msg error';
                formStatus.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Could not save the appointment (${err.message}). Please try again or call the clinic.`;
            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });

        // Undo functionality
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                if (previousFormData) {
                    document.getElementById('patientName').value = previousFormData.fullName;
                    document.getElementById('patientEmail').value = previousFormData.email;
                    document.getElementById('patientPhone').value = previousFormData.phone;
                    document.getElementById('consultationType').value = previousFormData.consultationType;
                    if (timeSelect) {
                        timeSelect.innerHTML = previousFormData.consultationType === 'Online Video Consult' ? videoSlots : clinicSlots;
                    }
                    document.getElementById('appointmentDate').value = previousFormData.preferredDate;
                    document.getElementById('appointmentTime').value = previousFormData.preferredTime;
                    document.getElementById('patientConcern').value = previousFormData.concern;
                    formStatus.innerHTML = '<i class="fa-solid fa-rotate-left"></i> Form restored. Submit again to save.';
                    formStatus.className = 'form-status-msg info';
                }
            });
        }
    }
});
