import { BaseEngine } from "../engines/BaseEngine.js";

export class ClassificationEngine extends BaseEngine {
    constructor(content) {
        super(content);
        this.content = content;
        this.state = null;
        this.container = null;
    }

    shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    start(container) {
        super.start(container);
        this.container = container;

        const categories = Array.from(
            new Set(this.content.data.map(i => i.category))
        );

        if (!this.state) {
            const rows = this.content.data.map((item, idx) => ({
                id: idx.toString(),
                label: item.label,
                correctCategory: item.category,
                currentCategory: null,
                correct: null
            }));

            this.state = {
                categories,
                rows: this.shuffleArray(rows)
            };
        }

        this.render();
    }


    createDraggableItem(row) {
        const itemDiv = document.createElement("div");
        itemDiv.textContent = row.label;
        itemDiv.classList.add("draggable-item");
        itemDiv.dataset.id = row.id;

        itemDiv.style.padding = "4px 8px";
        itemDiv.style.margin = "2px 0";
        itemDiv.style.border = "1px solid #333";
        itemDiv.style.borderRadius = "4px";
        itemDiv.style.cursor = "grab";
        itemDiv.style.background =
            row.correct === true
                ? "rgba(160, 230, 160, 0.6)"
                : row.correct === false
                    ? "rgba(246, 160, 160, 0.6)"
                    : "#48119e";

        interact(itemDiv).draggable({
            inertia: true,
            autoScroll: true,
            listeners: {
                start: () => {
                    document.body.style.touchAction = "none";
                },
                move: event => {
                    const target = event.target;
                    const x = (parseFloat(target.dataset.x) || 0) + event.dx;
                    const y = (parseFloat(target.dataset.y) || 0) + event.dy;

                    target.style.transform = `translate(${x}px, ${y}px)`;
                    target.dataset.x = x;
                    target.dataset.y = y;
                },
                end: event => {
                    document.body.style.touchAction = "auto";
                    event.target.style.transform = "none";
                    delete event.target.dataset.x;
                    delete event.target.dataset.y;
                }
            }
        });

        return itemDiv;
    }

    render(container = this.container) {
        if (!container || !this.state) return;
        container.innerHTML = "";

        // ---- ZONAS (CATEGORIAS) ----
        const categoriesDiv = document.createElement("div");
        categoriesDiv.style.display = "flex";
        categoriesDiv.style.flexWrap = "wrap";
        categoriesDiv.style.gap = "12px";

        this.state.categories.forEach(category => {
            const zoneDiv = document.createElement("div");
            zoneDiv.style.flex = "1";
            zoneDiv.style.minHeight = "120px";
            zoneDiv.style.border = "2px dashed #aaa";
            zoneDiv.style.padding = "8px";
            zoneDiv.style.borderRadius = "4px";
            zoneDiv.style.background = "#48119e";

            const label = document.createElement("div");
            label.textContent = category;
            label.style.fontWeight = "bold";
            label.style.marginBottom = "8px";
            zoneDiv.appendChild(label);

            this.state.rows
                .filter(r => r.currentCategory === category)
                .forEach(r => {
                    zoneDiv.appendChild(this.createDraggableItem(r));
                });

            categoriesDiv.appendChild(zoneDiv);

            interact(zoneDiv).dropzone({
                accept: ".draggable-item",
                overlap: 0.5,
                ondrop: event => {
                    const itemId = event.relatedTarget.dataset.id;
                    this.onDrop(itemId, category);
                }
            });
        });

        container.appendChild(categoriesDiv);

        // ---- ITENS SEM CATEGORIA ----
        const poolDiv = document.createElement("div");
        poolDiv.style.display = "flex";
        poolDiv.style.flexWrap = "wrap";
        poolDiv.style.marginTop = "12px";
        poolDiv.style.gap = "8px";

        this.state.rows
            .filter(r => !r.currentCategory)
            .forEach(r => {
                poolDiv.appendChild(this.createDraggableItem(r));
            });

        container.appendChild(poolDiv);
    }

    onDrop(itemId, category) {
        const row = this.state.rows.find(r => r.id === itemId);
        if (!row) return;

        row.currentCategory = category;
        row.correct = row.correctCategory === category;

        super.saveState(); // 💾 persist
        this.render();
    }
    
    exportState() {
        return {
            rows: this.state.rows
        };
    }

    importState(state) {
        if (!state) return;

        // categories come from content (source of truth)
        const categories = Array.from(
            new Set(this.content.data.map(i => i.category))
        );

        this.state = {
            categories,
            rows: state.rows || []
        };
    }

}
