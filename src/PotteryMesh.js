import * as THREE from "three";

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export class PotteryMesh {
  constructor(scene) {
    this.ringCount = 42;
    this.segments = 96;
    this.minRadius = 0.16;
    this.maxRadius = 1.25;
    this.baseHeight = 1.8;
    this.undoStack = [];
    this.redoStack = [];
    this.textureCanvas = document.createElement("canvas");
    this.textureCanvas.width = 1024;
    this.textureCanvas.height = 512;
    this.textureCtx = this.textureCanvas.getContext("2d");
    this.paintTexture = new THREE.CanvasTexture(this.textureCanvas);
    this.paintTexture.colorSpace = THREE.SRGBColorSpace;
    this.group = new THREE.Group();
    scene.add(this.group);

    this.material = new THREE.MeshPhysicalMaterial({
      color: 0xf7f1e7,
      roughness: 0.42,
      metalness: 0,
      clearcoat: 0.18,
      clearcoatRoughness: 0.35,
      sheen: 0.45,
      map: this.paintTexture,
      side: THREE.DoubleSide
    });

    this.reset(false);
  }

  reset(pushHistory = true) {
    if (pushHistory) this.pushHistory();
    this.heightScale = 1;
    this.radii = Array.from({ length: this.ringCount }, (_, i) => {
      const t = i / (this.ringCount - 1);
      return 0.46 + Math.sin(t * Math.PI) * 0.18 - t * 0.05;
    });
    this.heights = Array.from({ length: this.ringCount }, (_, i) => (i / (this.ringCount - 1)) * this.baseHeight);
    this.clearPaint("#f7f1e7");
    this.rebuild();
  }

  clearPaint(color) {
    this.baseColor = color;
    this.textureCtx.fillStyle = color;
    this.textureCtx.fillRect(0, 0, this.textureCanvas.width, this.textureCanvas.height);
    this.addClayNoise();
    this.paintTexture.needsUpdate = true;
  }

  addClayNoise() {
    const image = this.textureCtx.getImageData(0, 0, this.textureCanvas.width, this.textureCanvas.height);
    for (let i = 0; i < image.data.length; i += 4) {
      const n = (Math.random() - 0.5) * 14;
      image.data[i] = clamp(image.data[i] + n, 0, 255);
      image.data[i + 1] = clamp(image.data[i + 1] + n, 0, 255);
      image.data[i + 2] = clamp(image.data[i + 2] + n, 0, 255);
    }
    this.textureCtx.putImageData(image, 0, 0);
  }

  rebuild() {
    const vertices = [];
    const uvs = [];
    const indices = [];

    for (let y = 0; y < this.ringCount; y++) {
      const radius = this.radii[y];
      const height = this.heights[y];
      for (let s = 0; s <= this.segments; s++) {
        const theta = (s / this.segments) * Math.PI * 2;
        const ripple = 1 + Math.sin(theta * 11 + y * 0.6) * 0.004;
        vertices.push(Math.cos(theta) * radius * ripple, height, Math.sin(theta) * radius * ripple);
        uvs.push(s / this.segments, 1 - y / (this.ringCount - 1));
      }
    }

    const stride = this.segments + 1;
    for (let y = 0; y < this.ringCount - 1; y++) {
      for (let s = 0; s < this.segments; s++) {
        const a = y * stride + s;
        const b = a + stride;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    geometry.computeBoundingSphere();

    if (!this.mesh) {
      this.mesh = new THREE.Mesh(geometry, this.material);
      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
      this.group.add(this.mesh);
    } else {
      this.mesh.geometry.dispose();
      this.mesh.geometry = geometry;
    }
  }

  pushHistory() {
    this.undoStack.push(this.serialize());
    if (this.undoStack.length > 40) this.undoStack.shift();
    this.redoStack.length = 0;
  }

  undo() {
    if (!this.undoStack.length) return false;
    this.redoStack.push(this.serialize());
    this.load(this.undoStack.pop());
    return true;
  }

  redo() {
    if (!this.redoStack.length) return false;
    this.undoStack.push(this.serialize());
    this.load(this.redoStack.pop());
    return true;
  }

  deform(hit, delta, tool, brushSize, strength) {
    const center = this.heightToRing(hit.y);
    const radiusDelta = delta.x * 0.58 * strength;
    const heightDelta = delta.y * 0.36 * strength;
    const radiusBrush = brushSize * this.ringCount * 1.18;
    const beforeTop = this.heights[this.ringCount - 1];

    for (let i = 1; i < this.ringCount; i++) {
      const d = Math.abs(i - center);
      const w = Math.exp(-(d * d) / (radiusBrush * radiusBrush));
      if (w < 0.02) continue;

      if (tool === "smooth") {
        const prev = this.radii[Math.max(0, i - 1)];
        const next = this.radii[Math.min(this.ringCount - 1, i + 1)];
        this.radii[i] += ((prev + next) / 2 - this.radii[i]) * w * 0.26 * strength;
      } else if (tool === "pinch") {
        this.radii[i] -= (0.016 + Math.abs(radiusDelta)) * w;
      } else if (tool === "expand") {
        this.radii[i] += (0.016 + Math.abs(radiusDelta)) * w;
      } else if (tool === "compress") {
        this.heights[i] -= Math.abs(heightDelta) * w * (i / this.ringCount);
      } else if (tool === "cut") {
        if (i > this.ringCount - 5) this.radii[i] *= 1 - 0.06 * strength;
      } else {
        this.radii[i] += radiusDelta * w;
        this.heights[i] += heightDelta * w * (i / this.ringCount);
      }
      this.radii[i] = clamp(this.radii[i], this.minRadius, this.maxRadius);
    }

    this.normalizeHeights(beforeTop, heightDelta);
    this.relaxProfile();
    this.relaxProfile(0.16);
    this.rebuild();
  }

  normalizeHeights(beforeTop, heightDelta) {
    const top = clamp(beforeTop + heightDelta * 0.5, 0.95, 3.1);
    for (let i = 0; i < this.ringCount; i++) {
      const t = i / (this.ringCount - 1);
      this.heights[i] = top * t;
    }
  }

  relaxProfile(amount = 0.28) {
    const copy = [...this.radii];
    for (let i = 2; i < this.ringCount - 2; i++) {
      const avg = (copy[i - 2] + copy[i - 1] + copy[i] * 2 + copy[i + 1] + copy[i + 2]) / 6;
      this.radii[i] = clamp(copy[i] * (1 - amount) + avg * amount, this.minRadius, this.maxRadius);
      const slope = this.radii[i] - this.radii[i - 1];
      if (Math.abs(slope) > 0.16) this.radii[i] = this.radii[i - 1] + Math.sign(slope) * 0.16;
    }
    this.radii[0] = Math.max(this.radii[0], 0.28);
  }

  heightToRing(y) {
    const top = this.heights[this.ringCount - 1] || 1;
    return clamp(Math.round((y / top) * (this.ringCount - 1)), 0, this.ringCount - 1);
  }

  paintAt(hit, color, brush, size = 28) {
    const v = clamp(hit.y / this.heights[this.ringCount - 1], 0, 1);
    const y = v * this.textureCanvas.height;
    this.textureCtx.save();
    const paintColor = brush === "eraser" ? this.baseColor : color;
    this.textureCtx.fillStyle = paintColor;
    this.textureCtx.strokeStyle = paintColor;
    this.textureCtx.lineCap = "round";
    this.textureCtx.lineJoin = "round";
    this.textureCtx.lineWidth = Math.max(2, size * 0.18);

    this.textureCtx.globalAlpha = brush === "free" ? 0.11 : brush === "eraser" ? 0.94 : 0.86;
    this.drawPatternBand(y, size, brush);

    this.textureCtx.restore();
    this.paintTexture.needsUpdate = true;
  }

  drawPatternBand(y, size, brush) {
    const step = brush === "flowers" ? size * 1.05 : brush === "clouds" ? size * 1.15 : size * 0.9;
    if (brush === "free") {
      this.textureCtx.fillRect(0, y - size * 0.095, this.textureCanvas.width, size * 0.19);
      return;
    }

    if (brush === "eraser") {
      this.textureCtx.fillRect(0, y - size * 0.16, this.textureCanvas.width, size * 0.32);
      return;
    }

    if (brush === "stripes") {
      this.textureCtx.fillRect(0, y - size * 0.13, this.textureCanvas.width, size * 0.26);
      return;
    }

    if (brush === "waves") {
      this.textureCtx.beginPath();
      for (let x = 0; x <= this.textureCanvas.width; x += 5) {
        const yy = y + Math.sin(x * 0.035) * size * 0.2;
        x === 0 ? this.textureCtx.moveTo(x, yy) : this.textureCtx.lineTo(x, yy);
      }
      this.textureCtx.stroke();
      return;
    }

    for (let x = step * 0.5; x < this.textureCanvas.width + step; x += step) {
      this.drawBrush(x, y, size, brush);
    }
  }

  drawBrush(x, y, size, brush) {
    const ctx = this.textureCtx;
    if (brush === "free") {
      ctx.beginPath(); ctx.arc(x, y, size * 0.22, 0, Math.PI * 2); ctx.fill();
    } else if (brush === "dots") {
      ctx.beginPath(); ctx.arc(x, y, size * 0.35, 0, Math.PI * 2); ctx.fill();
    } else if (brush === "stripes") {
      ctx.fillRect(x - size * 0.14, 0, size * 0.28, this.textureCanvas.height);
    } else if (brush === "waves") {
      ctx.beginPath();
      for (let i = -size; i <= size; i += 4) {
        const yy = y + Math.sin(i * 0.18) * size * 0.22;
        i === -size ? ctx.moveTo(x + i, yy) : ctx.lineTo(x + i, yy);
      }
      ctx.stroke();
    } else if (brush === "flowers") {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        ctx.beginPath(); ctx.arc(x + Math.cos(a) * size * 0.25, y + Math.sin(a) * size * 0.25, size * 0.16, 0, Math.PI * 2); ctx.fill();
      }
    } else if (brush === "clouds") {
      for (let i = 0; i < 4; i++) {
        ctx.beginPath(); ctx.arc(x + (i - 1.5) * size * 0.18, y + Math.sin(i) * size * 0.12, size * 0.22, 0, Math.PI * 2); ctx.fill();
      }
    } else {
      ctx.beginPath();
      ctx.rect(x - size * 0.3, y - size * 0.3, size * 0.6, size * 0.6);
      ctx.fill();
    }
  }

  setStageMaterial(stage, glaze = "matte") {
    const materials = {
      shape: { color: 0xf7f1e7, roughness: 0.42, clearcoat: 0.18, metalness: 0 },
      dry: { color: 0xf1e4d4, roughness: 0.82, clearcoat: 0.02, metalness: 0 },
      fired: { color: 0xf8f1e8, roughness: 0.58, clearcoat: 0.08, metalness: 0 },
      glazed: { color: 0xffffff, roughness: glaze === "matte" ? 0.68 : 0.18, clearcoat: glaze === "matte" ? 0.1 : 0.75, metalness: glaze === "metallic" ? 0.35 : 0 }
    };
    const next = materials[stage] || materials.shape;
    this.material.color.set(next.color);
    this.material.roughness = next.roughness;
    this.material.clearcoat = next.clearcoat;
    this.material.metalness = next.metalness;
    if (glaze === "crackle") this.addCrackle();
    this.material.needsUpdate = true;
  }

  addCrackle() {
    this.textureCtx.strokeStyle = "rgba(60,42,31,.32)";
    this.textureCtx.lineWidth = 1;
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * this.textureCanvas.width;
      const y = Math.random() * this.textureCanvas.height;
      this.textureCtx.beginPath();
      this.textureCtx.moveTo(x, y);
      this.textureCtx.lineTo(x + (Math.random() - 0.5) * 55, y + (Math.random() - 0.5) * 35);
      this.textureCtx.stroke();
    }
    this.paintTexture.needsUpdate = true;
  }

  getMetrics() {
    const height = this.heights.at(-1);
    const width = Math.max(...this.radii) * 2;
    let smoothness = 1;
    for (let i = 1; i < this.radii.length - 1; i++) smoothness -= Math.abs(this.radii[i - 1] - this.radii[i] * 2 + this.radii[i + 1]) * 0.06;
    return { height, width, smoothness: clamp(smoothness, 0, 1), symmetry: 1 };
  }

  serialize() {
    return { radii: [...this.radii], heights: [...this.heights], texture: this.textureCanvas.toDataURL("image/png") };
  }

  load(data) {
    this.radii = [...data.radii];
    this.heights = [...data.heights];
    if (data.texture) {
      const img = new Image();
      img.onload = () => {
        this.textureCtx.drawImage(img, 0, 0);
        this.paintTexture.needsUpdate = true;
      };
      img.src = data.texture;
    }
    this.rebuild();
  }
}
