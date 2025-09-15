// Developer UI for texture placement mode

const DeveloperUI = {
    dom: {
        bar: null,
        buttons: {},
    },
    activeType: null,
    movement: null, // Will be set in init

    init(movement) {
        this.movement = movement;
        this._createDOM();
    },

    _createDOM() {
        // Glassmorphic bar
        this.dom.bar = document.createElement('div');
        this.dom.bar.style.position = 'fixed';
        this.dom.bar.style.bottom = '20px';
        this.dom.bar.style.left = '50%';
        this.dom.bar.style.transform = 'translateX(-50%)';
        this.dom.bar.style.display = 'flex';
        this.dom.bar.style.justifyContent = 'space-around';
        this.dom.bar.style.width = '90%';
        this.dom.bar.style.maxWidth = '400px';
        this.dom.bar.style.padding = '10px';
        this.dom.bar.style.background = 'rgba(255, 255, 255, 0.1)';
        this.dom.bar.style.borderRadius = '16px';
        this.dom.bar.style.backdropFilter = 'blur(10px)';
        this.dom.bar.style.webkitBackdropFilter = 'blur(10px)';
        this.dom.bar.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        this.dom.bar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
        document.body.appendChild(this.dom.bar);

        // Button types and SVGs (monochrome so themeable)
        const types = ['grass', 'dirt', 'water', 'sand', 'stone'];
        const svgs = {
            grass: `
              <svg viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2" stroke-linecap="round">
                <path d="M4 20l2-6 2 6m2 0V10m2 10l2-6 2 6m2 0V8m2 12l2-6 2 6"/>
              </svg>`,
            dirt: `
              <svg viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2">
                <rect x="4" y="10" width="16" height="10" rx="2" />
                <circle cx="9" cy="15" r="1"/>
                <circle cx="13" cy="13" r="1"/>
                <circle cx="16" cy="16" r="1"/>
              </svg>`,
            water: `
              <svg viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2" stroke-linecap="round">
                <path d="M12 3C12 3 5 11 5 15a7 7 0 0014 0c0-4-7-12-7-12z"/>
              </svg>`,
            sand: `
              <svg viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2" stroke-linecap="round">
                <path d="M4 18h16M6 14h12M8 10h8M10 6h4"/>
              </svg>`,
            stone: `
              <svg viewBox="0 0 24 24" fill="none" stroke="#f5f5f5" stroke-width="2" stroke-linejoin="round">
                <polygon points="6 22 2 12 12 2 22 12 18 22"/>
              </svg>`,
        };

        types.forEach(type => {
            const button = document.createElement('button');
            button.innerHTML = svgs[type];
            button.style.background = 'rgba(255, 255, 255, 0.05)';
            button.style.border = 'none';
            button.style.borderRadius = '12px';
            button.style.padding = '10px';
            button.style.cursor = 'pointer';
            button.style.width = '50px';
            button.style.height = '50px';
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            button.style.backdropFilter = 'blur(5px)';
            button.style.webkitBackdropFilter = 'blur(5px)';
            button.addEventListener('click', () => this._toggleType(type));
            this.dom.buttons[type] = button;
            this.dom.bar.appendChild(button);
        });
    },

    _toggleType(type) {
        if (this.activeType === type) {
            this.activeType = null;
            this.dom.buttons[type].style.background = 'rgba(255, 255, 255, 0.05)';
            this.movement.setBuildMode(null);
        } else {
            if (this.activeType) {
                this.dom.buttons[this.activeType].style.background = 'rgba(255, 255, 255, 0.05)';
            }
            this.activeType = type;
            this.dom.buttons[type].style.background = 'rgba(255, 255, 255, 0.2)';
            this.movement.setBuildMode(type);
        }
    },
};

export default DeveloperUI;