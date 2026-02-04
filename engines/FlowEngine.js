import { BaseEngine } from "../engines/BaseEngine.js";

export class FlowEngine extends BaseEngine{
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
      selectedPort: null, // { nodeId, port }
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
    svg.style.background = "#fafafa";

    container.appendChild(svg);
    this.svg = svg;

    // ⚠️ precisa do SVG no DOM antes
    const rect = svg.getBoundingClientRect();

    const minX = FlowEngine.NODE_HALF_WIDTH + FlowEngine.PADDING;
    const maxX = rect.width - FlowEngine.NODE_HALF_WIDTH - FlowEngine.PADDING;
    const minY = FlowEngine.NODE_HALF_HEIGHT + FlowEngine.PADDING;
    const maxY = rect.height - FlowEngine.NODE_HALF_HEIGHT - FlowEngine.PADDING;

    // 🔥 ONLY generate nodes if no saved state
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
    line.setAttribute("stroke", conn.correct ? "green" : "red");
    line.setAttribute("stroke-width", "2");
    line.setAttribute("marker-end", "url(#arrow)");

    this.svg.appendChild(line);
  }

  drawNode(node) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.style.cursor = "pointer";

    let shape;

    if (node.nodeType === "condition") {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      shape.setAttribute(
        "points",
        `${node.x},${node.y - 30}
         ${node.x + 50},${node.y}
         ${node.x},${node.y + 30}
         ${node.x - 50},${node.y}`
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

      shape.setAttribute("fill", fillMap[node.nodeType] || "#eee");
    }

    shape.setAttribute("stroke", "#333");
    shape.setAttribute("stroke-width", "2");
    g.appendChild(shape);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", node.x);
    text.setAttribute("y", node.y + 4);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", "10");
    text.setAttribute("pointer-events", "none");
    text.textContent = node.label;
    g.appendChild(text);

    if (node.nodeType === "condition") {
      this.drawPort(g, node, "yes", node.x + 50, node.y, "SIM", "green");
      this.drawPort(g, node, "no", node.x - 50, node.y, "NÃO", "red");
    }

    if (node.nodeType === "start" || node.nodeType === "rule") {
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
    c.setAttribute(
      "fill",
      this.state.selectedPort?.nodeId === node.id &&
        this.state.selectedPort?.port === port
        ? "#000"
        : color
    );

    c.addEventListener("pointerdown", e => {
      e.stopPropagation();
      this.state.selectedPort = { nodeId: node.id, port };
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
      "Arraste nós para organizar",
      "Verde = correto | Vermelho = incorreto"
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
    if (this.state.selectedPort) {
      const { nodeId, port } = this.state.selectedPort;
      this.state.selectedPort = null;
      this.createConnection(nodeId, port, node.id);
      this.render();
      return;
    }

    this.state.draggingNode = node.id;
    this.state.dragOffset.x = e.offsetX - node.x;
    this.state.dragOffset.y = e.offsetY - node.y;
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
     LÓGICA
  ========================= */

  createConnection(from, port, to) {
    const correct = this.content.data.edges.some(e =>
      (
        e.from === from &&
        e.to === to &&
        e.port === port
      ) ||
      (
        e.from === to &&
        e.to === from &&
        e.port === port
      )
    );

    if (!correct) return;

    this.state.connections.push({ from, to, port, correct });
    super.saveState(); // ✅
  }
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
