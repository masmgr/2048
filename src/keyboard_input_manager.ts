import { Direction } from "./game_manager";

export type DirectionFunction = (param?: Direction) => void;
export type ButtonPressFunction = (param: Event) => void;

export interface IKeyboardInputManager {
    events: { [name: string]: DirectionFunction[] };
    eventTouchstart: string;
    eventTouchmove: string;
    eventTouchend: string;

    on(event: string, callback: DirectionFunction): void;
    emit(event: string, data?: Direction): void;
    listen(): void;
    restart(event: Event): void;
    keepPlaying(event: Event): void;
    bindButtonPress(selector: string, fn: ButtonPressFunction): void;
}

export class KeyboardInputManager implements IKeyboardInputManager {
    events: { [name: string]: DirectionFunction[] };
    eventTouchstart: string;
    eventTouchmove: string;
    eventTouchend: string;

    constructor() {
        this.events = {};

        this.eventTouchstart = "touchstart";
        this.eventTouchmove = "touchmove";
        this.eventTouchend = "touchend";

        this.listen();
    }

    on(event: string, callback: DirectionFunction): void {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    emit(event: string, data?: Direction): void {
        const callbacks = this.events[event];
        if (callbacks) {
            callbacks.forEach((callback: DirectionFunction) => {
                callback(data);
            });
        }
    }

    listen(): void {
        const map: { [name: number]: Direction } = {
            38: Direction.Up, // Up
            39: Direction.Right, // Right
            40: Direction.Down, // Down
            37: Direction.Left, // Left
            75: Direction.Up, // Vim up
            76: Direction.Right, // Vim right
            74: Direction.Down, // Vim down
            72: Direction.Left, // Vim left
            87: Direction.Up, // W
            68: Direction.Right, // D
            83: Direction.Down, // S
            65: Direction.Left, // A
        };

        // Respond to direction keys
        document.addEventListener("keydown", (event: KeyboardEvent) => {
            const modifiers =
                event.altKey ||
                event.ctrlKey ||
                event.metaKey ||
                event.shiftKey;
            const mapped = map[event.which];

            if (!modifiers) {
                if (mapped !== undefined) {
                    event.preventDefault();
                    this.emit("move", mapped);
                }
            }

            // R key restarts the game
            if (!modifiers && event.which === 82) {
                this.restart.call(self, event);
            }
        });

        // Respond to button presses
        this.bindButtonPress(".retry-button", this.restart);
        this.bindButtonPress(".restart-button", this.restart);
        this.bindButtonPress(".keep-playing-button", this.keepPlaying);

        // Respond to swipe events
        let touchStartClientX: number, touchStartClientY: number;
        const gameContainer =
            document.getElementsByClassName("game-container")[0];

        gameContainer.addEventListener(this.eventTouchstart, ((
            event: TouchEvent
        ) => {
            if (event.touches.length > 1 || event.targetTouches.length > 1) {
                return; // Ignore if touching with more than 1 finger
            }

            touchStartClientX = event.touches[0].clientX;
            touchStartClientY = event.touches[0].clientY;

            event.preventDefault();
        }) as EventListener);

        gameContainer.addEventListener(this.eventTouchmove, ((
            event: TouchEvent
        ) => {
            event.preventDefault();
        }) as EventListener);

        gameContainer.addEventListener(this.eventTouchend, ((
            event: TouchEvent
        ) => {
            // Remove code msPointerEnabled
            if (event.touches.length > 0 || event.targetTouches.length > 0) {
                return; // Ignore if still touching with one or more fingers
            }

            const touchEndClientX = event.changedTouches[0].clientX;
            const touchEndClientY = event.changedTouches[0].clientY;

            const dx = touchEndClientX - touchStartClientX;
            const absDx = Math.abs(dx);

            const dy = touchEndClientY - touchStartClientY;
            const absDy = Math.abs(dy);

            if (Math.max(absDx, absDy) > 10) {
                let direction: Direction;

                if (absDx > absDy) {
                    if (dx > 0) {
                        direction = Direction.Right;
                    } else {
                        direction = Direction.Left;
                    }
                } else {
                    if (dy > 0) {
                        direction = Direction.Down;
                    } else {
                        direction = Direction.Up;
                    }
                }
                // (right : left) : (down : up)
                this.emit("move", direction);
            }
        }) as EventListener);
    }

    restart(event: Event): void {
        event.preventDefault();
        this.emit("restart");
    }

    keepPlaying(event: Event): void {
        event.preventDefault();
        this.emit("keepPlaying");
    }

    bindButtonPress(selector: string, fn: ButtonPressFunction): void {
        const button = document.querySelector(selector);
        button?.addEventListener("click", fn.bind(this));
        button?.addEventListener(this.eventTouchend, fn.bind(this));
    }
}
