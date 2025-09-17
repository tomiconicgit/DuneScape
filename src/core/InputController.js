import * as THREE from 'three';

export default class InputController {
    constructor(camera, plane, domElement) {
        this.camera = camera;
        this.plane = plane;
        this.raycaster = new THREE.Raycaster();
        this.domElement = domElement;

        this.onTap = null;
        this.onBuildTap = null; // New callback for building
        this.mode = 'MOVEMENT'; // Can be 'MOVEMENT' or 'BUILD'
        this.touchState = { startTime: 0, startX: 0, startY: 0, isDragging: false };
        
        this._addEventListeners();
    }

    setMode(mode) {
        this.mode = mode;
    }

    // ... (rest of the event listener and touch state methods are the same)

    _onTouchEnd(event) {
        if (event.changedTouches.length !== 1) return;
        event.preventDefault();

        const isTapOnUI = event.target.closest('#editor-navbar');
        if (isTapOnUI) return; // Ignore taps on the navbar

        const duration = Date.now() - this.touchState.startTime;
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
            if (this.mode === 'BUILD' && this.onBuildTap) {
                this.onBuildTap(point);
            } else if (this.mode === 'MOVEMENT' && this.onTap) {
                this.onTap(point);
            }
        }
    }
}
