import * as THREE from 'three';

export default class Camera {
    constructor(domElement) {
        this.domElement = domElement;
        this.target = null;
        const aspect = window.innerWidth / window.innerHeight;
        
        // MODIFIED: Field of View (FOV) increased from 75 to 100
        this.threeCamera = new THREE.PerspectiveCamera(100, aspect, 0.1, 20000);

        // State
        this.orbitAngle = Math.PI / 4;
        // MODIFIED: Starts more zoomed in (0=in, 1=out)
        this.zoomLevel = 0.2; 

        // Config
        this.minDistance = 8;
        this.maxDistance = 10;
        this.minHeight = 1.5;
        this.maxHeight = 12;
        this.smoothing = 0.05;

        // Touch State
        this.touchState = {
            isDragging: false,
            isPinching: false,
            lastDragX: 0,
            initialPinchDist: 0,
        };
        
        this._addEventListeners();
    }

    setTarget(target) {
        this.target = target;
    }

    update() {
        if (!this.target) return;

        const distance = this.minDistance + this.zoomLevel * (this.maxDistance - this.minDistance);
        const height = this.minHeight + this.zoomLevel * (this.maxHeight - this.minHeight);

        const targetPosition = this.target.position;
        const idealPosition = new THREE.Vector3();
        idealPosition.x = targetPosition.x + distance * Math.sin(this.orbitAngle);
        idealPosition.z = targetPosition.z + distance * Math.cos(this.orbitAngle);
        idealPosition.y = targetPosition.y + height;

        this.threeCamera.position.lerp(idealPosition, this.smoothing);
        this.threeCamera.lookAt(targetPosition.x, this.minHeight, targetPosition.z);
    }

    handleResize() {
        this.threeCamera.aspect = window.innerWidth / window.innerHeight;
        this.threeCamera.updateProjectionMatrix();
    }
    
    _addEventListeners() {
        this.domElement.addEventListener('touchstart', this._onTouchStart.bind(this), { passive: false });
        this.domElement.addEventListener('touchmove', this._onTouchMove.bind(this), { passive: false });
        this.domElement.addEventListener('touchend', this._onTouchEnd.bind(this), { passive: false });
    }

    _onTouchStart(event) {
        if (event.touches.length === 1) {
            this.touchState.lastDragX = event.touches[0].clientX;
        } else if (event.touches.length === 2) {
            this.touchState.isPinching = true;
            this.touchState.initialPinchDist = this._getPinchDistance(event.touches);
        }
    }

    _onTouchMove(event) {
        event.preventDefault();

        const isTapAndDrag = event.target.isTapAndDrag;
        if (isTapAndDrag) return;

        if (this.touchState.isPinching && event.touches.length === 2) {
             const currentPinchDist = this._getPinchDistance(event.touches);
            const delta = this.touchState.initialPinchDist - currentPinchDist;
            this.zoomLevel += delta * 0.001;
            this.zoomLevel = Math.max(0, Math.min(1, this.zoomLevel));
            this.touchState.initialPinchDist = currentPinchDist;

        } else if (!this.touchState.isPinching && event.touches.length === 1) {
             const deltaX = event.touches[0].clientX - this.touchState.lastDragX;
             this.orbitAngle -= deltaX * 0.01;
             this.touchState.lastDragX = event.touches[0].clientX;
        }
    }
    
    _onTouchEnd() {
        this.touchState.isPinching = false;
    }

    _getPinchDistance(touches) {
        const dx = touches[0].clientX - touches[1].clientX;
        const dy = touches[0].clientY - touches[1].clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}
