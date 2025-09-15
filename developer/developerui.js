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

        // Button types and improved SVGs with colors
        const types = ['grass', 'dirt', 'water', 'sand', 'stone'];
        const svgs = {
            grass: '<svg viewBox="0 0 24 24" fill="#228b22"><path d="M12 3c0 0 3 4 3 6s-3 4-3 4-3-2-3-4S12 3 12 3zM12 21c0 0 3-4 3-6s-3-4-3-4-3 2-3 4S12 21 12 21zM3 12c0 0 4-3 6-3s4 3 4 3-2 3-4 3S3 12 3 12zM21 12c0 0-4 3-6 3s-4-3-4-3 2-3 4-3S21 12 21 12z"/></svg>',
            dirt: '<svg viewBox="0 0 24 24" fill="#d2b48c"><path d="M4 12h16v4H4zM4 8h16v4H4zM4 16h16v4H4z"/></svg>',
            water: '<svg viewBox="0 0 24 24" fill="#0000ff"><path d="M21 15c-2 0-2.4-1-4-1s-2 1-4 1s-2-1-4-1s-2 1-4 1s-1.6-1-3-1V9c1.4 0 1.6 1 3 1s2-1 4-1s2 1 4 1s2-1 4-1s2.4 1 4 1z"/></svg>',
            sand: '<svg viewBox="0 0 24 24" fill="#f5f5dc"><path d="M3 15h18v2H3zm0 4h18v2H3zm0-8h18v2H3z"/></svg>',
            stone: '<svg viewBox="0 0 24 24" fill="#ffffff"><path d="M12 2l-8 7v6l8 7 8-7V9z"/></svg>',
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
```- **Update Applied**: Icons not showing likely due to SVG size; added width="24" height="24" to each SVG tag in /developer/developerui.js. No other changes.

- **File Path: /developer/developerui.js** (updated)

```javascript
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

        // Button types and SVGs (specific colors, added width/height)
        const types = ['grass', 'dirt', 'water', 'sand', 'stone'];
        const svgs = {
            grass: '<svg viewBox="0 0 24 24" width="24" height="24" fill="#228b22"><path d="M12 3c0 0 3 4 3 6s-3 4-3 4-3-2-3-4S12 3 12 3zM12 21c0 0 3-4 3-6s-3-4-3-4-3 2-3 4S12 21 12 21zM3 12c0 0 4-3 6-3s4 3 4 3-2 3-4 3S3 12 3 12zM21 12c0 0-4 3-6 3s-4-3-4-3 2-3 4-3S21 12 21 12z"/></svg>',
            dirt: '<svg viewBox="0 0 24 24" width="24" height="24" fill="#d2b48c"><path d="M4 12h16v4H4zM4 8h16v4H4zM4 16h16v4H4z"/></svg>',
            water: '<svg viewBox="0 0 24 24" width="24" height="24" fill="#0000ff"><path d="M21 15c-2 0-2.4-1-4-1s-2 1-4 1s-2-1-4-1s-2 1-4 1s-1.6-1-3-1V9c1.4 0 1.6 1 3 1s2-1 4-1s2 1 4 1s2-1 4-1s2.4 1 4 1z"/></svg>',
            sand: '<svg viewBox="0 0 24 24" width="24" height="24" fill="#f5f5dc"><path d="M3 15h18v2H3zm0 4h18v2H3zm0-8h18v2H3z"/></svg>',
            stone: '<svg viewBox="0 0 24 24" width="24" height="24" fill="#ffffff"><path d="M12 2l-8 7v6l8 7 8-7V9z"/></svg>',
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
                this.dom.buttons[this.activeType].style.background = 'rgba(255, 255, 0.05)';
            }
            this.activeType = type;
            this.dom.buttons[type].style.background = 'rgba(255, 255, 255, 0.2)';
            this.movement.setBuildMode(type);
        }
    },
};

export default DeveloperUI;