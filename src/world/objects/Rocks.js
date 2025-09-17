import * as THREE from 'three';
import { MINE_AREA } from '../WorldData.js'; // Import the mine data

export default class Rocks {
    constructor(scene) {
        // --- Ore Presets (colors, settings for the shader) ---
        this.orePresets = {
            limestone: { color: 0xbfbfa8, color2: 0x9e9b84, roughness: 0.9, metalness: 0.0, displacement: 0.2 },
            carbon:    { color: 0x4a4a4a, color2: 0x1f1f1f, roughness: 0.6, metalness: 0.1, displacement: 0.3 },
            iron:      { color: 0x7d584a, color2: 0x5c3e33, roughness: 0.5, metalness: 0.4, displacement: 0.4 },
            stone:     { color: 0x808080, color2: 0x404040, roughness: 0.8, metalness: 0.2, displacement: 0.25 }
        };

        // --- Place Rocks on Mine Levels ---
        MINE_AREA.levels.forEach(level => {
            const rockCount = Math.floor(level.radius * 5); // More rocks on wider levels
            for (let i = 0; i < rockCount; i++) {
                const angle = Math.random() * Math.PI * 2;
                // Place rocks from the edge inwards to avoid perfect circles
                const radius = level.radius - (Math.random() * level.radius * 0.5);
                const x = MINE_AREA.x + Math.cos(angle) * radius;
                const z = MINE_AREA.y + Math.sin(angle) * radius;
                const position = new THREE.Vector3(x, -level.depth, z);
                
                // Place some generic 'stone' on all levels
                const type = (Math.random() > 0.3) ? level.name : 'stone';
                
                this._createRock(scene, type, position);
            }
        });
    }

    _createRock(scene, type, position) {
        const preset = this.orePresets[type];
        const seed = Math.random() * 100;
        const noise = new Noise(seed);

        // --- Geometry Generation (from your example) ---
        const geometry = new THREE.SphereGeometry(1, 64, 64);
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

        // --- Shader Material (from your example) ---
        const uniforms = {
            color: { value: new THREE.Color(preset.color) },
            color2: { value: new THREE.Color(preset.color2) },
            matRoughness: { value: preset.roughness },
            matMetalness: { value: preset.metalness },
            lightDir: { value: new THREE.Vector3(5, 5, 5) },
            texFrequency: { value: 5.0 }, colorVar: { value: 0.1 }, bumpStrength: { value: 0.1 },
            texSeed: { value: Math.random() * 100 }, lightIntensity: { value: 0.25 },
            aoStrength: { value: 3.5 }, wetness: { value: 0.0 },
        };
        const material = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: rockVertexShader,
            fragmentShader: rockFragmentShader
        });

        const rockMesh = new THREE.Mesh(geometry, material);
        rockMesh.position.copy(position);

        rockMesh.geometry.computeBoundingBox();
        const height = rockMesh.geometry.boundingBox.max.y - rockMesh.geometry.boundingBox.min.y;
        rockMesh.position.y += height / 2;

        const scale = THREE.MathUtils.randFloat(0.4, 0.9);
        rockMesh.scale.set(scale, scale, scale);
        rockMesh.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);

        rockMesh.castShadow = true;
        rockMesh.receiveShadow = true;
        scene.add(rockMesh);
    }
}


// --- FULL NOISE & SHADER CODE (PLACED AT THE BOTTOM OF ROCKS.JS) ---

function seededRandom(seed) {
    return function() {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    }
}

class Noise {
    constructor(seed) {
        this.seed = seed || 0;
        this.random = seededRandom(this.seed);
        this.permutation = Array.from({length: 256}, (_, i) => i);
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(this.random() * (i + 1));
            [this.permutation[i], this.permutation[j]] = [this.permutation[j], this.permutation[i]];
        }
        this.p = [...this.permutation, ...this.permutation];
    }
    grad3 = [[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]];
    noise(x, y, z) {
        const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
        x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
        const u = this.fade(x), v = this.fade(y), w = this.fade(z);
        const A = this.p[X] + Y, AA = this.p[A] + Z, AB = this.p[A + 1] + Z;
        const B = this.p[X + 1] + Y, BA = this.p[B] + Z, BB = this.p[B + 1] + Z;
        return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.p[AA], x, y, z), this.grad(this.p[BA], x-1, y, z)),
            this.lerp(u, this.grad(this.p[AB], x, y-1, z), this.grad(this.p[BB], x-1, y-1, z))),
            this.lerp(v, this.lerp(u, this.grad(this.p[AA+1], x, y, z-1), this.grad(this.p[BA+1], x-1, y, z-1)),
            this.lerp(u, this.grad(this.p[AB+1], x, y-1, z-1), this.grad(this.p[BB+1], x-1, y-1, z-1))));
    }
    fade(t) { return t * t * t * (t * (t * 6 - 15) + 10); }
    lerp(t, a, b) { return a + t * (b - a); }
    grad(hash, x, y, z) {
        return this.grad3[hash % 12].reduce((a, b, i) => a + b * [x,y,z][i], 0);
    }
    fbm(x, y, z, octaves, lacunarity, gain) {
        let value = 0;
        let amplitude = 1;
        for (let i = 0; i < octaves; i++) {
            value += amplitude * this.noise(x, y, z);
            x *= lacunarity;
            y *= lacunarity;
            z *= lacunarity;
            amplitude *= gain;
        }
        return value;
    }
};

