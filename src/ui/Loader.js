// File: src/ui/Loader.js

export default class Loader {
    constructor() {
        this.loadingScreen = document.getElementById('loading-screen');
        this.progressBar = document.getElementById('loading-bar');
        this.statusElement = document.getElementById('loading-status');
        
        if (!this.loadingScreen || !this.progressBar || !this.statusElement) {
            console.error("Loading screen DOM elements not found!");
            return;
        }
    }

    updateStatus(message, progress) {
        this.statusElement.textContent = message;
        this.progressBar.style.width = `${progress}%`;
    }

    fail(error) {
        const errorMessage = error.message || 'An unknown error occurred.';
        const errorSource = error.stack ? error.stack.split('\n')[1] || '' : '';
        
        this.statusElement.textContent = `ERROR: ${errorMessage}`;
        this.statusElement.style.color = '#f55';
        this.progressBar.style.backgroundColor = '#f55';
        this.progressBar.style.width = '100%';
        
        console.error("Game initialization failed:", error);
    }

    finish() {
        this.updateStatus('Ready!', 100);
        setTimeout(() => {
            this.loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                this.loadingScreen.remove();
            }, 1000); // Must match CSS transition
        }, 500);
    }
}
