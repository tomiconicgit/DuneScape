// File: main.js
import Game from './src/core/Game.js';

// Use an async function to initialize and start the game
async function main() {
    try {
        if (!window.loader) {
            throw new Error("Loader not found.");
        }
        
        window.loader.updateStatus('Loading game module...', 0);
        const game = new Game();
        await game.init(); // Wait for initialization to complete
        game.start();

    } catch (error) {
        if (window.loader) {
            window.loader.fail(error);
        } else {
            document.body.innerHTML = `<div style="color: red; font-family: monospace; padding: 20px;">
                <h1>Fatal Error</h1><p>${error.message}</p><pre>${error.stack}</pre>
            </div>`;
        }
    }
}

main(); // Run the async main function
