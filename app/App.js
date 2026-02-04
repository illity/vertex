import { MenuScreen } from "./MenuScreen.js";
import { GameScreen } from "../ui/GameScreen.js";
import { ClassificationEngine } from "../engines/ClassificationEngine.js";
import { MatchEngine } from "../engines/MatchEngine.js";
import { FlowEngine } from "../engines/FlowEngine.js";

const app = document.getElementById("app");

// layout fixo
app.innerHTML = `
  <div id="controls"></div>
  <div id="screen"></div>
`;

const controls = document.getElementById("controls");
const screenContainer = document.getElementById("screen");

const engineMap = {
  ClassificationEngine,
  MatchEngine,
  FlowEngine
};

let currentContent = null;
let currentEngine = null;

// Base absoluta para fetch
const basePath =
  window.location.hostname === "localhost" ||
    window.location.protocol === "file:" ||
    window.location.hostname.includes("192.168.1")
    ? ""
    : `${window.location.origin}/vertex`;

async function startMenu() {
  controls.innerHTML = "";
  screenContainer.innerHTML = "";

  const url = `${basePath}/content/index.json`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error("Erro ao carregar index.json");
    return;
  }

  const contents = await res.json();
  const menu = new MenuScreen(screenContainer, contents, startGame);
  menu.mount();
}

async function startGame(content) {
  currentContent = content;

  const url = `${basePath}/${content.file}`;
  const res = await fetch(url);

  if (!res.ok) {
    console.error(`Erro ao carregar ${content.file}`);
    return;
  }

  const json = await res.json();
  mountGame(content, json);
}

function mountGame(content, json) {
  // limpa só a tela
  screenContainer.innerHTML = "";

  // cria engine nova
  currentEngine = new engineMap[content.engine](json);

  // botão restart (fixo)
  mountControls();

  const screen = new GameScreen(screenContainer, currentEngine);
  screen.mount();
}

function mountControls() {
  controls.innerHTML = "";

  const restartBtn = document.createElement("button");
  restartBtn.textContent = "Reiniciar";
  restartBtn.onclick = async () => {
    if (!currentContent) return;

    clearGameState(currentContent);

    const url = `${basePath}/${currentContent.file}`;
    const res = await fetch(url);
    const json = await res.json();

    mountGame(currentContent, json);
  };


  const menuBtn = document.createElement("button");
  menuBtn.textContent = "Voltar ao menu";
  menuBtn.onclick = startMenu;

  controls.append(restartBtn, menuBtn);
}

function clearGameState(content) {
  const key = `content:${content.type}:${content.title}`;
  localStorage.removeItem(key);
}


startMenu();
