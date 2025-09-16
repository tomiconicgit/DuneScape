import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

export default class GameSky {
    constructor(scene) {
        this.sky = new Sky();
        this.sky.scale.setScalar(450000);
        scene.add(this.sky);

        this.sun = new THREE.Vector3();
        this.uniforms = this.sky.material.uniforms;

        // Set initial default values
        this.setParameters({
            turbidity: 10,
            rayleigh: 3,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.7,
            elevation: 2,
            azimuth: 180,
        });
    }

    /**
     * Updates the sky's appearance based on a set of parameters.
     * @param {object} params - The parameters to update.
     */
    setParameters(params) {
        if (!params) return;

        const effectController = {
            turbidity: params.turbidity !== undefined ? params.turbidity : this.uniforms['turbidity'].value,
            rayleigh: params.rayleigh !== undefined ? params.rayleigh : this.uniforms['rayleigh'].value,
            mieCoefficient: params.mieCoefficient !== undefined ? params.mieCoefficient : this.uniforms['mieCoefficient'].value,
            mieDirectionalG: params.mieDirectionalG !== undefined ? params.mieDirectionalG : this.uniforms['mieDirectionalG'].value,
            elevation: params.elevation !== undefined ? params.elevation : this.elevation,
            azimuth: params.azimuth !== undefined ? params.azimuth : this.azimuth,
        };

        this.uniforms['turbidity'].value = effectController.turbidity;
        this.uniforms['rayleigh'].value = effectController.rayleigh;
        this.uniforms['mieCoefficient'].value = effectController.mieCoefficient;
        this.uniforms['mieDirectionalG'].value = effectController.mieDirectionalG;
        
        // Store these for reference
        this.elevation = effectController.elevation;
        this.azimuth = effectController.azimuth;

        const phi = THREE.MathUtils.degToRad(90 - this.elevation);
        const theta = THREE.MathUtils.degToRad(this.azimuth);

        this.sun.setFromSphericalCoords(1, phi, theta);
        this.uniforms['sunPosition'].value.copy(this.sun);
    }
}
