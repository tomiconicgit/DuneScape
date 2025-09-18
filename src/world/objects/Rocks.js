import * as THREE from 'three';

export default class Rocks {
    constructor(scene) {
        this.scene = scene;
        this.rockMeshes = [];

        this.orePresets = {
            limestone: { color: 0xcccccc, color2: 0x9e9b84, roughness: 0.9, metalness: 0.0, displacement: 0.2 },
            carbon:    { color: 0x4a4a4a, color2: 0x1f1f1f, roughness: 0.6, metalness: 0.1, displacement: 0.3 },
            iron:      { color: 0x8E574A, color2: 0x5c3e33, roughness: 0.5, metalness: 0.4, displacement: 0.4 },
            stone:     { color: 0x808080, color2: 0x404040, roughness: 0.8, metalness: 0.2, displacement: 0.25 }
        };
    }

    addRock(type, position) {
        if (!this.orePresets[type]) return;

        const preset = this.orePresets[type];
        const seed = Math.random() * 100;
        const noise = new Noise(seed);

        const geometry = new THREE.SphereGeometry(1, 16, 12);
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

        const uniforms = {
            color: { value: new THREE.Color(preset.color) }, color2: { value: new THREE.Color(preset.color2) },
            matRoughness: { value: preset.roughness }, matMetalness: { value: preset.metalness },
            lightDir: { value: new THREE.Vector3(0.5, 1, 0.5) }, sunColor: { value: new THREE.Color(0xffffff) },
            hemiSkyColor: { value: new THREE.Color(0xffffff) }, hemiGroundColor: { value: new THREE.Color(0xffffff) },
            texFrequency: { value: 5.0 }, bumpStrength: { value: 0.1 }, texSeed: { value: Math.random() * 100 }
        };
        const material = new THREE.ShaderMaterial({ uniforms, vertexShader, fragmentShader });

        const rockMesh = new THREE.Mesh(geometry, material);
        const scale = 0.5;
        rockMesh.scale.set(scale, scale, scale);
        rockMesh.position.set(position.x, position.y + (scale * 0.5), position.z);
        rockMesh.userData.type = type;
        
        rockMesh.castShadow = true;
        rockMesh.receiveShadow = true;
        this.scene.add(rockMesh);
        this.rockMeshes.push(rockMesh);
    }

    getRockDataForExport() {
        const rockData = this.rockMeshes.map(rock => ({
            type: rock.userData.type,
            pos: [parseFloat(rock.position.x.toFixed(2)), parseFloat(rock.position.y.toFixed(2)), parseFloat(rock.position.z.toFixed(2))]
        }));
        return JSON.stringify(rockData, null, 2);
    }

    clearAllRocks() {
        this.rockMeshes.forEach(rock => this.scene.remove(rock));
        this.rockMeshes = [];
    }
}


// --- FULL NOISE & SHADER CODE ---
function seededRandom(s){return function(){s=Math.sin(s)*1e4;return s-Math.floor(s)}}
class Noise{constructor(s){this.seed=s||0;this.random=seededRandom(this.seed);this.p=Array.from({length:256},(_,i)=>i);for(let i=255;i>0;i--){const j=Math.floor(this.random()*(i+1));[this.p[i],this.p[j]]=[this.p[j],this.p[i]]}this.perm=[...this.p,...this.p];this.grad3=[[1,1,0],[-1,1,0],[1,-1,0],[-1,-1,0],[1,0,1],[-1,0,1],[1,0,-1],[-1,0,-1],[0,1,1],[0,-1,1],[0,1,-1],[0,-1,-1]]}fade(t){return t*t*t*(t*(t*6-15)+10)}lerp(t,a,b){return a+t*(b-a)}grad(h,x,y,z){return this.grad3[h%12].reduce((a,b,i)=>a+b*[x,y,z][i],0)}noise(x,y,z){const X=Math.floor(x)&255,Y=Math.floor(y)&255,Z=Math.floor(z)&255;x-=Math.floor(x);y-=Math.floor(y);z-=Math.floor(z);const u=this.fade(x),v=this.fade(y),w=this.fade(z),A=this.perm[X]+Y,AA=this.perm[A]+Z,AB=this.perm[A+1]+Z,B=this.perm[X+1]+Y,BA=this.perm[B]+Z,BB=this.perm[B+1]+Z;return this.lerp(w,this.lerp(v,this.lerp(u,this.grad(this.perm[AA],x,y,z),this.grad(this.perm[BA],x-1,y,z)),this.lerp(u,this.grad(this.perm[AB],x,y-1,z),this.grad(this.perm[BB],x-1,y-1,z))),this.lerp(v,this.lerp(u,this.grad(this.perm[AA+1],x,y,z-1),this.grad(this.perm[BA+1],x-1,y,z-1)),this.lerp(u,this.grad(this.perm[AB+1],x,y-1,z-1),this.grad(this.perm[BB+1],x-1,y-1,z-1))))}fbm(x,y,z,o,l,g){let v=0,a=1;for(let i=0;i<o;i++){v+=a*this.noise(x,y,z);x*=l;y*=l;z*=l;a*=g}return v}}

