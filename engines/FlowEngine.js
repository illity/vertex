import { BaseEngine } from "../engines/BaseEngine.js";

export class FlowEngine extends BaseEngine {
  // =========================
  // Tamanhos base (serão escalados)
  // =========================
  static BASE_NODE_HALF_WIDTH = 20;
  static BASE_NODE_HALF_HEIGHT = 15;
  static BASE_PADDING = 20;
  static BASE_FONT_NODE = 12;
  static BASE_FONT_PORT = 10;
  static BASE_FONT_LEGEND = 11;
  static BASE_PORT_RADIUS = 7;
  static BASE_EDGE_WIDTH = 2;
  static BASE_EDGE_MARKER_SIZE = 15;

  constructor(content) {
    super(content);
    this.content = content;
    this.container = null;
    this.svg = null;

    this.state = {
      nodes: [],
      connections: [],
      selectedObject: null,
      draggingNode: null,
      dragOffset: { x: 0, y: 0 }
    };

    this.scale = 1; // será recalculada
    window.addEventListener("resize", () => this.onResize());
  }

  get NODE_HALF_WIDTH() { return FlowEngine.BASE_NODE_HALF_WIDTH * this.scale; }
  get NODE_HALF_HEIGHT() { return FlowEngine.BASE_NODE_HALF_HEIGHT * this.scale; }
  get PADDING() { return FlowEngine.BASE_PADDING * this.scale; }
  get FONT_SIZE_NODE() { return FlowEngine.BASE_FONT_NODE * this.scale; }
  get FONT_SIZE_PORT() { return FlowEngine.BASE_FONT_PORT * this.scale; }
  get FONT_SIZE_LEGEND() { return FlowEngine.BASE_FONT_LEGEND * this.scale; }
  get PORT_RADIUS() { return FlowEngine.BASE_PORT_RADIUS * this.scale; }
  get EDGE_WIDTH() { return FlowEngine.BASE_EDGE_WIDTH * this.scale; }
  get EDGE_MARKER_SIZE() { return FlowEngine.BASE_EDGE_MARKER_SIZE * this.scale; }

  // =========================
  // INICIALIZAÇÃO
  // =========================
  start(container) {
    this.container = container;
    super.start(container);
    container.innerHTML = "";

    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    svg.setAttribute("width", "100%");
    svg.style.border = "1px solid #ccc";
    svg.style.touchAction = "none";
    svg.style.background = "#9987ff";
    container.appendChild(svg);
    this.svg = svg;

    this.onResize(); // inicializa escala e altura
    this.initializeNodes();
    this.addListeners();
    this.render();
  }

  onResize() {
    if (!this.svg) return;
    const minDim = Math.min(window.innerWidth, window.innerHeight);
    this.scale = minDim / 800; // referência base 800px
    const topoAbsoluto = this.svg.getBoundingClientRect().top + window.scrollY;
    const alturaDisponivel = window.innerHeight - topoAbsoluto;
    this.svg.style.height = `${alturaDisponivel}px`;
    this.render();
  }

  initializeNodes() {
    const rect = this.svg.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const centerX = width / 2;
    const centerY = height / 2;

    const nodes = this.content.data.nodes;
    const edges = this.content.data.edges;

    // ====== calcular mapa de pais ======
    const parentsMap = {};
    nodes.forEach(n => (parentsMap[n.id] = []));
    edges.forEach(e => parentsMap[e.to].push(e.from));

    // ====== calcular maior distância da raiz (maior caminho) ======
    function maxDistanceToRoot(nodeId) {
      const parents = parentsMap[nodeId] || [];
      if (parents.length === 0) return 0; // raiz
      let maxDist = 0;
      for (let p of parents) {
        maxDist = Math.max(maxDist, 1 + maxDistanceToRoot(p));
      }
      return maxDist;
    }

    const ancestorMap = {};
    nodes.forEach(n => {
      if (n.nodeType !== "relation") ancestorMap[n.id] = maxDistanceToRoot(n.id);
    });

    // ====== Agrupar nós por nível (somente não-relations) ======
    const levels = {};
    let maxLevel = 0;
    nodes.forEach(n => {
      if (n.nodeType === "relation") return;
      const lvl = ancestorMap[n.id];
      if (!levels[lvl]) levels[lvl] = [];
      levels[lvl].push(n);
      if (lvl > maxLevel) maxLevel = lvl;
    });

    const nodeState = {};

    if (maxLevel <= 3) {
      // ====== Círculos concêntricos ======
      const radiusStep = 0.5 * Math.min(window.innerWidth, window.innerHeight) / (maxLevel + 1);
      let prevAngleStep = 2 * Math.PI;

      Object.keys(levels).forEach(lvlStr => {
        const lvl = parseInt(lvlStr);
        const group = levels[lvl];

        let radius;
        if (lvl === 0 && group.length === 1) {
          radius = 0;
          nodeState[group[0].id] = { ...group[0], x: centerX, y: centerY };
          prevAngleStep = 2 * Math.PI;
          return;
        } else {
          radius = (1 + lvl) * radiusStep;
        }

        const angleStep = (2 * Math.PI) / group.length;
        const offset = prevAngleStep / (10 * Math.random() / 7);

        group.forEach((n, i) => {
          const angle = i * angleStep + offset;
          nodeState[n.id] = {
            ...n,
            x: centerX + radius * Math.cos(angle),
            y: centerY + radius * Math.sin(angle)
          };
        });

        prevAngleStep = angleStep;
      });

    } else {
      // ====== Distribuição vertical por nível (mais de 3 níveis) ======
      const totalLevels = Object.keys(levels).length;
      const verticalStep = height / (totalLevels + 1);

      Object.keys(levels).forEach((lvlStr, lvlIndex) => {
        const lvl = parseInt(lvlStr);
        const group = levels[lvl];
        const y = verticalStep * (lvlIndex + 1);

        // distribuir horizontalmente conforme o número de elementos no mesmo nível
        const groupCount = group.length;
        const horizontalStep = width / (groupCount + 1);

        group.forEach((n, i) => {
          const x = horizontalStep * (i + 1);
          nodeState[n.id] = { ...n, x, y };
        });
      });
    }

    // ====== Colocar os nós "relation" à direita ======
    const relationNodes = nodes.filter(n => n.nodeType === "relation");
    relationNodes.forEach((n, i) => {
      nodeState[n.id] = {
        ...n,
        x: width - this.PADDING - this.NODE_HALF_WIDTH,
        y: centerY + (i - relationNodes.length / 2) * (this.NODE_HALF_HEIGHT * 3)
      };
    });

    this.state.nodes = nodes.map(n => nodeState[n.id]);
  }


