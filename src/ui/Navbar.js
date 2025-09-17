// src/ui/Navbar.js

export default class Navbar {
    constructor() {
        this.panels = {};
        this.buttons = {};
        this.activePanelName = null;
        this.isPanelOpen = false;
        this.tabOrder = ['Inventory', 'Skills', 'Missions', 'World Map'];

        // These calls are now safe because the methods exist below
        this._createSVGFilter();
        this._injectStyles();
        this._createDOM();
    }
    
    // --- ADDED PLACEHOLDERS ---
    // You need to fill these with your actual code for building the UI
    _createSVGFilter() {
        console.log("Navbar: _createSVGFilter() called. (Placeholder)");
    }

    _injectStyles() {
        console.log("Navbar: _injectStyles() called. (Placeholder)");
    }

    _createDOM() {
        console.log("Navbar: _createDOM() called. (Placeholder)");
        // Example: This is where you would create button elements and call
        // this._registerPanel(name, panelInstance, buttonElement);
    }
    // --- END OF PLACEHOLDERS ---

    _registerPanel(name, panelInstance, buttonElement) {
        this.panels[name] = panelInstance;
        this.buttons[name] = buttonElement;
        buttonElement.addEventListener('click', () => {
             this.isPanelOpen = this._handleTabClick(name);
        });
    }

    _handleTabClick(name) {
        const currentlyActive = this.activePanelName;
        const isClosing = currentlyActive === name;
        if (currentlyActive) { 
            this.panels[currentlyActive].hide(); 
            this.buttons[currentlyActive].classList.remove('active'); 
        }
        if (!isClosing) {
            this.panels[name].show(); 
            this.buttons[name].classList.add('active'); 
            this.activePanelName = name;
            return true;
        } else {
            this.activePanelName = null;
            return false;
        }
    }

    closePanel() {
        if (this.isPanelOpen && this.activePanelName) {
            this.isPanelOpen = this._handleTabClick(this.activePanelName);
        }
    }

    cycleTab(direction) {
        if (!this.isPanelOpen && this.tabOrder.length > 0) {
            this.isPanelOpen = this._handleTabClick(this.tabOrder[0]);
            return;
        }
        
        const currentIndex = this.tabOrder.indexOf(this.activePanelName);
        let nextIndex = currentIndex + direction;

        if (nextIndex >= this.tabOrder.length) nextIndex = 0;
        if (nextIndex < 0) nextIndex = this.tabOrder.length - 1;

        this.isPanelOpen = this._handleTabClick(this.tabOrder[nextIndex]);
    }
}

