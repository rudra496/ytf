// ==========================================================================
// RippleUp JS Interactivity - State Management & Animations
// ==========================================================================

document.addEventListener('DOMContentLoaded', () => {
    
    // ======================================================================
    // Mobile Drawer Navigation
    // ======================================================================
    const mobileMenuToggle = document.getElementById('mobile-menu-toggle');
    const mobileDrawer = document.getElementById('mobile-drawer');
    const drawerClose = document.getElementById('drawer-close');
    const drawerOverlay = document.getElementById('drawer-overlay');
    const drawerLinks = document.querySelectorAll('.drawer-link');

    function openDrawer() {
        mobileDrawer.classList.add('open');
        drawerOverlay.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeDrawer() {
        mobileDrawer.classList.remove('open');
        drawerOverlay.classList.remove('open');
        document.body.style.overflow = '';
    }

    if (mobileMenuToggle) mobileMenuToggle.addEventListener('click', openDrawer);
    if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
    if (drawerOverlay) drawerOverlay.addEventListener('click', closeDrawer);

    drawerLinks.forEach(link => {
        link.addEventListener('click', closeDrawer);
    });

    // ======================================================================
    // Scroll Reveal Animation
    // ======================================================================
    const scrollReveals = document.querySelectorAll('.scroll-reveal');

    function checkReveal() {
        const triggerBottom = window.innerHeight * 0.85;
        scrollReveals.forEach(reveal => {
            const top = reveal.getBoundingClientRect().top;
            if (top < triggerBottom) {
                reveal.classList.add('revealed');
            }
        });
    }

    window.addEventListener('scroll', checkReveal);
    checkReveal(); // Initial check

    // ======================================================================
    // Interactive Storyboard Slide Controller
    // ======================================================================
    const slides = document.querySelectorAll('.story-slide');
    const dots = document.querySelectorAll('.story-dots .dot');
    const prevBtn = document.getElementById('prev-slide');
    const nextBtn = document.getElementById('next-slide');
    let currentSlide = 0;
    const totalSlides = slides.length;

    function showSlide(index) {
        if (index >= totalSlides) index = 0;
        if (index < 0) index = totalSlides - 1;

        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        slides[index].classList.add('active');
        dots[index].classList.add('active');
        currentSlide = index;
    }

    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            showSlide(currentSlide + 1);
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            showSlide(currentSlide - 1);
        });
    }

    dots.forEach((dot, idx) => {
        dot.addEventListener('click', () => {
            showSlide(idx);
        });
    });

    // ======================================================================
    // Leaderboard Tabs Controller
    // ======================================================================
    const tabBtns = document.querySelectorAll('.leaderboard-tabs .tab-btn');
    const teamsView = document.getElementById('leaderboard-teams-view');
    const individualsView = document.getElementById('leaderboard-individuals-view');
    const calculatorView = document.getElementById('leaderboard-calculator-view');

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const target = btn.dataset.tab;
            if (target === 'teams') {
                teamsView.classList.remove('display-none');
                individualsView.classList.add('display-none');
                if (calculatorView) calculatorView.classList.add('display-none');
            } else if (target === 'individuals') {
                teamsView.classList.add('display-none');
                individualsView.classList.remove('display-none');
                if (calculatorView) calculatorView.classList.add('display-none');
            } else if (target === 'calculator') {
                teamsView.classList.add('display-none');
                individualsView.classList.add('display-none');
                if (calculatorView) {
                    calculatorView.classList.remove('display-none');
                    // Recalculate and trigger gauge transitions
                    updateCalculator();
                }
            }
        });
    });

    // ======================================================================
    // Interactive SDG Impact Calculator
    // ======================================================================
    const slideRefill = document.getElementById('slide-refill');
    const slideRecycle = document.getElementById('slide-recycle');
    const slideCommute = document.getElementById('slide-commute');
    const slideFood = document.getElementById('slide-food');

    const valRefill = document.getElementById('val-refill');
    const valRecycle = document.getElementById('val-recycle');
    const valCommute = document.getElementById('val-commute');
    const valFood = document.getElementById('val-food');

    const calcCO2 = document.getElementById('calc-co2');
    const calcPlastic = document.getElementById('calc-plastic');
    const calcWaste = document.getElementById('calc-waste');
    const calcPoints = document.getElementById('calc-points');
    const calcAnnualCO2 = document.getElementById('calc-annual-co2');
    const calcAnnualPlastic = document.getElementById('calc-annual-plastic');
    const calcGaugeFill = document.getElementById('calc-gauge-fill');
    const calcGaugeLevel = document.getElementById('calc-gauge-level');

    // Helper: Number pop pulse trigger
    function applyNumberPop(element) {
        if (!element) return;
        element.classList.remove('number-pop');
        void element.offsetWidth; // trigger reflow
        element.classList.add('number-pop');
    }

    function updateCalculator() {
        if (!slideRefill) return;
        const refills = parseInt(slideRefill.value);
        const recycles = parseInt(slideRecycle.value);
        const commutes = parseInt(slideCommute.value);
        const foods = parseInt(slideFood.value);

        // Update labels
        valRefill.textContent = refills;
        valRecycle.textContent = recycles;
        valCommute.textContent = commutes + ' km';
        valFood.textContent = foods;

        // Calculate impact
        const co2 = (refills * 0.20) + (recycles * 0.15) + (commutes * 0.50) + (foods * 0.30);
        const plastic = refills + recycles;
        const waste = foods * 0.50; // assuming 0.5kg per avoided event
        const points = (refills * 20) + (recycles * 30) + (commutes * 25) + (foods * 15);

        // Check if values have changed to apply popping effect
        const oldCO2 = calcCO2.textContent;
        const oldPlastic = calcPlastic.textContent;
        const oldWaste = calcWaste.textContent;
        const oldPoints = calcPoints.textContent;

        // Update display
        calcCO2.textContent = co2.toFixed(1);
        calcPlastic.textContent = plastic;
        calcWaste.textContent = waste.toFixed(1);
        calcPoints.textContent = points;

        if (oldCO2 !== calcCO2.textContent) applyNumberPop(calcCO2);
        if (oldPlastic !== calcPlastic.textContent) applyNumberPop(calcPlastic);
        if (oldWaste !== calcWaste.textContent) applyNumberPop(calcWaste);
        if (oldPoints !== calcPoints.textContent) applyNumberPop(calcPoints);

        // Annual estimates
        calcAnnualCO2.textContent = (co2 * 52).toFixed(1) + ' kg';
        calcAnnualPlastic.textContent = plastic * 52;

        // Update Dashboard SVG Circular Gauge
        if (calcGaugeFill) {
            // Circumference of SVG circle (radius=40) = 2 * PI * 40 = 251.2
            const maxPoints = 1600; // max scale of points
            const percentage = Math.min(points / maxPoints, 1.0);
            const offset = 251.2 * (1 - percentage);
            calcGaugeFill.style.strokeDashoffset = offset;

            // Define status tier based on points
            let levelTitle = "Eco Scout";
            let levelColor = "var(--primary)"; // Green
            
            if (points >= 1200) {
                levelTitle = "Eco Legend";
                levelColor = "var(--purple)"; // Purple
            } else if (points >= 700) {
                levelTitle = "Planet Guardian";
                levelColor = "var(--warning)"; // Gold
            } else if (points >= 300) {
                levelTitle = "Carbon Champion";
                levelColor = "var(--accent)"; // Mint green
            }

            if (calcGaugeLevel) {
                calcGaugeLevel.textContent = levelTitle;
                calcGaugeLevel.style.color = levelColor;
            }
            calcGaugeFill.style.stroke = levelColor;
        }
    }

    if (slideRefill) {
        [slideRefill, slideRecycle, slideCommute, slideFood].forEach(slider => {
            slider.addEventListener('input', updateCalculator);
        });
        updateCalculator(); // Initial run
    }

    // ======================================================================
    // Mock App Simulator State & Control
    // ======================================================================
    
    // Core Simulator State
    let state = {
        points: 350,
        co2Saved: 7.0,
        streak: 5,
        ecoActions: 12
    };

    // DOM References
    const pointsCounter = document.getElementById('points-counter');
    const co2Counter = document.getElementById('co2-counter');
    const streakCounter = document.getElementById('streak-counter');
    const levelCounter = document.getElementById('level-counter');
    
    const badgeSilver = document.getElementById('badge-silver');
    const badgeGold = document.getElementById('badge-gold');
    const activityLog = document.getElementById('activity-log');

    // Action buttons (Simulator panel side)
    const actionBtns = document.querySelectorAll('.action-btn');
    
    // Phone QR overlay triggers
    const triggerQrScan = document.getElementById('trigger-qr-scan');
    const btnPhoneScan = document.getElementById('btn-phone-scan');
    const btnPhoneHome = document.getElementById('btn-phone-home');
    const viewScanner = document.getElementById('view-scanner');
    const closeScanner = document.getElementById('close-scanner');
    
    // Phone Success overlay
    const viewSuccess = document.getElementById('view-success');
    const successPoints = document.getElementById('success-points');
    const successMessage = document.getElementById('success-message');
    const successDismiss = document.getElementById('success-dismiss');

    // Preset scan buttons inside Phone Mockup
    const presetBtns = document.querySelectorAll('.preset-btn');

    // Glare Reflex for Phone Mockup Frame
    const phoneMockup = document.querySelector('.phone-mockup');
    if (phoneMockup) {
        phoneMockup.addEventListener('mousemove', (e) => {
            const rect = phoneMockup.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            phoneMockup.style.setProperty('--glare-x', `${x}px`);
            phoneMockup.style.setProperty('--glare-y', `${y}px`);
        });
    }

    // Canvas Confetti Generator inside phone screen
    const confettiCanvas = document.getElementById('phone-confetti-canvas');
    let confettiCtx = null;
    let confettiParticles = [];
    let confettiAnimId = null;

    if (confettiCanvas) {
        confettiCtx = confettiCanvas.getContext('2d');
        function resizeConfettiCanvas() {
            const rect = confettiCanvas.parentElement.getBoundingClientRect();
            confettiCanvas.width = rect.width;
            confettiCanvas.height = rect.height;
        }
        resizeConfettiCanvas();
        window.addEventListener('resize', resizeConfettiCanvas);
    }

    function triggerConfetti() {
        if (!confettiCanvas || !confettiCtx) return;
        if (confettiAnimId) cancelAnimationFrame(confettiAnimId);
        
        confettiParticles = [];
        const colors = ['#10b981', '#34d399', '#3b82f6', '#f59e0b', '#8b5cf6'];
        const pCount = 45;
        
        const startX = confettiCanvas.width / 2;
        const startY = confettiCanvas.height * 0.7; // Emit from center
        
        for (let i = 0; i < pCount; i++) {
            const angle = Math.PI * 1.05 + (Math.random() - 0.5) * Math.PI * 0.5; // arc directed upwards
            const speed = 3.5 + Math.random() * 7;
            confettiParticles.push({
                x: startX,
                y: startY,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                color: colors[Math.floor(Math.random() * colors.length)],
                size: 4 + Math.random() * 5,
                rotation: Math.random() * Math.PI * 2,
                rotSpeed: (Math.random() - 0.5) * 0.15,
                opacity: 1.0,
                shape: Math.random() > 0.45 ? 'leaf' : 'circle'
            });
        }

        function drawFrame() {
            confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            let alive = false;

            confettiParticles.forEach(p => {
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.24; // gravity
                p.vx *= 0.97; // friction
                p.rotation += p.rotSpeed;

                if (p.y < confettiCanvas.height && p.opacity > 0.02) {
                    alive = true;
                    confettiCtx.save();
                    confettiCtx.translate(p.x, p.y);
                    confettiCtx.rotate(p.rotation);
                    confettiCtx.globalAlpha = p.opacity;
                    confettiCtx.fillStyle = p.color;

                    if (p.shape === 'leaf') {
                        // Eco Leaf shape drawing
                        confettiCtx.beginPath();
                        confettiCtx.moveTo(0, -p.size);
                        confettiCtx.quadraticCurveTo(p.size * 1.4, 0, 0, p.size);
                        confettiCtx.quadraticCurveTo(-p.size * 1.4, 0, 0, -p.size);
                        confettiCtx.fill();
                    } else {
                        // Circular spark drawing
                        confettiCtx.beginPath();
                        confettiCtx.arc(0, 0, p.size / 2, 0, Math.PI * 2);
                        confettiCtx.fill();
                    }
                    confettiCtx.restore();

                    if (p.y > confettiCanvas.height * 0.4) {
                        p.opacity -= 0.016; // start fading past mid-screen
                    }
                }
            });

            if (alive) {
                confettiAnimId = requestAnimationFrame(drawFrame);
            } else {
                confettiCtx.clearRect(0, 0, confettiCanvas.width, confettiCanvas.height);
            }
        }
        drawFrame();
    }

    // Helper functions: Count up animation
    function animateCounter(element, start, end, duration = 1000, isFloat = false) {
        if (!element) return;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            const easeProgress = progress * (2 - progress); // easeOutQuad
            const currentVal = start + (end - start) * easeProgress;
            
            element.textContent = isFloat ? currentVal.toFixed(1) : Math.floor(currentVal);

            if (progress < 1) {
                requestAnimationFrame(update);
            } else {
                element.textContent = isFloat ? end.toFixed(1) : end;
            }
        }
        requestAnimationFrame(update);
    }

    // Function to add a verified action to the phone dashboard
    function logAction(title, points, co2Value) {
        const oldState = { ...state };
        
        // Update State
        state.points += points;
        state.co2Saved += co2Value;
        state.ecoActions += 1;
        state.streak += 1;

        // Animate counter values
        animateCounter(pointsCounter, oldState.points, state.points, 1200);
        animateCounter(co2Counter, oldState.co2Saved, state.co2Saved, 1200, true);
        
        if (streakCounter) streakCounter.textContent = state.streak;
        if (levelCounter) levelCounter.textContent = state.ecoActions;

        checkBadges();

        // Prep Success Message Overlay
        successPoints.textContent = `+${points} Ripple Points`;
        successMessage.innerHTML = `<i class="fa-solid fa-leaf text-glow"></i> Verified! You avoided carbon offset by <strong>${co2Value.toFixed(2)} kg</strong>.`;
        viewSuccess.classList.add('active');

        // Add to recent activity list in Mock Phone
        const newRow = document.createElement('div');
        newRow.className = 'activity-row';
        
        let colorClass = 'bg-blue';
        let iconClass = 'fa-droplet';
        
        if (title.toLowerCase().includes('food') || title.toLowerCase().includes('grocer')) {
            colorClass = 'bg-red';
            iconClass = 'fa-apple-whole';
        } else if (title.toLowerCase().includes('recycl') || title.toLowerCase().includes('plastic')) {
            colorClass = 'bg-green';
            iconClass = 'fa-recycle';
        } else if (title.toLowerCase().includes('walk') || title.toLowerCase().includes('transit') || title.toLowerCase().includes('cycle')) {
            colorClass = 'bg-purple';
            iconClass = 'fa-bicycle';
        }

        newRow.innerHTML = `
            <div class="act-icon ${colorClass}"><i class="fa-solid ${iconClass}"></i></div>
            <div class="act-details">
                <span class="act-title">${title}</span>
                <span class="act-time">Just now</span>
            </div>
            <span class="act-points">+${points} pts</span>
        `;

        if (activityLog) {
            activityLog.insertBefore(newRow, activityLog.firstChild);
            if (activityLog.children.length > 4) {
                activityLog.removeChild(activityLog.lastChild);
            }
        }

        // Trigger phone mockup haptic vibration shake
        if (phoneMockup) {
            phoneMockup.classList.remove('haptic-shake');
            void phoneMockup.offsetWidth; // force redraw/reflow
            phoneMockup.classList.add('haptic-shake');
        }

        // Trigger visual confetti explosion
        triggerConfetti();

        // Trigger 3D Globe & Background Particles Pulse
        if (window.RippleGlobe && typeof window.RippleGlobe.triggerPulse === 'function') {
            let colorHex = 0x10b981; // default emerald
            if (colorClass === 'bg-blue') colorHex = 0x3b82f6;      // blue
            else if (colorClass === 'bg-red') colorHex = 0xef4444;   // red
            else if (colorClass === 'bg-purple') colorHex = 0x8b5cf6;// purple
            window.RippleGlobe.triggerPulse(colorHex);
        }
    }

    // Check Badges thresholds
    function checkBadges() {
        if (state.ecoActions >= 14 && badgeSilver) {
            if (badgeSilver.classList.contains('locked')) {
                badgeSilver.classList.remove('locked');
                badgeSilver.classList.add('unlocked');
                badgeSilver.querySelector('i').className = 'fa-solid fa-medal';
                triggerBadgeMilestone('Silver Badge');
            }
        }
        
        if (state.ecoActions >= 16 && badgeGold) {
            if (badgeGold.classList.contains('locked')) {
                badgeGold.classList.remove('locked');
                badgeGold.classList.add('unlocked');
                badgeGold.querySelector('i').className = 'fa-solid fa-trophy';
                triggerBadgeMilestone('Gold Badge');
            }
        }
    }

    function triggerBadgeMilestone(badgeName) {
        const alertDiv = document.createElement('div');
        alertDiv.style.position = 'absolute';
        alertDiv.style.top = '50px';
        alertDiv.style.left = '10px';
        alertDiv.style.right = '10px';
        alertDiv.style.background = 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)';
        alertDiv.style.color = '#fff';
        alertDiv.style.padding = '8px 12px';
        alertDiv.style.borderRadius = '8px';
        alertDiv.style.fontSize = '0.75rem';
        alertDiv.style.fontWeight = '700';
        alertDiv.style.textAlign = 'center';
        alertDiv.style.boxShadow = '0 4px 15px rgba(245, 158, 11, 0.4)';
        alertDiv.style.zIndex = '10';
        alertDiv.innerHTML = `🎉 Milestone Unlocked: ${badgeName}!`;
        
        const phoneScreen = document.querySelector('.phone-screen');
        if (phoneScreen) {
            phoneScreen.appendChild(alertDiv);
            setTimeout(() => {
                alertDiv.remove();
            }, 3000);
        }
    }

    // Dismiss Success Overlay
    if (successDismiss) {
        successDismiss.addEventListener('click', () => {
            viewSuccess.classList.remove('active');
        });
    }

    // Button event listeners (Simulator Panel Side)
    actionBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            if (action === 'refill') {
                logAction("Campus Refill Station #3", 20, 0.20);
            } else if (action === 'food') {
                logAction("Avoided Food Waste", 15, 0.30);
            } else if (action === 'recycle') {
                logAction("Recycling Hub B", 30, 0.15);
            } else if (action === 'transit') {
                logAction("Walk/Cycling Commute", 25, 0.50);
            }
        });
    });

    // Scanner UI Open / Close
    function openScanner() {
        viewScanner.classList.add('active');
        btnPhoneScan.classList.add('active');
        btnPhoneHome.classList.remove('active');
    }

    function closeScannerView() {
        viewScanner.classList.remove('active');
        btnPhoneScan.classList.remove('active');
        btnPhoneHome.classList.add('active');
    }

    if (triggerQrScan) triggerQrScan.addEventListener('click', openScanner);
    if (btnPhoneScan) btnPhoneScan.addEventListener('click', openScanner);
    if (closeScanner) closeScanner.addEventListener('click', closeScannerView);
    if (btnPhoneHome) btnPhoneHome.addEventListener('click', closeScannerView);

    // Preset Scanning Buttons inside Mock Scanner
    presetBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            closeScannerView();

            setTimeout(() => {
                if (preset === 'campus-refill') {
                    logAction("Water Station #4 Scan", 25, 0.20);
                } else if (preset === 'green-grocer') {
                    logAction("Organic Grocer Stall #7 Scan", 20, 0.35);
                } else if (preset === 'recycle-bin') {
                    logAction("Recycling Point #12 Scan", 35, 0.15);
                }
            }, 300);
        });
    });

    // ======================================================================
    // Intersection Observer for Survey Charts Scroll Animation
    // ======================================================================
    const surveyCharts = document.querySelector('.survey-charts-container');
    if (surveyCharts) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const fills = entry.target.querySelectorAll('.chart-bar-fill');
                    fills.forEach(fill => {
                        const targetWidth = fill.getAttribute('data-width');
                        if (targetWidth) {
                            fill.style.width = targetWidth;
                        }
                    });
                    observer.unobserve(entry.target); // Animate only once
                }
            });
        }, { threshold: 0.15 });
        observer.observe(surveyCharts);
    }
});
