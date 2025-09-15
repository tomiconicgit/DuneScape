const Debug = {
    errorLog: [],
    dom: {
        icon: null,
        counter: null,
        modal: null,
        errorList: null,
    },

    init() {
        this._createStyles();
        this._createDOM();
        this._attachEventListeners();
        console.log("Debug Engine: Initialized and listening for errors.");
    },

    _createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            #debug-icon {
                position: fixed; bottom: 15px; left: 15px; width: 40px; height: 40px;
                background-color: #ff3838; color: white; border-radius: 50%;
                display: none; align-items: center; justify-content: center;
                font-family: monospace; font-size: 18px; font-weight: bold;
                cursor: pointer; z-index: 9999; box-shadow: 0 0 10px rgba(0,0,0,0.5);
                user-select: none;
            }
            #debug-modal-overlay {
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background-color: rgba(0, 0, 0, 0.7); display: none;
                align-items: center; justify-content: center; z-index: 9998;
            }
            #debug-modal {
                background-color: #1e1e1e; color: #d4d4d4; padding: 20px;
                border-radius: 8px; width: 90%; max-width: 600px;
                height: 70%; max-height: 500px; display: flex; flex-direction: column;
                font-family: monospace; box-shadow: 0 5px 15px rgba(0,0,0,0.5);
            }
            #debug-modal h2 { margin: 0 0 15px 0; color: #ff3838; border-bottom: 1px solid #444; padding-bottom: 10px; }
            #debug-error-list {
                flex-grow: 1; overflow-y: auto; background: #252526; padding: 10px;
                border-radius: 4px; font-size: 13px; white-space: pre-wrap; word-break: break-all;
            }
            #debug-error-list div { padding-bottom: 10px; margin-bottom: 10px; border-bottom: 1px dashed #444; }
            #debug-modal-controls { margin-top: 15px; display: flex; gap: 10px; }
            .debug-button {
                padding: 10px 15px; border: none; border-radius: 4px; cursor: pointer;
                background-color: #0e639c; color: white; font-family: monospace; flex-grow: 1;
            }
            .debug-button:hover { background-color: #1579b9; }
        `;
        document.head.appendChild(style);
    },

    _createDOM() {
        const overlay = document.createElement('div');
        overlay.id = 'debug-modal-overlay';
        overlay.innerHTML = `
            <div id="debug-modal">
                <h2>🚨 Error Log</h2>
                <div id="debug-error-list"></div>
                <div id="debug-modal-controls">
                    <button id="debug-copy-btn" class="debug-button">Copy All</button>
                    <button id="debug-close-btn" class="debug-button">Close</button>
                </div>
            </div>`;
        document.body.appendChild(overlay);

        this.dom.icon = document.createElement('div');
        this.dom.icon.id = 'debug-icon';
        this.dom.counter = document.createElement('span');
        this.dom.icon.appendChild(this.dom.counter);
        document.body.appendChild(this.dom.icon);

        this.dom.errorList = document.getElementById('debug-error-list');
        this.dom.icon.addEventListener('click', () => this.showModal());
        document.getElementById('debug-copy-btn').addEventListener('click', () => this._copyErrorsToClipboard());
        document.getElementById('debug-close-btn').addEventListener('click', () => this.hideModal());
        overlay.addEventListener('click', (e) => { if (e.target === overlay) this.hideModal(); });
    },
    
    _attachEventListeners() {
        window.addEventListener('error', e => this.addError('Uncaught Error', `${e.message}\n@ ${e.filename}:${e.lineno}:${e.colno}`));
        window.addEventListener('unhandledrejection', e => this.addError('Promise Rejection', e.reason));
        const originalConsoleError = console.error;
        console.error = (...args) => {
            this.addError('Console.error', args.join(' '));
            originalConsoleError.apply(console, args);
        };
    },

    addError(type, message) {
        const timestamp = new Date().toLocaleTimeString();
        this.errorLog.push({ type, message, timestamp });
        this.dom.icon.style.display = 'flex';
        this.dom.counter.textContent = this.errorLog.length;
    },

    showModal() {
        this.dom.errorList.innerHTML = this.errorLog.map(err => `<div><strong>[${err.timestamp}] ${err.type}:</strong><br>${err.message}</div>`).join('');
        document.getElementById('debug-modal-overlay').style.display = 'flex';
    },

    hideModal() {
        document.getElementById('debug-modal-overlay').style.display = 'none';
    },

    _copyErrorsToClipboard() {
        const textToCopy = this.errorLog.map(err => `[${err.timestamp}] ${err.type}:\n${err.message}`).join('\n\n---\n\n');
        navigator.clipboard.writeText(textToCopy).then(() => {
            const btn = document.getElementById('debug-copy-btn');
            btn.textContent = 'Copied!';
            setTimeout(() => { btn.textContent = 'Copy All'; }, 2000);
        });
    }
};

export default Debug;
