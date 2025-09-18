export default class Navbar {
    constructor(onRockSelect, onCopy, onClear, onNavigate) { // Added onNavigate
        this.onRockSelect = onRockSelect;
        this.onCopy = onCopy;
        this.onClear = onClear;
        this.onNavigate = onNavigate; // Store the navigation callback
        this.activeButton = null;
        this.rockTypes = ['iron', 'carbon', 'limestone', 'stone'];
        this.locations = ['Town', 'Mine', 'Oasis']; // New locations

        this._injectStyles();
        this._createDOM();
    }

    _injectStyles() { /* ... unchanged ... */ }

    _createDOM() {
        const container = document.createElement('div');
        container.id = 'editor-navbar';

        // --- Navigation Buttons ---
        this.locations.forEach(loc => {
            const btn = document.createElement('button');
            btn.className = 'nav-btn';
            btn.textContent = `Go to ${loc}`;
            btn.addEventListener('click', () => this.onNavigate(loc.toLowerCase()));
            container.appendChild(btn);
        });

        const separator = document.createElement('div');
        separator.style.borderLeft = '2px solid #555';
        separator.style.margin = '0 10px';
        container.appendChild(separator);
        
        // --- Rock Editor Buttons ---
        // ... (rock button creation logic remains the same) ...
        
        document.body.appendChild(container);
    }
}