  addListeners() {
    this.svg.addEventListener("pointermove", e => this.onPointerMove(e));
    this.svg.addEventListener("pointerup", () => this.onPointerUp());
    this.svg.addEventListener("pointerleave", () => this.onPointerUp());
  }

  /* =========================
     UTIL
  ========================= */
  clampNodePosition(node) {
    const rect = this.svg.getBoundingClientRect();
    const minX = this.NODE_HALF_WIDTH + this.PADDING;
    const maxX = rect.width - this.NODE_HALF_WIDTH - this.PADDING;
    const minY = this.NODE_HALF_HEIGHT + this.PADDING;
    const maxY = rect.height - this.NODE_HALF_HEIGHT - this.PADDING;
    node.x = Math.min(Math.max(node.x, minX), maxX);
    node.y = Math.min(Math.max(node.y, minY), maxY);
  }

  findNode(id) {
    return this.state.nodes.find(n => n.id === id);
  }

  isConnectionValid(from, port, to) {
    const edges = this.content.data.edges || [];
    return edges.some(e =>
      (e.from === from && e.to === to && (e.port === port || (!e.port && !port)))
    );
  }

  /* =========================
     RENDER
  ========================= */
  render() {
    if (!this.svg) return;
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
    marker.setAttribute("markerWidth", this.EDGE_MARKER_SIZE);
    marker.setAttribute("markerHeight", this.EDGE_MARKER_SIZE);
    marker.setAttribute("refX", this.EDGE_MARKER_SIZE);
    marker.setAttribute("refY", this.EDGE_MARKER_SIZE / 2);
    marker.setAttribute("orient", "auto");
    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M 0 0 L ${this.EDGE_MARKER_SIZE} ${this.EDGE_MARKER_SIZE / 2} L 0 ${this.EDGE_MARKER_SIZE} z`);
    path.setAttribute("fill", "#333");
    marker.appendChild(path);
    defs.appendChild(marker);
    this.svg.appendChild(defs);
  }

  drawEdge(conn) {
    const from = this.findNode(conn.from);
    const to = this.findNode(conn.to);
    if (!from || !to) return;

    let sx = from.x;
    let sy = from.y;
    let ex = to.x;
    let ey = to.y;

    const halfWidthFrom = this.NODE_HALF_WIDTH;
    const halfHeightFrom = this.NODE_HALF_HEIGHT;
    const halfWidthTo = this.NODE_HALF_WIDTH;
    const halfHeightTo = this.NODE_HALF_HEIGHT;

    var color;
    switch (conn.port) {
      case "yes":
        color = "green";
        break;
      case "no":
        color = "red";
        break;
      case "next":
        color = "blue";
        break;
      default:
        color = "blue";
        break;
    }


    // === posição de chegada do nó "to" ===
    const dx = ex - sx;
    const dy = ey - sy;
    const angle = Math.atan2(dy, dx);

    // deslocar ponto final para a borda do nó de destino
    let radiusX = halfWidthTo;
    let radiusY = halfHeightTo;
    if (to.nodeType === "condition") radiusX = halfWidthTo; // losango horizontal
    ex -= Math.cos(angle) * radiusX;
    ey -= Math.sin(angle) * radiusY;

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", sx);
    line.setAttribute("y1", sy);
    line.setAttribute("x2", ex);
    line.setAttribute("y2", ey);
    line.setAttribute("stroke", color);
    line.setAttribute("stroke-width", this.EDGE_WIDTH);
    line.setAttribute("marker-end", "url(#arrow)");

    this.svg.appendChild(line);
  }




  hashStringToColor(str) {
    let hash = 0;
    for (let i = 0; i < str.length; i++) hash = str.charCodeAt(i) + ((hash << 5) - hash);
    const c = (hash & 0x00FFFFFF).toString(16).toUpperCase();
    return "#" + "00000".substring(0, 6 - c.length) + c;
  }

  drawNode(node) {
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.style.cursor = "pointer";

    // ====== medir largura do texto ======
    const tmpText = document.createElementNS("http://www.w3.org/2000/svg", "text");
    tmpText.setAttribute("font-size", this.FONT_SIZE_NODE);
    tmpText.style.visibility = "hidden";
    tmpText.textContent = node.label;
    this.svg.appendChild(tmpText);
    const bbox = tmpText.getBBox();
    const halfWidth = Math.max(this.NODE_HALF_WIDTH, bbox.width / 2 + this.PADDING);
    this.svg.removeChild(tmpText);

    let shape;
    if (node.nodeType === "relation") {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "polygon");
      const r = this.NODE_HALF_HEIGHT;
      const w = halfWidth;
      shape.setAttribute(
        "points",
        `${node.x},${node.y - r} ${node.x + w},${node.y} ${node.x},${node.y + r} ${node.x - w},${node.y}`
      );
      shape.setAttribute("fill", "#fff3cd");
    } else {
      shape = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      shape.setAttribute("x", node.x - halfWidth);
      shape.setAttribute("y", node.y - this.NODE_HALF_HEIGHT);
      shape.setAttribute("width", halfWidth * 2);
      shape.setAttribute("height", this.NODE_HALF_HEIGHT * 2);
      shape.setAttribute("rx", 8);
      shape.setAttribute("fill", this.hashStringToColor(node.nodeType));
    }

    shape.setAttribute(
      "stroke",
      this.state.selectedObject?.type === "node" && this.state.selectedObject.nodeId === node.id
        ? "#0d6efd"
        : "#333"
    );
    shape.setAttribute("stroke-width", this.EDGE_WIDTH);

    g.appendChild(shape);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", node.x);
    text.setAttribute("y", node.y + 4 * this.scale);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("font-size", this.FONT_SIZE_NODE);
    text.setAttribute("pointer-events", "none");
    text.textContent = node.label;
    g.appendChild(text);

    if (node.nodeType === "condition") {
      this.drawPort(g, node, "yes", node.x + halfWidth, node.y, "SIM", "green");
      this.drawPort(g, node, "no", node.x - halfWidth, node.y, "NÃO", "red");
    } else if (node.nodeType === "start" || node.nodeType === "rule") {
      this.drawPort(g, node, "next", node.x + halfWidth, node.y, "→", "#0d6efd");
    }

    g.addEventListener("pointerdown", e => this.onNodePointerDown(e, node));
    this.svg.appendChild(g);
  }

  drawPort(group, node, port, x, y, label, color) {
    const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    c.setAttribute("cx", x);
    c.setAttribute("cy", y);
    c.setAttribute("r", this.PORT_RADIUS);
    c.setAttribute("fill", this.state.selectedObject?.type === "port" && this.state.selectedObject.nodeId === node.id && this.state.selectedObject.port === port ? "#0d6efd" : color);

    c.addEventListener("pointerdown", e => {
      e.stopPropagation();
      this.state.selectedObject = { type: "port", nodeId: node.id, port };
      this.render();
    });

    const t = document.createElementNS("http://www.w3.org/2000/svg", "text");
    t.setAttribute("x", x);
    t.setAttribute("y", y - 10 * this.scale);
    t.setAttribute("text-anchor", "middle");
    t.setAttribute("font-size", this.FONT_SIZE_PORT);
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
      t.setAttribute("x", 16 * this.scale);
      t.setAttribute("y", 20 * this.scale + i * (this.FONT_SIZE_LEGEND + 2) * this.scale);
      t.setAttribute("font-size", this.FONT_SIZE_LEGEND);
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
        port = sel.port;
        to = node.id;
      } else if (sel.type === "node") {
        from = sel.nodeId;
        port = null;
        to = node.id;
      }

      if (!this.isConnectionValid(from, port, to) && this.isConnectionValid(to, port, from)) {
        [from, to] = [to, from];
      }

      if (this.isConnectionValid(from, port, to)) {
        this.state.connections.push({ from, to, port: port || null, correct: true, relations: [] });
      }

      this.state.selectedObject = null;
      this.render();
      return;
    }

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

  addRelationToSelectedConnection(relationId) {
    const sel = this.state.selectedObject;
    if (!sel || sel.type !== "connection") return;
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
