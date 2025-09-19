// File: src/ui/DeveloperBar.js
export default class DeveloperBar {
  constructor(player) {
    this.player = player;
    this.initStyles();
    this.initDOM();
  }

  initStyles() {
    const style = document.createElement('style');
    style.textContent = `
      .dev-panel {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        max-height: 50vh;
        z-index: 10000;
        pointer-events: none;
      }
      .dev-inner {
        margin: 6px;
        background: rgba(0,0,0,0.88);
        color: #fff;
        font-family: monospace;
        font-size: 13px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        pointer-events: auto;
      }
      .dev-header {
        display: flex; align-items: center; justify-content: space-between;
        background: #151515; padding: 6px 10px; user-select: none;
      }
      .dev-title { font-weight: bold; }
      .dev-toggle {
        cursor: pointer; background: #2a2a2a; color:#fff; border: 1px solid #444;
        border-radius: 6px; padding: 4px 8px;
      }
      .dev-body { max-height: 44vh; overflow-y: auto; padding: 8px 10px 12px; display: block; }
      .dev-body.collapsed { display:none; }
      .dev-section-title { margin:8px 0 4px; font-size:14px; padding:6px; background:#222; border-radius:4px; cursor:pointer; }
      .dev-section { display:none; padding:6px 0 8px 6px; border-left:2px solid #444; }
      .dev-section.open { display:block; }
      .dev-control { margin:6px 0; }
      .dev-control label { display:flex; justify-content:space-between; margin-bottom:4px; gap:8px; }
      .dev-control input[type=range], .dev-control input[type=color], .dev-control select { width:100%; }
      .dev-row { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
      @media (max-width: 560px) { .dev-row { grid-template-columns: 1fr; } }
    `;
    document.head.appendChild(style);
  }

