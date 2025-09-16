import * as THREE from 'three';
import Debug from '../ui/Debug.js';
// ... other imports
import GameSky from '../world/Sky.js';
import Terrain from '../world/Terrain.js';

const DAY_DURATION_SECONDS = 20; 
const NIGHT_DURATION_SECONDS = 20;
const TOTAL_CYCLE_SECONDS = DAY_DURATION_SECONDS + NIGHT_DURATION_SECONDS;

export default class Game {
    constructor() {
        // ... (constructor setup is the same until the end)
        
        // NEW: Properties to store current sun angles
        this.currentElevation = 0;
        this.currentAzimuth = 0;
        
        this._setupEvents();
    }

    // ... (_createRenderer is unchanged)
    
    _setupEvents() {
        // ... (resize and onTap listeners are unchanged)

        this.devUI.onSettingChange = (change) => {
            this._handleSettingChange(change);
        };
        this.devUI.onPauseToggle = () => {
            this.isPaused = !this.isPaused;
        };
        // NEW: Connect the copy button request
        this.devUI.onCopyRequest = () => {
            this._copySkySettings();
        };
    }

    // MODIFIED: Expanded to handle all the new sliders
    _handleSettingChange(change) {
        switch (change.setting) {
            // Renderer
            case 'exposure': this.renderer.toneMappingExposure = change.value; break;
            // Sky
            case 'turbidity': this.sky.uniforms['turbidity'].value = change.value; break;
            case 'rayleigh': this.sky.uniforms['rayleigh'].value = change.value; break;
            case 'mieCoefficient': this.sky.uniforms['mieCoefficient'].value = change.value; break;
            case 'mieDirectionalG': this.sky.uniforms['mieDirectionalG'].value = change.value; break;
            // Lights
            case 'sunIntensity': this.sunLight.intensity = change.value; break;
            case 'hemiIntensity': this.hemiLight.intensity = change.value; break;
        }
    }

    // NEW: Method to gather and copy all settings
    _copySkySettings() {
        const settings = {
            // Sky Parameters
            turbidity: this.sky.uniforms['turbidity'].value,
            rayleigh: this.sky.uniforms['rayleigh'].value,
            mieCoefficient: this.sky.uniforms['mieCoefficient'].value,
            mieDirectionalG: this.sky.uniforms['mieDirectionalG'].value,
            // Sun Position
            elevation: this.currentElevation,
            azimuth: this.currentAzimuth,
            // Lights & Renderer
            sunIntensity: this.sunLight.intensity,
            hemiIntensity: this.hemiLight.intensity,
            exposure: this.renderer.toneMappingExposure
        };

        const settingsString = `const timeSettings = ${JSON.stringify(settings, null, 2)};`;

        navigator.clipboard.writeText(settingsString).then(() => {
            this.devUI.showCopiedFeedback();
        }).catch(err => {
            console.error('Failed to copy settings: ', err);
        });
    }

    // ... (start method is unchanged)

    _animate() {
        // ... (time calculation logic is the same)
        
        // MODIFIED: Store the current elevation and azimuth so we can copy them
        this.currentElevation = 0;
        this.currentAzimuth = 180;
        let dayProgress = 0;

        if (cycleProgress < (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) {
            dayProgress = cycleProgress / (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            this.currentElevation = Math.sin(dayProgress * Math.PI) * 90;
        } else {
            const nightProgress = (cycleProgress - (DAY_DURATION_SECONDS / TOTAL_CYCLE_SECONDS)) / (NIGHT_DURATION_SECONDS / TOTAL_CYCLE_SECONDS);
            this.currentElevation = Math.sin(Math.PI + nightProgress * Math.PI) * 90;
        }
        this.currentAzimuth = 180 - (dayProgress * 360);
        
        if (!this.isPaused) {
            this.sky.setParameters({ elevation: this.currentElevation, azimuth: this.currentAzimuth });
            this.sunLight.position.copy(this.sky.sun).multiplyScalar(1000);
        }
        
        // ... (rest of animate loop is the same)
    }
}
