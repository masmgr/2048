import { assertIsDefined } from "./assert_function";
import { IGrid, Grid } from "./grid";
import { IHTMLActuator, HTMLActuator } from "./html_actuator";
import {
    IKeyboardInputManager,
    KeyboardInputManager,
} from "./keyboard_input_manager";
import {
    ILocalStorageManager,
    LocalStorageManager,
} from "./local_storage_manager";
import { Position } from "./position";
import { GameManagerInfo } from "./serialize";
import { ITile, Tile } from "./tile";

export const Direction = {
    Up: 0,
    Right: 1,
    Down: 2,
    Left: 3,
} as const;
export type Direction = typeof Direction[keyof typeof Direction];

export interface Cell {
    x: number;
    y: number;
}

export const VectorDirection = {
    Zero: 0,
    Plus: 1,
    Minus: -1,
} as const;

export interface Vector {
    x: number;
    y: number;
}

export interface Traversals {
    x: number[];
    y: number[];
}

export interface FarthestPosition {
    farthest: Cell;
    next: Cell;
}

export interface IGameManager {
    size: number;
    inputManager: IKeyboardInputManager;
    storageManager: ILocalStorageManager;
    actuator: IHTMLActuator;
    startTiles: number;
    grid: IGrid;
    score: number;
    over: boolean;
    won: boolean;
    keepPlaying: boolean;

    restart(): void;
    keepPlay(): void;
    isGameTerminated(): boolean;
    setup(): void;
    addStartTiles(): void;
    addRandomTile(): void;
    actuate(): void;
    serialize(): GameManagerInfo;
    prepareTiles(): void;
    moveTile(tile: ITile, cell: Cell): void;
    move(direction?: Direction): void;
    getVector(direction: Direction): Vector;
    buildTraversals(vector: Vector): Traversals;
    findFarthestPosition(cell: Cell, vector: Vector): FarthestPosition;
    movesAvailable(): boolean;
    tileMatchesAvailable(): boolean;
    positionsEqual(first: Position, second: Position): boolean;
}

export class GameManager implements IGameManager {
    size: number;
    inputManager: IKeyboardInputManager;
    storageManager: ILocalStorageManager;
    actuator: IHTMLActuator;
    startTiles: number;
    grid: IGrid;
    score: number;
    over: boolean;
    won: boolean;
    keepPlaying: boolean;

    constructor(size: number) {
        this.size = size; // Size of the grid
        this.inputManager = new KeyboardInputManager();
        this.storageManager = new LocalStorageManager();
        this.actuator = new HTMLActuator();

        this.startTiles = 2;

        this.inputManager.on("move", this.move.bind(this));
        this.inputManager.on("restart", this.restart.bind(this));
        this.inputManager.on("keepPlaying", this.keepPlay.bind(this));

        this.grid = new Grid(this.size);
        this.score = 0;
        this.over = false;
        this.won = false;
        this.keepPlaying = false;

        this.setup();
    }

    // Restart the game
    restart(): void {
        this.storageManager.clearGameState();
        this.actuator.continueGame(); // Clear the game won/lost message
        this.setup();
    }

    // Keep playing after winning (allows going over 2048)
    keepPlay(): void {
        this.keepPlaying = true;
        this.actuator.continueGame(); // Clear the game won/lost message
    }

    // Return true if the game is lost, or has won and the user hasn't kept playing
    isGameTerminated(): boolean {
        return this.over || (this.won && !this.keepPlaying);
    }

    // Set up the game
    setup(): void {
        const previousState = this.storageManager.getGameState();

        // Reload the game from a previous game if present
        if (previousState) {
            this.grid = new Grid(
                previousState.grid.size,
                previousState.grid.cells
            ); // Reload grid
            this.score = previousState.score;
            this.over = previousState.over;
            this.won = previousState.won;
            this.keepPlaying = previousState.keepPlaying;
        } else {
            this.grid = new Grid(this.size);
            this.score = 0;
            this.over = false;
            this.won = false;
            this.keepPlaying = false;

            // Add the initial tiles
            this.addStartTiles();
        }

        // Update the actuator
        this.actuate();
    }

    // Set up the initial tiles to start the game with
    addStartTiles(): void {
        for (let i = 0; i < this.startTiles; i++) {
            this.addRandomTile();
        }
    }

    // Adds a tile in a random position
    addRandomTile(): void {
        if (this.grid.cellsAvailable()) {
            const value = Math.random() < 0.9 ? 2 : 4;
            const tile = new Tile(this.grid.randomAvailableCell(), value);

            this.grid.insertTile(tile);
        }
    }

    // Sends the updated grid to the actuator
    actuate(): void {
        if (this.storageManager.getBestScore() < this.score) {
            this.storageManager.setBestScore(this.score);
        }

        // Clear the state when the game is over (game over only, not win)
        if (this.over) {
            this.storageManager.clearGameState();
        } else {
            this.storageManager.setGameState(this.serialize());
        }

        this.actuator.actuate(this.grid, {
            score: this.score,
            over: this.over,
            won: this.won,
            bestScore: this.storageManager.getBestScore(),
            terminated: this.isGameTerminated(),
        });
    }

