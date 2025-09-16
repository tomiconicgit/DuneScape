export default class MissionsPanel {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'panel-content';
        this.element.innerHTML = '<h2>Missions</h2><p>Active quests and objectives will be displayed here.</p>';
        this.hide();
    }
    show() { this.element.style.display = 'block'; }
    hide() { this.element.style.display = 'none'; }
}
