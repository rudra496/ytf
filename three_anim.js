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
        let satellites = [];
        let satLinks;
        let mouseX = 0, mouseY = 0;
        let targetX = 0, targetY = 0;
        let windowHalfX = 0;
        let windowHalfY = 0;
        
        // Drag rotation state
        let isDragging = false;
        let previousMousePosition = { x: 0, y: 0 };
        
        // Spin speed boost multipliers
        let speedBoost = 1.0;

        // Centrifugal rotation velocity for equatorial bulge
        let rotationVelocity = 0;

        // Aurora Magnetic Field Curves and Flowing Particles
        let fieldCurves = [];
        let fieldLines = [];
        const fieldLineCount = 6;
        let fieldParticles;
        let fieldParticlesData = [];

        // Action Data Ingestion Stream Particles
        let ingestParticles;
        let ingestMat;
        let ingestGeo;
        let ingestData = [];
        const ingestCount = 50;

        // Advanced Connection Energy Pulses
        let connParticles;
        let connParticlesData = [];

        let heroInitialized = false;

        function tryInitHero() {
            if (heroInitialized) return;
            if (heroContainer.clientWidth > 0 && heroContainer.clientHeight > 0) {
                heroInitialized = true;
                windowHalfX = heroContainer.clientWidth / 2;
                windowHalfY = heroContainer.clientHeight / 2;
                initHero();
                animateHero();
            }
        }

        // Try initializing immediately
        tryInitHero();

        // Listen to window load and DOMContentLoaded
        window.addEventListener('load', tryInitHero);
        document.addEventListener('DOMContentLoaded', tryInitHero);

        // Robust Auto-Resize: Handles load timing and media collapses
        if (typeof ResizeObserver !== 'undefined') {
            const ro = new ResizeObserver(entries => {
                for (let entry of entries) {
                    const { width, height } = entry.contentRect;
                    if (width > 0 && height > 0) {
                        if (!heroInitialized) {
                            tryInitHero();
                        } else {
                            onHeroResize();
                        }
                    }
                }
            });
            ro.observe(heroContainer);
        } else {
            // Fallback: poll size using requestAnimationFrame
            const pollSize = () => {
                if (!heroInitialized) {
                    tryInitHero();
                    if (!heroInitialized) {
                        requestAnimationFrame(pollSize);
                    }
                }
            };
            pollSize();
        }

        function initHero() {
            scene = new THREE.Scene();

            camera = new THREE.PerspectiveCamera(50, heroContainer.clientWidth / (heroContainer.clientHeight || 1), 0.1, 1000);
            camera.position.z = 15;

            renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
            renderer.setSize(heroContainer.clientWidth, heroContainer.clientHeight || 1);
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

            // Save original positions for breathing waves and cursor attraction
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

                // FIX: Convert colorHex number to a valid CSS Hex string for Canvas gradients
                const colorStr = '#' + colorHex.toString(16).padStart(6, '0');
                const ringTex = createCircleTexture(colorStr, 64);
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

            // --- Advanced Physics Gravity Satellites ---
            satellites = [];
            const satCount = 6;
            const satColors = [0x10b981, 0x3b82f6, 0xf59e0b, 0x8b5cf6, 0x34d399, 0xef4444];
            
            for (let i = 0; i < satCount; i++) {
                // High-tech wireframe octahedron geometries for satellite nodes
                const satGeo = new THREE.OctahedronGeometry(0.16, 0);
                const satMat = new THREE.MeshBasicMaterial({
                    color: satColors[i],
                    wireframe: true,
                    transparent: true,
                    opacity: 0.8,
                    blending: THREE.AdditiveBlending
                });
                const satMesh = new THREE.Mesh(satGeo, satMat);
                scene.add(satMesh);
                
                satellites.push({
                    mesh: satMesh,
                    color: satColors[i],
                    distance: 5.5 + (i * 0.25) + Math.random() * 0.15,
                    speed: 0.012 + (i * 0.004),
                    angle: (i / satCount) * Math.PI * 2,
                    tiltX: (Math.random() - 0.5) * Math.PI * 0.35,
                    tiltZ: (Math.random() - 0.5) * Math.PI * 0.35,
                    phase: Math.random() * 100,
                    // Spring-physics velocity and offsets for cursor gravity reaction
                    offsetPos: new THREE.Vector3(0, 0, 0),
                    vel: new THREE.Vector3(0, 0, 0)
                });
            }

            // Dynamic Satellite Link Lines (LineSegments)
            const satLinkPositions = new Float32Array(satCount * 2 * 3); // 2 points per satellite, 3 coords each
            const satLinkGeometry = new THREE.BufferGeometry();
            satLinkGeometry.setAttribute('position', new THREE.BufferAttribute(satLinkPositions, 3));
            
            const satLinkMaterial = new THREE.LineBasicMaterial({
                color: 0x10b981,
                transparent: true,
                opacity: 0.22,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            satLinks = new THREE.LineSegments(satLinkGeometry, satLinkMaterial);
            scene.add(satLinks);

            // --- Advanced Connection Energy Pulses ---
            const pulsePerSat = 4;
            const connParticleCount = satCount * pulsePerSat;
            const connGeo = new THREE.BufferGeometry();
            const connPositions = new Float32Array(connParticleCount * 3);
            connGeo.setAttribute('position', new THREE.BufferAttribute(connPositions, 3));
            
            const connTex = createCircleTexture('rgba(52, 211, 153, 0.95)', 32);
            const connMat = new THREE.PointsMaterial({
                size: 0.15,
                map: connTex,
                transparent: true,
                opacity: 0.85,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                color: 0x6ee7b7
            });
            
            connParticles = new THREE.Points(connGeo, connMat);
            scene.add(connParticles);
            
            connParticlesData = [];
            for (let i = 0; i < satCount; i++) {
                for (let p = 0; p < pulsePerSat; p++) {
                    connParticlesData.push({
                        satIndex: i,
                        t: p / pulsePerSat, // space out starting progress
                        speed: 0.008 + Math.random() * 0.006
                    });
                }
            }

            // Replacing 2D Shockwave with 3D Spherical wireframe shell
            const shockGeo = new THREE.SphereGeometry(radius * 0.95, 12, 12);
            const shockMat = new THREE.MeshBasicMaterial({
                color: 0x10b981,
                wireframe: true,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false
            });
            shockwaveRing = new THREE.Mesh(shockGeo, shockMat);
            scene.add(shockwaveRing);

            // --- Advanced Aurora Magnetic Field Curves ---
            fieldCurves = [];
            fieldLines = [];
            const fieldLinesGroup = new THREE.Group();
            scene.add(fieldLinesGroup);
            
            for (let i = 0; i < fieldLineCount; i++) {
                const angle = (i / fieldLineCount) * Math.PI * 2;
                const midRadius = radius * 1.25;
                const midX = midRadius * Math.cos(angle);
                const midZ = midRadius * Math.sin(angle);
                
                const curve = new THREE.QuadraticBezierCurve3(
                    new THREE.Vector3(0, radius, 0),        // North Pole
                    new THREE.Vector3(midX, 0, midZ),        // Equator bulge
                    new THREE.Vector3(0, -radius, 0)        // South Pole
                );
                
                fieldCurves.push(curve);
                
                // Create magnetic field line geometry
                const points = curve.getPoints(24);
                const lineGeo = new THREE.BufferGeometry().setFromPoints(points);
                const lineMat = new THREE.LineBasicMaterial({
                    color: 0x34d399,
                    transparent: true,
                    opacity: 0.15,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false
                });
                const lineMesh = new THREE.Line(lineGeo, lineMat);
                fieldLinesGroup.add(lineMesh);
                fieldLines.push(lineMesh);
            }
            
            // Aurora Flowing Particles
            const fieldParticleCount = 30;
            const fieldParticlesGeo = new THREE.BufferGeometry();
            const fieldParticlePositions = new Float32Array(fieldParticleCount * 3);
            fieldParticlesGeo.setAttribute('position', new THREE.BufferAttribute(fieldParticlePositions, 3));
            
            const fieldTex = createCircleTexture('rgba(52, 211, 153, 0.85)', 32);
            const fieldParticlesMat = new THREE.PointsMaterial({
                size: 0.16,
                map: fieldTex,
                transparent: true,
                opacity: 0.8,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                color: 0x6ee7b7
            });
            
            fieldParticles = new THREE.Points(fieldParticlesGeo, fieldParticlesMat);
            scene.add(fieldParticles);
            
            fieldParticlesData = [];
            for (let i = 0; i < fieldParticleCount; i++) {
                fieldParticlesData.push({
                    curveIndex: Math.floor(Math.random() * fieldLineCount),
                    t: Math.random(),
                    speed: 0.003 + Math.random() * 0.007
                });
            }

            // --- Action Data Ingestion Stream Particles ---
            ingestGeo = new THREE.BufferGeometry();
            const ingestPositions = new Float32Array(ingestCount * 3);
            const ingestColors = new Float32Array(ingestCount * 3);
            ingestGeo.setAttribute('position', new THREE.BufferAttribute(ingestPositions, 3));
            ingestGeo.setAttribute('color', new THREE.BufferAttribute(ingestColors, 3));
            
            const ingestTex = createCircleTexture('rgba(255, 255, 255, 1)', 32);
            ingestMat = new THREE.PointsMaterial({
                size: 0.18,
                map: ingestTex,
                transparent: true,
                opacity: 0,
                blending: THREE.AdditiveBlending,
                depthWrite: false,
                vertexColors: true
            });
            ingestParticles = new THREE.Points(ingestGeo, ingestMat);
            scene.add(ingestParticles);
            
            ingestData = [];
            for (let i = 0; i < ingestCount; i++) {
                ingestData.push({
                    pos: new THREE.Vector3(0, 0, 0),
                    vel: new THREE.Vector3(0, 0, 0),
                    targetSat: 0,
                    active: false,
                    t: 0
                });
            }

            // Trigger hook for simulator clicks
            window.triggerHeroPulse = function(colorHex) {
                if (shockwaveRing) {
                    shockwaveRing.material.color.setHex(colorHex || 0x10b981);
                    shockwaveRing.scale.set(0.1, 0.1, 0.1);
                    shockwaveRing.material.opacity = 0.95;
                }
                speedBoost = 6.5; // Trigger spin surge

                // Trigger Ingestion Streams
                if (typeof window.triggerIngestStream === 'function') {
                    window.triggerIngestStream(colorHex);
                }
            };

            window.triggerIngestStream = function(colorHex) {
                const colorObj = new THREE.Color(colorHex || 0x10b981);
                const colorsArr = ingestGeo.attributes.color.array;
                
                // Choose a random start point on the surface of the globe (radius = 4.5)
                const phi = Math.random() * Math.PI * 2;
                const theta = Math.acos(Math.random() * 2 - 1);
                const startPoint = new THREE.Vector3(
                    radius * Math.sin(theta) * Math.cos(phi),
                    radius * Math.sin(theta) * Math.sin(phi),
                    radius * Math.cos(theta)
                );
                
                ingestData.forEach((p, idx) => {
                    p.active = true;
                    p.t = 0;
                    p.targetSat = Math.floor(Math.random() * satellites.length);
                    p.startPos = new THREE.Vector3().copy(startPoint);
                    
                    // Add small offset to start positions to spread them out
                    p.startPos.x += (Math.random() - 0.5) * 0.5;
                    p.startPos.y += (Math.random() - 0.5) * 0.5;
                    p.startPos.z += (Math.random() - 0.5) * 0.5;
                    
                    // Spiral parameters
                    p.spiralSpeed = 5 + Math.random() * 8; // spiral revolutions
                    p.spiralRadius = 0.5 + Math.random() * 1.5;
                    p.speed = 0.015 + Math.random() * 0.015;
                    
                    // Set color
                    colorsArr[idx * 3] = colorObj.r;
                    colorsArr[idx * 3 + 1] = colorObj.g;
                    colorsArr[idx * 3 + 2] = colorObj.b;
                });
                
                ingestGeo.attributes.color.needsUpdate = true;
                ingestMat.opacity = 1.0;
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

            // ResizeObserver moved to outer scope
        }

        function onHeroResize() {
            windowHalfX = heroContainer.clientWidth / 2;
            windowHalfY = heroContainer.clientHeight / 2;
            camera.aspect = heroContainer.clientWidth / (heroContainer.clientHeight || 1);
            camera.updateProjectionMatrix();
            renderer.setSize(heroContainer.clientWidth, heroContainer.clientHeight || 1);
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

            // Accumulate rotation velocity for equatorial bulge
            rotationVelocity += (Math.abs(deltaMove.x) + Math.abs(deltaMove.y)) * 0.08;
            if (rotationVelocity > 5.0) rotationVelocity = 5.0; // clamp

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

            // Accumulate rotation velocity for touch drag
            rotationVelocity += (Math.abs(deltaMove.x) + Math.abs(deltaMove.y)) * 0.12;
            if (rotationVelocity > 5.0) rotationVelocity = 5.0;

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

            // Decelerate rotation velocity
            rotationVelocity *= 0.94;
            if (rotationVelocity < 0.01) rotationVelocity = 0;

            const time = performance.now() * 0.001;

            // Project 3D cursor position in world space
            const cursor3D = new THREE.Vector3(mouseX * 11, -mouseY * 8, 3);
            // Transform mouse coordinate into globe local rotation frame
            const localCursor = new THREE.Vector3().copy(cursor3D);
            localCursor.applyEuler(new THREE.Euler(-particleGlobe.rotation.x, -particleGlobe.rotation.y, 0, 'YXZ'));

            // Apply mathematical wave displacements and cursor attraction (Tidal Bulge)
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
                    // Breathing wave
                    const wave = Math.sin(angle * 4 + time * 1.5) * Math.cos(nz * 2 + time) * 0.18;
                    const scale = 1.0 + wave;

                    // Centrifugal equator stretch (oblateness)
                    const equatorStretch = 1.0 + (1 - nz * nz) * rotationVelocity * 0.08;
                    
                    let finalX = ox * scale * equatorStretch;
                    let finalY = oy * scale * equatorStretch;
                    let finalZ = oz * scale;
                    
                    // Mouse cursor tidal gravity attraction bulge
                    const dx = localCursor.x - finalX;
                    const dy = localCursor.y - finalY;
                    const dz = localCursor.z - finalZ;
                    const distSq = dx*dx + dy*dy + dz*dz;
                    const dist = Math.sqrt(distSq);
                    
                    const attractRadius = 5.5;
                    if (dist < attractRadius && dist > 0.05) {
                        const force = (attractRadius - dist) / attractRadius;
                        // Pull vertices towards cursor, boosted by simulator speedBoost
                        const pull = force * 0.45 * (speedBoost * 0.6 + 0.4);
                        finalX += (dx / dist) * pull;
                        finalY += (dy / dist) * pull;
                        finalZ += (dz / dist) * pull;
                    }
                    
                    globePositionsArr[i * 3] = finalX;
                    globePositionsArr[i * 3 + 1] = finalY;
                    globePositionsArr[i * 3 + 2] = finalZ;
                }
                particleGlobe.geometry.attributes.position.needsUpdate = true;
            }

            // Animate Gravity Satellites (Advanced Spring-Mass-Damper Physics) & Connecting lines
            if (satellites && satellites.length > 0 && satLinks) {
                const satLinkPosArr = satLinks.geometry.attributes.position.array;
                
                satellites.forEach((sat, index) => {
                    sat.angle += sat.speed * speedBoost * 0.7; // Speed perturbed by pulses
                    
                    // Elliptical parameters
                    const radiusX = sat.distance;
                    const radiusZ = sat.distance * 0.85;
                    
                    const timePhase = time * 1.5 + sat.phase;
                    const noisePert = Math.sin(timePhase) * 0.22;
                    
                    // Calculate local 3D base position
                    let sx = (radiusX + noisePert) * Math.cos(sat.angle);
                    let sy = Math.sin(timePhase) * 0.15; // Vertical bounce
                    let sz = (radiusZ + noisePert) * Math.sin(sat.angle);
                    
                    // Apply tilt rotations to base position
                    let basePos = new THREE.Vector3(sx, sy, sz);
                    basePos.applyAxisAngle(new THREE.Vector3(1, 0, 0), sat.tiltX);
                    basePos.applyAxisAngle(new THREE.Vector3(0, 0, 1), sat.tiltZ);

                    // Spring physics calculation for cursor attraction
                    let currentPos = new THREE.Vector3().copy(basePos).add(sat.offsetPos);
                    let force = new THREE.Vector3(0, 0, 0);
                    
                    // 1. Gravitational pull towards cursor
                    const distToCursor = currentPos.distanceTo(cursor3D);
                    if (distToCursor < 6.0) {
                        const pullForce = (6.0 - distToCursor) / 6.0;
                        const gravityStrength = 0.08 * (speedBoost * 0.5 + 0.5);
                        let dirToCursor = new THREE.Vector3().subVectors(cursor3D, currentPos).normalize();
                        force.add(dirToCursor.multiplyScalar(pullForce * gravityStrength));
                    }
                    
                    // 2. Restoring spring force towards basePos (offsetPos = 0)
                    const springK = 0.05;
                    let restoringForce = new THREE.Vector3().copy(sat.offsetPos).multiplyScalar(-springK);
                    force.add(restoringForce);
                    
                    // 3. Damping force
                    const dampingC = 0.12;
                    let dampingForce = new THREE.Vector3().copy(sat.vel).multiplyScalar(-dampingC);
                    force.add(dampingForce);
                    
                    // Update physics state (dt = 1)
                    sat.vel.add(force);
                    sat.offsetPos.add(sat.vel);
                    
                    // Final position
                    let satPos = new THREE.Vector3().copy(basePos).add(sat.offsetPos);
                    sat.mesh.position.copy(satPos);
                    sat.mesh.rotation.x += 0.015;
                    sat.mesh.rotation.y += 0.025;
                    
                    // Sat scale breathing
                    const sScale = 1.0 + Math.sin(timePhase * 2) * 0.15;
                    sat.mesh.scale.set(sScale, sScale, sScale);
                    
                    // Connect line: from projected surface point to satellite position
                    const surfacePoint = new THREE.Vector3().copy(satPos).normalize().multiplyScalar(4.5);
                    const lineIdx = index * 6;
                    
                    satLinkPosArr[lineIdx] = surfacePoint.x;
                    satLinkPosArr[lineIdx + 1] = surfacePoint.y;
                    satLinkPosArr[lineIdx + 2] = surfacePoint.z;
                    
                    satLinkPosArr[lineIdx + 3] = satPos.x;
                    satLinkPosArr[lineIdx + 4] = satPos.y;
                    satLinkPosArr[lineIdx + 5] = satPos.z;
                });
                
                satLinks.geometry.attributes.position.needsUpdate = true;
                // Pulsate connecting lines opacity
                satLinks.material.opacity = 0.16 + Math.sin(time * 3) * 0.06;
            }

            // Animate Traveling Energy Pulses along connection lines
            if (connParticles && connParticlesData.length > 0) {
                const connPosArr = connParticles.geometry.attributes.position.array;
                
                connParticlesData.forEach((p, idx) => {
                    p.t += p.speed * speedBoost;
                    if (p.t > 1.0) {
                        p.t = 0;
                    }
                    
                    const satPos = satellites[p.satIndex].mesh.position;
                    const surfacePoint = new THREE.Vector3().copy(satPos).normalize().multiplyScalar(4.5);
                    const point = new THREE.Vector3().lerpVectors(surfacePoint, satPos, p.t);
                    
                    connPosArr[idx * 3] = point.x;
                    connPosArr[idx * 3 + 1] = point.y;
                    connPosArr[idx * 3 + 2] = point.z;
                });
                
                connParticles.geometry.attributes.position.needsUpdate = true;
            }

            // Animate Aurora Magnetic Field Curves (Solar Wind Wobble) & Flowing Particles
            if (fieldCurves.length > 0 && fieldLines.length > 0 && fieldParticles) {
                fieldCurves.forEach((curve, i) => {
                    const angle = (i / fieldLineCount) * Math.PI * 2;
                    const midRadius = radius * (1.25 + Math.sin(time * 1.5 + i * 2) * 0.15);
                    const wobbleAngle = angle + Math.cos(time * 0.8 + i) * 0.22;
                    
                    curve.v1.x = midRadius * Math.cos(wobbleAngle);
                    curve.v1.y = Math.sin(time * 2.0 + i) * 0.45;
                    curve.v1.z = midRadius * Math.sin(wobbleAngle);
                    curve.cacheArcLengths = null;
                    
                    const points = curve.getPoints(24);
                    fieldLines[i].geometry.setFromPoints(points);
                    fieldLines[i].geometry.attributes.position.needsUpdate = true;
                });

                const posArr = fieldParticles.geometry.attributes.position.array;
                fieldParticlesData.forEach((p, idx) => {
                    p.t += p.speed * speedBoost * 0.8;
                    if (p.t > 1.0) {
                        p.t = 0;
                        p.curveIndex = Math.floor(Math.random() * fieldLineCount);
                    }
                    
                    const point = fieldCurves[p.curveIndex].getPointAt(p.t);
                    posArr[idx * 3] = point.x;
                    posArr[idx * 3 + 1] = point.y;
                    posArr[idx * 3 + 2] = point.z;
                });
                
                fieldParticles.geometry.attributes.position.needsUpdate = true;
            }

            // Animate Action Data Ingestion Particles (Swirling Helical Vortex)
            if (ingestParticles && ingestMat.opacity > 0) {
                const posArr = ingestGeo.attributes.position.array;
                let anyActive = false;
                
                ingestData.forEach((p, idx) => {
                    if (!p.active) return;
                    anyActive = true;
                    
                    p.t += p.speed * (speedBoost * 0.5 + 0.5);
                    if (p.t >= 1.0) {
                        p.active = false;
                        // flash satellite mesh scale when pulse hits it
                        if (satellites[p.targetSat]) {
                            satellites[p.targetSat].mesh.scale.set(1.8, 1.8, 1.8);
                        }
                        return;
                    }
                    
                    const satPos = satellites[p.targetSat].mesh.position;
                    const linearPoint = new THREE.Vector3().lerpVectors(p.startPos, satPos, p.t);
                    
                    // Create helical spiral vortex around the path
                    const pathDir = new THREE.Vector3().subVectors(satPos, p.startPos).normalize();
                    let tempDir = new THREE.Vector3(0, 1, 0);
                    if (Math.abs(pathDir.dot(tempDir)) > 0.9) {
                        tempDir.set(1, 0, 0);
                    }
                    const perpDir1 = new THREE.Vector3().crossVectors(pathDir, tempDir).normalize();
                    const perpDir2 = new THREE.Vector3().crossVectors(pathDir, perpDir1).normalize();
                    
                    const angle = p.t * Math.PI * 2 * p.spiralSpeed;
                    const radiusScale = Math.sin(p.t * Math.PI) * p.spiralRadius;
                    
                    const offset = new THREE.Vector3()
                        .addScaledVector(perpDir1, Math.cos(angle) * radiusScale)
                        .addScaledVector(perpDir2, Math.sin(angle) * radiusScale);
                        
                    const finalPoint = new THREE.Vector3().copy(linearPoint).add(offset);
                    
                    posArr[idx * 3] = finalPoint.x;
                    posArr[idx * 3 + 1] = finalPoint.y;
                    posArr[idx * 3 + 2] = finalPoint.z;
                });
                
                ingestGeo.attributes.position.needsUpdate = true;
                
                if (!anyActive) {
                    ingestMat.opacity -= 0.03;
                }
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

            // Animate Expanding 3D wireframe shockwave shell
            if (shockwaveRing && shockwaveRing.material.opacity > 0) {
                const scaleVal = shockwaveRing.scale.x + 0.12;
                shockwaveRing.scale.set(scaleVal, scaleVal, scaleVal);
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
