import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GodRaysCombineShader, GodRaysGenerateShader } from 'three/addons/shaders/GodRaysShader.js';

export default class SunRays {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        // The main composer that renders to the screen
        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        // A separate render target for the god rays mask
        const renderTargetParameters = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        };
        this.godRaysRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParameters);

        // A pass to generate the god rays from the mask
        this.godraysPass = new ShaderPass(GodRaysGenerateShader);
        
        // A pass to combine the god rays with the main scene
        this.combinePass = new ShaderPass(GodRaysCombineShader);
        this.combinePass.uniforms['fGodRayIntensity'].value = 0.6;
        
        // Feed the god rays texture into the combine pass
        this.combinePass.uniforms['tGodRays'].value = this.godRaysRenderTarget.texture;
        
        this.composer.addPass(this.combinePass);

        // A fake sun mesh that is only used to create the god rays mask
        const sunGeometry = new THREE.SphereGeometry(200, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        this.sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sunMesh.layers.set(1); // Put it on a separate layer
        this.scene.add(this.sunMesh);
    }

    update(sunPosition) {
        // Project the sun's 3D position to 2D screen space
        const screenSpaceSun = sunPosition.clone().project(this.camera);
        
        // Update the uniform in the god rays generation shader
        this.godraysPass.uniforms['vSunPositionScreen'].value.set(
            (screenSpaceSun.x + 1) / 2,
            (screenSpaceSun.y + 1) / 2,
            screenSpaceSun.z
        );
        
        // Keep the fake sun mesh's 3D position in sync
        this.sunMesh.position.copy(sunPosition);
    }
    
    render(delta) {
        // Step 1: Render ONLY the sun to our special render target
        const originalClearColor = this.renderer.getClearColor(new THREE.Color());
        const originalClearAlpha = this.renderer.getClearAlpha();
        const oldLayer = this.camera.layers.mask;

        this.renderer.setRenderTarget(this.godRaysRenderTarget);
        this.renderer.setClearColor(0x000000, 0);
        this.renderer.clear();
        this.camera.layers.set(1); // See only the sun
        this.renderer.render(this.scene, this.camera);
        
        // Step 2: Now, render the god rays effect using the sun texture
        // The composer's input is the main scene, but we manually provide the sun texture
        // to our internal godraysPass.
        this.camera.layers.set(oldLayer); // See the main scene again
        this.renderer.setRenderTarget(null);
        this.renderer.setClearColor(originalClearColor, originalClearAlpha);
        
        // Manually render the godrays pass to get its output
        this.godraysPass.render(this.renderer, this.godRaysRenderTarget, this.godRaysRenderTarget);

        // Step 3: Render the final scene with the combined effect
        this.composer.render(delta);
    }
}
