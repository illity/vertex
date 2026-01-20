export class ClassificationEngine {
    constructor(content) {
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
        this.container = container;
        const categories = Array.from(new Set(this.content.data.map(i => i.category)));

        // Cria as linhas e embaralha **uma única vez**
        const rows = this.content.data.map((item, idx) => ({
            id: idx.toString(),
            label: item.label,
            correctCategory: item.category,
            currentCategory: null,
            correct: null
        }));

        this.state = {
            categories,
            rows: this.shuffleArray(rows) // embaralha apenas aqui
        };

        this.render(container);
    }

    render(container = this.container) {
        if (!container || !this.state) return;
        container.innerHTML = "";

        // Categorias
        const categoriesDiv = document.createElement("div");
        categoriesDiv.style.display = "flex";
        categoriesDiv.style.flexWrap = "wrap";
        categoriesDiv.style.gap = "12px";

        this.state.categories.forEach(cat => {
            const zoneDiv = document.createElement("div");
            zoneDiv.style.flex = "1";
            zoneDiv.style.minHeight = "120px";
            zoneDiv.style.border = "2px dashed #aaa";
            zoneDiv.style.padding = "8px";
            zoneDiv.style.borderRadius = "4px";
            zoneDiv.style.background = "#f9f9f9";

            const label = document.createElement("div");
            label.textContent = cat;
            label.style.fontWeight = "bold";
            label.style.marginBottom = "8px";
            zoneDiv.appendChild(label);

            // Itens já categorizados — mantém a ordem original
            const itemsInCategory = this.state.rows.filter(r => r.currentCategory === cat);

            itemsInCategory.forEach(r => {
                const itemDiv = document.createElement("div");
                itemDiv.textContent = r.label;
                itemDiv.style.padding = "4px 8px";
                itemDiv.style.margin = "2px 0";
                itemDiv.style.border = "1px solid #ccc";
                itemDiv.style.borderRadius = "4px";
                itemDiv.style.background =
                    r.correct === true ? "rgba(160, 230, 160, 0.6)" :
                    r.correct === false ? "rgba(246, 160, 160, 0.6)" : "#fff";

                zoneDiv.appendChild(itemDiv);
            });

            // Drag & drop
            zoneDiv.ondragover = e => e.preventDefault();
            zoneDiv.ondrop = e => {
                e.preventDefault();
                const data = JSON.parse(e.dataTransfer.getData("text/plain"));
                this.onDrop(data.id, cat);
            };

            categoriesDiv.appendChild(zoneDiv);
        });

        container.appendChild(categoriesDiv);

        // Draggables restantes — mantém ordem do estado
        const draggablesDiv = document.createElement("div");
        draggablesDiv.style.display = "flex";
        draggablesDiv.style.flexWrap = "wrap";
        draggablesDiv.style.marginTop = "12px";
        draggablesDiv.style.gap = "8px";

        const remainingItems = this.state.rows.filter(r => !r.currentCategory);

        remainingItems.forEach(r => {
            const itemDiv = document.createElement("div");
            itemDiv.textContent = r.label;
            itemDiv.style.padding = "4px 8px";
            itemDiv.style.border = "1px solid #333";
            itemDiv.style.borderRadius = "4px";
            itemDiv.style.background = "#fff";
            itemDiv.style.cursor = "grab";
            itemDiv.draggable = true;

            itemDiv.ondragstart = e => {
                e.dataTransfer.effectAllowed = "move";
                e.dataTransfer.setData("text/plain", JSON.stringify({ id: r.id }));
            };

            draggablesDiv.appendChild(itemDiv);
        });

        container.appendChild(draggablesDiv);
    }

    onDrop(itemId, category) {
        const row = this.state.rows.find(r => r.id === itemId);
        if (!row) return;
        row.currentCategory = category;
        row.correct = row.correctCategory === category;
        this.render();
    }
}
