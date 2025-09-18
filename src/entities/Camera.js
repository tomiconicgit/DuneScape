// File: src/entities/Camera.js

// ... (constructor and other methods remain the same)

update() {
    if (!this.target) return;

    // Calculate the ideal camera position based on state
    // The distance is fixed because minDistance === maxDistance
    const distance = this.minDistance + this.zoomLevel * (this.maxDistance - this.minDistance);
    
    // Use the fixed cameraHeight property
    const height = this.cameraHeight; 

    const targetPosition = this.target.position;
    const idealPosition = new THREE.Vector3();
    idealPosition.x = targetPosition.x + distance * Math.sin(this.orbitAngle);
    idealPosition.z = targetPosition.z + distance * Math.cos(this.orbitAngle);
    idealPosition.y = targetPosition.y + height;

    // --- 💡 THE FIX IS HERE ---
    // Replace lerp with a direct assignment to stay on the circular path
    this.threeCamera.position.copy(idealPosition);
    // -------------------------
    
    // Always look at a point slightly above the target's base
    const lookAtPosition = new THREE.Vector3(targetPosition.x, targetPosition.y + 1, targetPosition.z);
    this.threeCamera.lookAt(lookAtPosition);
}

// ... (handleResize method remains the same)
