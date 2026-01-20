import { MenuScreen } from "./MenuScreen.js";
import { GameScreen } from "../ui/GameScreen.js";
import { ClassificationEngine } from "../engines/ClassificationEngine.js";
import { MatchEngine } from "../engines/MatchEngine.js";

const app = document.getElementById("app");

// Lista de engines disponíveis
const engineMap = {
  ClassificationEngine: ClassificationEngine,
  MatchEngine: MatchEngine
};

// Detecta se está rodando localmente ou no GitHub Pages
// - Localhost: caminhos relativos normais
// - GitHub Pages: adiciona o nome do repositório
const basePath = window.location.hostname === "localhost" || window.location.protocol === "file:"
  ? ""
  : "/vertex"; // <--- Substitua "vertex" pelo nome do seu repositório se mudar

async function startMenu() {
  const res = await fetch(`${basePath}/content/index.json`);
  if (!res.ok) {
    console.error("Não foi possível carregar o index.json:", res.status, res.statusText);
    return;
  }
  const contents = await res.json();

  const menu = new MenuScreen(app, contents, startGame);
  menu.mount();
}

async function startGame(content) {
  const res = await fetch(`${basePath}/content/${content.file}`);
  if (!res.ok) {
    console.error(`Não foi possível carregar ${content.file}:`, res.status, res.statusText);
    return;
  }
  const json = await res.json();

  const engine = new engineMap[content.engine](json);
  const screen = new GameScreen(app, engine);
  screen.mount();
}

startMenu();
