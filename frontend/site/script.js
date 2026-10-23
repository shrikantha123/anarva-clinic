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
        if (window.innerWidth > 768) closeMenu();
    });

    // FAQ Accordion
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const question = item.querySelector('.faq-question');

        question?.addEventListener('click', () => {
            faqItems.forEach(otherItem => {
                if (
                    otherItem !== item &&
                    otherItem.classList.contains('active')
                ) {
                    otherItem.classList.remove('active');
                }
            });

            item.classList.toggle('active');
        });
    });

    // Smooth Scrolling
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            const targetId = this.getAttribute('href');

            if (!targetId || targetId === '#') return;

            const targetElement = document.querySelector(targetId);

            if (!targetElement) return;

            e.preventDefault();

            targetElement.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        });
    });

    // Active Navigation Scroll Spy
    const trackedSections = document.querySelectorAll('section[id]');
    const navAnchors = document.querySelectorAll(
        '.nav-links a:not(.nav-cta)'
    );

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

                if (
                    href === `#${currentId}` ||
                    (
                        currentId === 'main-content' &&
                        (href === '#main-content' || href === '#')
                    )
                ) {
                    a.classList.add('active');
                } else {
                    a.classList.remove('active');
                }
            });
        }
    };

    window.addEventListener('scroll', updateActiveNav, {
        passive: true
    });

    updateActiveNav();

    // Consultation Type and Time Slot Sync
    const typeSelect = document.getElementById('consultationType');
    const timeSelect = document.getElementById('appointmentTime');

    if (typeSelect && timeSelect) {
        typeSelect.addEventListener('change', e => {
            if (e.target.value === 'Online Video Consult') {
                timeSelect.innerHTML = `
                    <option value="">Select Video Slot</option>
                    <option value="10:00 AM - 10:30 AM">
                        10:00 AM - 10:30 AM
                    </option>
                    <option value="11:30 AM - 12:00 PM">
                        11:30 AM - 12:00 PM
                    </option>
                    <option value="12:30 PM - 01:00 PM">
                        12:30 PM - 01:00 PM
                    </option>
                `;
            } else {
                timeSelect.innerHTML = `
                    <option value="">Select Time Slot</option>
                    <option value="10:00 AM">
                        10:00 AM - 10:30 AM
                    </option>
                    <option value="11:00 AM">
                        11:00 AM - 11:30 AM
                    </option>
                    <option value="12:00 PM">
                        12:00 PM - 12:30 PM
                    </option>
                    <option value="01:00 PM">
                        01:00 PM - 01:30 PM
                    </option>
                `;
            }
        });
    }

    // Results Image Modal
    const resultModal = document.getElementById('resultModal');
    const modalImg = document.getElementById('modalImg');
    const modalClose = document.querySelector('.modal-close');
    const modalBackdrop = document.querySelector('.modal-backdrop');
    const modalPrev = document.querySelector('.modal-prev');
    const modalNext = document.querySelector('.modal-next');
    const cleanCards = document.querySelectorAll('.result-card');

    let currentIndex = 0;
    const cardsArray = Array.from(cleanCards);

    const updateModalImg = index => {
        if (index < 0 || index >= cardsArray.length) return;

        currentIndex = index;

        const img = cardsArray[index].querySelector('img');

        if (img && modalImg) {
            modalImg.setAttribute('src', img.getAttribute('src'));
            modalImg.setAttribute(
                'alt',
                img.getAttribute('alt') || 'Result view'
            );
        }
    };

    const openModal = index => {
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

    cleanCards.forEach((card, index) => {
        card.addEventListener('click', () => openModal(index));
    });

    modalClose?.addEventListener('click', closeModal);
    modalBackdrop?.addEventListener('click', closeModal);

    modalPrev?.addEventListener('click', e => {
        e.stopPropagation();

        if (!cardsArray.length) return;

        updateModalImg(
            (currentIndex - 1 + cardsArray.length) % cardsArray.length
        );
    });

    modalNext?.addEventListener('click', e => {
        e.stopPropagation();

        if (!cardsArray.length) return;

        updateModalImg(
            (currentIndex + 1) % cardsArray.length
        );
    });

    document.addEventListener('keydown', e => {
        if (!resultModal?.classList.contains('active')) return;

        if (e.key === 'Escape') closeModal();
        if (e.key === 'ArrowLeft') modalPrev?.click();
        if (e.key === 'ArrowRight') modalNext?.click();
    });

    // Review Slider Navigation
    const reviewSlider = document.querySelector('.review-slider');
    const reviewPrevBtn = document.querySelector('.review-nav-prev');
    const reviewNextBtn = document.querySelector('.review-nav-next');
    const reviewMobPrev = document.querySelector('.review-mob-prev');
    const reviewMobNext = document.querySelector('.review-mob-next');

    if (reviewSlider) {
        const scrollAmount = 380;

        const scrollPrev = () => {
            reviewSlider.scrollBy({
                left: -scrollAmount,
                behavior: 'smooth'
            });
        };

        const scrollNext = () => {
            reviewSlider.scrollBy({
                left: scrollAmount,
                behavior: 'smooth'
            });
        };

        reviewPrevBtn?.addEventListener('click', scrollPrev);
        reviewNextBtn?.addEventListener('click', scrollNext);
        reviewMobPrev?.addEventListener('click', scrollPrev);
        reviewMobNext?.addEventListener('click', scrollNext);
    }

    // Read More / Read Less
    document.querySelectorAll('.read-more-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const body = btn.previousElementSibling;

            if (!body) return;

            const isOpen = body.classList.contains('expanded');

            if (isOpen) {
                body.classList.remove('expanded');
                body.classList.add('truncated');
                btn.classList.remove('open');

                btn.innerHTML =
                    'Read More <i class="fa-solid fa-chevron-down"></i>';
            } else {
                body.classList.add('expanded');
                body.classList.remove('truncated');
                btn.classList.add('open');

                btn.innerHTML =
                    'Read Less <i class="fa-solid fa-chevron-up"></i>';
            }
        });
    });

    // Scroll-Reveal Animations
    const tagForAnim = (selector, cls, delayPrefix) => {
        document.querySelectorAll(selector).forEach((el, index) => {
            el.classList.add(cls);

            if (delayPrefix) {
                el.classList.add(`anim-d${Math.min(index + 1, 6)}`);
            }
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

    if ('IntersectionObserver' in window) {
        const revealObserver = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('anim-visible');
                    revealObserver.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.12
        });

        document.querySelectorAll(
            '.anim-ready, .anim-left, .anim-right'
        ).forEach(el => {
            revealObserver.observe(el);
        });
    } else {
        document.querySelectorAll(
            '.anim-ready, .anim-left, .anim-right'
        ).forEach(el => {
            el.classList.add('anim-visible');
        });
    }

    // Booking Form
    const bookingForm = document.getElementById('bookingForm');
    const formStatus = document.getElementById('formStatus');
    const undoBtn = document.getElementById('undoBtn');
    const consultationType = document.getElementById('consultationType');
    const paymentSection = document.getElementById('paymentSection');
    const payNowBtn = document.getElementById('payNowBtn');

    let previousFormData = null;

    // Show or hide payment section
    const updatePaymentSection = () => {
        if (!consultationType || !paymentSection) return;

        paymentSection.style.display =
            consultationType.value === 'Online Video Consult'
                ? 'block'
                : 'none';
    };

    if (consultationType && paymentSection) {
        consultationType.addEventListener(
            'change',
            updatePaymentSection
        );

        updatePaymentSection();
    }

    // =========================================================
    // FIXED UPI PAYMENT REQUEST
    // =========================================================
    if (payNowBtn) {
        payNowBtn.addEventListener('click', () => {
            const fullName =
                document.getElementById('patientName')?.value.trim() || '';

            const phone =
                document.getElementById('patientPhone')?.value.trim() || '';

            if (!fullName || !phone) {
                alert(
                    'Please enter your name and phone number before making payment.'
                );
                return;
            }

            if (
                !consultationType ||
                consultationType.value !== 'Online Video Consult'
            ) {
                alert(
                    'Please select Online Video Consult before making payment.'
                );
                return;
            }

            const upiId = '9902430424-3@ybl';
            const amount = '500';

            const params = new URLSearchParams({
                pa: upiId,
                pn: 'Ajith Kumar',
                am: amount,
                cu: 'INR',
                tn: 'Anarva Clinic Consultation'
            });

            const upiLink = `upi://pay?${params.toString()}`;

            alert(
                'Opening your UPI app for payment.\n\n' +
                'Recipient: Ajith Kumar\n' +
                'UPI ID: ' + upiId + '\n' +
                'Amount: ₹500\n\n' +
                'Please verify the recipient and amount in your UPI app. ' +
                'Your appointment is not confirmed until the clinic verifies payment.'
            );

            // Open the UPI app. This does not confirm payment success.
            window.location.href = upiLink;
        });
    }

    // =========================================================
    // SAVE APPOINTMENT TO BACKEND
    // =========================================================
    if (bookingForm) {
        bookingForm.addEventListener('submit', async e => {
            e.preventDefault();

            const submitBtn = document.getElementById('submitBtn');

            if (!submitBtn) {
                console.error('Submit button #submitBtn was not found.');
                return;
            }

            const originalBtnText = submitBtn.innerHTML;

            previousFormData = {
                fullName:
                    document.getElementById('patientName')?.value.trim() || '',
                email:
                    document.getElementById('patientEmail')?.value.trim() || '',
                phone:
                    document.getElementById('patientPhone')?.value.trim() || '',
                consultationType:
                    document.getElementById('consultationType')?.value || '',
                preferredDate:
                    document.getElementById('appointmentDate')?.value || '',
                preferredTime:
                    document.getElementById('appointmentTime')?.value || '',
                concern:
                    document.getElementById('patientConcern')?.value.trim() || ''
            };

            if (
                !previousFormData.fullName ||
                !previousFormData.phone
            ) {
                if (formStatus) {
                    formStatus.className = 'form-status-msg error';
                    formStatus.textContent =
                        'Please enter your name and phone number.';
                } else {
                    alert('Please enter your name and phone number.');
                }

                return;
            }

            submitBtn.innerHTML =
                '<i class="fa-solid fa-spinner fa-spin"></i> Saving Appointment...';

            submitBtn.disabled = true;

            const formData = {
                ...previousFormData,
                submittedAt: new Date().toLocaleString()
            };

            try {
                const response = await fetch(
                    'https://anarva-clinic.onrender.com/api/appointments',
                    {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            patient_name: formData.fullName,
                            patient_phone: formData.phone,
                            specialist: 'Dr. Ajith Kumar',
                            date: formData.preferredDate,
                            time_slot: formData.preferredTime,
                            type: formData.consultationType,
                            notes:
                                `Email: ${formData.email}\n` +
                                `Concern: ${formData.concern}`
                        })
                    }
                );

                if (!response.ok) {
                    throw new Error(
                        `Appointment request failed with status ${response.status}`
                    );
                }

                // Notify the clinic by WhatsApp.
                // Payment must be verified separately.
                if (
                    formData.consultationType === 'Online Video Consult'
                ) {
                    const message = [
                        '*New Online Consultation Booking*',
                        '',
                        `*Name:* ${formData.fullName}`,
                        `*Phone:* ${formData.phone}`,
                        `*Email:* ${formData.email}`,
                        `*Date:* ${formData.preferredDate}`,
                        `*Time:* ${formData.preferredTime}`,
                        '*Consultation fee:* ₹500',
                        `*Concern:* ${formData.concern || 'Not specified'}`,
                        '',
                        'Please verify payment separately before confirming the appointment.'
                    ].join('\n');

                    const whatsappUrl =
                        'https://wa.me/919902430424?text=' +
                        encodeURIComponent(message);

                    window.open(
                        whatsappUrl,
                        '_blank',
                        'noopener,noreferrer'
                    );
                }

                if (formStatus) {
                    formStatus.className = 'form-status-msg success';

                    formStatus.innerHTML =
                        '<i class="fa-solid fa-circle-check"></i> ' +
                        'Appointment request saved. The clinic team will ' +
                        'confirm your slot after checking the details.';
                }

                bookingForm.reset();
                updatePaymentSection();

            } catch (err) {
                console.error('Submission Error:', err);

                if (formStatus) {
                    formStatus.className = 'form-status-msg error';

                    formStatus.innerHTML =
                        '<i class="fa-solid fa-triangle-exclamation"></i> ' +
                        'Could not save the appointment. Please try again ' +
                        'or call the clinic.';
                } else {
                    alert(
                        'Could not save the appointment. Please try again or call the clinic.'
                    );
                }

            } finally {
                submitBtn.innerHTML = originalBtnText;
                submitBtn.disabled = false;
            }
        });

        // Undo Form Changes
        if (undoBtn) {
            undoBtn.addEventListener('click', () => {
                if (!previousFormData) return;

                const setValue = (
