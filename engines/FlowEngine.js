import { BaseEngine } from "../engines/BaseEngine.js";

export class FlowEngine extends BaseEngine {
  static NODE_HALF_WIDTH = 55;
  static NODE_HALF_HEIGHT = 30;
  static PADDING = 20;

  constructor(content) {
    super(content);
    this.content = content;
    this.container = null;
    this.svg = null;

    this.state = {
      nodes: [],
      connections: [],
      selectedObject: null, // { type: 'node'|'port'|'connection', ... }
      draggingNode: null,
      dragOffset: { x: 0, y: 0 }
    };
  }

  start(container) {
    this.container = container;
    super.start(container);
    container.innerHTML = "";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.setAttribute("height", "600");
    svg.style.border = "1px solid #ccc";
    svg.style.touchAction = "none";
    svg.style.background = "#9987ff";
    container.appendChild(svg);
    this.svg = svg;

    const rect = svg.getBoundingClientRect();
    const minX = FlowEngine.NODE_HALF_WIDTH + FlowEngine.PADDING;
    const maxX = rect.width - FlowEngine.NODE_HALF_WIDTH - FlowEngine.PADDING;
    const minY = FlowEngine.NODE_HALF_HEIGHT + FlowEngine.PADDING;
    const maxY = rect.height - FlowEngine.NODE_HALF_HEIGHT - FlowEngine.PADDING;

    if (!this.state.nodes || this.state.nodes.length === 0) {
      this.state.nodes = this.content.data.nodes.map(n => ({
        ...n,
        x: minX + Math.random() * (maxX - minX),
        y: minY + Math.random() * (maxY - minY)
      }));
    }

    svg.addEventListener("pointermove", e => this.onPointerMove(e));
    svg.addEventListener("pointerup", () => this.onPointerUp());
    svg.addEventListener("pointerleave", () => this.onPointerUp());

    this.render();
  }

  /* =========================
     UTIL
  ========================= */

  clampNodePosition(node) {
    const rect = this.svg.getBoundingClientRect();
    const minX = FlowEngine.NODE_HALF_WIDTH + FlowEngine.PADDING;
    const maxX = rect.width - FlowEngine.NODE_HALF_WIDTH - FlowEngine.PADDING;
    const minY = FlowEngine.NODE_HALF_HEIGHT + FlowEngine.PADDING;
    const maxY = rect.height - FlowEngine.NODE_HALF_HEIGHT - FlowEngine.PADDING;

    node.x = Math.min(Math.max(node.x, minX), maxX);
    node.y = Math.min(Math.max(node.y, minY), maxY);
  }

  findNode(id) {
    return this.state.nodes.find(n => n.id === id);
  }

  isConnectionValid(from, port, to) {
    const edges = this.content.data.edges || [];
    // ⚡ aceita port null se edge correspondente tiver port null ou undefined
    return edges.some(e =>
      (e.from === from && e.to === to && (e.port === port || (!e.port && !port))) //||
      // (e.from === to && e.to === from && (e.port === port || (!e.port && !port)))
    );
  }


  /* =========================
     RENDER
  ========================= */

  render() {
    this.svg.innerHTML = "";
    this.drawMarkers();

    this.state.connections.forEach(c => this.drawEdge(c));
    this.state.nodes.forEach(n => this.drawNode(n));

    this.drawLegend();
  }

  drawMarkers() {
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    const marker = document.createElementNS("http://www.w3.org/2000/svg", "marker");
    marker.setAttribute("id", "arrow");
    marker.setAttribute("markerWidth", "10");
    marker.setAttribute("markerHeight", "10");
    marker.setAttribute("refX", "10");
    marker.setAttribute("refY", "5");
    marker.setAttribute("orient", "auto");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", "M 0 0 L 10 5 L 0 10 z");
    path.setAttribute("fill", "#333");
    marker.appendChild(path);
    defs.appendChild(marker);
    this.svg.appendChild(defs);
  }

