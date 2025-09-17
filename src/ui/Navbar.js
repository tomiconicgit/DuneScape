import InventoryPanel from './InventoryPanel.js';
import SkillsPanel from './SkillsPanel.js';
import MissionsPanel from './MissionsPanel.js';
import WorldMapPanel from './WorldMapPanel.js';

export default class Navbar {
    constructor() {
        this.panels = {};
        this.buttons = {};
        this.activePanelName = null;
        this.isPanelOpen = false;

        this._createSVGFilter();
        this._injectStyles();
        this._createDOM();
    }
    
    // ... (_createSVGFilter, _createDOM, _registerPanel, _handleTabClick methods are unchanged)
    _createSVGFilter() { const svgNS = "http://www.w3.org/2000/svg"; const svg = document.createElementNS(svgNS, 'svg'); svg.style.display = 'none'; const filter = document.createElementNS(svgNS, 'filter'); filter.setAttribute('id', 'glass-distortion'); const turbulence = document.createElementNS(svgNS, 'feTurbulence'); turbulence.setAttribute('type', 'turbulence'); turbulence.setAttribute('baseFrequency', '0.005 0.005'); turbulence.setAttribute('numOctaves', '2'); turbulence.setAttribute('result', 'noise'); const displacementMap = document.createElementNS(svgNS, 'feDisplacementMap'); displacementMap.setAttribute('in', 'SourceGraphic'); displacementMap.setAttribute('in2', 'noise'); displacementMap.setAttribute('scale', '50'); filter.appendChild(turbulence); filter.appendChild(displacementMap); svg.appendChild(filter); document.body.appendChild(svg); }
    _createDOM() { const uiContainer = document.createElement('div'); uiContainer.id = 'ui-container'; this.dom = { panelContent: document.createElement('div'), navbar: document.createElement('div') }; this.dom.navbar.id = 'navbar'; this.dom.navbar.innerHTML = `<div class="glass-filter"></div><div class="glass-overlay"></div><div class="glass-specular"></div><div class="glass-content" id="navbar-content"></div>`; const navbarContent = this.dom.navbar.querySelector('#navbar-content'); this.dom.panelContent.id = 'panel-content'; this.dom.panelContent.innerHTML = `<div class="glass-filter"></div><div class="glass-overlay"></div><div class="glass-specular"></div><div class="glass-content" id="panel-content-area"></div>`; const panelContentArea = this.dom.panelContent.querySelector('#panel-content-area'); this._registerPanel('Inventory', new InventoryPanel(), panelContentArea, navbarContent, 'fa-briefcase'); this._registerPanel('Skills', new SkillsPanel(), panelContentArea, navbarContent, 'fa-star'); this._registerPanel('Missions', new MissionsPanel(), panelContentArea, navbarContent, 'fa-scroll'); this._registerPanel('World Map', new WorldMapPanel(), panelContentArea, navbarContent, 'fa-map-location-dot'); uiContainer.appendChild(this.dom.panelContent); uiContainer.appendChild(this.dom.navbar); document.body.appendChild(uiContainer); }
    _registerPanel(name, panelInstance, contentContainer, navContainer, iconClass) { this.panels[name] = panelInstance; contentContainer.appendChild(panelInstance.element); const button = document.createElement('button'); button.innerHTML = `<i class="fa-solid ${iconClass}"></i><span>${name}</span>`; button.addEventListener('click', () => this._handleTabClick(name)); this.buttons[name] = button; navContainer.appendChild(button); }
    _handleTabClick(name) { const currentlyActive = this.activePanelName; const isClosing = currentlyActive === name; if (currentlyActive) { this.panels[currentlyActive].hide(); this.buttons[currentlyActive].classList.remove('active'); } if (!isClosing) { this.panels[name].show(); this.buttons[name].classList.add('active'); this.activePanelName = name; this.dom.panelContent.classList.add('visible'); } else { this.activePanelName = null; this.dom.panelContent.classList.remove('visible'); } }

    _injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
            /* --- Main Layout --- */
            #canvas-container { position: fixed; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
            #ui-container {
                position: fixed;
                bottom: 0; left: 0; right: 0;
                z-index: 2;
                display: flex;
                flex-direction: column; 
                height: 40vh;
                /* MODIFIED: Make the container click-through by default */
                pointer-events: none;
            }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }

            /* --- Base Glass Styles --- */
            #navbar, #panel-content { 
                position: relative; 
                border: 1px solid rgba(100, 100, 110, 0.2); 
                overflow: hidden;
                /* MODIFIED: Make the UI elements clickable again */
                pointer-events: auto;
            }
            .glass-filter { position: absolute; top: 0; left: 0; width: 100%; height: 100%; backdrop-filter: blur(25px) saturate(1.2); -webkit-backdrop-filter: blur(25px) saturate(1.2); filter: url(#glass-distortion); transform: scale(1.1); }
            .glass-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(to top, rgba(15, 15, 20, 0.8), rgba(35, 35, 40, 0.6)); }
            .glass-specular { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(160deg, rgba(255, 255, 255, 0.1) 0%, transparent 40%); pointer-events: none; }
            .glass-content { position: relative; z-index: 1; width: 100%; height: 100%; }

            /* --- Navbar (Bottom Bar) --- */
            #navbar { box-shadow: 0 -5px 20px rgba(0,0,0,0.2); border-top: 1px solid rgba(100, 100, 110, 0.3); }
            #navbar-content { display: flex; justify-content: space-around; align-items: stretch; }
            #navbar button { background: none; border: none; color: #aaa; flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 4px; font-size: 11px; font-weight: 500; padding: 5px 0; transition: color 0.2s ease-in-out; border-top: 2px solid transparent; }
            #navbar button .fa-solid { font-size: 20px; }
            #navbar button.active { color: #ffffff; border-top-color: #00aaff; }

            /* --- Content Panel (Slides Up) --- */
            #panel-content { flex: 1; min-height: 0; border-radius: 20px 20px 0 0; border-bottom: none; transform: translateY(100%); visibility: hidden; transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1), visibility 0.4s; }
            #panel-content.visible { transform: translateY(0%); visibility: visible; }
            #panel-content-area { padding: 20px; height: 100%; overflow-y: auto; }
            .panel-content h2 { margin: 0; font-weight: 600; font-size: 24px; color: #ffffff; }
            .panel-content p { color: #b0b0b0; font-size: 16px; line-height: 1.5; }
        `;
        document.head.appendChild(style);
    }
}
