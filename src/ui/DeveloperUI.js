export default class DeveloperUI {
    constructor() {
        this.dom = { bar: null, buttons: {} };
        this.activeType = null;
        this.onBuildModeChange = null; // Callback
        this._createDOM();
    }

    getBuildMode() {
        return this.activeType;
    }

    _createDOM() {
        // ... (DOM creation code is identical to your original, no changes needed here) ...
        this.dom.bar = document.createElement('div');
        this.dom.bar.style.position = 'fixed';
        this.dom.bar.style.bottom = '20px';
        this.dom.bar.style.left = '50%';
        this.dom.bar.style.transform = 'translateX(-50%)';
        this.dom.bar.style.display = 'flex';
        this.dom.bar.style.gap = '10px';
        this.dom.bar.style.width = 'auto';
        this.dom.bar.style.padding = '10px';
        this.dom.bar.style.background = 'rgba(255, 255, 255, 0.1)';
        this.dom.bar.style.borderRadius = '16px';
        this.dom.bar.style.backdropFilter = 'blur(10px)';
        this.dom.bar.style.zIndex = '9999';
        document.body.appendChild(this.dom.bar);

        const types = ['Grass', 'Dirt', 'Sand', 'Stone'];
        types.forEach(type => {
            const button = document.createElement('button');
            button.textContent = type;
            // ... (Button styling is identical to your original) ...
            button.style.background = 'rgba(255, 255, 255, 0.05)';
            button.style.color = '#f5f5f5';
            button.style.fontSize = '14px';
            button.style.fontWeight = 'bold';
            button.style.border = 'none';
            button.style.borderRadius = '12px';
            button.style.padding = '10px 14px';
            button.style.cursor = 'pointer';
            
            button.addEventListener('click', () => this._toggleType(type.toLowerCase()));
            this.dom.buttons[type.toLowerCase()] = button;
            this.dom.bar.appendChild(button);
        });
    }

    _toggleType(type) {
        if (this.activeType === type) {
            this.activeType = null;
            this.dom.buttons[type].style.background = 'rgba(255, 255, 255, 0.05)';
        } else {
            if (this.activeType) {
                this.dom.buttons[this.activeType].style.background = 'rgba(255, 255, 255, 0.05)';
            }
            this.activeType = type;
            this.dom.buttons[type].style.background = 'rgba(255, 255, 255, 0.2)';
        }
        if (this.onBuildModeChange) {
            this.onBuildModeChange(this.activeType);
        }
    }
}
