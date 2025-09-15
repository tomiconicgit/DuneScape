export default class DeveloperUI {
    constructor() {
        this.dom = { bar: null, buttons: {}, advancedPanel: null, skyPanel: null };
        this.activeType = null;
        this.onBuildModeChange = null;
        this.onSettingChange = null; // NEW: Callback for slider changes
        this._createDOM();
    }

    getBuildMode() {
        return this.activeType;
    }

    _createDOM() {
        // --- Main container for the whole UI ---
        const uiContainer = document.createElement('div');
        uiContainer.style.cssText = `
            position: fixed; bottom: 20px; left: 50%;
            transform: translateX(-50%); z-index: 999;
            display: flex; flex-direction: column; align-items: center;
        `;
        document.body.appendChild(uiContainer);

        // --- Texture Bar (your original bar) ---
        this.dom.bar = document.createElement('div');
        this.dom.bar.style.cssText = `
            position: relative; /* For positioning the toggle */
            display: flex; gap: 10px; padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 16px; backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        `;
        const types = ['Grass', 'Dirt', 'Sand', 'Stone'];
        types.forEach(type => {
            const button = this._createTextureButton(type);
            this.dom.buttons[type.toLowerCase()] = button;
            this.dom.bar.appendChild(button);
        });
        
        // --- Advanced Settings Toggle ---
        const advancedToggle = document.createElement('div');
        advancedToggle.innerHTML = '⚙️';
        advancedToggle.style.cssText = `
            position: absolute; top: -22px; left: 50%; transform: translateX(-50%);
            width: 40px; height: 20px; background: rgba(255, 255, 255, 0.1);
            border-top-left-radius: 8px; border-top-right-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2); border-bottom: none;
            cursor: pointer; text-align: center; line-height: 20px;
            font-size: 14px;
        `;
        this.dom.bar.appendChild(advancedToggle);

        // --- Advanced Panel (slides out) ---
        this.dom.advancedPanel = document.createElement('div');
        this.dom.advancedPanel.style.cssText = `
            background: rgba(30, 30, 30, 0.3); backdrop-filter: blur(10px);
            border-radius: 16px; padding: 10px; margin-bottom: 10px;
            width: 300px; box-sizing: border-box;
            max-height: 0; overflow: hidden;
            transition: max-height 0.3s ease-out, padding 0.3s ease-out;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        // --- Category Buttons inside Advanced Panel ---
        const skyButton = this._createCategoryButton('Sky');
        this.dom.advancedPanel.appendChild(skyButton);
        
        // --- Sky Controls Panel ---
        this.dom.skyPanel = this._createSkyPanel();
        this.dom.advancedPanel.appendChild(this.dom.skyPanel);

        // Append main elements to the container
        uiContainer.appendChild(this.dom.advancedPanel);
        uiContainer.appendChild(this.dom.bar);

        // --- Event Listeners ---
        advancedToggle.addEventListener('click', () => {
            const panel = this.dom.advancedPanel;
            if (panel.style.maxHeight === '0px' || panel.style.maxHeight === '') {
                panel.style.maxHeight = '500px'; // Set to a height larger than content
                panel.style.padding = '10px';
            } else {
                panel.style.maxHeight = '0px';
                panel.style.padding = '0 10px';
            }
        });
        
        skyButton.addEventListener('click', () => {
             const panel = this.dom.skyPanel;
             panel.style.display = panel.style.display === 'none' ? 'block' : 'none';
        });
    }

    _createTextureButton(type) {
        const button = document.createElement('button');
        button.textContent = type;
        button.style.cssText = `
            background: rgba(255, 255, 255, 0.05); color: #f5f5f5;
            font-size: 14px; font-weight: bold; border: none;
            border-radius: 12px; padding: 10px 14px; cursor: pointer;
        `;
        button.addEventListener('click', () => this._toggleType(type.toLowerCase()));
        return button;
    }
    
    _createCategoryButton(text) {
        const button = document.createElement('button');
        button.textContent = text;
        button.style.cssText = `
            width: 100%; background: rgba(255, 255, 255, 0.1); color: white;
            border: none; border-radius: 8px; padding: 8px; font-weight: bold;
            cursor: pointer; margin-bottom: 10px;
        `;
        return button;
    }
    
    _createSkyPanel() {
        const panel = document.createElement('div');
        panel.style.display = 'none'; // Initially hidden
        
        // Helper to create sliders
        const createSlider = (setting, label, min, max, step, value) => {
            const container = document.createElement('div');
            container.style.cssText = 'margin-bottom: 8px; color: white; font-size: 12px;';
            const labelEl = document.createElement('label');
            labelEl.textContent = label + ': ';
            const valueEl = document.createElement('span');
            valueEl.textContent = value;
            const input = document.createElement('input');
            input.type = 'range';
            input.min = min;
            input.max = max;
            input.step = step;
            input.value = value;
            input.style.width = '100%';
            
            input.addEventListener('input', () => {
                const newValue = parseFloat(input.value);
                valueEl.textContent = newValue;
                if (this.onSettingChange) {
                    this.onSettingChange({ setting, value: newValue });
                }
            });
            
            container.appendChild(labelEl);
            container.appendChild(valueEl);
            container.appendChild(input);
            return container;
        };

        // Add sliders for Atmosphere and Clouds
        panel.appendChild(createSlider('exposure', 'Brightness', 0.1, 3.0, 0.1, 1.0));
        panel.appendChild(createSlider('rayleigh', 'Atmosphere Density', 0.1, 5.0, 0.1, 2.5));
        panel.appendChild(createSlider('mie', 'Haze / Pollen', 0.0001, 0.005, 0.0001, 0.001));
        panel.appendChild(createSlider('horizonOffset', 'Horizon Level', -0.1, 0.1, 0.005, 0.0));
        panel.appendChild(createSlider('cloudCover', 'Cloud Amount', 0.0, 1.0, 0.01, 0.55));
        panel.appendChild(createSlider('cloudSharpness', 'Cloud Sharpness', 5.0, 75.0, 1.0, 30.0));
        
        return panel;
    }

    _toggleType(type) {
        const isDeactivating = this.activeType === type;
        if (this.activeType) {
            this.dom.buttons[this.activeType].style.background = 'rgba(255, 255, 255, 0.05)';
        }
        this.activeType = isDeactivating ? null : type;
        if (this.activeType) {
            this.dom.buttons[this.activeType].style.background = 'rgba(255, 255, 255, 0.2)';
        }
        if (this.onBuildModeChange) {
            this.onBuildModeChange(this.activeType);
        }
    }
}
