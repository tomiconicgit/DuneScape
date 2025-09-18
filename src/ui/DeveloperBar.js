// File: src/ui/DeveloperBar.js
import * as THREE from 'three';
import { rockPresets } from '../world/assets/rockPresets.js';

export default class DeveloperBar {
    constructor(buildModeCallback) {
        this.buildModeCallback = buildModeCallback;
        this.activeButton = null;

        this.initStyles();
        this.initDOM();
        this.setupEventListeners();
    }

    initStyles() {
        // ✨ CHANGED: Updated styles to position the bar at the top and wrap buttons.
        const style = document.createElement('style');
        style.textContent = `
            .build-bar {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                color: #fff;
                font-family: monospace;
                font-size: 14px;
                z-index: 10000;
                display: flex;
                flex-wrap: wrap; /* Allows buttons to go to the next line */
                gap: 5px;
                padding: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.5);
            }
            .build-bar button {
                padding: 8px 12px;
                background-color: #333;
                color: #fff;
                border: 1px solid #555;
                cursor: pointer;
                border-radius: 5px;
            }
            .build-bar button:hover {
                background-color: #444;
            }
            .build-bar button.active {
                background-color: #5a5;
                border-color: #7c7;
                color: #fff;
            }
        `;
        document.head.appendChild(style);
    }

    initDOM() {
        this.container = document.createElement('div');
        this.container.className = 'build-bar';
        document.body.appendChild(this.container);

        this.addControls();
    }
    
    addControls() {
        // Create a button for each rock preset
        for (const rockName in rockPresets) {
            const button = document.createElement('button');
            button.textContent = rockName;
            button.dataset.rockName = rockName;
            this.container.appendChild(button);
        }
    }
    
    setupEventListeners() {
        // ✨ CHANGED: Rewritten logic to make each rock button a toggle.
        this.container.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button || !button.dataset.rockName) return;

            const rockName = button.dataset.rockName;

            // If the clicked button is already active, deactivate it.
            if (button === this.activeButton) {
                this.activeButton.classList.remove('active');
                this.activeButton = null;
                this.buildModeCallback('exit'); // Exit build mode
            } 
            // Otherwise, activate the new button.
            else {
                // Deactivate the previously active button, if any.
                if (this.activeButton) {
                    this.activeButton.classList.remove('active');
                }

                // Activate the new button
                button.classList.add('active');
                this.activeButton = button;
                this.buildModeCallback('enter', rockName); // Enter build mode with the selected rock
            }
        });
    }
}
