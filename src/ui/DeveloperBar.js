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
        const style = document.createElement('style');
        style.textContent = `
            .build-bar {
                position: fixed;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(0, 0, 0, 0.7);
                color: #fff;
                font-family: monospace;
                font-size: 14px;
                z-index: 10000;
                display: flex;
                gap: 5px;
                padding: 5px;
                border-radius: 8px;
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
            .build-bar button.exit {
                background-color: #a55;
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

        // Add an exit button
        const exitButton = document.createElement('button');
        exitButton.textContent = 'Exit';
        exitButton.className = 'exit';
        exitButton.dataset.action = 'exit';
        this.container.appendChild(exitButton);
    }
    
    setupEventListeners() {
        this.container.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button) return;

            // Deactivate previous button
            if (this.activeButton) {
                this.activeButton.classList.remove('active');
            }

            const rockName = button.dataset.rockName;
            const action = button.dataset.action;

            if (action === 'exit') {
                this.buildModeCallback('exit');
                this.activeButton = null;
            } else if (rockName) {
                button.classList.add('active');
                this.activeButton = button;
                this.buildModeCallback('enter', rockName);
            }
        });
    }
}
