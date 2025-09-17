export default class GamepadController {
    constructor() {
        this.gamepad = null;
        this.prevButtonStates = [];
        this.buttonMap = { A: 0, B: 1, LB: 4, RB: 5, LT: 6, RT: 7 };
        this.axisMap = { L_HOR: 0, L_VER: 1, R_HOR: 2, R_VER: 3 };

        // Callbacks for single-press events
        this.onA = null;
        this.onB = null;
        this.onRB = null;
        this.onLB = null;

        window.addEventListener('gamepadconnected', (e) => this._connect(e));
        window.addEventListener('gamepaddisconnected', () => this._disconnect());
    }

    _connect(e) {
        console.log('Gamepad connected:', e.gamepad.id);
        this.gamepad = e.gamepad;
        this.prevButtonStates = this.gamepad.buttons.map(b => b.pressed);
    }

    _disconnect() {
        console.log('Gamepad disconnected.');
        this.gamepad = null;
    }

    update() {
        if (!this.gamepad) return;

        const currentGamepad = navigator.getGamepads()[this.gamepad.index];
        if (!currentGamepad) return;

        const buttons = currentGamepad.buttons;

        // Check for single button presses
        if (buttons[this.buttonMap.A].pressed && !this.prevButtonStates[this.buttonMap.A] && this.onA) this.onA();
        if (buttons[this.buttonMap.B].pressed && !this.prevButtonStates[this.buttonMap.B] && this.onB) this.onB();
        if (buttons[this.buttonMap.RB].pressed && !this.prevButtonStates[this.buttonMap.RB] && this.onRB) this.onRB();
        if (buttons[this.buttonMap.LB].pressed && !this.prevButtonStates[this.buttonMap.LB] && this.onLB) this.onLB();

        // Store current state for next frame
        this.prevButtonStates = buttons.map(b => b.pressed);
    }
    
    // --- Getters for continuous input (sticks and triggers) ---
    getLeftStick() {
        if (!this.gamepad) return { x: 0, y: 0 };
        const gamepad = navigator.getGamepads()[this.gamepad.index];
        const x = gamepad.axes[this.axisMap.L_HOR];
        const y = gamepad.axes[this.axisMap.L_VER];
        return { x: Math.abs(x) > 0.1 ? x : 0, y: Math.abs(y) > 0.1 ? y : 0 }; // Deadzone
    }

    getRightStick() {
        if (!this.gamepad) return { x: 0, y: 0 };
        const gamepad = navigator.getGamepads()[this.gamepad.index];
        const x = gamepad.axes[this.axisMap.R_HOR];
        return { x: Math.abs(x) > 0.15 ? x : 0 }; // Deadzone
    }
    
    getTriggers() {
        if (!this.gamepad) return { lt: 0, rt: 0 };
        const gamepad = navigator.getGamepads()[this.gamepad.index];
        const lt = gamepad.buttons[this.buttonMap.LT].value;
        const rt = gamepad.buttons[this.buttonMap.RT].value;
        return { lt, rt };
    }
}
