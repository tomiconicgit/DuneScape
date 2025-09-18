// File: src/ui/DeveloperBar.js

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
            .dev-control input[type="checkbox"] {
                 margin-left: 10px;
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

        this.toggleButton = document.createElement('button');
        this.toggleButton.id = 'toggle-panel-btn';
        this.toggleButton.textContent = 'Show';

        this.panel = document.createElement('div');
        this.panel.className = 'dev-panel';

        this.header.appendChild(this.toggleButton);
        this.container.appendChild(this.header);
        this.container.appendChild(this.panel);
        document.body.appendChild(this.container);

        this.addControls();
    }
    
    addControls() {
        // Geometry
        this.panel.innerHTML += this.createSlider('radius', 'Size', 0.1, 5, 0.1, this.config.radius);
        this.panel.innerHTML += this.createSlider('detail', 'Edges (Detail)', 0, 7, 1, this.config.detail);
        this.panel.innerHTML += this.createSlider('roughness', 'Shape Roughness', 0, 1.5, 0.05, this.config.roughness);
        this.panel.innerHTML += this.createSlider('noiseScale', 'Noise Scale', 0.1, 2, 0.05, this.config.noiseScale);
        
        // Material
        this.panel.innerHTML += this.createColorPicker('color', 'Color', this.config.color);
        this.panel.innerHTML += this.createSlider('materialRoughness', 'Material Roughness', 0, 1, 0.05, this.config.materialRoughness);
        this.panel.innerHTML += this.createSlider('metalness', 'Metalness', 0, 1, 0.05, this.config.metalness);
        this.panel.innerHTML += this.createCheckbox('flatShading', 'Flat Shading', this.config.flatShading);

        // Transform
        this.panel.innerHTML += this.createSlider('scaleX', 'Width', 0.2, 3, 0.1, this.config.scaleX);
        this.panel.innerHTML += this.createSlider('scaleY', 'Height', 0.2, 3, 0.1, this.config.scaleY);
        this.panel.innerHTML += this.createSlider('scaleZ', 'Depth', 0.2, 3, 0.1, this.config.scaleZ);

        // Seed
        this.panel.innerHTML += this.createButton('randomizeSeed', 'Randomize Shape');
    }
    
    // Helper methods for creating controls
    createSlider(id, label, min, max, step, value) {
        return `
            <div class="dev-control">
                <label for="${id}">${label} <span id="${id}-value">${value}</span></label>
                <input type="range" id="${id}" min="${min}" max="${max}" step="${step}" value="${value}">
            </div>
        `;
    }
    createColorPicker(id, label, value) {
        const hexValue = `#${value.toString(16).padStart(6, '0')}`;
        return `
            <div class="dev-control">
                <label for="${id}">${label}</label>
                <input type="color" id="${id}" value="${hexValue}">
            </div>
        `;
    }
    createCheckbox(id, label, checked) {
        return `
            <div class="dev-control" style="flex-direction: row; align-items: center;">
                <label for="${id}" style="margin: 0;">${label}</label>
                <input type="checkbox" id="${id}" ${checked ? 'checked' : ''}>
            </div>
        `;
    }
    createButton(id, label) {
        return `<div class="dev-control"><button id="${id}" style="width: 100%; padding: 8px;">${label}</button></div>`;
    }

    setupEventListeners() {
        this.toggleButton.addEventListener('click', () => {
            this.isPanelOpen = !this.isPanelOpen;
            this.panel.classList.toggle('open');
            this.toggleButton.textContent = this.isPanelOpen ? 'Hide' : 'Show';
        });

        this.panel.addEventListener('input', (e) => {
            const el = e.target;
            const valueSpan = document.getElementById(`${el.id}-value`);
            if (valueSpan) {
                valueSpan.textContent = el.value;
            }
            this.handleUpdate();
        });
        
        this.panel.addEventListener('click', (e) => {
            if (e.target.id === 'randomizeSeed') {
                this.config.seed = Math.random();
                this.handleUpdate();
            }
        });
    }

    handleUpdate() {
        // Read all values from the DOM
        const newConfig = {
            // Geometry
            radius: parseFloat(document.getElementById('radius').value),
            detail: parseInt(document.getElementById('detail').value),
            roughness: parseFloat(document.getElementById('roughness').value),
            noiseScale: parseFloat(document.getElementById('noiseScale').value),
            seed: this.config.seed, // Keep the seed unless randomized
            // Material
            color: parseInt(document.getElementById('color').value.substring(1), 16),
            materialRoughness: parseFloat(document.getElementById('materialRoughness').value),
            metalness: parseFloat(document.getElementById('metalness').value),
            flatShading: document.getElementById('flatShading').checked,
            // Transform
            scaleX: parseFloat(document.getElementById('scaleX').value),
            scaleY: parseFloat(document.getElementById('scaleY').value),
            scaleZ: parseFloat(document.getElementById('scaleZ').value),
        };
        this.config = newConfig;
        this.updateCallback(this.config);
    }
}
