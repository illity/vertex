export class MenuScreen {
  constructor(container, contents, onSelect) {
    this.container = container;
    this.contents = contents;
    this.onSelect = onSelect;

    this.currentPath = []; // ex: ["TI", "network"]
  }

  mount() {
    this.render();
  }

  render() {
    this.container.innerHTML = "";

    // Header / breadcrumb
    const header = document.createElement("h2");
    header.textContent = this.currentPath.length
      ? "📁 " + this.currentPath.join(" / ")
      : "Selecione o conteúdo";
    this.container.appendChild(header);

    // Botão voltar
    if (this.currentPath.length) {
      const backBtn = document.createElement("button");
      backBtn.textContent = "⬅ Voltar";
      backBtn.style.marginBottom = "12px";
      backBtn.onclick = () => {
        this.currentPath.pop();
        this.render();
      };
      this.container.appendChild(backBtn);
    }

    // Filtra conteúdos que pertencem ao path atual
    const visible = this.contents.filter(c =>
      this.currentPath.every((p, i) => c.path[i] === p)
    );

    // Descobre próximas pastas
    const folders = new Set();
    const items = [];

    visible.forEach(c => {
      if (c.path.length > this.currentPath.length) {
        folders.add(c.path[this.currentPath.length]);
      } else {
        items.push(c);
      }
    });

    // Renderiza pastas
    folders.forEach(folder => {
      const btn = document.createElement("button");
      btn.textContent = "📁 " + folder;
      btn.style.display = "block";
      btn.style.margin = "6px 0";
      btn.onclick = () => {
        this.currentPath.push(folder);
        this.render();
      };
      this.container.appendChild(btn);
    });

    // Renderiza conteúdos finais
    items.forEach(content => {
      const btn = document.createElement("button");
      btn.textContent = content.title + " — " + content.description;
      btn.style.display = "block";
      btn.style.margin = "6px 0";
      btn.onclick = () => this.onSelect(content);
      this.container.appendChild(btn);
    });
  }
}
