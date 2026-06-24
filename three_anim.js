// ==========================================================================
// Three.js Interactive 3D Eco-Globe & Full-Screen Background Particles
// ==========================================================================

// Global controller for cross-script interaction
window.RippleGlobe = {
    triggerPulse: function(colorHex) {
        if (window.triggerHeroPulse) window.triggerHeroPulse(colorHex);
        if (window.triggerBgPulse) window.triggerBgPulse(colorHex);
    }
};

(function() {
    // Helper: generate glowing point canvas texture
    function createCircleTexture(color, size) {
        const matCanvas = document.createElement('canvas');
        matCanvas.width = size;
        matCanvas.height = size;
        const matContext = matCanvas.getContext('2d');
        
        const gradient = matContext.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.2, color);
        gradient.addColorStop(0.6, 'rgba(255, 255, 255, 0.08)');
        gradient.addColorStop(1, 'transparent');
        
        matContext.fillStyle = gradient;
        matContext.fillRect(0, 0, size, size);
        return new THREE.CanvasTexture(matCanvas);
    }

    // ==========================================================================
    // 1. HERO ECO-GLOBE RENDERER
    // ==========================================================================
    const heroContainer = document.getElementById('three-orbit-canvas');
    if (heroContainer) {
        let scene, camera, renderer;
        let particleGlobe, ringGreen, ringBlue, ringGold, innerLattice, shockwaveRing;
        let origGlobePositions;
        let mouseX = 0, mouseY = 0;
        let targetX = 0, targetY = 0;
        let windowHalfX = heroContainer.clientWidth / 2;
        let windowHalfY = heroContainer.clientHeight / 2;
        
        // Drag rotation state
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        // Spin speed boost multipliers
        let speedBoost = 1.0;

        initHero();
        animateHero();

        function initHero() {
            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera(50, heroContainer.clientWidth / heroContainer.clientHeight, 0.1, 1000);
            camera.position.z = 15;

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(heroContainer.clientWidth, heroContainer.clientHeight);
            renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
            heroContainer.appendChild(renderer.domElement);

            const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
            scene.add(ambientLight);

            const pointLight = new THREE.PointLight(0x10b981, 2, 50);
            pointLight.position.set(5, 5, 5);
            scene.add(pointLight);

            // Core Particle Globe
            const particleCount = 280;
            const globeGeometry = new THREE.BufferGeometry();
            const positions = new Float32Array(particleCount * 3);
            const radius = 4.5;

            for (let i = 0; i < particleCount; i++) {
                const phi = Math.acos(-1 + (2 * i) / particleCount);
                const theta = Math.sqrt(particleCount * Math.PI) * phi;

                positions[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
                positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
                positions[i * 3 + 2] = radius * Math.cos(phi);
            }

            // Save original positions for breathing waves
            origGlobePositions = new Float32Array(positions);

            globeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const greenTexture = createCircleTexture('rgba(16, 185, 129, 1)', 64);
            const globeMaterial = new THREE.PointsMaterial({
                size: 0.28,
                map: greenTexture,
                transparent: true,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                color: 0x34d399
            });

            particleGlobe = new THREE.Points(globeGeometry, globeMaterial);
            scene.add(particleGlobe);

            // Inner Hologram Lattice
            const sphereGeo = new THREE.SphereGeometry(radius * 0.98, 16, 16);
            const sphereMat = new THREE.MeshBasicMaterial({
                color: 0x059669,
                wireframe: true,
                transparent: true,
                opacity: 0.15,
                blending: THREE.AdditiveBlending
            });
            innerLattice = new THREE.Mesh(sphereGeo, sphereMat);
            scene.add(innerLattice);

            // Orbiting Rings Creator Helper
            function createOrbitingRing(colorHex, ringRadius, angleX, angleZ) {
                const ringCount = 75;
                const ringGeometry = new THREE.BufferGeometry();
                const ringPositions = new Float32Array(ringCount * 3);
                
                for (let i = 0; i < ringCount; i++) {
                    const angle = (i / ringCount) * Math.PI * 2;
                    const yOffset = (Math.random() - 0.5) * 0.25;
                    
                    ringPositions[i * 3] = ringRadius * Math.cos(angle);
                    ringPositions[i * 3 + 1] = yOffset;
                    ringPositions[i * 3 + 2] = ringRadius * Math.sin(angle);
                }

                ringGeometry.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));

                const ringTex = createCircleTexture(colorHex, 64);
                const ringMaterial = new THREE.PointsMaterial({
                    size: 0.22,
                    map: ringTex,
                    transparent: true,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                    color: colorHex
                });

                const ringPoints = new THREE.Points(ringGeometry, ringMaterial);
                ringPoints.rotation.x = angleX;
                ringPoints.rotation.z = angleZ;
                scene.add(ringPoints);
                return ringPoints;
            }

            // Three Distinct Gyroscopic Orbiting Rings
            ringGreen = createOrbitingRing(0x10b981, 6.0, Math.PI / 6, Math.PI / 12);  // Green (Circular Economy)
            ringBlue = createOrbitingRing(0x3b82f6, 6.4, -Math.PI / 4, -Math.PI / 6); // Blue (Water Conservation)
            ringGold = createOrbitingRing(0xf59e0b, 6.8, Math.PI / 3, -Math.PI / 4);  // Gold (Carbon Reduction)

            // Expanding 3D Shockwave Ring (Initially invisible)
            const shockGeo = new THREE.RingGeometry(0.1, 4.5, 32);
            const shockMat = new THREE.MeshBasicMaterial({
                color: 0x10b981,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            shockwaveRing = new THREE.Mesh(shockGeo, shockMat);
            shockwaveRing.rotation.x = Math.PI / 6;
            shockwaveRing.rotation.z = Math.PI / 12;
            scene.add(shockwaveRing);

            // Trigger hook for simulator clicks
            window.triggerHeroPulse = function(colorHex) {
                if (shockwaveRing) {
                    shockwaveRing.material.color.setHex(colorHex || 0x10b981);
                    shockwaveRing.scale.set(0.1, 0.1, 0.1);
                    shockwaveRing.material.opacity = 0.95;
                }
                speedBoost = 6.5; // Trigger spin surge
            };

            // Event listeners
            window.addEventListener('resize', onHeroResize);
            heroContainer.addEventListener('mousedown', onHeroMouseDown);
            heroContainer.addEventListener('mousemove', onHeroMouseMove); // Camera pan on hover
            window.addEventListener('mousemove', onHeroMouseMoveDrag); // Globe drag rotation
            window.addEventListener('mouseup', onHeroMouseUp);
            
            // Touch Support (uses non-passive to allow preventing default page scroll while dragging)
            heroContainer.addEventListener('touchstart', onHeroTouchStart, { passive: false });
            window.addEventListener('touchmove', onHeroTouchMove, { passive: false });
            window.addEventListener('touchend', onHeroMouseUp);
        }

        function onHeroResize() {
            windowHalfX = heroContainer.clientWidth / 2;
            windowHalfY = heroContainer.clientHeight / 2;
            camera.aspect = heroContainer.clientWidth / heroContainer.clientHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(heroContainer.clientWidth, heroContainer.clientHeight);
        }

        function onHeroMouseMove(event) {
            const rect = heroContainer.getBoundingClientRect();
            targetX = ((event.clientX - rect.left) - windowHalfX) * 0.0015;
            targetY = ((event.clientY - rect.top) - windowHalfY) * 0.0015;
        }

        function onHeroMouseDown(event) {
            isDragging = true;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        }

        function onHeroMouseMoveDrag(event) {
            if (!isDragging) return;
            const deltaMove = {
                x: event.clientX - previousMousePosition.x,
                y: event.clientY - previousMousePosition.y
            };
            const rotationSpeed = 0.005;
            particleGlobe.rotation.y += deltaMove.x * rotationSpeed;
            particleGlobe.rotation.x += deltaMove.y * rotationSpeed;
            innerLattice.rotation.y += deltaMove.x * rotationSpeed;
            innerLattice.rotation.x += deltaMove.y * rotationSpeed;
            ringGreen.rotation.y -= deltaMove.x * rotationSpeed * 0.5;
            ringBlue.rotation.y += deltaMove.x * rotationSpeed * 0.3;
            ringGold.rotation.y -= deltaMove.x * rotationSpeed * 0.4;
            previousMousePosition = { x: event.clientX, y: event.clientY };
        }

        function onHeroMouseUp() {
            isDragging = false;
        }

        function onHeroTouchStart(event) {
            if (event.touches.length === 1) {
                isDragging = true;
                previousMousePosition = {
                    x: event.touches[0].clientX,
                    y: event.touches[0].clientY
                };
            }
        }

        function onHeroTouchMove(event) {
            if (!isDragging || event.touches.length !== 1) return;
            // Prevent default page scrolling when dragging the eco-globe
            if (event.cancelable) event.preventDefault();
            const deltaMove = {
                x: event.touches[0].clientX - previousMousePosition.x,
                y: event.touches[0].clientY - previousMousePosition.y
            };
            const rotationSpeed = 0.008;
            particleGlobe.rotation.y += deltaMove.x * rotationSpeed;
            particleGlobe.rotation.x += deltaMove.y * rotationSpeed;
            innerLattice.rotation.y += deltaMove.x * rotationSpeed;
            innerLattice.rotation.x += deltaMove.y * rotationSpeed;
            ringGreen.rotation.y -= deltaMove.x * rotationSpeed * 0.5;
            ringBlue.rotation.y += deltaMove.x * rotationSpeed * 0.3;
            ringGold.rotation.y -= deltaMove.x * rotationSpeed * 0.4;
            previousMousePosition = { x: event.touches[0].clientX, y: event.touches[0].clientY };
        }

        function animateHero() {
            requestAnimationFrame(animateHero);
            
            // Decelerate speed boost
            if (speedBoost > 1.0) {
                speedBoost -= 0.08;
            } else {
                speedBoost = 1.0;
            }

            const time = performance.now() * 0.001;

            // Apply mathematical wave displacements to Globe particles (Breathe effect)
            if (particleGlobe && origGlobePositions) {
                const globePositionsArr = particleGlobe.geometry.attributes.position.array;
                const pCount = origGlobePositions.length / 3;
                
                for (let i = 0; i < pCount; i++) {
                    const ox = origGlobePositions[i * 3];
                    const oy = origGlobePositions[i * 3 + 1];
                    const oz = origGlobePositions[i * 3 + 2];
                    
                    const len = Math.sqrt(ox*ox + oy*oy + oz*oz);
                    if (len === 0) continue;
                    
                    const nx = ox / len;
                    const ny = oy / len;
                    const nz = oz / len;
                    
                    const angle = Math.atan2(ny, nx);
                    // Beautiful organic wave morphing
                    const wave = Math.sin(angle * 4 + time * 1.5) * Math.cos(nz * 2 + time) * 0.18;
                    const scale = 1.0 + wave;
                    
                    globePositionsArr[i * 3] = ox * scale;
                    globePositionsArr[i * 3 + 1] = oy * scale;
                    globePositionsArr[i * 3 + 2] = oz * scale;
                }
                particleGlobe.geometry.attributes.position.needsUpdate = true;
            }

            if (!isDragging) {
                const scrollSpeedMultiplier = 1 + Math.min(window.scrollY * 0.005, 5);
                const rotationFactor = scrollSpeedMultiplier * speedBoost;
                
                particleGlobe.rotation.y += 0.0012 * rotationFactor;
                particleGlobe.rotation.x += 0.0003 * rotationFactor;
                innerLattice.rotation.y += 0.0012 * rotationFactor;
                innerLattice.rotation.x += 0.0003 * rotationFactor;
                
                // Gyroscopic Orbit Rings rotation
                ringGreen.rotation.y -= 0.0022 * rotationFactor;
                ringBlue.rotation.y += 0.0016 * rotationFactor;
                ringGold.rotation.y -= 0.0010 * rotationFactor;
            }

            // Animate Expanding Shockwave Ring
            if (shockwaveRing && shockwaveRing.material.opacity > 0) {
                shockwaveRing.scale.x += 0.12;
                shockwaveRing.scale.y += 0.12;
                shockwaveRing.material.opacity -= 0.022;
            }

            mouseX += (targetX - mouseX) * 0.05;
            mouseY += (targetY - mouseY) * 0.05;
            camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
            camera.position.y += (-mouseY * 5 - camera.position.y) * 0.05;
            camera.lookAt(scene.position);

            renderer.render(scene, camera);
        }
    }

    // ==========================================================================
    // 2. FULL-SCREEN VIEWPORT BACKGROUND PARTICLES & CONSTELLATION WEB
    // ==========================================================================
    const bgContainer = document.getElementById('canvas-container');
    if (bgContainer) {
        let bgScene, bgCamera, bgRenderer, bgParticles, bgLines;
        const bgParticleCount = 120;
        const maxConnections = 240;
        let bgSpeeds = [];
        let bgBasePositions;
        let bgOffsets;
        let bgPulseBoost = 1.0;
        
        let mouseX = 0, mouseY = 0;
        let targetX = 0, targetY = 0;
        
        initBg();
        animateBg();

        function initBg() {
            bgScene = new THREE.Scene();
            
            bgCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.1, 1000);
            bgCamera.position.z = 20;
            
            bgRenderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
            bgRenderer.setSize(window.innerWidth, window.innerHeight);
            bgRenderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
            bgContainer.appendChild(bgRenderer.domElement);
            
            const greenTexture = createCircleTexture('rgba(16, 185, 129, 0.75)', 64);
            const goldTexture = createCircleTexture('rgba(245, 158, 11, 0.75)', 64);
            
            const bgGeometry = new THREE.BufferGeometry();
            const bgPositions = new Float32Array(bgParticleCount * 3);
            bgBasePositions = new Float32Array(bgParticleCount * 3);
            bgOffsets = new Float32Array(bgParticleCount * 3);
            
            // Randomly spread particles throughout 3D bounding box
            for (let i = 0; i < bgParticleCount; i++) {
                const rx = (Math.random() - 0.5) * 45;      // X
                const ry = (Math.random() - 0.5) * 35;      // Y
                const rz = (Math.random() - 0.5) * 20;      // Z
                
                bgPositions[i * 3] = rx;
                bgPositions[i * 3 + 1] = ry;
                bgPositions[i * 3 + 2] = rz;
                
                bgBasePositions[i * 3] = rx;
                bgBasePositions[i * 3 + 1] = ry;
                bgBasePositions[i * 3 + 2] = rz;
                
                bgOffsets[i * 3] = 0;
                bgOffsets[i * 3 + 1] = 0;
                bgOffsets[i * 3 + 2] = 0;
                
                // Slow drift speed
                bgSpeeds.push(0.015 + Math.random() * 0.025);
            }
            
            bgGeometry.setAttribute('position', new THREE.BufferAttribute(bgPositions, 3));
            
            const bgMaterial = new THREE.PointsMaterial({
                size: 0.35,
                map: Math.random() > 0.5 ? greenTexture : goldTexture,
                transparent: true,
                opacity: 0.35,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            bgParticles = new THREE.Points(bgGeometry, bgMaterial);
            bgScene.add(bgParticles);

            // Constellation Lines Set Up
            const linePositions = new Float32Array(maxConnections * 2 * 3); // 2 points per line, 3 coords each
            const lineGeometry = new THREE.BufferGeometry();
            lineGeometry.setAttribute('position', new THREE.BufferAttribute(linePositions, 3));
            
            const lineMaterial = new THREE.LineBasicMaterial({
                color: 0x10b981,
                transparent: true,
                opacity: 0.12,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            
            bgLines = new THREE.LineSegments(lineGeometry, lineMaterial);
            bgScene.add(bgLines);
            
            // Trigger hook for simulator clicks
            window.triggerBgPulse = function(colorHex) {
                bgPulseBoost = 6.0; // Trigger upward particle surge
                bgParticles.material.opacity = 0.8;
                if (bgLines) bgLines.material.opacity = 0.4;
            };
            
            // Event listeners
            window.addEventListener('resize', onBgResize);
            window.addEventListener('mousemove', onBgMouseMove);
        }

        function onBgResize() {
            bgCamera.aspect = window.innerWidth / window.innerHeight;
            bgCamera.updateProjectionMatrix();
            bgRenderer.setSize(window.innerWidth, window.innerHeight);
        }
        
        function onBgMouseMove(event) {
            // Map cursor coordinate to target range
            targetX = (event.clientX - window.innerWidth / 2) * 0.0005;
            targetY = (event.clientY - window.innerHeight / 2) * 0.0005;
        }

        function animateBg() {
            requestAnimationFrame(animateBg);
            
            // Decelerate pulse boost back to baseline
            if (bgPulseBoost > 1.0) {
                bgPulseBoost -= 0.1;
                bgParticles.material.opacity -= 0.01;
                if (bgParticles.material.opacity < 0.35) bgParticles.material.opacity = 0.35;
                if (bgLines) {
                    bgLines.material.opacity -= 0.007;
                    if (bgLines.material.opacity < 0.12) bgLines.material.opacity = 0.12;
                }
            } else {
                bgPulseBoost = 1.0;
            }
            
            const positions = bgParticles.geometry.attributes.position.array;
            
            // 3D projected mouse position
            const mouseX3D = mouseX * 45;
            const mouseY3D = -mouseY * 35;
            
            // Drift particles upwards and apply mouse repulsion
            for (let i = 0; i < bgParticleCount; i++) {
                // Apply base upward drift
                bgBasePositions[i * 3 + 1] += bgSpeeds[i] * bgPulseBoost;
                
                // Wrap around when moving past the top of the viewport
                if (bgBasePositions[i * 3 + 1] > 20) {
                    bgBasePositions[i * 3 + 1] = -20;
                    bgBasePositions[i * 3] = (Math.random() - 0.5) * 45;
                }

                // Mouse Repulsion force calculations
                const px = bgBasePositions[i * 3] + bgOffsets[i * 3];
                const py = bgBasePositions[i * 3 + 1] + bgOffsets[i * 3 + 1];
                const pz = bgBasePositions[i * 3 + 2] + bgOffsets[i * 3 + 2];
                
                const dx = px - mouseX3D;
                const dy = py - mouseY3D;
                const dz = pz - 0;
                const distSq = dx*dx + dy*dy + dz*dz;
                const dist = Math.sqrt(distSq);
                
                const repelRadius = 7.5;
                if (dist < repelRadius && dist > 0.1) {
                    const force = (repelRadius - dist) / repelRadius;
                    // Accelerate offset outwards
                    bgOffsets[i * 3] += (dx / dist) * force * 0.4;
                    bgOffsets[i * 3 + 1] += (dy / dist) * force * 0.4;
                }
                
                // Inertia spring damping
                bgOffsets[i * 3] *= 0.90;
                bgOffsets[i * 3 + 1] *= 0.90;
                bgOffsets[i * 3 + 2] *= 0.90;
                
                positions[i * 3] = bgBasePositions[i * 3] + bgOffsets[i * 3];
                positions[i * 3 + 1] = bgBasePositions[i * 3 + 1] + bgOffsets[i * 3 + 1];
                positions[i * 3 + 2] = bgBasePositions[i * 3 + 2] + bgOffsets[i * 3 + 2];
            }
            
            bgParticles.geometry.attributes.position.needsUpdate = true;

            // Update Dynamic Constellation Line Connections
            if (bgLines) {
                let lineIndex = 0;
                const linePosArr = bgLines.geometry.attributes.position.array;
                
                for (let i = 0; i < bgParticleCount; i++) {
                    if (lineIndex >= maxConnections) break;
                    
                    const ix = positions[i * 3];
                    const iy = positions[i * 3 + 1];
                    const iz = positions[i * 3 + 2];
                    
                    for (let j = i + 1; j < bgParticleCount; j++) {
                        if (lineIndex >= maxConnections) break;
                        
                        const jx = positions[j * 3];
                        const jy = positions[j * 3 + 1];
                        const jz = positions[j * 3 + 2];
                        
                        const dx = ix - jx;
                        const dy = iy - jy;
                        const dz = iz - jz;
                        const distSq = dx*dx + dy*dy + dz*dz;
                        
                        // Connect particles closer than 6.8 units
                        if (distSq < 46.2) {
                            const idx = lineIndex * 6;
                            linePosArr[idx] = ix;
                            linePosArr[idx + 1] = iy;
                            linePosArr[idx + 2] = iz;
                            
                            linePosArr[idx + 3] = jx;
                            linePosArr[idx + 4] = jy;
                            linePosArr[idx + 5] = jz;
                            
                            lineIndex++;
                        }
                    }
                }
                
                // Clear remaining slots to prevent drawing artifacts
                for (let k = lineIndex; k < maxConnections; k++) {
                    const idx = k * 6;
                    linePosArr[idx] = 0;
                    linePosArr[idx + 1] = 0;
                    linePosArr[idx + 2] = 0;
                    linePosArr[idx + 3] = 0;
                    linePosArr[idx + 4] = 0;
                    linePosArr[idx + 5] = 0;
                }
                
                bgLines.geometry.attributes.position.needsUpdate = true;
                bgLines.geometry.setDrawRange(0, lineIndex * 2);
            }
            
            // Rotate the background particle structure very slowly
            bgParticles.rotation.y += 0.0001;
            bgParticles.rotation.x += 0.00005;
            if (bgLines) {
                bgLines.rotation.y += 0.0001;
                bgLines.rotation.x += 0.00005;
            }
            
            // Gentle camera pan
            mouseX += (targetX - mouseX) * 0.03;
            mouseY += (targetY - mouseY) * 0.03;
            bgCamera.position.x += (mouseX * 10 - bgCamera.position.x) * 0.03;
            bgCamera.position.y += (-mouseY * 10 - bgCamera.position.y) * 0.03;
            bgCamera.lookAt(bgScene.position);
            
            bgRenderer.render(bgScene, bgCamera);
        }
    }
})();
