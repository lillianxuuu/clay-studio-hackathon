export class UIManager {
  constructor(gameState, paintSystem) {
    this.gameState = gameState;
    this.paintSystem = paintSystem;
    this.stageProgress = document.querySelector("#stageProgress");
    this.toastEl = document.querySelector("#toast");
    this.paintPanel = document.querySelector("#paintPanel");
    this.scorePanel = document.querySelector("#scorePanel");
    this.initStages();
    this.initPaint();
  }

  initStages() {
    this.stageProgress.innerHTML = "";
    this.gameState.stages.forEach((stage) => {
      const dot = document.createElement("span");
      dot.className = "stage-dot";
      dot.title = stage;
      this.stageProgress.append(dot);
    });
    this.updateStage();
  }

  initPaint() {
    const colors = ["#ffffff", "#f7f1e7", "#6e8fa3", "#9dac8c", "#6e4c32", "#29323a", "#d79b73", "#a8563f"];
    const palette = document.querySelector("#colorPalette");
    colors.forEach((color) => {
      const button = document.createElement("button");
      button.className = "swatch";
      button.style.background = color;
      button.title = color;
      button.addEventListener("click", () => {
        this.paintSystem.setColor(color);
        document.querySelector("#customColor").value = color;
        document.querySelectorAll(".swatch").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
      });
      palette.append(button);
    });
    palette.querySelector(".swatch")?.classList.add("active");
    document.querySelector("#customColor").addEventListener("input", (event) => this.paintSystem.setColor(event.target.value));
    document.querySelector("#baseColorBtn").addEventListener("click", () => this.paintSystem.applyBase(this.paintSystem.color));

    const brushes = ["free", "dots", "stripes", "waves", "flowers", "clouds", "geo"];
    const brushBox = document.querySelector("#decorBrushes");
    brushes.forEach((brush) => {
      const button = document.createElement("button");
      button.textContent = brush;
      button.addEventListener("click", () => {
        document.querySelectorAll("#decorBrushes button").forEach((item) => item.classList.remove("active"));
        button.classList.add("active");
        this.paintSystem.setBrush(brush);
      });
      brushBox.append(button);
    });
    brushBox.querySelector("button")?.classList.add("active");
  }

  updateStage() {
    [...this.stageProgress.children].forEach((dot, index) => dot.classList.toggle("active", index <= this.gameState.stageIndex));
    const paintToolActive = document.querySelector('[data-tool="paint"]')?.classList.contains("active");
    const eraserActive = document.querySelector('[data-tool="eraser"]')?.classList.contains("active");
    this.paintPanel.classList.toggle("hidden", this.gameState.stage !== "paint" && !paintToolActive && !eraserActive);
    this.scorePanel.classList.toggle("hidden", this.gameState.stage !== "display");
  }

  showScore(result, challengeName) {
    this.scorePanel.innerHTML = `
      <strong>${challengeName}</strong>
      <p>Score ${result.score}/100</p>
      <p>Height ${Math.round(result.heightScore * 100)} · Width ${Math.round(result.widthScore * 100)} · Smooth ${Math.round(result.smoothness * 100)}</p>
    `;
  }

  toast(message) {
    this.toastEl.textContent = message;
    this.toastEl.classList.add("show");
    clearTimeout(this.toastTimer);
    this.toastTimer = setTimeout(() => this.toastEl.classList.remove("show"), 1900);
  }

  renderGallery(items, onDelete) {
    const grid = document.querySelector("#galleryGrid");
    grid.innerHTML = items.length ? "" : "<p>No finished pieces yet.</p>";
    items.forEach((item) => {
      const el = document.createElement("article");
      el.className = "gallery-item";
      el.innerHTML = `
        <img src="${item.screenshot}" alt="${item.name}" />
        <strong>${item.name}</strong>
        <small>${item.metrics.score}/100</small>
        <button class="delete-gallery-item" type="button">Delete</button>
      `;
      el.querySelector(".delete-gallery-item").addEventListener("click", () => onDelete?.(item.id));
      grid.append(el);
    });
  }
}
