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
            .dev-section { display:none; padding:5px 0 10px 10px; border-left:2px solid #444; }
            .dev-panel input[type=range], .dev-panel input[type=color] { width: 100%; }
            .dev-control { margin: 5px 0; }
            .dev-control label { display:block; margin-bottom:2px; }
        `;
        document.head.appendChild(style);
    }

    initDOM() {
        this.container = document.createElement('div');
        this.container.className = 'dev-panel';
        document.body.appendChild(this.container);

        // Shape sections
        this.addSection("Body", [
            { type:"range", name:"Torso Width", min:0.5,max:2,step:0.01,target:this.player.rig.torsoMesh.scale,axis:"x" },
            { type:"range", name:"Torso Height", min:0.5,max:2,step:0.01,target:this.player.rig.torsoMesh.scale,axis:"y" },
            { type:"range", name:"Torso Depth", min:0.5,max:2,step:0.01,target:this.player.rig.torsoMesh.scale,axis:"z" },
        ]);
        this.addSection("Head", [
            { type:"range", name:"Head Size", min:0.3,max:2,step:0.01,target:this.player.rig.headMesh.scale,axis:"x",link:["y","z"] },
            { type:"toggle", name:"Show Head", target:this.player.rig.headMesh },
        ]);
        this.addSection("Arms", [
            { type:"range", name:"Arm Length", min:0.5,max:2,step:0.01,target:this.player.rig.leftArm.position,axis:"y",mirror:this.player.rig.rightArm.position },
            { type:"toggle", name:"Show Arms", group:[this.player.rig.leftArm,this.player.rig.rightArm] },
        ]);
        this.addSection("Legs", [
            { type:"range", name:"Leg Length", min:0.5,max:2,step:0.01,target:this.player.rig.leftLeg.position,axis:"y",mirror:this.player.rig.rightLeg.position },
            { type:"toggle", name:"Show Legs", group:[this.player.rig.leftLeg,this.player.rig.rightLeg] },
        ]);

        // Animation section
        this.addSection("Animation", [
            { type:"range", name:"Walk Speed", min:0.5,max:3,step:0.01,onChange:val=> this.player.speed=val },
            { type:"range", name:"Breathing Strength", min:0,max:0.1,step:0.001,onChange:val=> this.player.idleBreathAmp=val },
        ]);

        // Material/Color section
        const mat = this.player.rig.torsoMesh.material;
        this.addSection("Materials", [
            { type:"color", name:"Body Color", onChange:val=> mat.color.set(val) },
            { type:"range", name:"Metalness", min:0,max:1,step:0.01,onChange:val=> mat.metalness=val },
            { type:"range", name:"Roughness", min:0,max:1,step:0.01,onChange:val=> mat.roughness=val },
        ]);

        // Expand/collapse headers
        this.container.querySelectorAll("h3").forEach(h=>{
            h.addEventListener("click",()=>{
                const sec = h.nextElementSibling;
                sec.style.display = sec.style.display==="block"?"none":"block";
            });
        });
    }

    addSection(title, controls) {
        const header=document.createElement("h3"); header.textContent=title;
        const section=document.createElement("div"); section.className="dev-section";

        controls.forEach(ctrl=>{
            const wrapper=document.createElement("div"); wrapper.className="dev-control";
            const label=document.createElement("label"); label.textContent=ctrl.name;
            let input;

            if(ctrl.type==="range"){
                input=document.createElement("input");
                input.type="range"; input.min=ctrl.min; input.max=ctrl.max; input.step=ctrl.step;
                input.value=ctrl.target ? ctrl.target[ctrl.axis] : 1;
                input.addEventListener("input",()=>{
                    const val=parseFloat(input.value);
                    if(ctrl.target){ ctrl.target[ctrl.axis]=val; if(ctrl.link) ctrl.link.forEach(ax=> ctrl.target[ax]=val); if(ctrl.mirror) ctrl.mirror[ctrl.axis]=val; }
                    if(ctrl.onChange) ctrl.onChange(val);
                });
            }
            else if(ctrl.type==="color"){
                input=document.createElement("input"); input.type="color";
                input.addEventListener("input",()=> ctrl.onChange(input.value));
            }
            else if(ctrl.type==="toggle"){
                input=document.createElement("input"); input.type="checkbox"; input.checked=true;
                input.addEventListener("change",()=>{
                    if(ctrl.target) ctrl.target.visible=input.checked;
                    if(ctrl.group) ctrl.group.forEach(g=> g.visible=input.checked);
                });
            }

            wrapper.appendChild(label); wrapper.appendChild(input); section.appendChild(wrapper);
        });

        this.container.appendChild(header); this.container.appendChild(section);
    }
}