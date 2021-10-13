import { GameManagerInfo } from "./serialize";

export interface ILocalStorageManager {
    bestScoreKey: string;
    gameStateKey: string;
    storage: Storage;

    localStorageSupported(): boolean;
    getBestScore(): number;
    setBestScore(score: number): void;
    getGameState(): GameManagerInfo | null;
    setGameState(gameState: GameManagerInfo): void;
    clearGameState(): void;
}

export class LocalStorageManager implements ILocalStorageManager {
    bestScoreKey: string;
    gameStateKey: string;
    storage: Storage;

    constructor() {
        this.bestScoreKey = "bestScore";
        this.gameStateKey = "gameState";

        this.storage = window.localStorage;
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
