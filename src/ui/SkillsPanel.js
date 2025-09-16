export default class SkillsPanel {
    constructor() {
        this.element = document.createElement('div');
        this.element.className = 'panel-content';
        this.element.innerHTML = '<h2>Skills</h2><p>Player skills and stats will be displayed here.</p>';
        this.hide();
    }
    show() { this.element.style.display = 'block'; }
    hide() { this.element.style.display = 'none'; }
}
