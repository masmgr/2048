import { Position } from "./position";

export interface GameManagerInfo {
    grid: GridInfo;
    score: number;
    over: boolean;
    won: boolean;
    keepPlaying: boolean;
}

export interface GridInfo {
    size: number;
    cells: (TileInfo | null)[][];
}

export interface TileInfo {
    position: Position;
    value: number | null;
}

export interface MetaData {
    score: number;
    over: boolean;
    won: boolean;
    bestScore: number;
    terminated: boolean;
}
