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
        // ... (styles remain the same)
    }

    initDOM() {
        // ... (DOM structure remains the same)
    }
    
    // ✨ CHANGED: Controls are now mapped to the new "Wet stone" shader parameters
    addControls() {
        this.panel.innerHTML = ''; // Clear old controls
        // Geometry
        this.panel.innerHTML += this.createSlider('detail', 'Mesh Detail', 4, 9, 1, this.config.detail);
        this.panel.innerHTML += this.createSlider('displacement', 'Displacement', 0.0, 1.0, 0.05, this.config.displacement);
        
        // Shading
        this.panel.innerHTML += this.createSlider('aoStrength', 'AO Strength', 0.0, 10.0, 0.1, this.config.aoParam.y);
        this.panel.innerHTML += this.createSlider('aoSpread', 'AO Spread', 0.1, 2.0, 0.1, this.config.aoParam.x);
        this.panel.innerHTML += this.createSlider('cornerHighlight', 'Corner Highlight', 0.0, 1.0, 0.05, this.config.cornerParam.x);
        this.panel.innerHTML += this.createSlider('lightIntensity', 'Light Intensity', 0.0, 1.0, 0.05, this.config.lightIntensity);
        this.panel.innerHTML += this.createSlider('metalness', 'Metalness', 0, 1, 0.05, this.config.metalness);

        // Transform
        this.panel.innerHTML += this.createSlider('scaleX', 'Width', 0.2, 3, 0.1, this.config.scaleX);
        this.panel.innerHTML += this.createSlider('scaleY', 'Height', 0.2, 3, 0.1, this.config.scaleY);
        this.panel.innerHTML += this.createSlider('scaleZ', 'Depth', 0.2, 3, 0.1, this.config.scaleZ);
    }
    
    createSlider(id, label, min, max, step, value) {
        // ... (helper function remains the same)
    }
    
    // ... (other helper functions remain the same)

    setupEventListeners() {
        // ... (event listeners remain the same, but will now act on the new controls)
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
            lightIntensity: parseFloat(document.getElementById('lightIntensity').value),
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
