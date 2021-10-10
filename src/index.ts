// Wait till the browser is ready to render the game (avoids glitches)
import { GameManager } from "./game_manager";

window.requestAnimationFrame(() => {
    new GameManager(4);
});
