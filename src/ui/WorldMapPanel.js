export default class WorldMapPanel {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'panel-content';
        this.element.innerHTML = '<h2>World Map</h2><p>The world map will be displayed here.</p>';
        this.hide();
    }
    show() { this.element.style.display = 'block'; }
    hide() { this.element.style.display = 'none'; }
}
