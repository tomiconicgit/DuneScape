export default class DeveloperUI {
    constructor() {
        this.dom = { bar: null, panel: null, timeDisplay: null, pauseButton: null };
        this.onSettingChange = null;
        this.onPauseToggle = null;
        this._createDOM();
    }

    // A new method for the Game class to update the time display
    updateTime(timeString) {
        if (this.dom.timeDisplay) {
            this.dom.timeDisplay.textContent = timeString;
        }
    }

    _createDOM() {
        const uiContainer = document.createElement('div');
        uiContainer.style.cssText = `
            position: fixed; bottom: 20px; left: 50%;
            transform: translateX(-50%); z-index: 999;
            display: flex; flex-direction: column; align-items: center; font-family: sans-serif;
        `;
        document.body.appendChild(uiContainer);

        // Main panel (hidden by default)
        this.dom.panel = document.createElement('div');
        this.dom.panel.style.cssText = `
            background: rgba(25, 25, 30, 0.8); backdrop-filter: blur(10px);
            border-radius: 16px; padding: 15px; margin-bottom: 10px;
            width: 320px; box-sizing: border-box; max-height: 0;
            overflow: hidden; transition: all 0.3s ease-out;
            border: 1px solid rgba(255, 255, 255, 0.2); color: white;
        `;

        // --- Time Controls ---
        const timeGroup = this._createGroup('Time Controls');
        this.dom.timeDisplay = document.createElement('span');
        this.dom.timeDisplay.textContent = '00:00';
        this.dom.timeDisplay.style.fontWeight = 'bold';
        this.dom.pauseButton = document.createElement('button');
        this.dom.pauseButton.textContent = 'Pause';
        this.dom.pauseButton.style.marginLeft = '10px';
        this.dom.pauseButton.addEventListener('click', () => {
            const isPaused = this.dom.pauseButton.textContent === 'Play';
            this.dom.pauseButton.textContent = isPaused ? 'Pause' : 'Play';
            if (this.onPauseToggle) this.onPauseToggle();
        });
        timeGroup.appendChild(this.dom.timeDisplay);
        timeGroup.appendChild(this.dom.pauseButton);
        this.dom.panel.appendChild(timeGroup);
        
        // --- Sky Settings ---
        const skyGroup = this._createGroup('Sky Parameters');
        skyGroup.appendChild(this._createSlider('turbidity', 'Turbidity (Haze)', 0.0, 20.0, 0.1, 10));
        skyGroup.appendChild(this._createSlider('rayleigh', 'Rayleigh (Sky Color)', 0.0, 4, 0.001, 3));
        skyGroup.appendChild(this._createSlider('mieCoefficient', 'Mie Coefficient (Sun Haze)', 0.0, 0.1, 0.001, 0.005));
        skyGroup.appendChild(this._createSlider('mieDirectionalG', 'Mie Direction (Sun Glow)', 0.0, 1, 0.001, 0.7));
        this.dom.panel.appendChild(skyGroup);

        // --- Lighting & Renderer Settings ---
        const lightGroup = this._createGroup('Lighting');
        lightGroup.appendChild(this._createSlider('sunIntensity', 'Sun Intensity', 0, 5, 0.1, 3.0));
        lightGroup.appendChild(this._createSlider('hemiIntensity', 'Ambient Intensity', 0, 5, 0.1, 2.0));
        lightGroup.appendChild(this._createSlider('exposure', 'Exposure (Brightness)', 0, 1.5, 0.01, 0.8));
        this.dom.panel.appendChild(lightGroup);

        // --- Bottom Bar ---
        this.dom.bar = document.createElement('div');
        this.dom.bar.style.cssText = `
            display: flex; gap: 10px; padding: 10px; height: 40px;
            background: rgba(255, 255, 255, 0.1); border-radius: 16px;
            backdrop-filter: blur(10px); border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        `;
        const skyButton = document.createElement('button');
        skyButton.textContent = 'Sky Settings';
        skyButton.style.cssText = 'background: none; border: none; color: white; font-weight: bold; cursor: pointer;';
        skyButton.addEventListener('click', () => {
            if (this.dom.panel.style.maxHeight === '0px' || this.dom.panel.style.maxHeight === '') {
                this.dom.panel.style.maxHeight = '500px';
                this.dom.panel.style.padding = '15px';
            } else {
                this.dom.panel.style.maxHeight = '0px';
                this.dom.panel.style.padding = '0 15px';
            }
        });
        this.dom.bar.appendChild(skyButton);
        
        uiContainer.appendChild(this.dom.panel);
        uiContainer.appendChild(this.dom.bar);
    }
    
    _createGroup(title) {
        const group = document.createElement('div');
        group.style.marginBottom = '15px';
        const p = document.createElement('p');
        p.textContent = title;
        p.style.margin = '0 0 8px 0';
        p.style.fontWeight = 'bold';
        p.style.borderBottom = '1px solid rgba(255,255,255,0.2)';
        p.style.paddingBottom = '5px';
        group.appendChild(p);
        return group;
    }

    _createSlider(setting, label, min, max, step, value) {
        const container = document.createElement('div');
        container.style.cssText = 'margin-bottom: 8px; font-size: 13px; display: flex; justify-content: space-between; align-items: center;';
        const labelEl = document.createElement('label');
        labelEl.textContent = label;
        const valueEl = document.createElement('span');
        valueEl.textContent = value;
        const input = document.createElement('input');
        input.type = 'range';
        input.min = min;
        input.max = max;
        input.step = step;
        input.value = value;
        input.style.width = '120px';
        
        input.addEventListener('input', () => {
            const newValue = parseFloat(input.value);
            valueEl.textContent = newValue.toFixed(4);
            if (this.onSettingChange) {
                this.onSettingChange({ setting, value: newValue });
            }
        });
        
        container.appendChild(labelEl);
        container.appendChild(valueEl);
        container.appendChild(input);
        return container;
    }
}
