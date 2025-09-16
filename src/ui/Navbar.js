import InventoryPanel from './InventoryPanel.js';
import SkillsPanel from './SkillsPanel.js';
import MissionsPanel from './MissionsPanel.js';
import WorldMapPanel from './WorldMapPanel.js';

export default class Navbar {
    constructor() {
        this.panels = {};
        this.buttons = {};
        this.activePanel = null;

        this._injectStyles();
        this._createDOM();
    }

    _createDOM() {
        const uiContainer = document.createElement('div');
        uiContainer.id = 'ui-container';

        const panelContent = document.createElement('div');
        panelContent.id = 'panel-content';

        const navbar = document.createElement('div');
        navbar.id = 'navbar';
        
        // Create and register panels and their corresponding buttons
        this._registerPanel('Inventory', new InventoryPanel(), panelContent, navbar);
        this._registerPanel('Skills', new SkillsPanel(), panelContent, navbar);
        this._registerPanel('Missions', new MissionsPanel(), panelContent, navbar);
        this._registerPanel('World Map', new WorldMapPanel(), panelContent, navbar);
        
        uiContainer.appendChild(panelContent);
        uiContainer.appendChild(navbar);
        document.body.appendChild(uiContainer);
        
        // Show the default panel
        this._handleTabClick('Inventory');
    }
    
    _registerPanel(name, panelInstance, contentContainer, navContainer) {
        this.panels[name] = panelInstance;
        contentContainer.appendChild(panelInstance.element);
        
        const button = document.createElement('button');
        button.textContent = name;
        button.addEventListener('click', () => this._handleTabClick(name));
        
        this.buttons[name] = button;
        navContainer.appendChild(button);
    }
    
    _handleTabClick(name) {
        if (this.activePanel) {
            this.panels[this.activePanel].hide();
            this.buttons[this.activePanel].classList.remove('active');
        }
        
        this.panels[name].show();
        this.buttons[name].classList.add('active');
        this.activePanel = name;
    }

    _injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            body {
                display: flex;
                flex-direction: column;
                height: 100vh;
            }
            #canvas-container {
                flex: 1; /* Takes up all available space */
                min-height: 0; /* Important for flexbox shrinking */
            }
            #ui-container {
                height: 45%; /* Panel takes up bottom 45% of the screen */
                background-color: #1a1a1a;
                color: white;
                display: flex;
                flex-direction: column;
                border-top: 1px solid #444;
            }
            #panel-content {
                flex: 1; /* Content area fills available space in the panel */
                padding: 15px;
                overflow-y: auto;
            }
            #navbar {
                display: flex;
                justify-content: space-around;
                background-color: #0d0d0d;
                padding: 5px 0;
                border-top: 1px solid #444;
            }
            #navbar button {
                background: none;
                border: none;
                color: #888;
                padding: 10px;
                font-size: 14px;
                font-weight: bold;
                flex: 1;
            }
            #navbar button.active {
                color: #fff;
            }
            .panel-content h2 {
                margin-top: 0;
            }
        `;
        document.head.appendChild(style);
    }
}
