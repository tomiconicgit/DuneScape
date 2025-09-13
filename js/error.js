// js/error.js

(() => {
    // Self-contained CSS for the error UI.
    const styles = `
        #error-container {
            position: fixed;
            bottom: 15px;
            left: 15px;
            z-index: 99999;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        #error-btn {
            display: none; /* Hidden by default */
            padding: 10px 15px;
            background-color: #e74c3c;
            color: white;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3);
            animation: pulse 2s infinite;
        }
        #error-modal-overlay {
            display: none; /* Hidden by default */
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.7);
            z-index: 99998;
            backdrop-filter: blur(5px);
        }
        #error-modal {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            width: 90%;
            max-width: 800px;
            background-color: #2c3e50;
            color: #ecf0f1;
            border-radius: 8px;
            box-shadow: 0 5px 25px rgba(0,0,0,0.5);
            padding: 25px;
        }
        #error-modal h2 {
            color: #e74c3c;
            margin-top: 0;
            border-bottom: 1px solid #34495e;
            padding-bottom: 10px;
            margin-bottom: 15px;
        }
        #error-modal-content {
            max-height: 60vh;
            overflow-y: auto;
            font-size: 14px;
        }
        #error-modal-content strong {
            color: #f1c40f;
        }
        #error-stack {
            background-color: #212f3d;
            padding: 10px;
            border-radius: 4px;
            white-space: pre-wrap;
            word-wrap: break-word;
            margin-top: 10px;
            font-family: 'Consolas', 'Monaco', monospace;
            font-size: 13px;
        }
        .error-modal-actions {
            margin-top: 20px;
            text-align: right;
        }
        .error-modal-btn {
            padding: 10px 20px;
            border: none;
            border-radius: 5px;
            cursor: pointer;
            font-weight: bold;
            margin-left: 10px;
            transition: background-color 0.2s;
        }
        #error-copy-btn {
            background-color: #3498db;
            color: white;
        }
        #error-copy-btn:hover { background-color: #2980b9; }
        #error-close-btn {
            background-color: #95a5a6;
            color: #2c3e50;
        }
        #error-close-btn:hover { background-color: #7f8c8d; }
        @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
        }
    `;

    let errorDetails = null;

    // Function to create and inject the UI into the DOM
    function setupErrorUI() {
        if (document.getElementById('error-container')) return;

        // Inject CSS
        const styleSheet = document.createElement("style");
        styleSheet.innerText = styles;
        document.head.appendChild(styleSheet);

        // Create HTML elements
        const container = document.createElement('div');
        container.id = 'error-container';
        
        container.innerHTML = `
            <button id="error-btn"><i class="fas fa-bug"></i> Error Detected!</button>
            <div id="error-modal-overlay">
                <div id="error-modal">
                    <h2><i class="fas fa-exclamation-triangle"></i> JavaScript Error Details</h2>
                    <div id="error-modal-content">
                        <p><strong>Message:</strong> <span id="error-message"></span></p>
                        <p><strong>File:</strong> <span id="error-file"></span></p>
                        <p><strong>Location:</strong> Line <span id="error-line"></span>, Column <span id="error-col"></span></p>
                        <p><strong>Stack Trace:</strong></p>
                        <pre id="error-stack"></pre>
                    </div>
                    <div class="error-modal-actions">
                        <button id="error-copy-btn" class="error-modal-btn">Copy Details</button>
                        <button id="error-close-btn" class="error-modal-btn">Close</button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // Add event listeners for the modal
        const modalOverlay = document.getElementById('error-modal-overlay');
        document.getElementById('error-btn').addEventListener('click', () => {
            showErrorModal(errorDetails);
        });
        document.getElementById('error-close-btn').addEventListener('click', () => {
            modalOverlay.style.display = 'none';
        });
        document.getElementById('error-copy-btn').addEventListener('click', copyErrorDetails);
    }

    function showErrorModal(details) {
        if (!details) return;
        document.getElementById('error-message').textContent = details.message;
        document.getElementById('error-file').textContent = details.filename || 'N/A';
        document.getElementById('error-line').textContent = details.lineno || 'N/A';
        document.getElementById('error-col').textContent = details.colno || 'N/A';
        document.getElementById('error-stack').textContent = details.stack || 'No stack trace available.';
        document.getElementById('error-modal-overlay').style.display = 'block';
    }

    function copyErrorDetails() {
        const copyText = `
Error Message: ${errorDetails.message}
File: ${errorDetails.filename || 'N/A'}
Location: Line ${errorDetails.lineno || 'N/A'}, Column ${errorDetails.colno || 'N/A'}
---
Stack Trace:
${errorDetails.stack || 'No stack trace available.'}
        `;
        navigator.clipboard.writeText(copyText.trim()).then(() => {
            const copyBtn = document.getElementById('error-copy-btn');
            copyBtn.textContent = 'Copied!';
            setTimeout(() => { copyBtn.textContent = 'Copy Details'; }, 2000);
        });
    }

    const handleError = (details) => {
        console.error("Caught by global handler:", details);
        errorDetails = details;
        setupErrorUI(); // Ensure UI is ready
        document.getElementById('error-btn').style.display = 'block';
    };

    // Catch standard runtime errors
    window.addEventListener('error', (event) => {
        handleError({
            message: event.message,
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno,
            stack: event.error ? event.error.stack : 'N/A'
        });
    });

    // Catch unhandled promise rejections (e.g., from async/await or .then())
    window.addEventListener('unhandledrejection', (event) => {
        let message = 'Unhandled promise rejection.';
        let stack = 'No stack trace available.';
        if (event.reason instanceof Error) {
            message = event.reason.message;
            stack = event.reason.stack;
        } else {
            message = String(event.reason);
        }
        handleError({
            message: message,
            filename: "Promise",
            lineno: null,
            colno: null,
            stack: stack
        });
    });

})();
