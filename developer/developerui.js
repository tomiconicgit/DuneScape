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
        this.dom.bar.style.webkitBackdropFilter = 'blur(10px)'; // Added for Safari
        this.dom.bar.style.border = '1px solid rgba(255, 255, 255, 0.2)';
        this.dom.bar.style.boxShadow = '0 4px 30px rgba(0, 0, 0, 0.1)';
        document.body.appendChild(this.dom.bar);

        // Button types and SVGs (specific colors)
        const types = ['grass', 'dirt', 'water', 'sand', 'stone'];
        const svgs = {
            grass: '<svg viewBox="0 0 24 24" fill="#228b22"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1-13h2v6h-2zm0 8h2v2h-2z"/></svg>', // Green
            dirt: '<svg viewBox="0 0 24 24" fill="#d2b48c"><path d="M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm0 14c-3.31 0-6-2.69-6-6s2.69-6 6-6 6 2.69 6 6-2.69 6-6 6z"/></svg>', // Light brown
            water: '<svg viewBox="0 0 24 24" fill="#0000ff"><path d="M3 9h18v2H3zm0 4h18v2H3zm0 4h18v2H3z"/></svg>', // Blue
            sand: '<svg viewBox="0 0 24 24" fill="#f5f5dc"><path d="M4 12l4 4 4-4 4 4 4-4"/></svg>', // Beige
            stone: '<svg viewBox="0 0 24 24" fill="#ffffff"><path d="M12 2L4 9v6l8 7 8-7V9z"/></svg>', // White
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
            button.style.webkitBackdropFilter = 'blur(5px)'; // Added for Safari
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