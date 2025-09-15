import * as THREE from 'three';

export default class Sky {
    constructor(scene) {
        this.scene = scene;
        this.clouds = [];
        this.weatherFactor = 0.6;
        this.worldSize = 100;

        this._createSkySphere();
        this._createClouds();
    }

    _createSkySphere() {
        const radius = this.worldSize * 8;
        const geo = new THREE.SphereGeometry(radius, 64, 32);
        const mat = new THREE.ShaderMaterial({
            side: THREE.BackSide,
            vertexShader: `
                varying vec3 vPos;
                void main() {
                    vPos = position;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }`,
            fragmentShader: `
                varying vec3 vPos;
                void main() {
                    vec3 topColor = vec3(0.53, 0.81, 0.92);
                    vec3 horizonColor = vec3(0.87, 0.93, 0.98);
                    float h = normalize(vPos).y;
                    gl_FragColor = vec4(mix(horizonColor, topColor, max(h, 0.0)), 1.0);
                }`
        });
        const skyMesh = new THREE.Mesh(geo, mat);
        this.scene.add(skyMesh);
    }

    _createClouds() {
        const cloudCount = Math.floor(5 + 20 * this.weatherFactor);
        const cloudGroup = new THREE.Group();

        for (let i = 0; i < cloudCount; i++) {
            const cluster = new THREE.Group();
            const puffCount = 5 + Math.floor(Math.random() * 10);
            
            const puffGeo = new THREE.SphereGeometry(1, 16, 16);
            const puffMat = new THREE.MeshPhongMaterial({
                color: 0xffffff, transparent: true, opacity: 0.6, shininess: 0,
            });

            for (let j = 0; j < puffCount; j++) {
                const puff = new THREE.Mesh(puffGeo, puffMat);
                puff.scale.setScalar(1 + Math.random() * 2);
                puff.position.set(
                    (Math.random() - 0.5) * (10 + 15 * this.weatherFactor),
                    Math.random() * 2,
                    (Math.random() - 0.5) * (10 + 15 * this.weatherFactor)
                );
                puff.castShadow = true;
                cluster.add(puff);
            }
            
            cluster.position.set(
                (Math.random() - 0.5) * this.worldSize,
                20 + Math.random() * 10,
                (Math.random() - 0.5) * this.worldSize
            );
            cluster.userData.speed = 0.5 + Math.random();
            this.clouds.push(cluster);
            cloudGroup.add(cluster);
        }
        this.scene.add(cloudGroup);
    }

    update(delta) {
        this.clouds.forEach(cloud => {
            cloud.position.x += cloud.userData.speed * delta;
            if (cloud.position.x > this.worldSize) {
                cloud.position.x = -this.worldSize;
            }
        });
    }
}
