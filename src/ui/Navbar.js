export default class Navbar {
    constructor(onRockSelect, onCopy, onClear, onNavigate) {
        this.onRockSelect = onRockSelect;
        this.onCopy = onCopy;
        this.onClear = onClear;
        this.onNavigate = onNavigate;
        this.activeButton = null;
        this.locations = ['Town', 'Mine', 'Oasis'];
        this.rockTypes = ['iron', 'carbon', 'limestone', 'stone'];

        this._injectStyles();
        this._createDOM();
    }

    _injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #game-navbar {
                position: fixed; top: 0; left: 0; width: 100%;
                background: rgba(0,0,0,0.4); padding: 8px; box-sizing: border-box;
                display: flex; flex-wrap: wrap; justify-content: center; gap: 10px; z-index: 100;
            }
            .nav-btn {
                font-family: sans-serif; background: #f0f0f0; border: 1px solid #888;
                padding: 8px 15px; cursor: pointer; border-radius: 6px; font-weight: bold; color: #333;
            }
            .nav-btn:hover { background: #fff; border-color: #000; }
            .nav-btn.rock-btn.active { background: #a8d8ff; border-color: #007bff; }
            .nav-separator { border-left: 2px solid #555; margin: 0 5px; }
            #copy-btn { background: #9effa0; }
            #clear-btn { background: #ff9e9e; }
        `;
        document.head.appendChild(style);
    }

    _createDOM() {
        const container = document.createElement('div');
        container.id = 'game-navbar';

        this.locations.forEach(loc => {
            const btn = document.createElement('button');
            btn.className = 'nav-btn';
            btn.textContent = `Go to ${loc}`;
            btn.addEventListener('click', () => this.onNavigate(loc.toLowerCase()));
            container.appendChild(btn);
        });

        container.appendChild(document.createElement('div')).className = 'nav-separator';
        
        this.rockTypes.forEach(type => {
            const btn = document.createElement('button');
            btn.className = 'nav-btn rock-btn';
            btn.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            btn.addEventListener('click', () => {
                if (this.activeButton === btn) {
                    this.activeButton.classList.remove('active');
                    this.activeButton = null;
                    this.onRockSelect(null);
                } else {
                    if (this.activeButton) this.activeButton.classList.remove('active');
                    this.activeButton = btn;
                    this.activeButton.classList.add('active');
                    this.onRockSelect(type);
                }
            });
            container.appendChild(btn);
        });

        const copyBtn = document.createElement('button');
        copyBtn.id = 'copy-btn'; copyBtn.className = 'nav-btn';
        copyBtn.textContent = 'Copy Data';
        copyBtn.addEventListener('click', this.onCopy);
        
        const clearBtn = document.createElement('button');
        clearBtn.id = 'clear-btn'; clearBtn.className = 'nav-btn';
        clearBtn.textContent = 'Clear Rocks';
        clearBtn.addEventListener('click', this.onClear);

        container.appendChild(copyBtn);
        container.appendChild(clearBtn);
        document.body.appendChild(container);
    }
}
