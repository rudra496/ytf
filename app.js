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
    // Initial check
    checkReveal();

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
        // Wrap index around boundaries
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

    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const target = btn.dataset.tab;
            if (target === 'teams') {
                teamsView.classList.remove('display-none');
                individualsView.classList.add('display-none');
            } else {
                teamsView.classList.add('display-none');
                individualsView.classList.remove('display-none');
            }
        });
    });

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

    // Helper functions: Count up animation
    function animateCounter(element, start, end, duration = 1000, isFloat = false) {
        if (!element) return;
        const startTime = performance.now();

        function update(currentTime) {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Easing function (easeOutQuad)
            const easeProgress = progress * (2 - progress);
            
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
        state.streak += 1; // Increment streak dynamically for engagement demo

        // Animate counter values
        animateCounter(pointsCounter, oldState.points, state.points, 1200);
        animateCounter(co2Counter, oldState.co2Saved, state.co2Saved, 1200, true);
        
        if (streakCounter) streakCounter.textContent = state.streak;
        if (levelCounter) levelCounter.textContent = state.ecoActions;

        // Check Badge Unlock Thresholds
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
            // Limit to 4 entries visually
            if (activityLog.children.length > 4) {
                activityLog.removeChild(activityLog.lastChild);
            }
        }
    }

    // Check Badges thresholds
    function checkBadges() {
        // Silver Badge: unlocks at 14 actions (12 initial + 2 new actions)
        if (state.ecoActions >= 14 && badgeSilver) {
            if (badgeSilver.classList.contains('locked')) {
                badgeSilver.classList.remove('locked');
                badgeSilver.classList.add('unlocked');
                badgeSilver.querySelector('i').className = 'fa-solid fa-medal';
                // Trigger animation alert or effect
                triggerBadgeMilestone('Silver Badge');
            }
        }
        
        // Gold Badge: unlocks at 16 actions
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
        // Create an alert inside the phone screen
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
            
            // Close Scanner
            closeScannerView();

            // Perform Mock Scan verification with slight delay to mimic camera read
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
});
