// File: main.js
import Game from './src/core/Game.js';

// ✨ ADDED: Wrap initialization in a try...catch block to report errors
try {
    // Check if the loader was initialized
    if (!window.loader) {
        throw new Error("Loader not found. Make sure Loader.js is loaded correctly in index.html.");
    }
    
    window.loader.updateStatus('Loading game module...', 0);
    const game = new Game();
    game.start();
} catch (error) {
    if (window.loader) {
        window.loader.fail(error);
    } else {
        // Fallback if the loader itself fails
        document.body.innerHTML = `<div style="color: red; font-family: monospace; padding: 20px;">
            <h1>Fatal Error</h1><p>${error.message}</p><pre>${error.stack}</pre>
        </div>`;
    }
}
