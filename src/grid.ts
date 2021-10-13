import { Cell } from "./game_manager";
import { Position } from "./position";
import { GridInfo, TileInfo } from "./serialize";
import { ITile, Tile } from "./tile";

export type eachCellFunction = (
    x: number,
    y: number,
    tile: ITile | null
) => void;

export interface IGrid {
    size: number;
    cells: (ITile | null)[][];

    empty(): ITile[][];
    fromState(state: (TileInfo | null)[][]): ITile[][];
    randomAvailableCell(): Cell;
    availableCells(): Cell[];
    eachCell(callback: eachCellFunction): void;
    cellsAvailable(): boolean;
    cellAvailable(cell: Cell): boolean;
    cellOccupied(cell: Cell): boolean;
    cellContent(cell: Cell): ITile | null;
    insertTile(tile: ITile): void;
    removeTile(tile: ITile): void;
    withinBounds(position: Position): boolean;
    serialize(): GridInfo;
}

export class Grid implements IGrid {
    size: number;
    cells: (ITile | null)[][];

    constructor(size: number, previousState?: (TileInfo | null)[][]) {
        this.size = size;
        this.cells = previousState
            ? this.fromState(previousState)
            : this.empty();
    }

    // Build a grid of the specified size
    empty(): ITile[][] {
        const cells: ITile[][] = [];

        for (let x = 0; x < this.size; x++) {
            const row: (ITile | null)[] = (cells[x] = []);

            for (let y = 0; y < this.size; y++) {
                row.push(null);
            }
        }

        return cells;
    }

    fromState(state: (TileInfo | null)[][]): ITile[][] {
        const cells: ITile[][] = [];

        for (let x = 0; x < this.size; x++) {
            const row: (ITile | null)[] = (cells[x] = []);

            for (let y = 0; y < this.size; y++) {
                const tile = state[x][y];
                if (tile) {
                    const position = { x: tile.position.x, y: tile.position.y };
                    row.push(new Tile(position, tile.value));
                } else {
                    row.push(null);
                }
            }
        }

        return cells;
    }

    // Find the first available random position
    randomAvailableCell(): Cell {
        const cells: Cell[] = this.availableCells();

        return cells[Math.floor(Math.random() * cells.length)];
    }

    availableCells(): Cell[] {
        const cells: Cell[] = [];

        this.eachCell((x, y, tile) => {
            if (!tile) {
                cells.push({ x: x, y: y });
            }
        });

        return cells;
    }

    // Call callback for every cell
    eachCell(callback: eachCellFunction): void {
        for (let x = 0; x < this.size; x++) {
            for (let y = 0; y < this.size; y++) {
                callback(x, y, this.cells[x][y]);
            }
        }
    }

    // Check if there are any cells available
    cellsAvailable(): boolean {
        return !!this.availableCells().length;
    }

    // Check if the specified cell is taken
    cellAvailable(cell: Cell): boolean {
        return !this.cellOccupied(cell);
    }

    cellOccupied(cell: Cell): boolean {
        return !!this.cellContent(cell);
    }

    cellContent(cell: Cell): Tile | null {
        if (this.withinBounds(cell)) {
            return this.cells[cell.x][cell.y];
        } else {
            return null;
        }
    }

    // Inserts a tile at its position
    insertTile(tile: ITile): void {
        this.cells[tile.x][tile.y] = tile;
    }

    removeTile(tile: ITile): void {
        this.cells[tile.x][tile.y] = null;
    }

    withinBounds(position: Position): boolean {
        return (
            position.x >= 0 &&
            position.x < this.size &&
            position.y >= 0 &&
            position.y < this.size
        );
    }

    serialize(): GridInfo {
        const cellState: (TileInfo | null)[][] = [];

        for (let x = 0; x < this.size; x++) {
            const row: (TileInfo | null)[] = (cellState[x] = []);

            for (let y = 0; y < this.size; y++) {
                row.push(this?.cells[x][y]?.serialize() ?? null);
            }
        }

        return {
            size: this.size,
            cells: cellState,
        };
    }
}
