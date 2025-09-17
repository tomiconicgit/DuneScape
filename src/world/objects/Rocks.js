import * as THREE from 'three';
import { MINE_AREA } from '../WorldData.js';

const MASTER_SEED = 42;

export default class Rocks {
    constructor(scene) {
        this.prng = seededRandom(MASTER_SEED);

        // --- Ore Presets ---
        this.orePresets = {
            limestone: { color: 0xc2c2b0, roughness: 0.9, metalness: 0.0, displacement: 0.2, seed: 10 },
            carbon:    { color: 0x3d3d3d, roughness: 0.6, metalness: 0.1, displacement: 0.3, seed: 20 },
            iron:      { color: 0x8E574A, roughness: 0.5, metalness: 0.4, displacement: 0.4, seed: 30 },
            stone:     { color: 0x808080, roughness: 0.8, metalness: 0.2, displacement: 0.25, seed: null }
        };

        // --- Materials (reused for performance) ---
        this.materials = {
            stone:     new THREE.MeshStandardMaterial({ color: this.orePresets.stone.color, roughness: this.orePresets.stone.roughness, metalness: this.orePresets.stone.metalness }),
            iron:      new THREE.MeshStandardMaterial({ color: this.orePresets.iron.color, roughness: this.orePresets.iron.roughness, metalness: this.orePresets.iron.metalness }),
            limestone: new THREE.MeshStandardMaterial({ color: this.orePresets.limestone.color, roughness: this.orePresets.limestone.roughness, metalness: this.orePresets.limestone.metalness }),
            carbon:    new THREE.MeshStandardMaterial({ color: this.orePresets.carbon.color, roughness: this.orePresets.carbon.roughness, metalness: this.orePresets.carbon.metalness })
        };
        
        // --- Place Rocks on Mine Levels ---
        const mineCenter = new THREE.Vector2(MINE_AREA.x, MINE_AREA.y);
        for (let i = 0; i < 200; i++) { // Generate 200 rocks in total
            const angle = this.prng() * Math.PI * 2;
            const distFromCenter = this.prng() * MINE_AREA.radius;
            
            const x = MINE_AREA.x + Math.cos(angle) * distFromCenter;
            const z = MINE_AREA.y + Math.sin(angle) * distFromCenter;

            // Determine which level this rock is on based on its distance
            let rockType = 'stone'; // Default
            if (distFromCenter < MINE_AREA.radius * 0.4) rockType = 'iron';
            else if (distFromCenter < MINE_AREA.radius * 0.7) rockType = 'carbon';
            else rockType = 'limestone';

            // Add some generic stone too
            if (this.prng() > 0.6) rockType = 'stone';

            // Calculate the height from the terrain at this position
            const smoothDepth = MINE_AREA.depth * Math.sqrt(1 - (distFromCenter / MINE_AREA.radius));
            const y = -smoothDepth + (this.prng() * 0.5); // Add slight height variation

            this._createRock(scene, rockType, new THREE.Vector3(x, y, z));
        }
    }

    _createRock(scene, type, position) {
        const preset = this.orePresets[type];
        const shapeSeed = (preset.seed !== null) ? preset.seed : this.prng() * 100;
        const noise = new Noise(shapeSeed);

        // --- High-Quality Geometry Generation (CPU) ---
        const geometry = new THREE.SphereGeometry(1, 16, 16); // Moderate detail
        const positions = geometry.attributes.position;
        const tempVec = new THREE.Vector3();

        for (let i = 0; i < positions.count; i++) {
            tempVec.fromBufferAttribute(positions, i);
            const n = noise.fbm(tempVec.x * 2, tempVec.y * 2, tempVec.z * 2, 4, 2, 0.5);
            tempVec.multiplyScalar(1 + n * preset.displacement);
            positions.setXYZ(i, tempVec.x, tempVec.y, tempVec.z);
        }
        positions.needsUpdate = true;
        geometry.computeVertexNormals();

        const material = this.materials[type];
        const rockMesh = new THREE.Mesh(geometry, material);
        rockMesh.position.copy(position);
        
        const isOre = preset.seed !== null;
        const scale = isOre ? 0.65 : THREE.MathUtils.lerp(0.4, 0.9, this.prng());
        
        rockMesh.scale.set(scale, scale, scale);
        rockMesh.rotation.set(this.prng() * Math.PI, this.prng() * Math.PI, this.prng() * Math.PI);

        // Place rock on the ground
        rockMesh.geometry.computeBoundingBox();
        const height = rockMesh.geometry.boundingBox.max.y - rockMesh.geometry.boundingBox.min.y;
        rockMesh.position.y += (height * scale) / 2;

        rockMesh.castShadow = true;
        rockMesh.receiveShadow = true;
        scene.add(rockMesh);
    }
}

// --- Full Noise Class (Self-Contained) ---
function seededRandom(s){return function(){s=Math.sin(s)*1e4;return s-Math.floor(s)}}
class Noise{constructor(s){this.seed=s||0;this.random=seededRandom(this.seed);this.p=Array.from({length:256},(_,i)=>i);for(let i=255;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.p[i],this.p[j]]=[this.p[j],this.p[i]]}this.perm=[...this.p,...this.p];this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]]}fade(t){return t*t*t*(t*(t*6-15)+10)}lerp(t,a,b){return a+t*(b-a)}grad(h,x,y,z){return this.grad3[h%12].reduce((a,b,i)=>a+b*[x,y,z][i],0)}noise(x,y,z){const X=Math.floor(x)&255,Y=Math.floor(y)&255,Z=Math.floor(z)&255;x-=Math.floor(x);y-=Math.floor(y);z-=Math.floor(z);const u=this.fade(x),v=this.fade(y),w=this.fade(z),A=this.perm[X]+Y,AA=this.perm[A]+Z,AB=this.perm[A+1]+Z,B=this.perm[X+1]+Y,BA=this.perm[B]+Z,BB=this.perm[B+1]+Z;return this.lerp(w,this.lerp(v,this.lerp(u,this.grad(this.perm[AA],x,y,z),this.grad(this.perm[BA],x-1,y,z)),this.lerp(u,this.grad(this.perm[AB],x,y-1,z),this.grad(this.perm[BB],x-1,y-1,z))),this.lerp(v,this.lerp(u,this.grad(this.perm[AA+1],x,y,z-1),this.grad(this.perm[BA+1],x-1,y,z-1)),this.lerp(u,this.grad(this.perm[AB+1],x,y-1,z-1),this.grad(this.perm[BB+1],x-1,y-1,z-1))))}fbm(x,y,z,o,l,g){let v=0,a=1;for(let i=0;i<o;i++){v+=a*this.noise(x,y,z);x*=l;y*=l;z*=l;a*=g}return v}}
