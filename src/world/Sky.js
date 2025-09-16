import * as THREE from 'three';

const vertexShader = `
    varying vec3 vWorldPosition;
    void main() {
        vec4 worldPosition = modelMatrix * vec4( position, 1.0 );
        vWorldPosition = worldPosition.xyz;
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );
    }
`;

const fragmentShader = `
    uniform vec3 topColor;
    uniform vec3 bottomColor;
    uniform float offset;
    uniform float exponent;
    varying vec3 vWorldPosition;

    void main() {
        float h = normalize( vWorldPosition + vec3(0.0, -offset, 0.0) ).y;
        gl_FragColor = vec4( mix( bottomColor, topColor, max( pow( max( h , 0.0), exponent ), 0.0 ) ), 1.0 );
    }
`;

export default class Sky {
    constructor(scene, topColor, bottomColor) {
        const skyGeo = new THREE.SphereGeometry(4000, 32, 15);
        
        const skyMat = new THREE.ShaderMaterial({
            uniforms: {
                'topColor': { value: topColor },
                'bottomColor': { value: bottomColor },
                'offset': { value: 33 },
                'exponent': { value: 0.6 }
            },
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide
        });

        const sky = new THREE.Mesh(skyGeo, skyMat);
        scene.add(sky);
    }
}
