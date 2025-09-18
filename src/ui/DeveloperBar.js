// File: src/ui/DeveloperBar.js
import * as THREE from 'three';

export default class DeveloperBar {
    constructor(initialConfig, updateCallback) {
        this.config = initialConfig;
        this.updateCallback = updateCallback;
        this.isPanelOpen = false;

        this.initStyles();
        this.initDOM();
        this.setupEventListeners();
    }

    initStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .dev-bar {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                color: #fff;
                font-family: monospace;
                font-size: 14px;
                z-index: 10000;
                display: flex;
                flex-direction: column;
                box-shadow: 0 2px 5px rgba(0,0,0,0.5);
            }
            .dev-bar-header {
                padding: 8px 12px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .dev-bar-title {
                font-weight: bold;
            }
            .dev-bar button {
                padding: 4px 8px;
                background-color: #333;
                color: #fff;
                border: 1px solid #555;
                cursor: pointer;
                margin-left: 10px;
            }
            .dev-panel {
                background-color: rgba(20, 20, 20, 0.85);
                padding: 15px;
                display: none; /* Initially hidden */
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 10px 20px;
                max-height: 40vh;
                overflow-y: auto;
            }
            .dev-panel.open {
                display: grid;
            }
            .dev-control {
                display: flex;
                flex-direction: column;
            }
            .dev-control label {
                margin-bottom: 5px;
                display: flex;
                justify-content: space-between;
            }
            .dev-control input[type="range"] {
                width: 100%;
            }
        `;
        document.head.appendChild(style);
    }

    initDOM() {
        this.container = document.createElement('div');
        this.container.className = 'dev-bar';
        this.header = document.createElement('div');
        this.header.className = 'dev-bar-header';
        this.header.innerHTML = '<span class="dev-bar-title">🛠️ Rock Controls</span>';
        const buttonGroup = document.createElement('div');
        this.copyButton = document.createElement('button');
        this.copyButton.id = 'copy-config-btn';
        this.copyButton.textContent = 'Copy Config';
        this.toggleButton = document.createElement('button');
        this.toggleButton.id = 'toggle-panel-btn';
        this.toggleButton.textContent = 'Show';
        buttonGroup.appendChild(this.copyButton);
        buttonGroup.appendChild(this.toggleButton);
        this.header.appendChild(buttonGroup);
        this.container.appendChild(this.header);
        this.panel = document.createElement('div');
        this.panel.className = 'dev-panel';
        this.container.appendChild(this.panel);
        document.body.appendChild(this.container);
        this.addControls();
    }
    
    addControls() {
        this.panel.innerHTML = ''; // Clear old controls
        // Geometry
        this.panel.innerHTML += this.createSlider('detail', 'Mesh Detail', 4, 9, 1, this.config.detail);
        this.panel.innerHTML += this.createSlider('displacement', 'Displacement', 0.0, 1.0, 0.05, this.config.displacement);
        
        // Shading
        this.panel.innerHTML += this.createSlider('aoStrength', 'AO Strength', 0.0, 5.0, 0.1, this.config.aoParam.y);
        this.panel.innerHTML += this.createSlider('aoSpread', 'AO Spread', 0.1, 2.0, 0.1, this.config.aoParam.x);
        this.panel.innerHTML += this.createSlider('cornerHighlight', 'Corner Highlight', 0.0, 1.0, 0.05, this.config.cornerParam.x);
        this.panel.innerHTML += this.createSlider('metalness', 'Metalness', 0, 1, 0.05, this.config.metalness);

        // Transform
        this.panel.innerHTML += this.createSlider('scaleX', 'Width', 0.2, 3, 0.1, this.config.scaleX);
        this.panel.innerHTML += this.createSlider('scaleY', 'Height', 0.2, 3, 0.1, this.config.scaleY);
        this.panel.innerHTML += this.createSlider('scaleZ', 'Depth', 0.2, 3, 0.1, this.config.scaleZ);
    }
    
    createSlider(id, label, min, max, step, value) {
        return `
            <div class="dev-control">
                <label for="${id}">${label} <span id="${id}-value">${value}</span></label>
                <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}">
            </div>
        `;
    }
    
    setupEventListeners() {
        this.toggleButton.addEventListener('click', () => {
            this.isPanelOpen = !this.isPanelOpen;
            this.panel.classList.toggle('open');
            this.toggleButton.textContent = this.isPanelOpen ? 'Hide' : 'Show';
        });

        this.copyButton.addEventListener('click', () => {
            const { seed, ...configToCopy } = this.config;
            const configString = `const rockConfig = ${JSON.stringify(configToCopy, null, 4)};`;
            
            navigator.clipboard.writeText(configString).then(() => {
                this.copyButton.textContent = 'Copied!';
                setTimeout(() => { this.copyButton.textContent = 'Copy Config'; }, 2000);
            });
        });

        this.panel.addEventListener('input', (e) => {
            const el = e.target;
            const valueSpan = document.getElementById(`${el.id}-value`);
            if (valueSpan) {
                valueSpan.textContent = el.value;
            }
            this.handleUpdate();
        });
    }

    handleUpdate() {
        // ✨ CHANGED: Reads values for the new shader configuration
        const newConfig = {
            detail: parseInt(document.getElementById('detail').value),
            displacement: parseFloat(document.getElementById('displacement').value),
            aoParam: new THREE.Vector2(
                parseFloat(document.getElementById('aoSpread').value),
                parseFloat(document.getElementById('aoStrength').value)
            ),
            cornerParam: new THREE.Vector2(
                parseFloat(document.getElementById('cornerHighlight').value),
                40.0 // Keep exponent constant for simplicity
            ),
            metalness: parseFloat(document.getElementById('metalness').value),
            scaleX: parseFloat(document.getElementById('scaleX').value),
            scaleY: parseFloat(document.getElementById('scaleY').value),
            scaleZ: parseFloat(document.getElementById('scaleZ').value),
            seed: this.config.seed,
            radius: this.config.radius, // Keep radius constant
        };
        this.config = newConfig;
        this.updateCallback(this.config);
    }
}
