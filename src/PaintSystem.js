export class PaintSystem {
  constructor(pottery) {
    this.pottery = pottery;
    this.color = "#6e8fa3";
    this.brush = "free";
    this.inside = false;
    this.glaze = "matte";
  }

  setColor(color) { this.color = color; }
  setBrush(brush) { this.brush = brush; }
  setInside(value) { this.inside = value; }
  setGlaze(value) { this.glaze = value; }

  paint(point, size) {
    this.pottery.paintAt(point, this.color, this.brush, 26 + size * 46);
  }

  applyBase(color) {
    this.pottery.clearPaint(color);
  }

  previewGlaze() {
    this.pottery.setStageMaterial("glazed", this.glaze);
  }
}
