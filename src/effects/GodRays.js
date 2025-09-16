import * as THREE from 'three';
import { GodRaysFakeSunShader, GodRaysDepthMaskShader, GodRaysCombineShader, GodRaysGenerateShader } from 'three/addons/shaders/GodRaysShader.js';

export default class GodRaysEffect {
    constructor(renderer, scene, camera) {
        this.renderer = renderer;
        this.mainScene = scene;
        this.mainCamera = camera;

        this.postprocessing = {};
        this.clipPosition = new THREE.Vector4();
        this.screenSpacePosition = new THREE.Vector3();

        this._initPostprocessing();
    }

    _initPostprocessing() {
        const pp = this.postprocessing;
        pp.scene = new THREE.Scene();
        pp.camera = new THREE.OrthographicCamera(-0.5, 0.5, 0.5, -0.5, -10000, 10000);
        pp.camera.position.z = 100;
        pp.scene.add(pp.camera);

        const renderTargetWidth = window.innerWidth;
        const renderTargetHeight = window.innerHeight;

        pp.rtTextureColors = new THREE.WebGLRenderTarget(renderTargetWidth, renderTargetHeight, { type: THREE.HalfFloatType });
        pp.rtTextureDepth = new THREE.WebGLRenderTarget(renderTargetWidth, renderTargetHeight, { type: THREE.HalfFloatType });
        pp.rtTextureDepthMask = new THREE.WebGLRenderTarget(renderTargetWidth, renderTargetHeight, { type: THREE.HalfFloatType });

        const godrayRenderTargetResolutionMultiplier = 1.0 / 4.0;
        const adjustedWidth = renderTargetWidth * godrayRenderTargetResolutionMultiplier;
        const adjustedHeight = renderTargetHeight * godrayRenderTargetResolutionMultiplier;
        pp.rtTextureGodRays1 = new THREE.WebGLRenderTarget(adjustedWidth, adjustedHeight, { type: THREE.HalfFloatType });
        pp.rtTextureGodRays2 = new THREE.WebGLRenderTarget(adjustedWidth, adjustedHeight, { type: THREE.HalfFloatType });

        // Shaders
        pp.godrayMaskUniforms = THREE.UniformsUtils.clone(GodRaysDepthMaskShader.uniforms);
        pp.materialGodraysDepthMask = new THREE.ShaderMaterial({ uniforms: pp.godrayMaskUniforms, vertexShader: GodRaysDepthMaskShader.vertexShader, fragmentShader: GodRaysDepthMaskShader.fragmentShader });
        pp.godrayGenUniforms = THREE.UniformsUtils.clone(GodRaysGenerateShader.uniforms);
        pp.materialGodraysGenerate = new THREE.ShaderMaterial({ uniforms: pp.godrayGenUniforms, vertexShader: GodRaysGenerateShader.vertexShader, fragmentShader: GodRaysGenerateShader.fragmentShader });
        pp.godrayCombineUniforms = THREE.UniformsUtils.clone(GodRaysCombineShader.uniforms);
        pp.materialGodraysCombine = new THREE.ShaderMaterial({ uniforms: pp.godrayCombineUniforms, vertexShader: GodRaysCombineShader.vertexShader, fragmentShader: GodRaysCombineShader.fragmentShader });
        pp.godraysFakeSunUniforms = THREE.UniformsUtils.clone(GodRaysFakeSunShader.uniforms);
        pp.materialGodraysFakeSun = new THREE.ShaderMaterial({ uniforms: pp.godraysFakeSunUniforms, vertexShader: GodRaysFakeSunShader.vertexShader, fragmentShader: GodRaysFakeSunShader.fragmentShader });

        pp.godraysFakeSunUniforms.bgColor.value.setHex(0x000511);
        pp.godraysFakeSunUniforms.sunColor.value.setHex(0xffee00);
        pp.godrayCombineUniforms.fGodRayIntensity.value = 0.75;

        pp.quad = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), pp.materialGodraysGenerate);
        pp.quad.position.z = -9900;
        pp.scene.add(pp.quad);
    }

    render(sunPosition) {
        const pp = this.postprocessing;

        // Update sun position for shaders
        this.clipPosition.set(sunPosition.x, sunPosition.y, sunPosition.z, 1);
        this.clipPosition.applyMatrix4(this.mainCamera.matrixWorldInverse).applyMatrix4(this.mainCamera.projectionMatrix);
        this.clipPosition.x /= this.clipPosition.w;
        this.clipPosition.y /= this.clipPosition.w;
        this.screenSpacePosition.set((this.clipPosition.x + 1) / 2, (this.clipPosition.y + 1) / 2, this.clipPosition.z);
        pp.godrayGenUniforms['vSunPositionScreenSpace'].value.copy(this.screenSpacePosition);
        pp.godraysFakeSunUniforms['vSunPositionScreenSpace'].value.copy(this.screenSpacePosition);

        // 1. Render scene colors
        this.renderer.setRenderTarget(pp.rtTextureColors);
        this.renderer.clear(true, true, false);
        this.renderer.render(this.mainScene, this.mainCamera);

        // 2. Render scene depth
        this.mainScene.overrideMaterial = new THREE.MeshDepthMaterial();
        this.renderer.setRenderTarget(pp.rtTextureDepth);
        this.renderer.clear();
        this.renderer.render(this.mainScene, this.mainCamera);

        // 3. Create god rays mask
        pp.godrayMaskUniforms['tInput'].value = pp.rtTextureDepth.texture;
        pp.scene.overrideMaterial = pp.materialGodraysDepthMask;
        this.renderer.setRenderTarget(pp.rtTextureDepthMask);
        this.renderer.render(pp.scene, pp.camera);

        // 4. Generate god rays (ping-pong blurring)
        const filterLen = 1.0;
        const TAPS_PER_PASS = 6.0;
        this._filterGodRays(pp.rtTextureDepthMask.texture, pp.rtTextureGodRays2, filterLen * Math.pow(TAPS_PER_PASS, -1.0));
        this._filterGodRays(pp.rtTextureGodRays2.texture, pp.rtTextureGodRays1, filterLen * Math.pow(TAPS_PER_PASS, -2.0));
        this._filterGodRays(pp.rtTextureGodRays1.texture, pp.rtTextureGodRays2, filterLen * Math.pow(TAPS_PER_PASS, -3.0));

        // 5. Final composite pass
        pp.godrayCombineUniforms['tColors'].value = pp.rtTextureColors.texture;
        pp.godrayCombineUniforms['tGodRays'].value = pp.rtTextureGodRays2.texture;
        pp.scene.overrideMaterial = pp.materialGodraysCombine;
        this.renderer.setRenderTarget(null);
        this.renderer.render(pp.scene, pp.camera);
        pp.scene.overrideMaterial = null;
        this.mainScene.overrideMaterial = null;
    }
    
    _filterGodRays(inputTex, renderTarget, stepSize) {
        const pp = this.postprocessing;
        pp.scene.overrideMaterial = pp.materialGodraysGenerate;
        pp.godrayGenUniforms['fStepSize'].value = stepSize;
        pp.godrayGenUniforms['tInput'].value = inputTex;
        this.renderer.setRenderTarget(renderTarget);
        this.renderer.render(pp.scene, pp.camera);
        pp.scene.overrideMaterial = null;
    }

    onWindowResize() {
        const renderTargetWidth = window.innerWidth;
        const renderTargetHeight = window.innerHeight;
        const pp = this.postprocessing;

        pp.rtTextureColors.setSize(renderTargetWidth, renderTargetHeight);
        pp.rtTextureDepth.setSize(renderTargetWidth, renderTargetHeight);
        pp.rtTextureDepthMask.setSize(renderTargetWidth, renderTargetHeight);

        const adjustedWidth = renderTargetWidth * (1.0 / 4.0);
        const adjustedHeight = renderTargetHeight * (1.0 / 4.0);
        pp.rtTextureGodRays1.setSize(adjustedWidth, adjustedHeight);
        pp.rtTextureGodRays2.setSize(adjustedWidth, adjustedHeight);
    }
}