const vertexShader = `
    varying vec3 vNormal; varying vec3 vPosition;
    void main() {
        vNormal = normal; vPosition = position;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }`;
const fragmentShader = `
    uniform vec3 color; uniform vec3 color2; uniform float matRoughness; uniform float matMetalness;
    uniform float texFrequency; uniform float bumpStrength; uniform float texSeed;
    uniform vec3 sunColor; uniform vec3 hemiSkyColor; uniform vec3 hemiGroundColor; uniform vec3 lightDir;
    varying vec3 vNormal; varying vec3 vPosition;
    vec3 mod289(vec3 x){return x-floor(x*(1./289.))*289.;} vec4 mod289(vec4 x){return x-floor(x*(1./289.))*289.;}
    vec4 permute(vec4 x){return mod289(((x*34.)+1.)*x);}
    vec3 fade(vec3 t){return t*t*t*(t*(t*6.-15.)+10.);}
    float cnoise(vec3 P){vec3 Pi0=floor(P);vec3 Pi1=Pi0+vec3(1.);Pi0=mod289(Pi0);Pi1=mod289(Pi1);vec3 Pf0=fract(P);vec3 Pf1=Pf0-vec3(1.);vec4 ix=vec4(Pi0.x,Pi1.x,Pi0.x,Pi1.x);vec4 iy=vec4(Pi0.yy,Pi1.yy);vec4 iz0=Pi0.zzzz;vec4 iz1=Pi1.zzzz;vec4 ixy=permute(permute(ix)+iy);vec4 ixy0=permute(ixy+iz0);vec4 ixy1=permute(ixy+iz1);vec4 gx0=ixy0*(1./7.);vec4 gy0=fract(floor(gx0)*(1./7.))-.5;gx0=fract(gx0);vec4 gz0=vec4(.5)-abs(gx0)-abs(gy0);vec4 sz0=step(gz0,vec4(0.));gx0-=sz0*(step(0.,gx0)-.5);gy0-=sz0*(step(0.,gy0)-.5);vec4 gx1=ixy1*(1./7.);vec4 gy1=fract(floor(gx1)*(1./7.))-.5;gx1=fract(gx1);vec4 gz1=vec4(.5)-abs(gx1)-abs(gy1);vec4 sz1=step(gz1,vec4(0.));gx1-=sz1*(step(0.,gx1)-.5);gy1-=sz1*(step(0.,gy1)-.5);vec3 g000=vec3(gx0.x,gy0.x,gz0.x);vec3 g100=vec3(gx0.y,gy0.y,gz0.y);vec3 g010=vec3(gx0.z,gy0.z,gz0.z);vec3 g110=vec3(gx0.w,gy0.w,gz0.w);vec3 g001=vec3(gx1.x,gy1.x,gz1.x);vec3 g101=vec3(gx1.y,gy1.y,gz1.y);vec3 g011=vec3(gx1.z,gy1.z,gz1.z);vec3 g111=vec3(gx1.w,gy1.w,gz1.w);float n000=dot(g000,Pf0);float n100=dot(g100,vec3(Pf1.x,Pf0.yz));float n010=dot(g010,vec3(Pf0.x,Pf1.y,Pf0.z));float n110=dot(g110,vec3(Pf1.xy,Pf0.z));float n001=dot(g001,vec3(Pf0.xy,Pf1.z));float n101=dot(g101,vec3(Pf1.x,Pf0.y,Pf1.z));float n011=dot(g011,vec3(Pf0.x,Pf1.yz));float n111=dot(g111,Pf1);vec3 fade_xyz=fade(Pf0);vec4 n_z=mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);vec2 n_yz=mix(n_z.xy,n_z.zw,fade_xyz.y);float n_xyz=mix(n_yz.x,n_yz.y,fade_xyz.x);return 2.2*n_xyz;}
    float fbm(vec3 p){ float v=0.; float a=.5; for(int i=0;i<4;i++){v+=a*cnoise(p); p=p*2.; a*=.5;} return v;}

    void main() {
        vec3 pos = vPosition + texSeed;
        float noiseVal = fbm(pos * texFrequency);
        vec3 baseColor = mix(color, color2, noiseVal);
        float d = 0.01;
        float nx = fbm(pos + vec3(d, 0.0, 0.0));
        float ny = fbm(pos + vec3(0.0, d, 0.0));
        vec3 normalPerturb = vec3(noiseVal - nx, noiseVal - ny, 0.0) / d * bumpStrength;
        vec3 perturbedNormal = normalize(vNormal - normalPerturb);
        vec3 normLightDir = normalize(lightDir);
        float directLight = max(dot(perturbedNormal, normLightDir), 0.0);
        vec3 directContribution = sunColor * directLight;
        float hemiFactor = dot(perturbedNormal, vec3(0.0, 1.0, 0.0)) * 0.5 + 0.5;
        vec3 hemiContribution = mix(hemiGroundColor, hemiSkyColor, hemiFactor);
        vec3 finalColor = baseColor * (directContribution + hemiContribution);
        gl_FragColor = vec4(finalColor, 1.0);
    }`;