const rockVertexShader = `
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
        vNormal = normal;
        vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
`;
const rockFragmentShader = `
    uniform vec3 color; uniform vec3 color2; uniform float matRoughness; uniform float matMetalness;
    uniform float texFrequency; uniform float colorVar; uniform float bumpStrength; uniform float texSeed;
    uniform float lightIntensity; uniform float aoStrength; uniform float wetness; uniform vec3 lightDir;
    varying vec3 vNormal; varying vec3 vPosition;
    vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;} vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
    vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);} vec4 taylorInvSqrt(vec4 r){return 1.79284291400159-.85373472095314*r;}
    vec3 fade(vec3 t){return t*t*t*(t*(t*6.-15.)+10.);}
    float cnoise(vec3 P){vec3 Pi0=floor(P);vec3 Pi1=Pi0+vec3(1.);Pi0=mod289(Pi0);Pi1=mod289(Pi1);vec3 Pf0=fract(P);vec3 Pf1=Pf0-vec3(1.);vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x);vec4 iy=vec4(Pi0.yy,Pi1.yy);vec4 iz0=Pi0.zzzz;vec4 iz1=Pi1.zzzz;vec4 ixy=permute(permute(ix)+iy);vec4 ixy0=permute(ixy+iz0);vec4 ixy1=permute(ixy+iz1);vec4 gx0=ixy0*(1./7.);vec4 gy0=fract(floor(gx0)*(1./7.))-.5;gx0=fract(gx0);vec4 gz0=vec4(.5)-abs(gx0)-abs(gy0);vec4 sz0=step(gz0,vec4(0.));gx0-=sz0*(step(0.,gx0)-.5);gy0-=sz0*(step(0.,gy0)-.5);vec4 gx1=ixy1*(1./7.);vec4 gy1=fract(floor(gx1)*(1./7.))-.5;gx1=fract(gx1);vec4 gz1=vec4(.5)-abs(gx1)-abs(gy1);vec4 sz1=step(gz1,vec4(0.));gx1-=sz1*(step(0.,gx1)-.5);gy1-=sz1*(step(0.,gy1)-.5);vec3 g000=vec3(gx0.x,gy0.x,gz0.x);vec3 g100=vec3(gx0.y,gy0.y,gz0.y);vec3 g010=vec3(gx0.z,gy0.z,gz0.z);vec3 g110=vec3(gx0.w,gy0.w,gz0.w);vec3 g001=vec3(gx1.x,gy1.x,gz1.x);vec3 g101=vec3(gx1.y,gy1.y,gz1.y);vec3 g011=vec3(gx1.z,gy1.z,gz1.z);vec3 g111=vec3(gx1.w,gy1.w,gz1.w);vec4 norm0=taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));g000*=norm0.x;g010*=norm0.y;g100*=norm0.z;g110*=norm0.w;vec4 norm1=taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));g001*=norm1.x;g011*=norm1.y;g101*=norm1.z;g111*=norm1.w;float n000=dot(g000,Pf0);float n100=dot(g100,vec3(Pf1.x,Pf0.yz));float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z));float n110=dot(g110,vec3(Pf1.xy,Pf0.z));float n001=dot(g001,vec3(Pf0.xy,Pf1.z));float n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));float n011=dot(g011,vec3(Pf0.x,Pf1.yz));float n111=dot(g111,Pf1);vec3 fade_xyz=fade(Pf0);vec4 n_z=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);vec2 n_yz=mix(n_z.xy,n_z.zw,fade_xyz.y);float n_xyz=mix(n_yz.x,n_yz.y,fade_xyz.x);return 2.2*n_xyz;}
    float fbm(vec3 p,int o,float l,float g){float v=0.;float a=1.;for(int i=0;i<o;i++){v+=a*cnoise(p);p*=l;a*=g;}return v;}
    float getAo(vec3 p,vec3 n){float o=0.,s=aoStrength;for(int i=0;i<4;i++){float h=.01+float(i)*.3/4.;float d=.5;o+=(h-d)*s;s*=.7;}return clamp(1.-o,0.,1.);}
    void main(){vec3 pos=vPosition+vec3(texSeed*.1,texSeed*.2,texSeed*.3);float noiseVal=fbm(pos*texFrequency,4,2.,.5)*.5+.5;float g=(vPosition.y+1.)/2.;vec3 gradColor=mix(color2,color,g);vec3 baseColor=gradColor*(1.-colorVar)+gradColor*noiseVal*colorVar;float d=.01;float nx=fbm((pos+vec3(d,0,0))*texFrequency,4,2.,.5);float ny=fbm((pos+vec3(0,d,0))*texFrequency,4,2.,.5);float nz=fbm((pos+vec3(0,0,d))*texFrequency,4,2.,.5);vec3 normalPerturb=vec3(noiseVal-nx,noiseVal-ny,noiseVal-nz)/d*bumpStrength;vec3 perturbedNormal=normalize(vNormal+normalPerturb);vec3 normLightDir=normalize(lightDir);float diff=max(dot(perturbedNormal,normLightDir),0.)*lightIntensity;vec3 ambient=baseColor*.1;vec3 diffuse=baseColor*diff*.9;vec3 viewDir=normalize(-vPosition);vec3 reflectDir=reflect(-normLightDir,perturbedNormal);float spec=pow(max(dot(viewDir,reflectDir),0.),(1.-matRoughness*(1.-wetness))*32.)*(matMetalness+wetness)*lightIntensity;float ao=getAo(pos,perturbedNormal);vec3 finalColor=(ambient+diffuse+vec3(spec))*ao;float lum=dot(finalColor,vec3(.2126,.7152,.0722));finalColor=mix(vec3(lum),finalColor,.8);gl_FragColor=vec4(finalColor,1.);}
`;
