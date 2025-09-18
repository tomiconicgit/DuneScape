// File: src/ui/DeveloperBar.js
import * as THREE from 'three';
import { rockPresets } from '../world/assets/rockPresets.js';

export default class DeveloperBar {
    constructor(buildModeCallback, copyLayoutCallback) {
        this.buildModeCallback = buildModeCallback;
        this.copyLayoutCallback = copyLayoutCallback; // ✨ ADDED: Callback for copying
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
                top: 0;
                left: 0;
                width: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                color: #fff;
                font-family: monospace;
                font-size: 14px;
                z-index: 10000;
                display: flex;
                flex-wrap: wrap;
                gap: 5px;
                padding: 5px;
                box-shadow: 0 2px 5px rgba(0,0,0,0.5);
                align-items: center; /* Vertically align items */
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
            /* ✨ ADDED: Styles for the new copy button and a separator */
            .build-bar .separator {
                width: 1px;
                height: 25px;
                background-color: #555;
                margin: 0 5px;
            }
            .build-bar .copy-button {
                background-color: #469;
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

        // ✨ ADDED: Add a visual separator and the Copy Layout button
        const separator = document.createElement('div');
        separator.className = 'separator';
        this.container.appendChild(separator);

        this.copyButton = document.createElement('button');
        this.copyButton.textContent = 'Copy Layout';
        this.copyButton.className = 'copy-button';
        this.container.appendChild(this.copyButton);
    }
    
    setupEventListeners() {
        // Handle rock selection toggles
        this.container.addEventListener('click', (e) => {
            const button = e.target.closest('button');
            if (!button || !button.dataset.rockName) return;

            const rockName = button.dataset.rockName;

            if (button === this.activeButton) {
                this.activeButton.classList.remove('active');
                this.activeButton = null;
                this.buildModeCallback('exit');
            } else {
                if (this.activeButton) {
                    this.activeButton.classList.remove('active');
                }
                button.classList.add('active');
                this.activeButton = button;
                this.buildModeCallback('enter', rockName);
            }
        });

        // ✨ ADDED: Handle the copy button click
        this.copyButton.addEventListener('click', () => {
            this.copyLayoutCallback();
            this.copyButton.textContent = 'Copied!';
            setTimeout(() => {
                this.copyButton.textContent = 'Copy Layout';
            }, 2000);
        });
    }
}
