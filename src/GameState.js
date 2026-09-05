const CURRENT_KEY = "clay-studio-current";
const GALLERY_KEY = "clay-studio-gallery";

export class GameState {
  constructor() {
    this.stages = ["shape", "smooth", "dry", "fire", "paint", "display"];
    this.stageIndex = 0;
    this.challenges = [
      { name: "Create a tall vase", type: "tall", height: 2.35, width: 0.9 },
      { name: "Create a wide bowl", type: "wide", height: 1.2, width: 1.8 },
      { name: "Create a narrow-neck bottle", type: "neck", height: 2.2, width: 1.1 },
      { name: "Create a symmetrical cup", type: "cup", height: 1.55, width: 1.25 }
    ];
    this.challenge = this.challenges[Math.floor(Math.random() * this.challenges.length)];
  }

  get stage() { return this.stages[this.stageIndex]; }
  next() { this.stageIndex = Math.min(this.stages.length - 1, this.stageIndex + 1); return this.stage; }
  prev() { this.stageIndex = Math.max(0, this.stageIndex - 1); return this.stage; }
  resetStage() { this.stageIndex = 0; }

  score(metrics) {
    const heightScore = 1 - Math.min(1, Math.abs(metrics.height - this.challenge.height) / 1.6);
    const widthScore = 1 - Math.min(1, Math.abs(metrics.width - this.challenge.width) / 1.4);
    const score = Math.round((heightScore * 0.28 + widthScore * 0.28 + metrics.smoothness * 0.28 + metrics.symmetry * 0.16) * 100);
    return { score, heightScore, widthScore, smoothness: metrics.smoothness, symmetry: metrics.symmetry };
  }

  saveCurrent(pottery, stage) {
    localStorage.setItem(CURRENT_KEY, JSON.stringify({ pottery: pottery.serialize(), stageIndex: this.stageIndex, stage, challenge: this.challenge }));
  }

  loadCurrent(pottery) {
    const raw = localStorage.getItem(CURRENT_KEY);
    if (!raw) return false;
    try {
      const data = JSON.parse(raw);
      pottery.load(data.pottery);
      this.stageIndex = data.stageIndex ?? 0;
      this.challenge = data.challenge ?? this.challenge;
      return true;
    } catch {
      return false;
    }
  }

  saveToGallery(name, screenshot, metrics) {
    const gallery = this.gallery();
    gallery.unshift({ id: crypto.randomUUID(), name, screenshot, metrics, createdAt: new Date().toISOString() });
    localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery.slice(0, 24)));
  }

  deleteFromGallery(id) {
    const gallery = this.gallery().filter((item) => item.id !== id);
    localStorage.setItem(GALLERY_KEY, JSON.stringify(gallery));
    return gallery;
  }

  gallery() {
    try {
      return JSON.parse(localStorage.getItem(GALLERY_KEY)) || [];
    } catch {
      return [];
    }
  }
}
