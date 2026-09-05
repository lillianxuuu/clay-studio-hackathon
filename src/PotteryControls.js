import * as THREE from "three";

export class PotteryControls {
  constructor({ canvas, camera, pottery, audio, getTool, getBrushSize, getStrength, getStage, onChange }) {
    this.canvas = canvas;
    this.camera = camera;
    this.pottery = pottery;
    this.audio = audio;
    this.getTool = getTool;
    this.getBrushSize = getBrushSize;
    this.getStrength = getStrength;
    this.getStage = getStage;
    this.onChange = onChange;
    this.raycaster = new THREE.Raycaster();
    this.pointer = new THREE.Vector2();
    this.draggingClay = false;
    this.orbiting = false;
    this.last = { x: 0, y: 0 };
    this.cameraOrbit = { yaw: 0.15, pitch: 0.28, distance: 4.25 };
    this.brushMesh = this.createBrush();
    pottery.group.add(this.brushMesh);
    this.bind();
    this.updateCamera();
  }

  createBrush() {
    const ring = new THREE.Mesh(
      new THREE.TorusGeometry(0.34, 0.008, 8, 80),
      new THREE.MeshBasicMaterial({ color: 0xfff2d4, transparent: true, opacity: 0.9, depthWrite: false })
    );
    ring.rotation.x = Math.PI / 2;
    ring.visible = false;
    return ring;
  }

  bind() {
    this.canvas.addEventListener("pointerdown", (event) => this.onPointerDown(event));
    this.canvas.addEventListener("pointermove", (event) => this.onPointerMove(event));
    window.addEventListener("pointerup", () => this.onPointerUp());
    this.canvas.addEventListener("wheel", (event) => {
      event.preventDefault();
      this.cameraOrbit.distance = Math.max(2.4, Math.min(6.2, this.cameraOrbit.distance + event.deltaY * 0.003));
      this.updateCamera();
    }, { passive: false });
  }

  setPointer(event) {
    const rect = this.canvas.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  intersect(event) {
    this.setPointer(event);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const hit = this.raycaster.intersectObject(this.pottery.mesh, false)[0];
    if (!hit) return null;
    hit.localPoint = this.pottery.group.worldToLocal(hit.point.clone());
    return hit;
  }

  onPointerDown(event) {
    this.canvas.setPointerCapture?.(event.pointerId);
    this.last = { x: event.clientX, y: event.clientY };
    const hit = this.intersect(event);
    if (hit && this.getStage() !== "display") {
      this.draggingClay = true;
      this.pottery.pushHistory();
      this.audio.touch();
      this.updateBrush(hit.localPoint);
      if (this.getStage() === "paint" || this.getTool() === "paint" || this.getTool() === "eraser") {
        this.onChange?.({ type: "paint", point: hit.localPoint });
      }
    } else {
      this.orbiting = true;
    }
  }

  onPointerMove(event) {
    const hit = this.intersect(event);
    if (hit) this.updateBrush(hit.localPoint);
    else if (!this.draggingClay) this.brushMesh.visible = false;

    const dx = event.clientX - this.last.x;
    const dy = event.clientY - this.last.y;
    this.last = { x: event.clientX, y: event.clientY };

    if (this.draggingClay && hit) {
      if (this.getStage() === "paint" || this.getTool() === "paint" || this.getTool() === "eraser") {
        this.onChange?.({ type: "paint", point: hit.localPoint });
      } else {
        this.pottery.deform(hit.localPoint, { x: dx / 240, y: -dy / 220 }, this.getTool(), this.getBrushSize(), this.getStrength());
        this.onChange?.({ type: "deform" });
      }
      return;
    }

    if (this.orbiting) {
      this.cameraOrbit.yaw -= dx * 0.006;
      this.cameraOrbit.pitch = Math.max(0.08, Math.min(0.85, this.cameraOrbit.pitch + dy * 0.004));
      this.updateCamera();
    }
  }

  onPointerUp() {
    this.draggingClay = false;
    this.orbiting = false;
    this.audio.stopTouch();
  }

  updateBrush(point) {
    this.brushMesh.visible = true;
    this.brushMesh.position.copy(point);
    const radius = Math.hypot(point.x, point.z);
    this.brushMesh.scale.setScalar(Math.max(0.35, radius / 0.34));
  }

  updateCamera(focusHeight = 1.05) {
    const { yaw, pitch, distance } = this.cameraOrbit;
    this.camera.position.set(
      Math.sin(yaw) * Math.cos(pitch) * distance,
      focusHeight + Math.sin(pitch) * distance,
      Math.cos(yaw) * Math.cos(pitch) * distance
    );
    this.camera.lookAt(0, focusHeight, 0);
  }

  cinematic(distance = 3.1, pitch = 0.32) {
    this.cameraOrbit.distance = distance;
    this.cameraOrbit.pitch = pitch;
    this.updateCamera(1.2);
  }
}