  initDOM() {
    this.container = document.createElement('div');
    this.container.className = 'dev-panel';

    const inner = document.createElement('div'); inner.className = 'dev-inner';
    const header = document.createElement('div'); header.className = 'dev-header';
    header.innerHTML = `<span class="dev-title">Developer Panel</span><button class="dev-toggle" aria-expanded="true">Hide</button>`;

    const body = document.createElement('div'); body.className = 'dev-body';
    inner.appendChild(header); inner.appendChild(body); this.container.appendChild(inner); document.body.appendChild(this.container);

    const toggle = header.querySelector('.dev-toggle');
    toggle.addEventListener('click', () => {
      const collapsed = body.classList.toggle('collapsed');
      toggle.textContent = collapsed ? 'Show' : 'Hide';
      toggle.setAttribute('aria-expanded', String(!collapsed));
    });

    // ===== Sections =====
    this.addSection(body, 'Offsets', (sec) => {
      this.addRangeLive(sec, 'Head Y', -0.2, 0.6, 0.005, this.player.params.offsets.headY, (v)=>{
        this.player.params.offsets.headY = v; this.player.rig.head.position.y = v;
      });
      this.addRangeLive(sec, 'Shoulder X', 0.2, 0.8, 0.005, this.player.params.offsets.shoulderX, (v)=>{
        this.player.params.offsets.shoulderX = v;
        this.player.rig.leftShoulder.position.x =  v;
        this.player.rig.rightShoulder.position.x = -v;
      });
      this.addRangeLive(sec, 'Hip X', 0.15, 0.5, 0.005, this.player.params.offsets.hipX, (v)=>{
        this.player.params.offsets.hipX = v;
        this.player.rig.leftUpLeg.position.x  =  v;
        this.player.rig.rightUpLeg.position.x = -v;
      });
    });

    this.addSection(body, 'Torso (shape)', (sec) => {
      const p = this.player.params.torso;
      this.addRangeLive(sec, 'Width', 0.6, 2.0, 0.01, p.w, (v)=>{ p.w = v; this.player.rebuildTorso(); });
      this.addRangeLive(sec, 'Height', 0.8, 2.2, 0.01, p.h, (v)=>{ p.h = v; this.player.rebuildTorso(); });
      this.addRangeLive(sec, 'Depth', 0.4, 1.2, 0.01, p.d, (v)=>{ p.d = v; this.player.rebuildTorso(); });
      this.addRangeLive(sec, 'Segments', 1, 24, 1, p.segments, (v)=>{ p.segments = Math.round(v); this.player.rebuildTorso(); });
      this.addRangeLive(sec, 'Roundness', 0, 1, 0.01, p.roundness, (v)=>{ p.roundness = v; this.player.rebuildTorso(); });
      this.addRangeLive(sec, 'Subdivision', 0, 3, 1, p.subdiv, (v)=>{ p.subdiv = Math.round(v); this.player.rebuildTorso(); });
    });

    this.addSection(body, 'Arms (curvature & detail)', (sec) => {
      const a = this.player.params.arms;
      this.addSelect(sec, 'Type', ['capsule','cylinder'], a.type, (val)=>{ a.type = val; this.player.rebuildArms(); });
      this.addRangeLive(sec, 'Radius', 0.08, 0.35, 0.005, a.radius, (v)=>{ a.radius = v; this.player.rebuildArms(); });
      this.addRangeLive(sec, 'Length', 0.35, 0.95, 0.005, a.length, (v)=>{ a.length = v; this.player.rebuildArms(); });
      this.addRangeLive(sec, 'Radial Seg', 4, 48, 1, a.radialSeg, (v)=>{ a.radialSeg = Math.round(v); this.player.rebuildArms(); });
      this.addRangeLive(sec, 'Height Seg', 1, 12, 1, a.heightSeg, (v)=>{ a.heightSeg = Math.round(v); this.player.rebuildArms(); });
      this.addRangeLive(sec, 'Subdivision', 0, 3, 1, a.subdiv, (v)=>{ a.subdiv = Math.round(v); this.player.rebuildArms(); });
      // ✨ FIX: Changed this.player.rebuildLegs() to this.player.rebuildArms()
      this.addRangeLive(sec, 'Thickness XZ', 0.6, 1.8, 0.01, a.thicknessXZ, (v)=>{ a.thicknessXZ = v; this.player.rebuildArms(); });
    });

    this.addSection(body, 'Legs (curvature & detail)', (sec) => {
      const l = this.player.params.legs;
      this.addSelect(sec, 'Type', ['capsule','cylinder'], l.type, (val)=>{ l.type = val; this.player.rebuildLegs(); });
      this.addRangeLive(sec, 'Radius', 0.10, 0.45, 0.005, l.radius, (v)=>{ l.radius = v; this.player.rebuildLegs(); });
      this.addRangeLive(sec, 'Length', 0.45, 1.10, 0.005, l.length, (v)=>{ l.length = v; this.player.rebuildLegs(); });
      this.addRangeLive(sec, 'Radial Seg', 4, 48, 1, l.radialSeg, (v)=>{ l.radialSeg = Math.round(v); this.player.rebuildLegs(); });
      this.addRangeLive(sec, 'Height Seg', 1, 12, 1, l.heightSeg, (v)=>{ l.heightSeg = Math.round(v); this.player.rebuildLegs(); });
      this.addRangeLive(sec, 'Subdivision', 0, 3, 1, l.subdiv, (v)=>{ l.subdiv = Math.round(v); this.player.rebuildLegs(); });
      this.addRangeLive(sec, 'Thickness XZ', 0.6, 1.8, 0.01, l.thicknessXZ, (v)=>{ l.thicknessXZ = v; this.player.rebuildLegs(); });
      this.addRangeLive(sec, 'Foot Size', 0.5, 2.0, 0.01, this.player.params.feet.scale, (v)=>{
        this.player.params.feet.scale = v;
        this.player.rig.leftFootMesh.scale.setScalar(v);
        this.player.rig.rightFootMesh.scale.setScalar(v);
      });
    });

    this.addSection(body, 'Materials & Texture', (sec) => {
      const m = this.player.params.mat;
      this.addColor(sec, 'Base Color', `#${m.color.getHexString()}`, (hex)=>{
        m.color.set(hex); this.player.bodyMaterial.color.copy(m.color);
      });
      this.addColor(sec, 'Secondary', `#${m.secondary.getHexString()}`, (hex)=>{
        m.secondary.set(hex); this.player.bodyMaterial.userData.uniforms.uSecondaryColor.value.copy(m.secondary);
      });
      this.addRangeLive(sec, 'Metalness', 0, 1, 0.01, m.metalness, (v)=>{ m.metalness = v; this.player.bodyMaterial.metalness = v; });
      this.addRangeLive(sec, 'Roughness', 0, 1, 0.01, m.roughness, (v)=>{ m.roughness = v; this.player.bodyMaterial.roughness = v; });
      this.addRangeLive(sec, 'Noise Blend', 0, 1, 0.01, m.noiseBlend, (v)=>{
        m.noiseBlend = v; this.player.bodyMaterial.userData.uniforms.uNoiseBlend.value = v;
      });
      this.addRangeLive(sec, 'Noise Scale', 0.5, 10, 0.1, m.noiseScale, (v)=>{
        m.noiseScale = v; this.player.bodyMaterial.userData.uniforms.uNoiseScale.value = v;
      });
      this.addRangeLive(sec, 'Idle Breathing', 0, 0.12, 0.001, this.player.params.idleBreathAmp, (v)=>{
        this.player.params.idleBreathAmp = v;
      });
      // Shadow toggles
      this.addToggle(sec, 'Cast Shadows', true, (on)=>{
        this.player.mesh.traverse(o=>{ if(o.isMesh) o.castShadow = on; });
      });
      this.addToggle(sec, 'Receive Shadows', true, (on)=>{
        this.player.mesh.traverse(o=>{ if(o.isMesh) o.receiveShadow = on; });
      });
    });
  }