  drawEdge(conn) {
    const from = this.findNode(conn.from);
    const to = this.findNode(conn.to);
    if (!from || !to) return;

    const sx =
      conn.port === "yes" ? from.x + 50 :
        conn.port === "no" ? from.x - 50 :
          from.x + 55;
    const sy = from.y;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", sx);
    line.setAttribute("y1", sy);
    line.setAttribute("x2", to.x);
    line.setAttribute("y2", to.y);
    line.setAttribute(
      "stroke",
      this.state.selectedObject?.type === "connection" &&
        this.state.selectedObject.from === conn.from &&
        this.state.selectedObject.to === conn.to
        ? "#0d6efd"
        : conn.correct ? "green" : "red"
    );
    line.setAttribute("stroke-width", "2");
    line.setAttribute("marker-end", "url(#arrow)");

    // 🔹 conexão selecionável
    line.addEventListener("pointerdown", e => {
      e.stopPropagation();
      this.state.selectedObject = { type: "connection", from: conn.from, to: conn.to, port: conn.port };
      this.render();
    });

    this.svg.appendChild(line);

    // 🔹 renderizar relações associadas
    if (conn.relations && conn.relations.length > 0) {
      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      conn.relations.forEach((rel, idx) => {
        const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
        t.setAttribute("x", midX + 10);
        t.setAttribute("y", midY + idx * 14);
        t.setAttribute("font-size", "10");
        t.setAttribute("fill", "#000");
        t.textContent = rel;
        this.svg.appendChild(t);
      });
    }
  }

  hashStringToColor(str) {
    // Cria um hash simples baseado nos códigos dos caracteres
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    // Converte hash em cor hexadecimal
    const c = (hash & 0x00FFFFFF)
      .toString(16)
      .toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  }

  drawNode(node) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.style.cursor = "pointer";

    let shape;
    if (node.nodeType === "relation") {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      shape.setAttribute(
        "points",
        `${node.x},${node.y - 30} ${node.x + 50},${node.y} ${node.x},${node.y + 30} ${node.x - 50},${node.y}`
      );
      shape.setAttribute("fill", "#fff3cd");
    } else {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      shape.setAttribute("x", node.x - 55);
      shape.setAttribute("y", node.y - 24);
      shape.setAttribute("width", 110);
      shape.setAttribute("height", 48);
      shape.setAttribute("rx", 8);

      const fillMap = {
        start: "#cfe2ff",
        rule: "#e2e3e5",
        result: "#d1e7dd"
      };
      shape.setAttribute("fill", this.hashStringToColor(node.nodeType));
    }

    // 🔹 destaque visual se selecionado
    if (this.state.selectedObject?.type === "node" && this.state.selectedObject.nodeId === node.id) {
      shape.setAttribute("stroke", "#0d6efd");
      shape.setAttribute("stroke-width", "4");
    } else {
      shape.setAttribute("stroke", "#333");
      shape.setAttribute("stroke-width", "2");
    }

