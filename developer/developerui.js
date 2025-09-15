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
        this.dom.bar.style.zIndex = '9999';
        document.body.appendChild(this.dom.bar);

        // Button types (words instead of icons)
        const types = ['Grass', 'Dirt', 'Water', 'Sand', 'Stone'];

        types.forEach(type => {
            const button = document.createElement('button');
            button.textContent = type;
            button.style.background = 'rgba(255, 255, 255, 0.05)';
            button.style.color = '#f5f5f5';
            button.style.fontSize = '14px';
            button.style.fontWeight = 'bold';
            button.style.border = 'none';
            button.style.borderRadius = '12px';
            button.style.padding = '10px 14px';
            button.style.cursor = 'pointer';
            button.style.minWidth = '70px';
            button.style.height = '40px';
            button.style.display = 'flex';
            button.style.alignItems = 'center';
            button.style.justifyContent = 'center';
            button.style.backdropFilter = 'blur(5px)';
            button.style.webkitBackdropFilter = 'blur(5px)';
            button.style.zIndex = '10000';

            button.addEventListener('click', () => this._toggleType(type.toLowerCase()));

            this.dom.buttons[type.toLowerCase()] = button;
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