  // ---------- UI helpers ----------
  addSection(parent, title, build) {
    const t = document.createElement('div'); t.className = 'dev-section-title'; t.textContent = title;
    const sec = document.createElement('div'); sec.className = 'dev-section';
    t.addEventListener('click', () => sec.classList.toggle('open'));
    parent.appendChild(t); parent.appendChild(sec); build(sec);
  }

  addControlWrapper(sec, labelText, input) {
    const wrap = document.createElement('div'); wrap.className = 'dev-control';
    const label = document.createElement('label'); label.innerHTML = `<span>${labelText}</span>`;
    wrap.appendChild(label); wrap.appendChild(input); sec.appendChild(wrap);
  }

  addRangeLive(sec, name, min, max, step, initial, onInput) {
    const input = document.createElement('input');
    input.type = 'range'; input.min = String(min); input.max = String(max); input.step = String(step);
    input.value = String(initial);
    input.addEventListener('input', ()=> onInput(parseFloat(input.value)));
    this.addControlWrapper(sec, name, input);
  }

  addToggle(sec, name, initial, onChange) {
    const input = document.createElement('input'); input.type = 'checkbox'; input.checked = initial;
    input.addEventListener('change', ()=> onChange(input.checked));
    this.addControlWrapper(sec, name, input);
  }

  addColor(sec, name, initialHex, onChange) {
    const input = document.createElement('input'); input.type = 'color'; input.value = initialHex;
    input.addEventListener('input', ()=> onChange(input.value));
    this.addControlWrapper(sec, name, input);
  }

  addSelect(sec, name, options, initial, onChange) {
    const sel = document.createElement('select');
    options.forEach(o => {
      const opt = document.createElement('option'); opt.value = o; opt.textContent = o;
      if (o === initial) opt.selected = true;
      sel.appendChild(opt);
    });
    sel.addEventListener('change', ()=> onChange(sel.value));
    this.addControlWrapper(sec, name, sel);
  }
}
