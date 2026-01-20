import { MenuScreen } from "./MenuScreen.js";
import { GameScreen } from "../ui/GameScreen.js";
import { ClassificationEngine } from "../engines/ClassificationEngine.js";
import { MatchEngine } from "../engines/MatchEngine.js";

const app = document.getElementById("app");

// Lista de conteúdos disponíveis
const engineMap = {
  ClassificationEngine: ClassificationEngine,
  MatchEngine: MatchEngine
};

async function startMenu() {
  const res = await fetch("../content/index.json");
  const contents = await res.json();

  const menu = new MenuScreen(app, contents, startGame);
  menu.mount();
}

async function startGame(content) {
  const res = await fetch(`../content/${content.file}`);
  const json = await res.json();

  const engine = new engineMap[content.engine](json);
  const screen = new GameScreen(app, engine);
  screen.mount();
}


startMenu();
