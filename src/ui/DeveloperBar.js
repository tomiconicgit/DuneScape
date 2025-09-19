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
        max-height: 45vh;
        z-index: 10000;
        pointer-events: none; /* Let canvas receive touches unless interacting with panel */
      }
      .dev-inner {
        margin: 6px;
        background: rgba(0,0,0,0.85);
        color: #fff;
        font-family: monospace;
        font-size: 13px;
        border-radius: 8px;
        overflow: hidden;
        box-shadow: 0 4px 12px rgba(0,0,0,0.6);
        pointer-events: auto; /* UI is interactive */
      }
      .dev-header {
        display: flex;
        align-items: center;
        justify-content: space-between;
        background: #151515;
        padding: 6px 10px;
        user-select: none;
      }
      .dev-title { font-weight: bold; }
      .dev-toggle {
        cursor: pointer;
        background: #2a2a2a;
        color: #fff;
        border: 1px solid #444;
        border-radius: 6px;
        padding: 4px 8px;
      }
      .dev-body {
        max-height: 40vh;
        overflow-y: auto;
        padding: 8px 10px 12px;
        display: block;
      }
      .dev-body.collapsed { display: none; }

      .dev-section-title {
        margin: 8px 0 4px;
        font-size: 14px;
        padding: 6px;
        background: #222;
        border-radius: 4px;
        cursor: pointer;
      }
      .dev-section {
        display: none;
        padding: 6px 0 8px 6px;
        border-left: 2px solid #444;
      }
      .dev-section.open { display: block; }

      .dev-control { margin: 6px 0; }
      .dev-control label { display: flex; justify-content: space-between; margin-bottom: 3px; gap: 8px; }
      .dev-control input[type=range],
      .dev-control input[type=color] { width: 100%; }
      .dev-row { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; }
      @media (max-width: 520px) {
        .dev-row { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  initDOM() {
    this.container = document.createElement('div');
    this.container.className = 'dev-panel';

    const inner = document.createElement('div');
    inner.className = 'dev-inner';

    const header = document.createElement('div');
    header.className = 'dev-header';
    header.innerHTML = `
      <span class="dev-title">Developer Panel</span>
      <button class="dev-toggle" aria-expanded="true">Hide</button>
    `;

    const body = document.createElement('div');
    body.className = 'dev-body';

    inner.appendChild(header);
    inner.appendChild(body);
    this.container.appendChild(inner);
    document.body.appendChild(this.container);

    // Toggle collapse
    const toggle = header.querySelector('.dev-toggle');
    toggle.addEventListener('click', () => {
      const collapsed = body.classList.toggle('collapsed');
      toggle.textContent = collapsed ? 'Show' : 'Hide';
      toggle.setAttribute('aria-expanded', String(!collapsed));
    });

    // ===== Sections =====
    // SHAPE — BODY
    this.addSection(body, 'Body', (sec) => {
      this.addRange(sec, 'Torso Width', 0.5, 2, 0.01, this.player.rig.torsoMesh.scale, 'x');
      this.addRange(sec, 'Torso Height', 0.5, 2, 0.01, this.player.rig.torsoMesh.scale, 'y');
      this.addRange(sec, 'Torso Depth', 0.5, 2, 0.01, this.player.rig.torsoMesh.scale, 'z');
      // Shoulder width (symmetrical)
      this.addRangeCustom(sec, 'Shoulder Width', 0.2, 0.7, 0.005, this.player.rig.leftShoulder.position.x, (val) => {
        this.player.rig.leftShoulder.position.x =  Math.abs(val);
        this.player.rig.rightShoulder.position.x = -Math.abs(val);
      });
      // Hip width (legs spread)
      this.addRangeCustom(sec, 'Hip Width', 0.15, 0.5, 0.005, this.player.rig.leftUpLeg.position.x, (val) => {
        this.player.rig.leftUpLeg.position.x  =  Math.abs(val);
        this.player.rig.rightUpLeg.position.x = -Math.abs(val);
      });
    });

    // SHAPE — HEAD
    this.addSection(body, 'Head', (sec) => {
      this.addUniformScale(sec, 'Head Size', 0.3, 2, 0.01, this.player.rig.headMesh.scale);
      this.addToggle(sec, 'Show Head', true, (on) => { this.player.rig.headMesh.visible = on; });
      this.addRangeCustom(sec, 'Head Tilt (X)', -0.6, 0.6, 0.01, 0, (v)=>{ this.player.rig.head.rotation.x = v; });
      this.addRangeCustom(sec, 'Head Turn (Y)', -0.8, 0.8, 0.01, 0, (v)=>{ this.player.rig.head.rotation.y = v; });
    });

    // SHAPE — ARMS
    this.addSection(body, 'Arms', (sec) => {
      // Upper arm cylinder is children[0] of each arm bone
      const LUpper = this.player.rig.leftArm.children[0];
      const RUpper = this.player.rig.rightArm.children[0];
      const LLower = this.player.rig.leftForeArm.children[0];
      const RLower = this.player.rig.rightForeArm.children[0];

      this.addRangePairY(sec, 'Upper Arm Length', 0.5, 2.0, 0.01, LUpper, RUpper);
      this.addRangePairY(sec, 'Lower Arm Length', 0.5, 2.0, 0.01, LLower, RLower);

      this.addRangePairXZ(sec, 'Arm Thickness', 0.1, 0.6, 0.01, LUpper, RUpper);
      this.addToggle(sec, 'Show Arms', true, (on) => {
        this.player.rig.leftArm.visible = on; this.player.rig.rightArm.visible = on;
      });
    });

    // SHAPE — LEGS
    this.addSection(body, 'Legs', (sec) => {
      const LUpper = this.player.rig.leftUpLeg.children[0];
      const RUpper = this.player.rig.rightUpLeg.children[0];
      const LLower = this.player.rig.leftLeg.children[0];
      const RLower = this.player.rig.rightLeg.children[0];

      this.addRangePairY(sec, 'Upper Leg Length', 0.5, 2.0, 0.01, LUpper, RUpper);
      this.addRangePairY(sec, 'Lower Leg Length', 0.5, 2.0, 0.01, LLower, RLower);

      this.addRangePairXZ(sec, 'Leg Thickness', 0.1, 0.8, 0.01, LUpper, RUpper);
      this.addToggle(sec, 'Show Legs', true, (on) => {
        this.player.rig.leftUpLeg.visible = on; this.player.rig.rightUpLeg.visible = on;
        this.player.rig.leftLeg.visible = on;   this.player.rig.rightLeg.visible = on;
        this.player.rig.leftFoot.visible = on;  this.player.rig.rightFoot.visible = on;
      });

      // Foot size (box attached to foot bone is children[0])
      const LFootMesh = this.player.rig.leftFoot.children.find(c=>c.isMesh);
      const RFootMesh = this.player.rig.rightFoot.children.find(c=>c.isMesh);
      this.addUniformScalePair(sec, 'Foot Size', 0.5, 2.0, 0.01, LFootMesh.scale, RFootMesh.scale);
    });

    // ANIMATION
    this.addSection(body, 'Animation', (sec) => {
      this.addRangeCustom(sec, 'Walk Speed', 0.5, 3.0, 0.01, this.player.speed, (v)=>{ this.player.speed = v; });
      this.addRangeCustom(sec, 'Breathing Strength', 0.0, 0.1, 0.001, this.player.idleBreathAmp, (v)=>{ this.player.idleBreathAmp = v; });
    });

    // MATERIALS
    this.addSection(body, 'Materials', (sec) => {
      const mat = this.player.bodyMaterial ?? this.player.rig.torsoMesh.material;

      // Color
      this.addColor(sec, 'Body Color', '#666688', (hex)=> { mat.color.set(hex); });

      // PBR
      this.addRangeCustom(sec, 'Metalness', 0, 1, 0.01, mat.metalness ?? 0.1, (v)=> { mat.metalness = v; });
      this.addRangeCustom(sec, 'Roughness', 0, 1, 0.01, mat.roughness ?? 0.8, (v)=> { mat.roughness = v; });

      // Shadows toggles
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
    const t = document.createElement('div');
    t.className = 'dev-section-title';
    t.textContent = title;

    const sec = document.createElement('div');
    sec.className = 'dev-section';

    t.addEventListener('click', () => {
      sec.classList.toggle('open');
    });

    parent.appendChild(t);
    parent.appendChild(sec);
    build(sec);
  }

  addControlWrapper(sec, labelText, input) {
    const wrap = document.createElement('div');
    wrap.className = 'dev-control';
    const label = document.createElement('label');
    label.innerHTML = `<span>${labelText}</span>`;
    wrap.appendChild(label);
    wrap.appendChild(input);
    sec.appendChild(wrap);
  }

  addRange(sec, name, min, max, step, target, axis) {
    const input = document.createElement('input');
    input.type = 'range'; input.min = min; input.max = max; input.step = step;
    input.value = target[axis];
    input.addEventListener('input', ()=>{
      const v = parseFloat(input.value);
      target[axis] = v;
    });
    this.addControlWrapper(sec, name, input);
  }

  addRangeCustom(sec, name, min, max, step, initial, onChange) {
    const input = document.createElement('input');
    input.type = 'range'; input.min = min; input.max = max; input.step = step;
    input.value = initial;
    input.addEventListener('input', ()=> onChange(parseFloat(input.value)));
    this.addControlWrapper(sec, name, input);
  }

  addUniformScale(sec, name, min, max, step, scaleVec3) {
    const input = document.createElement('input');
    input.type = 'range'; input.min = min; input.max = max; input.step = step;
    input.value = scaleVec3.x;
    input.addEventListener('input', ()=>{
      const v = parseFloat(input.value);
      scaleVec3.set(v, v, v);
    });
    this.addControlWrapper(sec, name, input);
  }

  addUniformScalePair(sec, name, min, max, step, scaleA, scaleB) {
    const input = document.createElement('input');
    input.type = 'range'; input.min = min; input.max = max; input.step = step;
    input.value = scaleA.x;
    input.addEventListener('input', ()=>{
      const v = parseFloat(input.value);
      scaleA.set(v,v,v);
      scaleB.set(v,v,v);
    });
    this.addControlWrapper(sec, name, input);
  }

  addRangePairY(sec, name, min, max, step, meshA, meshB) {
    const input = document.createElement('input');
    input.type = 'range'; input.min = min; input.max = max; input.step = step;
    input.value = meshA.scale.y;
    input.addEventListener('input', ()=>{
      const v = parseFloat(input.value);
      meshA.scale.y = v;
      meshB.scale.y = v;
    });
    this.addControlWrapper(sec, name, input);
  }

  addRangePairXZ(sec, name, min, max, step, meshA, meshB) {
    const input = document.createElement('input');
    input.type = 'range'; input.min = min; input.max = max; input.step = step;
    input.value = meshA.scale.x;
    input.addEventListener('input', ()=>{
      const v = parseFloat(input.value);
      meshA.scale.x = meshA.scale.z = v;
      meshB.scale.x = meshB.scale.z = v;
    });
    this.addControlWrapper(sec, name, input);
  }

  addToggle(sec, name, initial, onChange) {
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = initial;
    input.addEventListener('change', ()=> onChange(input.checked));
    this.addControlWrapper(sec, name, input);
  }

  addColor(sec, name, initialHex, onChange) {
    const input = document.createElement('input');
    input.type = 'color';
    input.value = initialHex;
    input.addEventListener('input', ()=> onChange(input.value));
    this.addControlWrapper(sec, name, input);
  }
}