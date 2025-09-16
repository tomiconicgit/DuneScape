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

        const navbar = document.createElement('div');
        navbar.id = 'navbar';
        
        const panelContent = document.createElement('div');
        panelContent.id = 'panel-content';

        this._registerPanel('Inventory', new InventoryPanel(), panelContent, navbar);
        this._registerPanel('Skills', new SkillsPanel(), panelContent, navbar);
        this._registerPanel('Missions', new MissionsPanel(), panelContent, navbar);
        this._registerPanel('World Map', new WorldMapPanel(), panelContent, navbar);
        
        // MODIFIED: Changed the order of elements
        uiContainer.appendChild(navbar);
        uiContainer.appendChild(panelContent);
        document.body.appendChild(uiContainer);
        
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
            /* --- Main Layout --- */
            body {
                display: flex;
                flex-direction: column;
                height: 100vh;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
            }
            #canvas-container {
                flex: 1;
                min-height: 0;
            }
            #ui-container {
                height: 45%;
                display: flex;
                flex-direction: column;
            }

            /* --- Glassmorphic Navbar --- */
            #navbar {
                display: flex;
                justify-content: space-around;
                padding: 10px 5px;
                background: rgba(30, 30, 30, 0.4); /* Translucent background */
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px); /* For Safari */
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }
            #navbar button {
                background: none;
                border: none;
                color: #a0a0a0;
                padding: 8px 12px;
                font-size: 15px;
                font-weight: 600;
                flex: 1;
                transition: background-color 0.2s ease-in-out, color 0.2s ease-in-out;
                border-radius: 8px;
            }
            #navbar button.active {
                color: #ffffff;
                background-color: rgba(255, 255, 255, 0.1);
            }
            
            /* --- Glassmorphic Content Panel --- */
            #panel-content {
                position: relative; /* Needed for the fade effect */
                flex: 1;
                background: rgba(20, 20, 20, 0.5); /* Lighter background than navbar */
                backdrop-filter: blur(20px);
                -webkit-backdrop-filter: blur(20px);
                padding: 20px;
                overflow-y: auto;
            }
            
            /* --- NEW: Fade-out effect at the bottom --- */
            #panel-content::after {
                content: '';
                position: absolute;
                bottom: 0;
                left: 0;
                right: 0;
                height: 60px; /* Height of the fade */
                background: linear-gradient(to top, rgba(20, 20, 20, 1), transparent);
                pointer-events: none; /* Allows scrolling through the fade */
            }

            /* --- Panel Typography --- */
            .panel-content {
                color: #e0e0e0;
            }
            .panel-content h2 {
                margin-top: 0;
                color: #ffffff;
                font-weight: 600;
                font-size: 24px;
            }
            .panel-content p {
                color: #b0b0b0;
                font-size: 16px;
                line-height: 1.5;
            }
        `;
        document.head.appendChild(style);
    }
}
