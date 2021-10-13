import { Position } from "./position";
import { TileInfo } from "./serialize";

export interface ITile {
    x: number;
    y: number;
    value: number | null;
    previousPosition: Position | null;
    mergedFrom: ITile[] | null;

    savePosition(): void;
    updatePosition(position: Position): void;
    serialize(): TileInfo;
}

export class Tile implements ITile {
    x: number;
    y: number;
    value: number | null;
    previousPosition: Position | null;
    mergedFrom: ITile[] | null;

    constructor(position: Position, value: number | null) {
        this.x = position.x;
        this.y = position.y;
        this.value = value ?? 2;

        this.previousPosition = null;
        this.mergedFrom = null; // Tracks tiles that merged together
    }

    savePosition(): void {
        this.previousPosition = { x: this.x, y: this.y };
    }

    updatePosition(position: Position): void {
        this.x = position.x;
        this.y = position.y;
    }

    serialize(): TileInfo {
        return {
            position: {
                x: this.x,
                y: this.y,
            },
            value: this.value,
        };
    }
}
