export class MenuScreen {
  constructor(container, contents, onSelect) {
    this.container = container;
    this.contents = contents; // array de conteúdos {id, title, description, engineClass, path}
    this.onSelect = onSelect; // callback quando selecionar
  }

  mount() {
    this.render();
  }

  render() {
    this.container.innerHTML = "";

    const header = document.createElement("h2");
    header.textContent = "Selecione o conteúdo";
    this.container.appendChild(header);

    this.contents.forEach(content => {
      const btn = document.createElement("button");
      btn.textContent = content.title + " - " + content.description;
      btn.style.display = "block";
      btn.style.margin = "8px 0";
      btn.onclick = () => this.onSelect(content);
      this.container.appendChild(btn);
    });
  }
}
