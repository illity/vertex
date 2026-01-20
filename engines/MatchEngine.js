export class MatchEngine {
  constructor(content, primaryKey) {
    console.log(content)
    this.content = content;
    this.primaryKey = 'primary';
    this.container = null;

    this.state = {
      columns: [],
      columnItems: {},   // { coluna: [valores] }
      correctMatches: {} // "primary|valor" -> {coluna: valor}
    };

    this.connections = [];
    this.dragging = null;
  }

  start(container) {
    this.container = container;
    if (!this.content?.data?.length) return;

    // Extrai todas as chaves de forma limpa
    let keys = Object.keys(this.content.data[0]).filter(k => k != null);
    let otherCols = keys.filter(k => k !== this.primaryKey);

    // Ordena colunas conforme regra: 3 → primária centro, 2 → primária esquerda
    let columns;
    if (otherCols.length === 2) columns = [otherCols[0], this.primaryKey, otherCols[1]];
    else if (otherCols.length === 1) columns = [this.primaryKey, otherCols[0]];
    else if (otherCols.length === 0) columns = [this.primaryKey];
    else columns = [this.primaryKey, ...otherCols];

    // Cria valores únicos por coluna, mas **somente os valores que realmente existem para cada coluna**
    const columnItems = {};
    columns.forEach(col => {
      const vals = [];
      this.content.data.forEach(d => {
        if (d[col] != null && !vals.includes(d[col])) vals.push(d[col]);
      });
      columnItems[col] = vals;
    });

    // Correspondência correta
    const correctMatches = {};
    this.content.data.forEach(d => {
      const key = `${this.primaryKey}|${d[this.primaryKey]}`;
      correctMatches[key] = {};
      Object.keys(d).forEach(k => {
        if (k !== this.primaryKey) correctMatches[key][k] = d[k];
      });
    });

    this.state = { columns, columnItems, correctMatches };
    this.render();
  }

  // Função utilitária para embaralhar array
  shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  render() {
    const container = this.container;
    container.innerHTML = "";

    // SVG para linhas
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.style.position = "absolute";
    svg.style.top = "0";
    svg.style.left = "0";
    svg.style.width = "100%";
    svg.style.height = "100%";
    svg.style.pointerEvents = "none";
    container.appendChild(svg);
    this.svg = svg;

    // Colunas
    const columnsDiv = document.createElement("div");
    columnsDiv.style.display = "flex";
    columnsDiv.style.gap = "16px";
    columnsDiv.style.position = "relative";
    container.appendChild(columnsDiv);

    this.state.columns.forEach(col => {
      const colDiv = document.createElement("div");
      colDiv.style.flex = "1";
      colDiv.style.border = "2px dashed #aaa";
      colDiv.style.padding = "8px";
      colDiv.style.borderRadius = "4px";
      colDiv.style.minHeight = "200px";

      const label = document.createElement("div");
      label.textContent = col;
      label.style.fontWeight = "bold";
      label.style.marginBottom = "8px";
      colDiv.appendChild(label);

      // 🔹 Embaralhar os valores antes de renderizar
      const shuffledValues = this.shuffleArray([...this.state.columnItems[col]]);

      shuffledValues.forEach(val => {
        const itemDiv = document.createElement("div");
        itemDiv.textContent = val;
        itemDiv.style.padding = "4px 8px";
        itemDiv.style.margin = "2px 0";
        itemDiv.style.border = "1px solid #333";
        itemDiv.style.borderRadius = "4px";
        itemDiv.style.background = "#fff";
        itemDiv.style.cursor = "pointer";
        itemDiv.dataset.col = col;
        itemDiv.dataset.value = val;

        itemDiv.onmousedown = e => this.startConnection(e, col, val);
        itemDiv.onmouseup = e => this.endConnection(e, col, val);

        colDiv.appendChild(itemDiv);
      });

      columnsDiv.appendChild(colDiv);
    });

    this.updateConnections();
  }


  startConnection(event, col, value) {
    event.preventDefault();
    this.dragging = { col, value, x: event.clientX, y: event.clientY, connected: false };
    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("stroke", "black");
    line.setAttribute("stroke-width", "2");
    this.svg.appendChild(line);
    this.dragging.line = line;

    const mouseMoveHandler = e => {
      line.setAttribute("x1", this.dragging.x);
      line.setAttribute("y1", this.dragging.y);
      line.setAttribute("x2", e.clientX);
      line.setAttribute("y2", e.clientY);
    };

    const mouseUpHandler = e => {
      document.removeEventListener("mousemove", mouseMoveHandler);
      document.removeEventListener("mouseup", mouseUpHandler);
      if (!this.dragging.connected) this.svg.removeChild(line);
      this.dragging = null;
    };

    document.addEventListener("mousemove", mouseMoveHandler);
    document.addEventListener("mouseup", mouseUpHandler);
  }

  endConnection(event, col, value) {
    if (!this.dragging) return;
    if (this.dragging.col === col) return;

    let status = "wrong";

    // 1️⃣ Primária como origem
    if (this.dragging.col === this.primaryKey) {
      const key = `${this.primaryKey}|${this.dragging.value}`;
      if (
        this.state.correctMatches[key] &&
        this.state.correctMatches[key][col] === value
      ) {
        status = "correct";
      }
    }
    // 2️⃣ Primária como destino
    else if (col === this.primaryKey) {
      // Encontrar a chave do primary no objeto onde primary = value do destino
      const dataItem = this.content.data.find(d => d[this.primaryKey] === value);
      if (dataItem && dataItem[this.dragging.col] === this.dragging.value) {
        status = "correct";
      }
    }
    // 3️⃣ Ligação entre colunas secundárias (não-primary)
    else {
      // Opcional: não validar, ou você pode implementar validação entre colunas secundárias
      status = "wrong";
    }

    this.connections.push({
      from: { col: this.dragging.col, value: this.dragging.value },
      to: { col, value },
      status
    });

    this.dragging.connected = true;
    this.updateConnections();
  }


  updateConnections() {
    this.svg.innerHTML = "";

    // Mapear índice das colunas para saber direção
    const colIndex = {};
    this.state.columns.forEach((col, i) => colIndex[col] = i);

    this.connections.forEach(conn => {
      const fromEl = this.findItemElement(conn.from.col, conn.from.value);
      const toEl = this.findItemElement(conn.to.col, conn.to.value);
      if (!fromEl || !toEl) return;

      const fromRect = fromEl.getBoundingClientRect();
      const toRect = toEl.getBoundingClientRect();
      const svgRect = this.svg.getBoundingClientRect();

      // Determinar direção
      const fromIdx = colIndex[conn.from.col];
      const toIdx = colIndex[conn.to.col];

      // Se for para a direita, sai da direita; se para a esquerda, sai da esquerda
      const x1 = fromIdx < toIdx
        ? fromRect.right - svgRect.left
        : fromRect.left - svgRect.left;
      const y1 = fromRect.top + fromRect.height / 2 - svgRect.top;

      const x2 = fromIdx < toIdx
        ? toRect.left - svgRect.left
        : toRect.right - svgRect.left;
      const y2 = toRect.top + toRect.height / 2 - svgRect.top;

      const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
      line.setAttribute("x1", x1);
      line.setAttribute("y1", y1);
      line.setAttribute("x2", x2);
      line.setAttribute("y2", y2);
      line.setAttribute("stroke", conn.status === "correct" ? "green" : "red");
      line.setAttribute("stroke-width", "2");
      this.svg.appendChild(line);

      // Fundo colorido dos itens
      const bg = conn.status === "correct"
        ? "rgba(0,255,0,0.2)"
        : "rgba(255,0,0,0.2)";
      fromEl.style.background = bg;
      toEl.style.background = bg;
    });
  }


  findItemElement(col, value) {
    return this.container.querySelector(`[data-col="${col}"][data-value="${value}"]`);
  }
}
