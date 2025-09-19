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
        
        console.log("Debugger attached successfully.");
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
            borderTop: '1px solid #444',
            pointerEvents: 'none',
        });

        Object.assign(this.logElement.style, {
            overflowY: 'auto',
            padding: '5px',
            margin: '0',
            flexGrow: '1',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-all',
            pointerEvents: 'auto',
        });

        Object.assign(this.copyButton.style, {
            padding: '5px',
            backgroundColor: '#333',
            color: '#fff',
            border: 'none',
            cursor: 'pointer',
            flexShrink: '0',
            pointerEvents: 'auto',
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

    // ✨ FIXED: This entire method is rewritten to be more robust.
    overrideConsole() {
        const oldLog = console.log;
        const oldWarn = console.warn;
        const oldError = console.error;

        const formatArg = (arg) => {
            // If it's an error, use its stack trace for the most detail
            if (arg instanceof Error) {
                return arg.stack || arg.message;
            }
            // If it's a non-null object, try to stringify it safely
            if (typeof arg === 'object' && arg !== null) {
                try {
                    return JSON.stringify(arg, null, 2); // Pretty-print JSON
                } catch (e) {
                    return '[Unserializable Object]'; // Fallback for cyclic structures
                }
            }
            // Otherwise, return as is
            return arg;
        };

        console.log = (...args) => {
            oldLog.apply(console, args);
            this.log(args.map(formatArg).join(' '));
        };
        console.warn = (...args) => {
            oldWarn.apply(console, args);
            this.warn(args.map(formatArg).join(' '));
        };
        console.error = (...args) => {
            oldError.apply(console, args);
            this.error(args.map(formatArg).join(' '));
        };
    }

    catchGlobalErrors() {
        window.onerror = (message, source, lineno, colno, error) => {
            this.error(`UNCAUGHT ERROR: ${message}\nSource: ${source}\nLine: ${lineno}, Col: ${colno}`);
            return true;
        };
        
        window.addEventListener('unhandledrejection', event => {
            this.error(`UNHANDLED PROMISE REJECTION: ${event.reason}`);
        });
    }
}
