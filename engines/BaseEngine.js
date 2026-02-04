export class BaseEngine {
  constructor(content, config) {
    this.content = content;
    this.config = config;
    this.state = null;
  }

  getStorageKey() {
    return `content:${this.content.type}:${this.content.title}`;
  }

  saveState() {
    if (!this.exportState) return; // engine não suporta persistência
    const state = this.exportState();
    console.log(state)
    localStorage.setItem(this.getStorageKey(), JSON.stringify(state));
  }

  loadState() {
    if (!this.importState) return null;
    console.log(localStorage);
    console.log('key', this.getStorageKey());
    const raw = localStorage.getItem(this.getStorageKey());
    if (!raw) return null;

    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  start(container) {
    const saved = this.loadState();
    if (saved) {
      this.importState(saved);
    }
  }
}
