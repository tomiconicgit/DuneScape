export default class DeveloperUI {
    constructor() {
        this.dom = { bar: null, advancedPanel: null };
        this.onSettingChange = null;
        this._createDOM();
    }

    _createDOM() {
        const uiContainer = document.createElement('div');
        uiContainer.style.cssText = `
            position: fixed; bottom: 20px; left: 50%;
            transform: translateX(-50%); z-index: 999;
            display: flex; flex-direction: column; align-items: center;
        `;
        document.body.appendChild(uiContainer);

        this.dom.bar = document.createElement('div');
        this.dom.bar.style.cssText = `
            position: relative;
            display: flex; gap: 10px; padding: 10px; height: 40px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 16px; backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1);
        `;
        
        const advancedToggle = document.createElement('div');
        advancedToggle.innerHTML = '⚙️';
        advancedToggle.style.cssText = `
            position: absolute; top: -22px; left: 50%; transform: translateX(-50%);
            width: 40px; height: 20px; background: rgba(255, 255, 255, 0.1);
            border-top-left-radius: 8px; border-top-right-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.2); border-bottom: none;
            cursor: pointer; text-align: center; line-height: 20px; font-size: 14px;
        `;
        this.dom.bar.appendChild(advancedToggle);

        this.dom.advancedPanel = document.createElement('div');
        this.dom.advancedPanel.style.cssText = `
            background: rgba(30, 30, 30, 0.3); backdrop-filter: blur(10px);
            border-radius: 16px; padding: 10px; margin-bottom: 10px;
            width: 300px; box-sizing: border-box;
            max-height: 0; overflow: hidden;
            transition: max-height 0.3s ease-out, padding 0.3s ease-out;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        // Add the one remaining useful slider
        this.dom.advancedPanel.appendChild(
            this._createSlider('exposure', 'Brightness', 0.1, 3.0, 0.1, 1.5)
        );

        uiContainer.appendChild(this.dom.advancedPanel);
        uiContainer.appendChild(this.dom.bar);

        advancedToggle.addEventListener('click', () => {
            const panel = this.dom.advancedPanel;
            if (panel.style.maxHeight === '0px' || panel.style.maxHeight === '') {
                panel.style.maxHeight = '500px';
                panel.style.padding = '10px';
            } else {
                panel.style.maxHeight = '0px';
                panel.style.padding = '0 10px';
            }
        });
    }
    
    _createSlider(setting, label, min, max, step, value) {
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
    }
}
