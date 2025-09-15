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
        this.dom.bar = document.createElement('div');
        this.dom.bar.style.cssText = `
            position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%);
            display: flex; gap: 10px; padding: 10px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 16px; backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
            box-shadow: 0 4px 30px rgba(0, 0, 0, 0.1); z-index: 999;
        `;
        document.body.appendChild(this.dom.bar);

        const types = ['Grass', 'Dirt', 'Sand', 'Stone'];
        types.forEach(type => {
            const button = document.createElement('button');
            button.textContent = type;
            button.style.cssText = `
                background: rgba(255, 255, 255, 0.05); color: #f5f5f5;
                font-size: 14px; font-weight: bold; border: none;
                border-radius: 12px; padding: 10px 14px; cursor: pointer;
            `;
            button.addEventListener('click', () => this._toggleType(type.toLowerCase()));
            this.dom.buttons[type.toLowerCase()] = button;
            this.dom.bar.appendChild(button);
        });
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
