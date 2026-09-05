import * as THREE from "three";
import { PotteryMesh } from "./PotteryMesh.js";
import { PotteryControls } from "./PotteryControls.js";
import { PaintSystem } from "./PaintSystem.js";
import { GameState } from "./GameState.js";
import { AudioManager } from "./AudioManager.js";
import { UIManager } from "./UIManager.js";

const canvas = document.querySelector("#scene");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0xf4eadc);
scene.fog = new THREE.Fog(0xf4eadc, 6, 11);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 100);
const clock = new THREE.Clock();
const gameState = new GameState();
const audio = new AudioManager();

const pottery = new PotteryMesh(scene);
const paintSystem = new PaintSystem(pottery);
const ui = new UIManager(gameState, paintSystem);

let activeTool = "shape";
let paused = false;
let dustVisible = true;

const controls = new PotteryControls({
  canvas,
  camera,
  pottery,
  audio,
  getTool: () => activeTool,
  getBrushSize: () => Number(document.querySelector("#brushSize").value),
  getStrength: () => Number(document.querySelector("#brushStrength").value),
  getStage: () => gameState.stage,
  onChange: (event) => {
    if (event.type === "paint") paintSystem.paint(event.point, Number(document.querySelector("#brushSize").value));
    gameState.saveCurrent(pottery, gameState.stage);
  }
});

function addStudio() {
  const hemi = new THREE.HemisphereLight(0xfff7e8, 0x7f6042, 1.8);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffdfad, 3.4);
  sun.position.set(-3.8, 5.5, 3.2);
  sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048);
  scene.add(sun);
  const fill = new THREE.PointLight(0x9eb7c7, 1.2, 6);
  fill.position.set(3, 2.5, -2);
  scene.add(fill);

  const table = new THREE.Mesh(
    new THREE.CylinderGeometry(2.2, 2.35, 0.2, 96),
    new THREE.MeshStandardMaterial({ color: 0x6e4c32, roughness: 0.62 })
  );
  table.position.y = -0.16;
  table.receiveShadow = true;
  scene.add(table);

  const wheel = new THREE.Mesh(
    new THREE.CylinderGeometry(0.92, 1.02, 0.18, 128),
    new THREE.MeshStandardMaterial({ color: 0x46372d, roughness: 0.42, metalness: 0.08 })
  );
  wheel.position.y = 0.02;
  wheel.receiveShadow = true;
  wheel.castShadow = true;
  scene.add(wheel);
  pottery.group.userData.wheel = wheel;

  const pedestal = new THREE.Mesh(
    new THREE.CylinderGeometry(0.75, 0.88, 0.52, 96),
    new THREE.MeshStandardMaterial({ color: 0xe8dfd0, roughness: 0.5 })
  );
  pedestal.position.y = -0.34;
  pedestal.visible = false;
  scene.add(pedestal);
  scene.userData.pedestal = pedestal;

  const particles = new THREE.BufferGeometry();
  const points = [];
  for (let i = 0; i < 180; i++) points.push((Math.random() - 0.5) * 7, Math.random() * 4 + 0.4, (Math.random() - 0.5) * 6);
  particles.setAttribute("position", new THREE.Float32BufferAttribute(points, 3));
  const dust = new THREE.Points(particles, new THREE.PointsMaterial({ color: 0xfff6da, size: 0.018, transparent: true, opacity: 0.55 }));
  scene.add(dust);
  scene.userData.dust = dust;
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
}

function setTool(tool) {
  activeTool = tool;
  document.querySelectorAll(".tool").forEach((button) => button.classList.toggle("active", button.dataset.tool === tool));
  if (tool === "eraser") paintSystem.setBrush("eraser");
  if (tool === "paint" && paintSystem.brush === "eraser") paintSystem.setBrush("free");
  ui.updateStage();
  if (tool === "paint") ui.toast("Drag on the pottery to paint patterns");
  if (tool === "eraser") ui.toast("Drag on the pottery to erase paint");
}

function setStageMaterial(stage) {
  if (stage === "shape" || stage === "smooth") pottery.setStageMaterial("shape");
  if (stage === "dry") animateDry();
  if (stage === "fire") animateFire();
  if (stage === "paint") pottery.setStageMaterial("fired");
  if (stage === "display") displayFinished();
  ui.updateStage();
  gameState.saveCurrent(pottery, stage);
}

function animateDry() {
  controls.cinematic(3.2, 0.26);
  pottery.setStageMaterial("dry");
  ui.toast("The clay dries to a lighter surface");
}

function animateFire() {
  controls.cinematic(3.0, 0.38);
  audio.kiln();
  const kilnLight = new THREE.PointLight(0xff762a, 0, 6);
  kilnLight.position.set(0, 1.2, 1.6);
  scene.add(kilnLight);
  let t = 0;
  const timer = setInterval(() => {
    t += 0.08;
    kilnLight.intensity = Math.sin(t) * 2.2 + 2.4;
    if (t > Math.PI) {
      clearInterval(timer);
      scene.remove(kilnLight);
      pottery.setStageMaterial("fired");
      ui.toast("Fired into ceramic");
    }
  }, 60);
}

