import * as THREE from 'three';

export default class InputController {
    constructor(camera, plane) {
        this.camera = camera;
        this.plane = plane;
        this.raycaster = new THREE.Raycaster();
        
        this.onTap = null; // Callback for tap events
        this.buildMode = null;

        // Touch State
        this.touchState = {
            startTime: 0,
            startX: 0,
            startY: 0,
        };

        this._addEventListeners();
    }
    
    setBuildMode(mode) {
        this.buildMode = mode;
    }

    _addEventListeners() {
        const domElement = document.querySelector('canvas');
        domElement.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
        domElement.addEventListener('touchend', this._onTouchEnd.bind(this), { passive: false });
    }

    _onTouchStart(event) {
        event.preventDefault();
        if (event.touches.length === 1) {
            this.touchState.startTime = Date.now();
            this.touchState.startX = event.touches[0].clientX;
            this.touchState.startY = event.touches[0].clientY;
        }
    }

    _onTouchEnd(event) {
        event.preventDefault();
        
        // Check if camera was dragged/pinched
        const cameraIsDragging = event.target.cameraDragInProgress;
        if (cameraIsDragging) return;

        // Check for a valid tap (short duration, minimal movement)
        const duration = Date.now() - this.touchState.startTime;
        const touch = event.changedTouches[0];
        const dist = Math.hypot(touch.clientX - this.touchState.startX, touch.clientY - this.touchState.startY);

        if (duration < 300 && dist < 10 && this.onTap) {
            this._handleTap(touch);
        }
    }
    
    _handleTap(touch) {
        const mouse = new THREE.Vector2();
        mouse.x = (touch.clientX / window.innerWidth) * 2 - 1;
        mouse.y = -(touch.clientY / window.innerHeight) * 2 + 1;

        this.raycaster.setFromCamera(mouse, this.camera);
        const intersects = this.raycaster.intersectObject(this.plane);

        if (intersects.length > 0) {
            const point = intersects[0].point;
            const gridPos = {
                x: Math.floor(point.x + 50),
                z: Math.floor(point.z + 50)
            };
            this.onTap(point, gridPos);
        }
    }
}
