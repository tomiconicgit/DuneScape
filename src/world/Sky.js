import * as THREE from 'three';
import { Sky } from 'three/addons/objects/Sky.js';

export default class GameSky {
    constructor(scene) {
        // Create the Sky addon instance
        this.sky = new Sky();
        this.sky.scale.setScalar(450000);
        scene.add(this.sky);

        // This vector will hold the sun's direction
        this.sun = new THREE.Vector3();
        
        // A shortcut to the sky's shader uniforms
        this.uniforms = this.sky.material.uniforms;

        // Set some nice initial default values
        this.setParameters({
            turbidity: 5,
            rayleigh: 0.5,
            mieCoefficient: 0.005,
            mieDirectionalG: 0.7,
            elevation: 2,
            azimuth: 180,
        });
    }

    /**
     * Updates the sky's appearance based on parameters.
     * The most important are elevation (sun height) and azimuth (sun direction).
     * @param {object} params - The parameters to update.
     */
    setParameters(params) {
        if (!params) return;

        // Update each uniform if a new value is provided
        if (params.turbidity !== undefined) this.uniforms['turbidity'].value = params.turbidity;
        if (params.rayleigh !== undefined) this.uniforms['rayleigh'].value = params.rayleigh;
        if (params.mieCoefficient !== undefined) this.uniforms['mieCoefficient'].value = params.mieCoefficient;
        if (params.mieDirectionalG !== undefined) this.uniforms['mieDirectionalG'].value = params.mieDirectionalG;
        
        // Calculate the sun's 3D position from the elevation and azimuth angles
        if (params.elevation !== undefined && params.azimuth !== undefined) {
            const phi = THREE.MathUtils.degToRad(90 - params.elevation);
            const theta = THREE.MathUtils.degToRad(params.azimuth);

            this.sun.setFromSphericalCoords(1, phi, theta);
            this.uniforms['sunPosition'].value.copy(this.sun);
        }
    }
}
