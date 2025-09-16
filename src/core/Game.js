// ... (imports are the same)

// Constants for day/night cycle
const DAY_DURATION_SECONDS = 600; // 10 minutes
const NIGHT_DURATION_SECONDS = 240; // 4 minutes
const TOTAL_CYCLE_SECONDS = DAY_DURATION_SECONDS + NIGHT_DURATION_SECONDS;

export default class Game {
    constructor() {
        // ... (Debug.init(), scene, renderer, etc.)
        
        this.clock = new THREE.Clock();
        
        // NEW: Set a start time of 7 AM
        // Our 10-minute day represents 12 hours (6 AM to 6 PM). 7 AM is 1 hour in.
        const startHourOffset = 1; // 1 hour after sunrise (6 AM)
        const hoursInDay = 12;
        this.timeOffset = (startHourOffset / hoursInDay) * DAY_DURATION_SECONDS;

        this.camera = new Camera(this.renderer.domElement);
        // ... (rest of the constructor is the same)
    }

    // ... (other methods are the same)

    _animate() {
        requestAnimationFrame(() => this._animate());

        const delta = this.clock.getDelta();
        // MODIFIED: Apply the time offset to the elapsed time
        const elapsed = this.clock.getElapsedTime() + this.timeOffset;

        // ... (rest of the animate loop is the same)
        const cycleProgress = (elapsed % TOTAL_CYCLE_SECONDS) / TOTAL_CYCLE_SECONDS;
        let angle;
        if (cycleProgress < (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) {
            const dayProgress = cycleProgress / (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            angle = dayProgress * Math.PI;
        } else {
            const nightProgress = (cycleProgress - (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) / (NIGHT_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            angle = Math.PI + (nightProgress * Math.PI);
        }
        this.sunPosition.set(Math.cos(angle) * 8000, Math.sin(angle) * 6000, Math.sin(angle * 0.5) * 2000);
        
        this.sunLight.position.copy(this.sunPosition);
        this.sunLight.target.position.set(0, 0, 0); 
        this.sunLight.target.updateMatrixWorld();
        this.movement.update(delta);
        this.camera.update();
        this.atmosphere.update(this.sunPosition);
        this.clouds.update(this.sunPosition, delta);

        this.renderer.render(this.scene, this.camera.threeCamera);
    }
}