    g.appendChild(shape);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", node.x);
    text.setAttribute("y", node.y + 4);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "10");
    text.setAttribute("pointer-events", "none");
    text.textContent = node.label;
    g.appendChild(text);

    // 🔹 portas
    if (node.nodeType === "condition") {
      this.drawPort(g, node, "yes", node.x + 50, node.y, "SIM", "green");
      this.drawPort(g, node, "no", node.x - 50, node.y, "NÃO", "red");
    } else if (node.nodeType === "start" || node.nodeType === "rule") {
      this.drawPort(g, node, "next", node.x + 55, node.y, "→", "#0d6efd");
    }

    g.addEventListener("pointerdown", e => this.onNodePointerDown(e, node));
    this.svg.appendChild(g);
  }

  drawPort(group, node, port, x, y, label, color) {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", x);
    c.setAttribute("cy", y);
    c.setAttribute("r", 7);

    // 🔹 seleção de porta
    if (this.state.selectedObject?.type === "port" &&
      this.state.selectedObject.nodeId === node.id &&
      this.state.selectedObject.port === port) {
      c.setAttribute("fill", "#0d6efd");
    } else {
      c.setAttribute("fill", color);
    }

    c.addEventListener("pointerdown", e => {
      e.stopPropagation();
      this.state.selectedObject = { type: "port", nodeId: node.id, port };
      this.render();
    });

    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", x);
    t.setAttribute("y", y - 10);
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("font-size", "9");
    t.textContent = label;

    group.appendChild(c);
    group.appendChild(t);
  }

  drawLegend() {
    const items = [
      "1) Clique em SIM / NÃO / →",
      "2) Clique no nó de destino",
      "3) Clique na conexão e depois em relação",
      "Arraste nós para organizar",
      "Verde = correto | Vermelho = incorreto | Azul = selecionado"
    ];
    items.forEach((txt, i) => {
      const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
      t.setAttribute("x", 16);
      t.setAttribute("y", 20 + i * 16);
      t.setAttribute("font-size", "11");
      t.textContent = txt;
      this.svg.appendChild(t);
    });
  }

  /* =========================
     INTERAÇÃO
  ========================= */

  onNodePointerDown(e, node) {
    const sel = this.state.selectedObject;

    if (sel) {
      let from, to, port;
      console.log('Selecionado: ', sel);
      console.log('node', node);

      if (sel.type === "connection") {
        console.log('edges', this.content.data.edges)
        for (let i = 0; i < this.content.data.edges.length; i++) {
          const edge = this.content.data.edges[i];
          console.log(edge.from, sel.from)
          console.log(edge.to, sel.to)
          console.log(edge.relations, node.label)
          if (edge.from === sel.from && edge.to === sel.to && edge.relations.includes(node.label)) {
            console.log('connections:', this.state.connections);

            for (let j = 0; j < this.state.connections.length; j++) {
              const connection = this.state.connections[j];
              console.log('connection: ', connection);

              if (connection.from === sel.from && connection.to === sel.to) {
                if (!connection.relations.includes(node.label)) connection.relations.push(node.label);
              }
            }
          }
        }


      }

      if (sel.type === "port") {
        from = sel.nodeId;
        port = sel.port; // porta selecionada
        to = node.id;
      } else if (sel.type === "node") {
        from = sel.nodeId;
        port = null; // não há porta
        to = node.id;
      }

      // tenta inverter a ordem caso a validação funcione
      if (!this.isConnectionValid(from, port, to) && this.isConnectionValid(to, port, from)) {
        [from, to] = [to, from];
      }

      if (this.isConnectionValid(from, port, to)) {
        // adiciona connection com port opcional
        this.state.connections.push({ from, to, port: port || null, correct: true, relations: [] });
      }

      this.state.selectedObject = null;
      this.render();
      return;
    }

    // nenhum objeto selecionado → selecionar nó
    this.state.selectedObject = { type: "node", nodeId: node.id };
    this.state.draggingNode = node.id;
    this.state.dragOffset.x = e.offsetX - node.x;
    this.state.dragOffset.y = e.offsetY - node.y;
    this.render();
  }


  onPointerMove(e) {
    if (!this.state.draggingNode) return;
    const n = this.findNode(this.state.draggingNode);
    n.x = e.offsetX - this.state.dragOffset.x;
    n.y = e.offsetY - this.state.dragOffset.y;
    this.clampNodePosition(n);
    this.render();
  }

  onPointerUp() {
    super.saveState();
    this.state.draggingNode = null;
  }

  /* =========================
     ADICIONAR RELAÇÃO
  ========================= */

  addRelationToSelectedConnection(relationId) {
    const sel = this.state.selectedObject;
    if (!sel || sel.type !== "connection") return; // deve haver uma conexão selecionada

    // encontra a connection correspondente
    const conn = this.state.connections.find(c =>
      (c.from === sel.from && c.to === sel.to && c.port === sel.port) ||
      (c.from === sel.to && c.to === sel.from && c.port === sel.port)
    );

    if (!conn) return;

    if (!conn.relations) conn.relations = [];
    if (!conn.relations.includes(relationId)) {
      conn.relations.push(relationId);
      this.render();
    }
  }


  /* =========================
     EXPORT / IMPORT
  ========================= */

  exportState() {
    return {
      nodes: this.state.nodes,
      connections: this.state.connections
    };
  }

  importState(state) {
    if (state.nodes) this.state.nodes = state.nodes;
    if (state.connections) this.state.connections = state.connections;
  }
}
