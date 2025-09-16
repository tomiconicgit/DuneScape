export default class InventoryPanel {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'panel-content';
        this.element.innerHTML = '<h2>Inventory</h2><p>Player items will be displayed here.</p>';
        this.hide(); // Hidden by default
    }
    show() { this.element.style.display = 'block'; }
    hide() { this.element.style.display = 'none'; }
}
