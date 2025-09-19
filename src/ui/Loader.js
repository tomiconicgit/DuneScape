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
        
        // Clear any initial content and prepare for log messages
        this.statusElement.innerHTML = '';
    }

    updateStatus(message, progress) {
        // Create a new line for the status log
        const logLine = document.createElement('p');
        logLine.textContent = `> ${message}`;
        this.statusElement.appendChild(logLine);

        // Automatically scroll to the latest message
        this.statusElement.scrollTop = this.statusElement.scrollHeight;

        // Update the progress bar width
        this.progressBar.style.width = `${progress}%`;
    }

    fail(error) {
        const errorMessage = error.message || 'An unknown error occurred.';
        
        // Log the error message to the status box
        const errorLine = document.createElement('p');
        errorLine.textContent = `❌ ERROR: ${errorMessage}`;
        errorLine.style.color = '#ff6b6b';
        errorLine.style.fontWeight = 'bold';
        this.statusElement.appendChild(errorLine);
        this.statusElement.scrollTop = this.statusElement.scrollHeight;

        this.progressBar.style.backgroundColor = '#f55';
        this.progressBar.style.boxShadow = '0 0 8px #f55';
        this.progressBar.style.width = '100%';
        
        console.error("Game initialization failed:", error);
    }

    finish() {
        this.updateStatus('Initialization complete!', 100);
        setTimeout(() => {
            this.loadingScreen.classList.add('fade-out');
            setTimeout(() => {
                this.loadingScreen.remove();
            }, 1000); // Must match CSS transition
        }, 500);
    }
}
