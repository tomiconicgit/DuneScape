// File: src/ui/Debugger.js

export default class Debugger {
    constructor() {
        this.logHistory = [];
        this.container = document.createElement('div');
        this.logElement = document.createElement('pre');
        this.copyButton = document.createElement('button');

        this.initStyles();
        this.createDOM();

        this.overrideConsole();
        this.catchGlobalErrors();
    }

    initStyles() {
        Object.assign(this.container.style, {
            position: 'fixed',
            bottom: '0',
            left: '0',
            width: '100%',
            maxHeight: '30vh',
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            color: '#00ff00',
            fontFamily: 'monospace',
            fontSize: '12px',
            zIndex: '9999',
            display: 'flex',
            flexDirection: 'column',
        });

        Object.assign(this.logElement.style, {
            overflowY: 'auto',
            padding: '5px',
            margin: '0',
            flexGrow: '1',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
        });

        Object.assign(this.copyButton.style, {
            padding: '5px',
            backgroundColor: '#333',
            color: '#fff',
            border: '1px solid #555',
            cursor: 'pointer',
            flexShrink: '0',
        });
        this.copyButton.innerText = 'Copy Log';
    }

    createDOM() {
        this.container.appendChild(this.logElement);
        this.container.appendChild(this.copyButton);
        document.body.appendChild(this.container);

        this.copyButton.onclick = () => {
            navigator.clipboard.writeText(this.logHistory.join('\n'))
                .then(() => this.log('[Debugger] Log copied to clipboard!'))
                .catch(err => this.error(`[Debugger] Failed to copy: ${err}`));
        };
    }

    log(message) {
        this._addMessage(message, '#00ff00');
    }

    warn(message) {
        this._addMessage(`[WARN] ${message}`, '#ffff00');
    }

    error(message) {
        this._addMessage(`[ERROR] ${message}`, '#ff4444');
    }

    _addMessage(message, color) {
        const timestamp = new Date().toLocaleTimeString();
        const formattedMessage = `[${timestamp}] ${message}`;
        this.logHistory.push(formattedMessage);
        
        const span = document.createElement('span');
        span.style.color = color;
        span.textContent = formattedMessage + '\n';

        this.logElement.appendChild(span);
        this.logElement.scrollTop = this.logElement.scrollHeight;
    }

    overrideConsole() {
        const oldLog = console.log;
        const oldWarn = console.warn;
        const oldError = console.error;

        console.log = (...args) => {
            oldLog.apply(console, args);
            this.log(args.map(a => JSON.stringify(a)).join(' '));
        };
        console.warn = (...args) => {
            oldWarn.apply(console, args);
            this.warn(args.map(a => JSON.stringify(a)).join(' '));
        };
        console.error = (...args) => {
            oldError.apply(console, args);
            this.error(args.map(a => JSON.stringify(a)).join(' '));
        };
    }

    catchGlobalErrors() {
        window.onerror = (message, source, lineno, colno, error) => {
            this.error(`UNCAUGHT ERROR: ${message}\nSource: ${source}\nLine: ${lineno}, Col: ${colno}`);
            // Prevent the default browser error handler
            return true;
        };
    }
}
