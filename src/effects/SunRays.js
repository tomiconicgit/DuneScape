import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/addons/postprocessing/ShaderPass.js';
import { GodRaysFakeSunShader, GodRaysDepthMaskShader, GodRaysCombineShader, GodRaysGenerateShader } from 'three/addons/shaders/GodRaysShader.js';

export default class SunRays {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.scene = scene;
        this.camera = camera;

        this.composer = new EffectComposer(this.renderer);
        this.composer.addPass(new RenderPass(this.scene, this.camera));

        this._setupGodRays();
    }

    _setupGodRays() {
        const sunPosition = new THREE.Vector3(0, 1000, -10000);
        const sunColor = 0xffffff;

        // Create a fake sun mesh that is only visible to the god rays effect
        const sunGeometry = new THREE.SphereGeometry(200, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: sunColor });
        this.sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sunMesh.layers.set(1); // A custom layer for the sun
        this.scene.add(this.sunMesh);

        // Set up render targets
        const renderTargetParameters = {
            minFilter: THREE.LinearFilter,
            magFilter: THREE.LinearFilter,
            format: THREE.RGBAFormat
        };
        const sunRenderTarget = new THREE.WebGLRenderTarget(window.innerWidth, window.innerHeight, renderTargetParameters);

        // God Rays generation pass
        this.godraysPass = new ShaderPass(GodRaysGenerateShader);
        this.godraysPass.needsSwap = true;

        // Custom pass to render ONLY the sun to a texture
        const sunPass = {
            render: (renderer, writeBuffer, readBuffer) => {
                const originalClearColor = renderer.getClearColor(new THREE.Color());
                const originalClearAlpha = renderer.getClearAlpha();
                
                renderer.setRenderTarget(sunRenderTarget);
                renderer.setClearColor(0x000000, 0);
                renderer.clear();

                const oldLayer = this.camera.layers.mask;
                this.camera.layers.set(1); // Render only layer 1 (the sun)
                renderer.render(this.scene, this.camera);
                this.camera.layers.set(oldLayer); // Restore original layers

                renderer.setRenderTarget(null);
                renderer.setClearColor(originalClearColor, originalClearAlpha);

                // Pass the sun texture to the godrays shader
                this.godraysPass.uniforms['tInput'].value = sunRenderTarget.texture;
            }
        };
        this.composer.addPass(sunPass);
        this.composer.addPass(this.godraysPass);

        // Final combine pass to add the rays to the main scene
        const combinePass = new ShaderPass(GodRaysCombineShader);
        combinePass.uniforms['fGodRayIntensity'].value = 0.5;
        // This shader needs two textures: the original scene and the generated god rays
        // 'tDiffuse' is the original scene (passed by the composer)
        // We manually set 'tGodRays' to the output of our godraysPass
        combinePass.uniforms['tGodRays'].value = this.godraysPass.renderTarget2.texture;

        this.composer.addPass(combinePass);
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
        this.composer.render(delta);
    }
}
