// ... (imports are the same)

export default class Navbar {
    constructor() {
        this.panels = {};
        this.buttons = {};
        this.activePanelName = null;
        this.isPanelOpen = false;
        // NEW: Store tab names in order for cycling
        this.tabOrder = ['Inventory', 'Skills', 'Missions', 'World Map'];

        this._createSVGFilter();
        this._injectStyles();
        this._createDOM();
    }
    
    // ... (_createSVGFilter, _createDOM, _registerPanel methods are unchanged)

    // MODIFIED: _handleTabClick now returns a boolean indicating if the panel is open
    _handleTabClick(name) {
        const currentlyActive = this.activePanelName;
        const isClosing = currentlyActive === name;
        if (currentlyActive) { this.panels[currentlyActive].hide(); this.buttons[currentlyActive].classList.remove('active'); }
        if (!isClosing) {
            this.panels[name].show(); this.buttons[name].classList.add('active'); this.activePanelName = name;
            this.dom.panelContent.classList.add('visible');
            return true; // Panel is now open
        } else {
            this.activePanelName = null;
            this.dom.panelContent.classList.remove('visible');
            return false; // Panel is now closed
        }
    }

    // --- NEW: Public methods for gamepad control ---
    closePanel() {
        if (this.isPanelOpen && this.activePanelName) {
            this.isPanelOpen = this._handleTabClick(this.activePanelName);
        }
    }

    cycleTab(direction) { // +1 for right, -1 for left
        const currentIndex = this.tabOrder.indexOf(this.activePanelName);
        let nextIndex = currentIndex + direction;
        
        if (nextIndex >= this.tabOrder.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = this.tabOrder.length - 1;
        
        this.isPanelOpen = this._handleTabClick(this.tabOrder[nextIndex]);
    }
    
    // ... (_injectStyles is unchanged)
}
