export class GameScreen {
  constructor(container, engine) {
    this.container = container;
    this.engine = engine;
  }

  mount() {
    try {
      // Inicializa engine
      this.engine.start?.(this.container);
    } catch (err) {
      console.error("Erro ao montar GameScreen:", err);
      this.container.innerHTML = "<p>Erro ao carregar o jogo.</p>";
    }
  }

  update() {
    // Permite que a engine atualize a renderização
    try {
      this.engine.render?.(this.container);
    } catch (err) {
      console.error("Erro ao atualizar GameScreen:", err);
    }
  }

  unmount() {
    // Opcional: se a engine tiver listeners, ela pode limpá-los aqui
    this.engine.unmount?.();
    this.container.innerHTML = "";
  }
}
