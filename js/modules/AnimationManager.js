// js/modules/AnimationManager.js
import * as THREE from 'three';

export class PlayerAnimationManager {
    constructor(mesh, animations) {
        this.mesh = mesh;
        this.mixer = new THREE.AnimationMixer(mesh);
        this.actions = {};
        this.currentState = 'Idle';

        // Assuming the model has animations named 'Idle' and 'Run'
        // The Three.js Soldier.glb has: 'Idle', 'Run', 'TPose', 'Walk'
        for (const clip of animations) {
            const action = this.mixer.clipAction(clip);
            this.actions[clip.name] = action;
        }

        // Start in the Idle state
        if (this.actions['Idle']) {
            this.actions['Idle'].play();
        }
    }

    transitionToState(newState, duration = 0.3) {
        if (this.currentState === newState || !this.actions[newState]) return;

        const fromAction = this.actions[this.currentState];
        const toAction = this.actions[newState];

        if (fromAction) {
            fromAction.fadeOut(duration);
        }

        toAction
            .reset()
            .setEffectiveTimeScale(1)
            .setEffectiveWeight(1)
            .fadeIn(duration)
            .play();

        this.currentState = newState;
    }

    update(delta, playerVelocity) {
        this.mixer.update(delta);

        // State transition logic
        const speed = playerVelocity.length();
        if (speed > 0.1) {
            this.transitionToState('Run');
        } else {
            this.transitionToState('Idle');
        }
    }
}
