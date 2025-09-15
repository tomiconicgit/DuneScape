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

        this.godraysEffect = null;
        this._createSunAndGodRays();
    }

    _createSunAndGodRays() {
        const sunPosition = new THREE.Vector3(0, 1000, -10000);
        const sunColor = 0xffffff;

        // Create a fake sun mesh that is only visible to the god rays effect
        const sunGeometry = new THREE.SphereGeometry(200, 32, 32);
        const sunMaterial = new THREE.MeshBasicMaterial({ color: sunColor });
        this.sunMesh = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sunMesh.layers.set(1); // Set to a layer that the main camera doesn't see
        this.scene.add(this.sunMesh);

        // God-rays effect
        const godraysPass = new ShaderPass(GodRaysGenerateShader);
        this.composer.addPass(godraysPass);
        
        // Final combine pass
        const combinePass = new ShaderPass(GodRaysCombineShader);
        combinePass.uniforms['fGodRayIntensity'].value = 0.5;
        this.composer.addPass(combinePass);

        this.godraysEffect = godraysPass;
        this.combinePass = combinePass;
    }

    update(sunPosition) {
        const screenSpaceSun = sunPosition.clone().project(this.camera);
        this.godraysEffect.uniforms['vSunPositionScreen'].value.set(
            (screenSpaceSun.x + 1) / 2,
            (screenSpaceSun.y + 1) / 2,
            screenSpaceSun.z
        );
        this.sunMesh.position.copy(sunPosition);
    }
    
    render(delta) {
        this.composer.render(delta);
    }
}
