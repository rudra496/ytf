// ==========================================================================
// Three.js Interactive 3D Eco-Globe Animation
// ==========================================================================

(function() {
    const container = document.getElementById('three-orbit-canvas');
    if (!container) return;

    let scene, camera, renderer;
    let particleGlobe, ringGolden, innerLattice;
    let mouseX = 0, mouseY = 0;
    let targetX = 0, targetY = 0;
    let windowHalfX = container.clientWidth / 2;
    let windowHalfY = container.clientHeight / 2;
    
    // Drag rotation state
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };

    init();
    animate();

    function init() {
        // Scene setup
        scene = new THREE.Scene();

        // Camera setup
        camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.z = 15;

        // Renderer setup
        renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        container.appendChild(renderer.domElement);

        // Lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        scene.add(ambientLight);

        const pointLight = new THREE.PointLight(0x10b981, 2, 50);
        pointLight.position.set(5, 5, 5);
        scene.add(pointLight);

        // Create custom glowing circular textures dynamically
        const greenTexture = createCircleTexture('rgba(16, 185, 129, 1)', 64);
        const goldTexture = createCircleTexture('rgba(245, 158, 11, 1)', 64);

        // 1. Core Particle Globe (Green points)
        const particleCount = 280;
        const globeGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const radius = 4.5;

        for (let i = 0; i < particleCount; i++) {
            // Spherical distribution
            const phi = Math.acos(-1 + (2 * i) / particleCount);
            const theta = Math.sqrt(particleCount * Math.PI) * phi;

            positions[i * 3] = radius * Math.cos(theta) * Math.sin(phi);
            positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
            positions[i * 3 + 2] = radius * Math.cos(phi);
        }

        globeGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
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

        // 2. Inner Glowing Wireframe Sphere (Hologram Grid)
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

        // 3. Orbiting Gold Particle Ring (Ripples)
        const ringCount = 80;
        const ringGeometry = new THREE.BufferGeometry();
        const ringPositions = new Float32Array(ringCount * 3);
        const ringRadiusX = 6.2;
        const ringRadiusZ = 6.2;

        for (let i = 0; i < ringCount; i++) {
            const angle = (i / ringCount) * Math.PI * 2;
            // Slightly spread vertical offset
            const yOffset = (Math.random() - 0.5) * 0.5;
            
            ringPositions[i * 3] = ringRadiusX * Math.cos(angle);
            ringPositions[i * 3 + 1] = yOffset;
            ringPositions[i * 3 + 2] = ringRadiusZ * Math.sin(angle);
        }

        ringGeometry.setAttribute('position', new THREE.BufferAttribute(ringPositions, 3));

        const ringMaterial = new THREE.PointsMaterial({
            size: 0.22,
            map: goldTexture,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            color: 0xf59e0b
        });

        ringGolden = new THREE.Points(ringGeometry, ringMaterial);
        // Tilt the ring
        ringGolden.rotation.x = Math.PI / 6;
        ringGolden.rotation.z = Math.PI / 12;
        scene.add(ringGolden);

        // Event listeners
        window.addEventListener('resize', onWindowResize);
        container.addEventListener('mousemove', onContainerMouseMove);
        
        // Touch & mouse drag listeners for direct control
        container.addEventListener('mousedown', onMouseDown);
        container.addEventListener('mousemove', onMouseMoveDrag);
        window.addEventListener('mouseup', onMouseUp);
        
        container.addEventListener('touchstart', onTouchStart, { passive: true });
        container.addEventListener('touchmove', onTouchMove, { passive: true });
        window.addEventListener('touchend', onMouseUp);
    }

    // Helper: generate glowing point canvas texture
    function createCircleTexture(color, size) {
        const matCanvas = document.createElement('canvas');
        matCanvas.width = size;
        matCanvas.height = size;
        const matContext = matCanvas.getContext('2d');
        
        const gradient = matContext.createRadialGradient(size/2, size/2, 0, size/2, size/2, size/2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.2, color);
        gradient.addColorStop(0.6, 'rgba(16, 185, 129, 0.08)');
        gradient.addColorStop(1, 'transparent');
        
        matContext.fillStyle = gradient;
        matContext.fillRect(0, 0, size, size);
        return new THREE.CanvasTexture(matCanvas);
    }

    // Event Handlers
    function onWindowResize() {
        windowHalfX = container.clientWidth / 2;
        windowHalfY = container.clientHeight / 2;
        
        camera.aspect = container.clientWidth / container.clientHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(container.clientWidth, container.clientHeight);
    }

    function onContainerMouseMove(event) {
        const rect = container.getBoundingClientRect();
        const localX = event.clientX - rect.left;
        const localY = event.clientY - rect.top;
        
        targetX = (localX - windowHalfX) * 0.001;
        targetY = (localY - windowHalfY) * 0.001;
    }

    // Drag Interactions
    function onMouseDown(event) {
        isDragging = true;
        previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    function onMouseMoveDrag(event) {
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
        
        ringGolden.rotation.y -= deltaMove.x * rotationSpeed * 0.5;

        previousMousePosition = {
            x: event.clientX,
            y: event.clientY
        };
    }

    function onMouseUp() {
        isDragging = false;
    }

    function onTouchStart(event) {
        if (event.touches.length === 1) {
            isDragging = true;
            previousMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY
            };
        }
    }

    function onTouchMove(event) {
        if (!isDragging || event.touches.length !== 1) return;
        const deltaMove = {
            x: event.touches[0].clientX - previousMousePosition.x,
            y: event.touches[0].clientY - previousMousePosition.y
        };

        const rotationSpeed = 0.008;
        
        particleGlobe.rotation.y += deltaMove.x * rotationSpeed;
        particleGlobe.rotation.x += deltaMove.y * rotationSpeed;
        innerLattice.rotation.y += deltaMove.x * rotationSpeed;
        innerLattice.rotation.x += deltaMove.y * rotationSpeed;
        ringGolden.rotation.y -= deltaMove.x * rotationSpeed * 0.5;

        previousMousePosition = {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY
        };
    }

    // Animation Loop
    function animate() {
        requestAnimationFrame(animate);
        render();
    }

    function render() {
        // Auto-rotation (drifts slowly if not dragging)
        if (!isDragging) {
            const speedMultiplier = 1 + Math.min(window.scrollY * 0.005, 5); // Speeds up rotation on scroll
            
            particleGlobe.rotation.y += 0.0015 * speedMultiplier;
            particleGlobe.rotation.x += 0.0004 * speedMultiplier;
            
            innerLattice.rotation.y += 0.0015 * speedMultiplier;
            innerLattice.rotation.x += 0.0004 * speedMultiplier;
            
            ringGolden.rotation.y -= 0.0028 * speedMultiplier;
        }

        // Parallax lag calculation for smooth hover response
        mouseX += (targetX - mouseX) * 0.05;
        mouseY += (targetY - mouseY) * 0.05;

        // Position offset adjustment for 3D feel
        camera.position.x += (mouseX * 5 - camera.position.x) * 0.05;
        camera.position.y += (-mouseY * 5 - camera.position.y) * 0.05;
        camera.lookAt(scene.position);

        renderer.render(scene, camera);
    }
})();
