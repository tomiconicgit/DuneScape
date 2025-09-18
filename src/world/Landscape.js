// Landscape.js — Desert terrain with animated wind ripples and heat shimmer
import * as THREE from 'three';

export function createDesert(scene, clock) {
  const size = 500;
  const segments = 256;

  const geometry = new THREE.PlaneGeometry(size, size, segments, segments);
  geometry.rotateX(-Math.PI / 2);

  const duneAmp = 2.5;
  const rippleAmp = 0.4;
  const rippleFreq = 0.12;

  const positions = geometry.attributes.position;
  const baseY = [];

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);

    const dune = Math.sin(x * 0.005) * Math.cos(z * 0.005) * duneAmp;
    const ripple = Math.sin(x * rippleFreq) * Math.sin(z * rippleFreq) * rippleAmp;

    const y = dune + ripple;
    baseY.push(y);
    positions.setY(i, y);
  }

  geometry.computeVertexNormals();

  const sandMaterial = new THREE.MeshStandardMaterial({
    color: 0xeed9b6,
    roughness: 0.95,
    metalness: 0.05,
  });

  const terrain = new THREE.Mesh(geometry, sandMaterial);
  terrain.receiveShadow = true;
  scene.add(terrain);

  // Lighting
  const ambient = new THREE.AmbientLight(0xfff4e5, 0.6);
  const sun = new THREE.DirectionalLight(0xffffff, 1.2);
  sun.position.set(100, 200, 100);
  sun.castShadow = true;
  scene.add(ambient, sun);

  // Wind ripple animation
  terrain.userData.animate = () => {
    const t = clock.getElapsedTime();
    for (let i = 0; i < positions.count; i++) {
      const x = positions.getX(i);
      const z = positions.getZ(i);
      const wind = Math.sin(x * 0.05 + t * 0.5) * Math.cos(z * 0.05 + t * 0.5) * 0.2;
      positions.setY(i, baseY[i] + wind);
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
  };
}
