// js/error.js - Super Advanced Error Handler

(() => {
    // --- Start: UI and Styling (Self-Contained) ---
    const styles = `
        #error-container { position: fixed; bottom: 15px; left: 15px; z-index: 99999; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; }
        #error-btn { display: none; padding: 10px 15px; background-color: #e74c3c; color: white; border: none; border-radius: 5px; cursor: pointer; font-size: 14px; box-shadow: 0 4px 15px rgba(0,0,0,0.3); animation: pulse 2s infinite; }
        #error-count { background-color: white; color: #e74c3c; border-radius: 50%; padding: 2px 6px; font-size: 12px; font-weight: bold; margin-left: 8px; }
        #error-modal-overlay { display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background-color: rgba(0, 0, 0, 0.7); z-index: 99998; backdrop-filter: blur(5px); }
        #error-modal { position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 90%; max-width: 800px; background-color: #2c3e50; color: #ecf0f1; border-radius: 8px; box-shadow: 0 5px 25px rgba(0,0,0,0.5); padding: 25px; display: flex; flex-direction: column; }
        #error-modal h2 { color: #e74c3c; margin-top: 0; border-bottom: 1px solid #34495e; padding-bottom: 10px; margin-bottom: 15px; }
        #error-modal-content { max-height: 60vh; overflow-y: auto; font-size: 14px; }
        .error-log-entry { border-bottom: 1px solid #34495e; padding: 10px 0; }
        .error-log-entry:last-child { border-bottom: none; }
        .error-log-entry strong { color: #f1c40f; }
        .error-log-entry pre { background-color: #212f3d; padding: 10px; border-radius: 4px; white-space: pre-wrap; word-wrap: break-word; margin-top: 10px; font-family: 'Consolas', 'Monaco', monospace; font-size: 13px; }
        .error-meta { font-size: 12px; color: #95a5a6; display: flex; justify-content: space-between; margin-bottom: 5px; }
        .error-severity-CRITICAL { border-left: 4px solid #e74c3c; padding-left: 10px; }
        .error-severity-WARNING { border-left: 4px solid #f1c40f; padding-left: 10px; }
        .error-severity-INFO { border-left: 4px solid #3498db; padding-left: 10px; }
        .error-modal-actions { margin-top: 20px; text-align: right; }
        .error-modal-btn { padding: 10px 20px; border: none; border-radius: 5px; cursor: pointer; font-weight: bold; margin-left: 10px; transition: background-color 0.2s; }
        #error-copy-btn { background-color: #3498db; color: white; } #error-copy-btn:hover { background-color: #2980b9; }
        #error-close-btn { background-color: #95a5a6; color: #2c3e50; } #error-close-btn:hover { background-color: #7f8c8d; }
        @keyframes pulse { 0% { transform: scale(1); } 50% { transform: scale(1.05); } 100% { transform: scale(1); } }
    `;
    // --- End: UI and Styling ---

    const errorLog = [];
    let glContext = null;
    let uiReady = false;

    function setupErrorUI() {
        if (uiReady) return;
        
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        const container = document.createElement('div');
        container.id = 'error-container';
        container.innerHTML = `
            <button id="error-btn">
                <i class="fas fa-bug"></i> Error Detected!
                <span id="error-count">0</span>
            </button>
            <div id="error-modal-overlay">
                <div id="error-modal">
                    <h2><i class="fas fa-exclamation-triangle"></i> Error Log</h2>
                    <div id="error-modal-content"></div>
                    <div class="error-modal-actions">
                        <button id="error-copy-btn" class="error-modal-btn">Copy All</button>
                        <button id="error-close-btn" class="error-modal-btn">Close</button>
                    </div>
                </div>
            </div>`;
        document.body.appendChild(container);

        document.getElementById('error-btn').addEventListener('click', showErrorModal);
        document.getElementById('error-close-btn').addEventListener('click', () => {
            document.getElementById('error-modal-overlay').style.display = 'none';
        });
        document.getElementById('error-copy-btn').addEventListener('click', copyAllErrors);
        uiReady = true;
    }

    function showErrorModal() {
        const content = document.getElementById('error-modal-content');
        content.innerHTML = ''; // Clear previous content

        errorLog.forEach(details => {
            const entry = document.createElement('div');
            entry.className = `error-log-entry error-severity-${details.severity}`;
            entry.innerHTML = `
                <div class="error-meta">
                    <span><strong>Type:</strong> ${details.type}</span>
                    <span><strong>Time:</strong> ${details.timestamp}</span>
                </div>
                <p><strong>Message:</strong> ${details.message}</p>
                ${details.filename ? `<p><strong>File:</strong> ${details.filename}:${details.lineno || 'N/A'}</p>` : ''}
                ${details.stack ? `<p><strong>Stack Trace:</strong></p><pre>${details.stack}</pre>` : ''}
                ${details.context ? `<p><strong>Context:</strong></p><pre>${JSON.stringify(details.context, null, 2)}</pre>` : ''}
            `;
            content.appendChild(entry);
        });

        document.getElementById('error-modal-overlay').style.display = 'block';
    }
    
    function copyAllErrors() {
        const copyText = errorLog.map(details => `
--- ERROR ---
Type: ${details.type}
Severity: ${details.severity}
Timestamp: ${details.timestamp}
Message: ${details.message}
File: ${details.filename || 'N/A'}:${details.lineno || 'N/A'}
Context: ${JSON.stringify(details.context, null, 2)}
Stack Trace:
${details.stack || 'No stack trace available.'}
        `).join('\n');

        navigator.clipboard.writeText(copyText.trim()).then(() => {
            const copyBtn = document.getElementById('error-copy-btn');
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = 'Copy All'; }, 2000);
        });
    }

    function handleError(details) {
        console.error("SuperErrorHandler Caught:", details);
        errorLog.push(details);

        if (!uiReady) {
            // If the DOM isn't ready, wait until it is to show the button.
             document.addEventListener('DOMContentLoaded', () => {
                setupErrorUI();
                updateErrorButton();
            });
        } else {
            updateErrorButton();
        }
    }

    function updateErrorButton() {
        const errorBtn = document.getElementById('error-btn');
        const errorCount = document.getElementById('error-count');
        if (errorBtn) {
            errorBtn.style.display = 'block';
            errorCount.textContent = errorLog.length;
        }
    }
    
    // The public API for our error handler
    const SuperErrorHandler = {
        /**
         * Manually report a logical or contextual error.
         * @param {string} message - The error message.
         * @param {object} [context={}] - A snapshot of relevant game state.
         * @param {'CRITICAL' | 'WARNING' | 'INFO'} [severity='CRITICAL'] - The severity level.
         */
        report(message, context = {}, severity = 'CRITICAL') {
            handleError({
                type: 'Logical Error',
                message,
                stack: new Error().stack, // Get stack trace for manual reports
                context,
                severity,
                timestamp: new Date().toLocaleTimeString()
            });
        },

        /**
         * Hooks into a Three.js renderer to monitor for silent WebGL errors.
         * Call this once during initialization.
         * @param {THREE.WebGLRenderer} renderer - The main renderer instance.
         */
        monitorWebGL(renderer) {
            glContext = renderer.getContext();
            console.log("SuperErrorHandler: WebGL monitoring enabled.");
        },
        
        /**
         * Checks for any WebGL errors.
         * Call this inside your main `animate` loop.
         */
        checkGLErrors() {
            if (!glContext) return;
            const error = glContext.getError();
            if (error !== glContext.NO_ERROR) {
                const errorMap = {
                    [glContext.INVALID_ENUM]: "INVALID_ENUM",
                    [glContext.INVALID_VALUE]: "INVALID_VALUE",
                    [glContext.INVALID_OPERATION]: "INVALID_OPERATION",
                    [glContext.INVALID_FRAMEBUFFER_OPERATION]: "INVALID_FRAMEBUFFER_OPERATION",
                    [glContext.OUT_OF_MEMORY]: "OUT_OF_MEMORY",
                    [glContext.CONTEXT_LOST_WEBGL]: "CONTEXT_LOST_WEBGL",
                };
                // Debounce to prevent spamming
                const lastError = errorLog[errorLog.length - 1];
                if (lastError && lastError.message.includes(errorMap[error])) return;

                this.report(`Silent WebGL Error: ${errorMap[error]}`, {
                    details: "This is a low-level graphics card error. It often happens if you pass invalid data to a BufferGeometry, shader, or texture. Check the objects you created just before this error."
                }, 'CRITICAL');
            }
        }
    };

    window.SuperErrorHandler = SuperErrorHandler;

    // Global Event Listeners
    window.addEventListener('error', (event) => {
        handleError({
            type: 'Runtime Error',
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error ? event.error.stack : 'N/A',
            severity: 'CRITICAL',
            timestamp: new Date().toLocaleTimeString()
        });
    });

    window.addEventListener('unhandledrejection', (event) => {
        handleError({
            type: 'Promise Rejection',
            message: event.reason instanceof Error ? event.reason.message : String(event.reason),
            filename: "Promise",
            stack: event.reason instanceof Error ? event.reason.stack : 'N/A',
            severity: 'CRITICAL',
            timestamp: new Date().toLocaleTimeString()
        });
    });

})();
