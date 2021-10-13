import { assertIsDefined } from "./assert_function";
import { IGrid, Grid } from "./grid";
import { Position } from "./position";
import { MetaData } from "./serialize";
import { ITile, Tile } from "./tile";

export interface IHTMLActuator {
    tileContainer: HTMLElement;
    scoreContainer: HTMLElement;
    bestContainer: HTMLElement;
    messageContainer: HTMLElement;
    score: number;

    actuate(grid: IGrid, metadata: MetaData): void;
    continueGame(): void;
    clearContainer(container: HTMLElement): void;
    addTile(tile: ITile): void;
    applyClasses(element: HTMLElement, classes: string[]): void;
    normalizePosition(position: Position): Position;
    positionClass(position: Position): string;
    updateScore(score: number): void;
    updateBestScore(bestScore: number): void;
    message(won: boolean): void;
    clearMessage(): void;
}

export class HTMLActuator implements IHTMLActuator {
    tileContainer: HTMLElement;
    scoreContainer: HTMLElement;
    bestContainer: HTMLElement;
    messageContainer: HTMLElement;
    score: number;

    constructor() {
        this.tileContainer =
            document.querySelector<HTMLElement>(".tile-container")!;
        this.scoreContainer =
            document.querySelector<HTMLElement>(".score-container")!;
        this.bestContainer =
            document.querySelector<HTMLElement>(".best-container")!;
        this.messageContainer =
            document.querySelector<HTMLElement>(".game-message")!;

        this.score = 0;
    }

    actuate(grid: Grid, metadata: MetaData): void {
        window.requestAnimationFrame(() => {
            this.clearContainer(this.tileContainer);

            grid.cells.forEach((column: (Tile | null)[]) => {
                column.forEach((cell: Tile | null) => {
                    if (cell) {
                        this.addTile(cell);
                    }
                });
            });

            this.updateScore(metadata.score);
            this.updateBestScore(metadata.bestScore);

            if (metadata.terminated) {
                if (metadata.over) {
                    this.message(false); // You lose
                } else if (metadata.won) {
                    this.message(true); // You win!
                }
            }
        });
    }

    // Continues the game (both restart and keep playing)
    continueGame(): void {
        this.clearMessage();
    }

    clearContainer(container: HTMLElement): void {
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
    }

    addTile(tile: ITile): void {
        const wrapper = document.createElement("div");
        const inner = document.createElement("div");
        const position = tile.previousPosition || { x: tile.x, y: tile.y };
        const positionClass = this.positionClass(position);

        // We can't use classlist because it somehow glitches when replacing classes
        const classes = ["tile", "tile-" + tile.value, positionClass];

        if ((tile.value ?? 0) > 2048) {
            classes.push("tile-super");
        }

        this.applyClasses(wrapper, classes);

        inner.classList.add("tile-inner");
        inner.textContent = tile.value?.toString() ?? null;

        if (tile.previousPosition) {
            // Make sure that the tile gets rendered in the previous position first
            window.requestAnimationFrame(() => {
                classes[2] = this.positionClass({ x: tile.x, y: tile.y });
                this.applyClasses(wrapper, classes); // Update the position
            });
        } else if (tile.mergedFrom) {
            classes.push("tile-merged");
            this.applyClasses(wrapper, classes);

            // Render the tiles that merged
            tile.mergedFrom.forEach((merged: Tile) => {
                this.addTile(merged);
            });
        } else {
            classes.push("tile-new");
            this.applyClasses(wrapper, classes);
        }

        // Add the inner part of the tile to the wrapper
        wrapper.appendChild(inner);

        // Put the tile on the board
        this.tileContainer?.appendChild(wrapper);
    }

    applyClasses(element: HTMLElement, classes: string[]): void {
        element.setAttribute("class", classes.join(" "));
    }

    normalizePosition(position: Position): Position {
        return { x: position.x + 1, y: position.y + 1 };
    }

    positionClass(position: Position): string {
        position = this.normalizePosition(position);
        return "tile-position-" + position.x + "-" + position.y;
    }

    updateScore(score: number): void {
        this.clearContainer(this.scoreContainer);

        const difference = score - this.score;
        this.score = score;

        assertIsDefined(this.scoreContainer);
        this.scoreContainer.textContent = this.score.toString();

        if (difference > 0) {
            const addition = document.createElement("div");
            addition.classList.add("score-addition");
            addition.textContent = "+" + difference;

            this.scoreContainer?.appendChild(addition);
        }
    }

    updateBestScore(bestScore: number): void {
        assertIsDefined(this.bestContainer);
        this.bestContainer.textContent = bestScore.toString();
    }

    message(won: boolean): void {
        const type = won ? "game-won" : "game-over";
        const message = won ? "You win!" : "Game over!";

        this.messageContainer?.classList.add(type);
        assertIsDefined(this.messageContainer);
        this.messageContainer.getElementsByTagName("p")[0].textContent =
            message;
    }

    clearMessage(): void {
        // IE only takes one value to remove at a time.
        this.messageContainer?.classList.remove("game-won");
        this.messageContainer?.classList.remove("game-over");
    }
}
