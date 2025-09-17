import InventoryPanel from './InventoryPanel.js';
import SkillsPanel from './SkillsPanel.js';
import MissionsPanel from './MissionsPanel.js';
import WorldMapPanel from './WorldMapPanel.js';

export default class Navbar {
    constructor() {
        this.panels = {};
        this.buttons = {};
        this.activePanel = null;

        this._createSVGFilter();
        this._injectStyles();
        this._createDOM();
    }
    
    _createSVGFilter() { const svgNS = "http://www.w3.org/2000/svg"; const svg = document.createElementNS(svgNS, 'svg'); svg.style.display = 'none'; const filter = document.createElementNS(svgNS, 'filter'); filter.setAttribute('id', 'glass-distortion'); const turbulence = document.createElementNS(svgNS, 'feTurbulence'); turbulence.setAttribute('type', 'turbulence'); turbulence.setAttribute('baseFrequency', '0.005 0.005'); turbulence.setAttribute('numOctaves', '2'); turbulence.setAttribute('result', 'noise'); const displacementMap = document.createElementNS(svgNS, 'feDisplacementMap'); displacementMap.setAttribute('in', 'SourceGraphic'); displacementMap.setAttribute('in2', 'noise'); displacementMap.setAttribute('scale', '50'); filter.appendChild(turbulence); filter.appendChild(displacementMap); svg.appendChild(filter); document.body.appendChild(svg); }

    _createDOM() {
        const uiContainer = document.createElement('div');
        uiContainer.id = 'ui-container';
        const navbar = document.createElement('div');
        navbar.id = 'navbar';
        navbar.innerHTML = `<div class="glass-filter"></div><div class="glass-overlay"></div><div class="glass-specular"></div><div class="glass-content" id="navbar-content"></div>`;
        const navbarContent = navbar.querySelector('#navbar-content');
        const panelContent = document.createElement('div');
        panelContent.id = 'panel-content';
        panelContent.innerHTML = `<div class="glass-filter"></div><div class="glass-overlay"></div><div class="glass-specular"></div><div class="glass-content" id="panel-content-area"></div>`;
        const panelContentArea = panelContent.querySelector('#panel-content-area');

        this._registerPanel('Inventory', new InventoryPanel(), panelContentArea, navbarContent, 'fa-briefcase');
        this._registerPanel('Skills', new SkillsPanel(), panelContentArea, navbarContent, 'fa-star');
        this._registerPanel('Missions', new MissionsPanel(), panelContentArea, navbarContent, 'fa-scroll');
        this._registerPanel('World Map', new WorldMapPanel(), panelContentArea, navbarContent, 'fa-map-location-dot');
        
        uiContainer.appendChild(panelContent);
        uiContainer.appendChild(navbar);
        document.body.appendChild(uiContainer);
        this._handleTabClick('Inventory');
    }
    
    _registerPanel(name, panelInstance, contentContainer, navContainer, iconClass) { this.panels[name] = panelInstance; contentContainer.appendChild(panelInstance.element); const button = document.createElement('button'); button.innerHTML = `<i class="fa-solid ${iconClass}"></i><span>${name}</span>`; button.addEventListener('click', () => this._handleTabClick(name)); this.buttons[name] = button; navContainer.appendChild(button); }
    _handleTabClick(name) { if (this.activePanel) { this.panels[this.activePanel].hide(); this.buttons[this.activePanel].classList.remove('active'); } this.panels[name].show(); this.buttons[name].classList.add('active'); this.activePanel = name; }

    _injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* --- MODIFIED: Main Layout for Full-Screen Canvas --- */
            #canvas-container {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                z-index: 1; /* Behind the UI */
            }
            #ui-container {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                z-index: 2; /* On top of the canvas */
                display: flex;
                flex-direction: column;
                /* MODIFIED: Shorter vertical height */
                height: 35vh; 
            }
            /* Remove body flexbox styles */
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

            /* --- Base Glass Styles (Unchanged) --- */
            #navbar, #panel-content { position: relative; border: 1px solid rgba(255, 255, 255, 0.1); overflow: hidden; }
            .glass-filter { position: absolute; top: 0; left: 0; width: 100%; height: 100%; backdrop-filter: blur(25px) saturate(1.2); -webkit-backdrop-filter: blur(25px) saturate(1.2); filter: url(#glass-distortion); transform: scale(1.1); }
            .glass-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to top, rgba(20, 20, 25, 0.7), rgba(40, 40, 45, 0.5)); }
            .glass-specular { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(160deg, rgba(255, 255, 255, 0.1) 0%, transparent 40%); pointer-events: none; }
            .glass-content { position: relative; z-index: 1; width: 100%; height: 100%; }

            /* --- MODIFIED: Navbar now sits at the bottom of its container --- */
            #navbar {
                border-radius: 0; /* Sharp corners */
                border-top: 1px solid rgba(255, 255, 255, 0.1);
                border-left: none;
                border-right: none;
                border-bottom: none;
            }
            #navbar-content { display: flex; justify-content: space-around; align-items: center; }
            #navbar button { background: none; border: none; color: #999; flex: 1; display: flex; flex-direction: column; align-items: center; gap: 4px; font-size: 10px; font-weight: 500; padding: 8px 0; transition: color 0.2s ease-in-out; }
            #navbar button .fa-solid { font-size: 18px; }
            #navbar button.active { color: #ffffff; }

            /* --- Content Panel (Unchanged) --- */
            #panel-content { flex: 1; min-height: 0; border-top: none; border-left: none; border-right: none; border-bottom: none; border-radius: 24px 24px 0 0; }
            #panel-content-area { padding: 20px; height: 100%; overflow-y: auto; }
            .panel-content h2 { margin: 0; font-weight: 600; font-size: 24px; color: #ffffff; }
            .panel-content p { color: #b0b0b0; font-size: 16px; line-height: 1.5; }
        `;
        document.head.appendChild(style);
    }
}
