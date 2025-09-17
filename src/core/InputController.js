import * as THREE from 'three';

export default class InputController {
    constructor(camera, plane, domElement) {
        this.camera = camera;
        this.plane = plane;
        this.raycaster = new THREE.Raycaster();
        this.domElement = domElement;

        // Callbacks for different modes
        this.onTap = null; // For movement
        this.onBuildTap = null; // For building

        // State management
        this.mode = 'MOVEMENT'; // Can be 'MOVEMENT' or 'BUILD'
        this.touchState = { startTime: 0, startX: 0, startY: 0, isDragging: false };
        
        this._addEventListeners();
    }

    /**
     * Sets the current input mode.
     * @param {string} mode - The new mode, either 'MOVEMENT' or 'BUILD'.
     */
    setMode(mode) {
        this.mode = mode;
    }

    _addEventListeners() {
        this.domElement.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
        this.domElement.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
        this.domElement.addEventListener('touchend', this._onTouchEnd.bind(this), { passive: false });
    }

    _onTouchStart(event) {
        if (event.touches.length !== 1) return;
        event.preventDefault();
        this.touchState.startTime = Date.now();
        this.touchState.startX = event.touches[0].clientX;
        this.touchState.startY = event.touches[0].clientY;
        this.touchState.isDragging = false;
    }

    _onTouchMove(event) {
        if (event.touches.length !== 1) return;
        event.preventDefault();
        const touch = event.touches[0];
        const dist = Math.hypot(touch.clientX - this.touchState.startX, touch.clientY - this.touchState.startY);
        if (dist > 10) { this.touchState.isDragging = true; }
    }



    _onTouchEnd(event) {
        if (event.changedTouches.length !== 1) return;
        event.preventDefault();

        // Do not process tap if it landed on a UI element (like the navbar)
        const isTapOnUI = event.target.closest('#editor-navbar');
        if (isTapOnUI) {
            return;
        }

        const duration = Date.now() - this.touchState.startTime;
        // Check if the tap is valid (short and not a drag)
        const isValidTap = duration < 300 && !this.touchState.isDragging;

        if (isValidTap) {
            this._handleTap(event.changedTouches[0]);
        }
    }


    _handleTap(touch) {
        const rect = this.domElement.getBoundingClientRect();
        const mouse = new THREE.Vector2();
        mouse.x = ((touch.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((touch.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.plane);

        if (intersects.length > 0) {
            const point = intersects[0].point;

            // Check the current mode and call the appropriate callback
            if (this.mode === 'BUILD' && this.onBuildTap) {
                this.onBuildTap(point);
            } else if (this.mode === 'MOVEMENT' && this.onTap) {
                this.onTap(point);
            }
        }
    }
}
