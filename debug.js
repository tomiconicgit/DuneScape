/**
 * A self-contained, high-tech debug utility for the game.
 * It creates its own UI and listens for global errors.
 */
const Debug = {
    errorLog: [],
    dom: {
        icon: null,
        counter: null,
        modal: null,
        errorList: null,
    },

    /**
     * Initializes the entire debug system.
     * Call this once when the application starts.
     */
    init() {
        this._createStyles();
        this._createDOM();
        this._attachEventListeners();
        console.log("Debug Engine: Initialized and listening for errors.");
    },

    /**
     * Injects the necessary CSS for the debug UI into the document's head.
     */
    _createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #debug-icon {
                position: fixed;
                bottom: 15px;
                left: 15px;
                width: 40px;
                height: 40px;
                background-color: #ff3838;
                color: white;
                border-radius: 50%;
                display: none; /* Hidden by default */
                align-items: center;
                justify-content: center;
                font-family: monospace;
                font-size: 18px;
                font-weight: bold;
                cursor: pointer;
                z-index: 9999;
                box-shadow: 0 0 10px rgba(0,0,0,0.5);
                user-select: none;
            }
            #debug-modal-overlay {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background-color: rgba(0, 0, 0, 0.7);
                display: none; /* Hidden by default */
                align-items: center;
                justify-content: center;
                z-index: 9998;
            }
            #debug-modal {
                background-color: #1e1e1e;
                color: #d4d4d4;
                padding: 20px;
                border-radius: 8px;
                width: 90%;
                max-width: 600px;
                height: 70%;
                max-height: 500px;
                display: flex;
                flex-direction: column;
                font-family: monospace;
                box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            }
            #debug-modal h2 {
                margin: 0 0 15px 0;
                color: #ff3838;
                border-bottom: 1px solid #444;
                padding-bottom: 10px;
            }
            #debug-error-list {
                flex-grow: 1;
                overflow-y: auto;
                background: #252526;
                padding: 10px;
                border-radius: 4px;
                font-size: 13px;
                white-space: pre-wrap; /* Allows long lines to wrap */
                word-break: break-all;
            }
            #debug-error-list div {
                padding-bottom: 10px;
                margin-bottom: 10px;
                border-bottom: 1px dashed #444;
            }
            #debug-modal-controls {
                margin-top: 15px;
                display: flex;
                gap: 10px;
            }
            .debug-button {
                padding: 10px 15px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                background-color: #0e639c;
                color: white;
                font-family: monospace;
                flex-grow: 1;
            }
            .debug-button:hover {
                background-color: #1579b9;
            }
        `;
        document.head.appendChild(style);
    },

    /**
     * Creates the icon and modal DOM elements and appends them to the body.
     */
    _createDOM() {
        // Create Icon
        this.dom.icon = document.createElement('div');
        this.dom.icon.id = 'debug-icon';
        this.dom.counter = document.createElement('span');
        this.dom.icon.appendChild(this.dom.counter);
        this.dom.icon.addEventListener('click', () => this.showModal());
        
        // Create Modal Overlay
        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'debug-modal-overlay';
        
        // Create Modal
        this.dom.modal = document.createElement('div');
        this.dom.modal.id = 'debug-modal';
        this.dom.modal.innerHTML = `
            <h2>🚨 Error Log</h2>
            <div id="debug-error-list"></div>
            <div id="debug-modal-controls">
                <button id="debug-copy-btn" class="debug-button">Copy All</button>
                <button id="debug-close-btn" class="debug-button">Close</button>
            </div>
        `;

        modalOverlay.appendChild(this.dom.modal);
        document.body.appendChild(this.dom.icon);
        document.body.appendChild(modalOverlay);

        // Assign modal elements to dom object
        this.dom.errorList = document.getElementById('debug-error-list');

        // Add event listeners for modal controls
        document.getElementById('debug-copy-btn').addEventListener('click', () => this._copyErrorsToClipboard());
        document.getElementById('debug-close-btn').addEventListener('click', () => this.hideModal());
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) this.hideModal();
        });
    },
    
    /**
     * Listens for global uncaught errors and promise rejections.
     * Also hijacks console.error to capture those as well.
     */
    _attachEventListeners() {
        window.addEventListener('error', (event) => {
            const errorInfo = `${event.message}\n@ ${event.filename}:${event.lineno}:${event.colno}`;
            this.addError('Uncaught Error', errorInfo);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.addError('Unhandled Promise Rejection', event.reason);
        });
        
        // Hijack console.error
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.addError('Console.error', args.join(' '));
            originalConsoleError.apply(console, args); // Still log to console
        };
    },

    /**
     * Adds an error to the log and updates the UI.
     * @param {string} type - The type of error (e.g., 'Uncaught Error').
     * @param {string} message - The error message or details.
     */
    addError(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        this.errorLog.push({ type, message, timestamp });
        this.dom.icon.style.display = 'flex';
        this.dom.counter.textContent = this.errorLog.length;
    },

    /**
     * Displays the modal and populates it with the latest errors.
     */
    showModal() {
        this.dom.errorList.innerHTML = ''; // Clear previous content
        this.errorLog.forEach(err => {
            const errorElement = document.createElement('div');
            errorElement.innerHTML = `<strong>[${err.timestamp}] ${err.type}:</strong><br>${err.message}`;
            this.dom.errorList.appendChild(errorElement);
        });
        document.getElementById('debug-modal-overlay').style.display = 'flex';
    },

    /**
     * Hides the error modal.
     */
    hideModal() {
        document.getElementById('debug-modal-overlay').style.display = 'none';
    },

    /**
     * Formats all errors into a string and copies them to the clipboard.
     */
    _copyErrorsToClipboard() {
        const textToCopy = this.errorLog.map(err => 
            `[${err.timestamp}] ${err.type}:\n${err.message}`
        ).join('\n\n---------------------------------\n\n');
        
        navigator.clipboard.writeText(textToCopy).then(() => {
            const copyBtn = document.getElementById('debug-copy-btn');
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = 'Copy All'; }, 2000);
        }).catch(err => {
            console.error('Failed to copy errors: ', err);
        });
    }
};

export default Debug;

