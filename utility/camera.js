import * as THREE from 'three';

const RTSCamera = {
    camera: null,
    target: null,
    domElement: null,

    // State
    orbitAngle: Math.PI / 4, // Initial angle
    zoomLevel: 0.5, // 0 = zoomed in, 1 = zoomed out
    
    // Config
    minDistance: 8,
    maxDistance: 30,
    minHeight: 1.5, // Height of character's head
    maxHeight: 25,
    smoothing: 0.05,

    // Touch Controls State
    touchState: {
        isDragging: false,
        isPinching: false,
        lastDragX: 0,
        initialPinchDist: 0,
    },

    /**
     * Initializes the camera system.
     * @param {THREE.Mesh} target - The character mesh to follow.
     * @param {HTMLElement} domElement - The canvas element for event listeners.
     */
    init(target, domElement) {
        this.target = target;
        this.domElement = domElement;
        const aspect = window.innerWidth / window.innerHeight;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this._addEventListeners();
    },

    /**
     * Main update loop, called every frame.
     */
    update() {
        if (!this.target || !this.camera) return;

        // 1. Interpolate values based on zoom level
        const distance = this.minDistance + this.zoomLevel * (this.maxDistance - this.minDistance);
        const height = this.minHeight + this.zoomLevel * (this.maxHeight - this.minHeight);

        // 2. Calculate ideal camera position
        const targetPosition = this.target.position;
        const idealPosition = new THREE.Vector3();
        idealPosition.x = targetPosition.x + distance * Math.sin(this.orbitAngle);
        idealPosition.z = targetPosition.z + distance * Math.cos(this.orbitAngle);
        idealPosition.y = targetPosition.y + height;

        // 3. Smoothly move camera to ideal position (Lerp)
        this.camera.position.lerp(idealPosition, this.smoothing);

        // 4. Always look at the character's head
        const lookAtPosition = new THREE.Vector3(targetPosition.x, this.minHeight, targetPosition.z);
        this.camera.lookAt(lookAtPosition);
    },

    handleResize() {
        if (this.camera) {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
        }
    },

    // --- Private Event Handlers ---

    _addEventListeners() {
        this.domElement.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
        this.domElement.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
        this.domElement.addEventListener('touchend', this._onTouchEnd.bind(this), { passive: false });
    },

    _onTouchStart(event) {
        event.preventDefault();
        if (event.touches.length === 1) { // Orbit
            this.touchState.isDragging = true;
            this.touchState.lastDragX = event.touches[0].clientX;
        } else if (event.touches.length === 2) { // Zoom
            this.touchState.isPinching = true;
            this.touchState.initialPinchDist = this._getPinchDistance(event.touches);
        }
    },

    _onTouchMove(event) {
        event.preventDefault();
        if (this.touchState.isDragging && event.touches.length === 1) { // Orbit
            const deltaX = event.touches[0].clientX - this.touchState.lastDragX;
            this.orbitAngle -= deltaX * 0.01;
            this.touchState.lastDragX = event.touches[0].clientX;
        } else if (this.touchState.isPinching && event.touches.length === 2) { // Zoom
            const currentPinchDist = this._getPinchDistance(event.touches);
            const delta = this.touchState.initialPinchDist - currentPinchDist;
            
            // Adjust zoom level based on pinch delta
            this.zoomLevel += delta * 0.001;
            this.zoomLevel = Math.max(0, Math.min(1, this.zoomLevel)); // Clamp between 0 and 1

            this.touchState.initialPinchDist = currentPinchDist;
        }
    },

    _onTouchEnd(event) {
        this.touchState.isDragging = false;
        this.touchState.isPinching = false;
    },

    _getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
};

export default RTSCamera;
