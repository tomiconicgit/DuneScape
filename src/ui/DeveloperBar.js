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
                bottom: 0;
                left: 0;
                width: 100%;
                max-height: 40vh;
                background: rgba(0,0,0,0.85);
                color: #fff;
                font-family: monospace;
                font-size: 13px;
                overflow-y: auto;
                padding: 10px;
                box-shadow: 0 -2px 8px rgba(0,0,0,0.7);
                z-index: 10000;
            }
            .dev-panel h3 {
                margin: 5px 0;
                font-size: 14px;
                cursor: pointer;
                background: #222;
                padding: 5px;
                border-radius: 4px;
            }
            .dev-section {
                display: none;
                padding: 5px 0 10px 10px;
                border-left: 2px solid #444;
            }
            .dev-panel input[type=range] {
                width: 100%;
            }
            .dev-control {
                margin: 5px 0;
            }
            .dev-control label {
                display: block;
                margin-bottom: 2px;
            }
        `;
        document.head.appendChild(style);
    }

    initDOM() {
        this.container = document.createElement('div');
        this.container.className = 'dev-panel';
        document.body.appendChild(this.container);

        // === SECTIONS ===
        this.addSection("Body", [
            { name: "Torso Width", min: 0.5, max: 2, step: 0.01, target: this.player.rig.torsoMesh.scale, axis: "x" },
            { name: "Torso Height", min: 0.5, max: 2, step: 0.01, target: this.player.rig.torsoMesh.scale, axis: "y" },
            { name: "Torso Depth", min: 0.5, max: 2, step: 0.01, target: this.player.rig.torsoMesh.scale, axis: "z" },
        ]);

        this.addSection("Head", [
            { name: "Head Size", min: 0.3, max: 2, step: 0.01, target: this.player.rig.headMesh.scale, axis: "x", link: ["y","z"] },
        ]);

        this.addSection("Arms", [
            { name: "Arm Length", min: 0.5, max: 2, step: 0.01, target: this.player.rig.leftArm.position, axis: "y", mirror: this.player.rig.rightArm.position },
            { name: "Arm Thickness", min: 0.1, max: 0.5, step: 0.01, target: this.player.rig.leftArm.children[0].scale, axis: "x", mirror: this.player.rig.rightArm.children[0].scale },
        ]);

        this.addSection("Legs", [
            { name: "Leg Length", min: 0.5, max: 2, step: 0.01, target: this.player.rig.leftLeg.position, axis: "y", mirror: this.player.rig.rightLeg.position },
            { name: "Leg Thickness", min: 0.1, max: 0.6, step: 0.01, target: this.player.rig.leftLeg.children[0].scale, axis: "x", mirror: this.player.rig.rightLeg.children[0].scale },
        ]);

        this.addSection("Animation", [
            { name: "Walk Speed", min: 0.5, max: 3, step: 0.01, onChange: (val)=> this.player.speed = val },
            { name: "Breathing Strength", min: 0, max: 0.1, step: 0.001, onChange: (val)=> this.player.idleBreathAmp = val },
        ]);

        // Expand/collapse behavior
        this.container.querySelectorAll("h3").forEach(header=>{
            header.addEventListener("click",()=>{
                const section = header.nextElementSibling;
                section.style.display = section.style.display==="block"?"none":"block";
            });
        });
    }

    addSection(title, controls) {
        const header = document.createElement("h3");
        header.textContent = title;
        const section = document.createElement("div");
        section.className = "dev-section";

        controls.forEach(ctrl=>{
            const wrapper = document.createElement("div");
            wrapper.className = "dev-control";
            const label = document.createElement("label");
            label.textContent = ctrl.name;

            const input = document.createElement("input");
            input.type = "range";
            input.min = ctrl.min;
            input.max = ctrl.max;
            input.step = ctrl.step;
            input.value = ctrl.target ? ctrl.target[ctrl.axis] : 1;

            input.addEventListener("input", ()=>{
                const val = parseFloat(input.value);
                if (ctrl.target) {
                    ctrl.target[ctrl.axis] = val;
                    if (ctrl.link) ctrl.link.forEach(ax=> ctrl.target[ax] = val);
                    if (ctrl.mirror) ctrl.mirror[ctrl.axis] = val;
                }
                if (ctrl.onChange) ctrl.onChange(val);
            });

            wrapper.appendChild(label);
            wrapper.appendChild(input);
            section.appendChild(wrapper);
        });

        this.container.appendChild(header);
        this.container.appendChild(section);
    }
}