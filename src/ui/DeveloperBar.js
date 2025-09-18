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
        // ... (styles remain the same, but a new rule is added for headers)
        const style = document.createElement('style');
        style.textContent = `
            /* ... (all previous styles) ... */
            .dev-panel-header {
                grid-column: 1 / -1; /* Span all columns */
                font-weight: bold;
                color: #aaa;
                margin-top: 10px;
                margin-bottom: -5px;
                border-bottom: 1px solid #444;
                padding-bottom: 5px;
            }
            .dev-panel-header:first-child {
                margin-top: 0;
            }
        `;
        document.head.appendChild(style);
    }

    initDOM() {
        // ... (DOM structure is the same, styles are now in initStyles)
    }
    
    addControls() {
        this.panel.innerHTML = '';
        
        // Geometry
        this.panel.innerHTML += `<div class="dev-panel-header">Geometry</div>`;
        this.panel.innerHTML += this.createSlider('detail', 'Mesh Detail', 4, 9, 1, this.config.detail);
        this.panel.innerHTML += this.createSlider('displacement', 'Displacement', 0.0, 1.0, 0.05, this.config.displacement);
        
        // ✨ ADDED: New color pickers for rock color hints
        this.panel.innerHTML += `<div class="dev-panel-header">Color Scheme</div>`;
        this.panel.innerHTML += this.createColorPicker('colorDark', 'Dark Tones (Crevices)', this.config.colorDark);
        this.panel.innerHTML += this.createColorPicker('colorBase', 'Base Color', this.config.colorBase);
        this.panel.innerHTML += this.createColorPicker('colorHighlight', 'Highlight Tones', this.config.colorHighlight);

        // Shading
        this.panel.innerHTML += `<div class="dev-panel-header">Shading & Material</div>`;
        this.panel.innerHTML += this.createSlider('aoStrength', 'AO Strength', 0.0, 5.0, 0.1, this.config.aoParam.y);
        this.panel.innerHTML += this.createSlider('aoSpread', 'AO Spread', 0.1, 2.0, 0.1, this.config.aoParam.x);
        this.panel.innerHTML += this.createSlider('cornerHighlight', 'Corner Highlight', 0.0, 1.0, 0.05, this.config.cornerParam.x);
        this.panel.innerHTML += this.createSlider('metalness', 'Metalness', 0, 1, 0.05, this.config.metalness);

        // Transform
        this.panel.innerHTML += `<div class="dev-panel-header">Transform</div>`;
        this.panel.innerHTML += this.createSlider('scaleX', 'Width', 0.2, 3, 0.1, this.config.scaleX);
        this.panel.innerHTML += this.createSlider('scaleY', 'Height', 0.2, 3, 0.1, this.config.scaleY);
        this.panel.innerHTML += this.createSlider('scaleZ', 'Depth', 0.2, 3, 0.1, this.config.scaleZ);
    }
    
    createSlider(id, label, min, max, step, value) {
        // ...
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
    
    setupEventListeners() {
        // ...
    }

    handleUpdate() {
        const newConfig = {
            detail: parseInt(document.getElementById('detail').value),
            displacement: parseFloat(document.getElementById('displacement').value),
            aoParam: new THREE.Vector2(
                parseFloat(document.getElementById('aoSpread').value),
                parseFloat(document.getElementById('aoStrength').value)
            ),
            cornerParam: new THREE.Vector2(
                parseFloat(document.getElementById('cornerHighlight').value),
                40.0
            ),
            metalness: parseFloat(document.getElementById('metalness').value),
            scaleX: parseFloat(document.getElementById('scaleX').value),
            scaleY: parseFloat(document.getElementById('scaleY').value),
            scaleZ: parseFloat(document.getElementById('scaleZ').value),
            seed: this.config.seed,
            radius: this.config.radius,
            // ✨ ADDED: Read new color values from the UI
            colorDark: parseInt(document.getElementById('colorDark').value.substring(1), 16),
            colorBase: parseInt(document.getElementById('colorBase').value.substring(1), 16),
            colorHighlight: parseInt(document.getElementById('colorHighlight').value.substring(1), 16),
        };
        this.config = newConfig;
        this.updateCallback(this.config);
    }
}