    // Represent the current game as an object
    serialize(): GameManagerInfo {
        return {
            grid: this.grid.serialize(),
            score: this.score,
            over: this.over,
            won: this.won,
            keepPlaying: this.keepPlaying,
        };
    }

    // Save all tile positions and remove merger info
    prepareTiles(): void {
        this.grid.eachCell((x, y, tile) => {
            if (tile) {
                tile.mergedFrom = null;
                tile.savePosition();
            }
        });
    }

    // Move a tile and its representation
    moveTile(tile: ITile, cell: Cell): void {
        this.grid.cells[tile.x][tile.y] = null;
        this.grid.cells[cell.x][cell.y] = tile;
        tile.updatePosition(cell);
    }

    // Move tiles on the grid in the specified direction
    move(direction?: Direction): void {
        assertIsDefined(direction);
        // 0: up, 1: right, 2: down, 3: left
        if (this.isGameTerminated()) return; // Don't do anything if the game's over

        let cell: Cell, tile: ITile | null;

        const vector = this.getVector(direction);
        const traversals = this.buildTraversals(vector);
        let moved = false;

        // Save the current tile positions and remove merger information
        this.prepareTiles();

        // Traverse the grid in the right direction and move tiles
        traversals.x.forEach((x) => {
            traversals.y.forEach((y) => {
                cell = { x: x, y: y };
                tile = this.grid.cellContent(cell);

                if (tile) {
                    const positions = this.findFarthestPosition(cell, vector);
                    const next = this.grid.cellContent(positions.next);

                    // Only one merger per row traversal?
                    if (next && next.value === tile.value && !next.mergedFrom) {
                        const merged = new Tile(
                            positions.next,
                            (tile?.value ?? 0) * 2
                        );
                        merged.mergedFrom = [tile, next];

                        this.grid.insertTile(merged);
                        this.grid.removeTile(tile);

                        // Converge the two tiles' positions
                        tile.updatePosition(positions.next);

                        // Update the score
                        this.score += merged.value ?? 0;

                        // The mighty 2048 tile
                        if (merged.value === 2048) this.won = true;
                    } else {
                        this.moveTile(tile, positions.farthest);
                    }

                    if (!this.positionsEqual(cell, tile)) {
                        moved = true; // The tile moved from its original cell!
                    }
                }
            });
        });

        if (moved) {
            this.addRandomTile();

            if (!this.movesAvailable()) {
                this.over = true; // Game over!
            }

            this.actuate();
        }
    }

    // Get the vector representing the chosen direction
    getVector(direction: Direction): Vector {
        // Vectors representing tile movement
        const map: { [name: number]: Vector } = {
            0: { x: VectorDirection.Zero, y: VectorDirection.Minus }, // Up
            1: { x: VectorDirection.Plus, y: VectorDirection.Zero }, // Right
            2: { x: VectorDirection.Zero, y: VectorDirection.Plus }, // Down
            3: { x: VectorDirection.Minus, y: VectorDirection.Zero }, // Left
        };

        return map[direction];
    }

    // Build a list of positions to traverse in the right order
    buildTraversals(vector: Vector): Traversals {
        const traversals: Traversals = {
            x: [],
            y: [],
        };

        for (let pos = 0; pos < this.size; pos++) {
            traversals.x.push(pos);
            traversals.y.push(pos);
        }

        // Always traverse from the farthest cell in the chosen direction
        if (vector.x === 1) traversals.x = traversals.x.reverse();
        if (vector.y === 1) traversals.y = traversals.y.reverse();

        return traversals;
    }

    findFarthestPosition(cell: Cell, vector: Vector): FarthestPosition {
        let previous: Cell;

        // Progress towards the vector direction until an obstacle is found
        do {
            previous = cell;
            cell = { x: previous.x + vector.x, y: previous.y + vector.y };
        } while (this.grid.withinBounds(cell) && this.grid.cellAvailable(cell));

        return {
            farthest: previous,
            next: cell, // Used to check if a merge is required
        };
    }

    movesAvailable(): boolean {
        return this.grid.cellsAvailable() || this.tileMatchesAvailable();
    }

    // Check for available matches between tiles (more expensive check)
    tileMatchesAvailable(): boolean {
        let tile;

        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                tile = this.grid.cellContent({ x: x, y: y });

                if (tile) {
                    for (const direction of [
                        Direction.Up,
                        Direction.Right,
                        Direction.Down,
                        Direction.Left,
                    ]) {
                        const vector = this.getVector(direction);
                        const cell: Cell = { x: x + vector.x, y: y + vector.y };

                        const other = this.grid.cellContent(cell);

                        if (other && other.value === tile.value) {
                            return true; // These two tiles can be merged
                        }
                    }
                }
            }
        }

        return false;
    }

    positionsEqual(first: Position, second: Position): boolean {
        return first.x === second.x && first.y === second.y;
    }
}
