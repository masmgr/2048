import { GameManagerInfo } from "./game_manager";

class FakeStorage implements Storage {
    _data: { [name: string]: string | null };
    readonly length: number; // not use.

    constructor() {
        this._data = {};
        this.length = 0;
    }

    setItem(id: string, val: string): string {
        return (this._data[id] = String(val));
    }

    getItem(id: string): string | null {
        // eslint-disable-next-line no-prototype-builtins
        return this._data.hasOwnProperty(id) ? this._data[id] : null;
    }
    removeItem(id: string): boolean {
        return delete this._data[id];
    }

    clear(): { [name: string]: string | null } {
        return (this._data = {});
    }

    key(index: number): string | null {
        return null;
    }
}

declare global {
    interface Window {
        fakeStorage: FakeStorage;
    }
}

export class LocalStorageManager {
    bestScoreKey: string;
    gameStateKey: string;
    storage: Storage;

    constructor() {
        this.bestScoreKey = "bestScore";
        this.gameStateKey = "gameState";

        const supported = this.localStorageSupported();
        this.storage = supported ? window.localStorage : window.fakeStorage;
    }

    localStorageSupported(): boolean {
        const testKey = "test";

        try {
            const storage = window.localStorage;
            storage.setItem(testKey, "1");
            storage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    // Best score getters/setters
    getBestScore(): number {
        return parseInt(this.storage.getItem(this.bestScoreKey) ?? "0", 10);
    }

    setBestScore(score: number): void {
        this.storage.setItem(this.bestScoreKey, score.toString());
    }

    // Game state getters/setters and clearing
    getGameState(): GameManagerInfo | null {
        const stateJSON = this.storage.getItem(this.gameStateKey);
        return stateJSON ? (JSON.parse(stateJSON) as GameManagerInfo) : null;
    }

    setGameState(gameState: GameManagerInfo): void {
        this.storage.setItem(this.gameStateKey, JSON.stringify(gameState));
    }

    clearGameState(): void {
        this.storage.removeItem(this.gameStateKey);
    }
}