function displayFinished() {
  controls.cinematic(3.65, 0.24);
  scene.userData.pedestal.visible = true;
  pottery.group.position.y = 0.26;
  pottery.setStageMaterial("glazed", paintSystem.glaze);
  const metrics = gameState.score(pottery.getMetrics());
  ui.showScore(metrics, gameState.challenge.name);
  const name = prompt("Name this pottery piece:", "Studio Piece") || "Studio Piece";
  gameState.saveToGallery(name, screenshot(), metrics);
  ui.toast("Saved to gallery");
}

function screenshot() {
  renderer.render(scene, camera);
  return canvas.toDataURL("image/png");
}

function openGallery() {
  const render = () => {
    ui.renderGallery(gameState.gallery(), (id) => {
      gameState.deleteFromGallery(id);
      render();
      ui.toast("Deleted from gallery");
    });
  };
  render();
  document.querySelector("#galleryDialog").showModal();
}

function bindUI() {
  document.querySelector("#challengeText").textContent = `Challenge: ${gameState.challenge.name}`;
  document.querySelector("#newCreationBtn").addEventListener("click", () => {
    document.querySelector("#startScreen").classList.remove("active");
    audio.ensure();
  });
  document.querySelector("#tutorialBtn").addEventListener("click", () => document.querySelector("#tutorialDialog").showModal());
  document.querySelector("#closeTutorialBtn").addEventListener("click", () => document.querySelector("#tutorialDialog").close());
  document.querySelector("#galleryBtn").addEventListener("click", openGallery);
  document.querySelector("#closeGalleryBtn").addEventListener("click", () => document.querySelector("#galleryDialog").close());
  document.querySelectorAll(".tool").forEach((button) => button.addEventListener("click", () => setTool(button.dataset.tool)));
  document.querySelector("#undoBtn").addEventListener("click", () => pottery.undo() && ui.toast("Undo"));
  document.querySelector("#redoBtn").addEventListener("click", () => pottery.redo() && ui.toast("Redo"));
  document.querySelector("#resetBtn").addEventListener("click", () => { pottery.reset(); gameState.resetStage(); scene.userData.pedestal.visible = false; pottery.group.position.y = 0; setStageMaterial("shape"); });
  document.querySelector("#nextStageBtn").addEventListener("click", () => setStageMaterial(gameState.next()));
  document.querySelector("#prevStageBtn").addEventListener("click", () => setStageMaterial(gameState.prev()));
  document.querySelector("#glazeSelect").addEventListener("change", (event) => paintSystem.setGlaze(event.target.value));
  document.querySelector("#insidePaint").addEventListener("change", (event) => paintSystem.setInside(event.target.checked));
  document.querySelector("#applyGlazeBtn").addEventListener("click", () => paintSystem.previewGlaze());
  document.querySelector("#muteBtn").addEventListener("click", () => { audio.setMuted(!audio.muted); ui.toast(audio.muted ? "Sound off" : "Sound on"); });
  document.querySelector("#saveBtn").addEventListener("click", () => {
    gameState.saveCurrent(pottery, gameState.stage);
    ui.toast("Current design saved");
  });
  document.querySelector("#exportBtn").addEventListener("click", () => {
    const link = document.createElement("a");
    link.download = "clay-studio.png";
    link.href = screenshot();
    link.click();
  });
  document.querySelector("#fullscreenBtn").addEventListener("click", () => document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen());
  document.querySelector("#pauseBtn").addEventListener("click", () => { paused = true; document.querySelector("#pauseDialog").showModal(); });
  document.querySelector("#closePauseBtn").addEventListener("click", () => { paused = false; document.querySelector("#pauseDialog").close(); });
  document.querySelector("#particlesToggle").addEventListener("change", (event) => { dustVisible = event.target.checked; });
  document.querySelector("#musicToggle").addEventListener("change", (event) => audio.setMuted(!event.target.checked));
  window.addEventListener("resize", resize);
  window.addEventListener("error", (event) => ui.toast(`Error: ${event.message}`));
}

function animate() {
  requestAnimationFrame(animate);
  const dt = clock.getDelta();
  if (!paused) {
    pottery.group.rotation.y += dt * 0.85;
    pottery.group.userData.wheel.rotation.y += dt * 3.2;
    if (scene.userData.dust) {
      scene.userData.dust.visible = dustVisible;
      scene.userData.dust.rotation.y += dt * 0.03;
    }
  }
  renderer.render(scene, camera);
}

addStudio();
bindUI();
resize();
setStageMaterial(gameState.stage);
gameState.loadCurrent(pottery);
ui.updateStage();
document.querySelector("#challengeText").textContent = `Challenge: ${gameState.challenge.name}`;
animate();
