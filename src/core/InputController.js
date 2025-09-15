import * as THREE from 'three';

export default class InputController {
    constructor(camera, plane) {
        this.camera = camera;
        this.plane = plane;
        this.raycaster = new THREE.Raycaster();
        
        this.onTap = null; // Callback for tap events
        this.buildMode = null; // Property to hold the current build mode
        
        // Touch State
        this.touchState = {
            startTime: 0,
            startX: 0,
            startY: 0,
            isDragging: false,
        };
        
        this._addEventListeners();
    }

    setBuildMode(mode) {
        this.buildMode = mode;
    }
    
    _addEventListeners() {
        const domElement = document.querySelector('canvas');
        domElement.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
        domElement.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
        domElement.addEventListener('touchend', this._onTouchEnd.bind(this), { passive: false });
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
        if (dist > 10) {
            this.touchState.isDragging = true;
        }
    }

    _onTouchEnd(event) {
        if (event.changedTouches.length !== 1) return;
        event.preventDefault();
        
        const duration = Date.now() - this.touchState.startTime;

        if (duration < 300 && !this.touchState.isDragging && this.onTap) {
            this._handleTap(event.changedTouches[0]);
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
            // Pass the current buildMode along in the callback
            this.onTap(point, gridPos, this.buildMode);
        }
    }
}
