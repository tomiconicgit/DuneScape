export default class Navbar {
    constructor(onRockSelect, onCopy, onClear) {
        this.onRockSelect = onRockSelect;
        this.onCopy = onCopy;
        this.onClear = onClear; // New callback for clearing
        this.activeButton = null;
        this.rockTypes = ['iron', 'carbon', 'limestone', 'stone'];

        this._injectStyles();
        this._createDOM();
    }

    _injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #editor-navbar { position: fixed; top: 0; left: 0; width: 100%; background: rgba(0,0,0,0.5); padding: 5px; display: flex; gap: 5px; z-index: 100; justify-content: center; }
            .nav-btn { background: #fff; border: 1px solid #333; padding: 5px 10px; cursor: pointer; border-radius: 4px; }
            .nav-btn.active { background: #a8d8ff; border-color: #007bff; }
            #copy-btn { background: #9effa0; margin-left: auto; }
            #clear-btn { background: #ff9e9e; }
        `;
        document.head.appendChild(style);
    }

    _createDOM() {
        const container = document.createElement('div');
        container.id = 'editor-navbar';

        this.rockTypes.forEach(type => {
            const btn = document.createElement('button');
            btn.className = 'nav-btn';
            btn.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            btn.dataset.type = type;

            btn.addEventListener('click', () => {
                if (this.activeButton === btn) {
                    // Deselect
                    this.activeButton.classList.remove('active');
                    this.activeButton = null;
                    this.onRockSelect(null);
                } else {
                    // Select
                    if (this.activeButton) this.activeButton.classList.remove('active');
                    this.activeButton = btn;
                    this.activeButton.classList.add('active');
                    this.onRockSelect(type);
                }
            });
            container.appendChild(btn);
        });
        
        const copyBtn = document.createElement('button');
        copyBtn.id = 'copy-btn';
        copyBtn.className = 'nav-btn';
        copyBtn.textContent = 'Copy Data';
        copyBtn.addEventListener('click', this.onCopy);
        
        const clearBtn = document.createElement('button');
        clearBtn.id = 'clear-btn';
        clearBtn.className = 'nav-btn';
        clearBtn.textContent = 'Clear Rocks';
        clearBtn.addEventListener('click', this.onClear);

        container.appendChild(copyBtn);
        container.appendChild(clearBtn);
        document.body.appendChild(container);
    }
}
