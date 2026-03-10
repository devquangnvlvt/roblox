import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// DOM Elements
const canvasMount = document.getElementById("canvasMount");
const resetViewBtn = document.getElementById("resetView");
const screenshotBtn = document.getElementById("screenshot");

// Scene state
let scene, camera, renderer, controls, grid, ambient, dirLight, avatar;
const shirtTargets = [];
const pantsTargets = [];

const r15ShirtPartNames = ["UpperTorso", "LowerTorso", "LeftUpperArm", "LeftLowerArm", "LeftHand", "RightUpperArm", "RightLowerArm", "RightHand"];
const r15PantsPartNames = ["LeftUpperLeg", "LeftLowerLeg", "LeftFoot", "RightUpperLeg", "RightLowerLeg", "RightFoot"];

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0b0e11);

  const w = canvasMount.clientWidth || window.innerWidth;
  const h = canvasMount.clientHeight || window.innerHeight;

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
  camera.position.set(0.8, 1.2, 2.2);

  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  canvasMount.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0.8, 0);

  ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(2, 3.5, 2.5);
  scene.add(dirLight);

  grid = new THREE.GridHelper(4, 40, 0x2a2f3a, 0x2a2f3a);
  scene.add(grid);

  window.addEventListener("resize", onResize);
  loadAvatar();
  bindUiEvents();
}

function bindUiEvents() {
  resetViewBtn.addEventListener("click", resetView);
  screenshotBtn.addEventListener("click", saveScreenshot);

  // ── Kotlin Bridge ──────────────────────────────────────
  window.setShirtFromBase64 = (base64) => loadTextureFromBase64(base64, "shirt");
  window.setPantsFromBase64 = (base64) => loadTextureFromBase64(base64, "pants");
  window.clearShirt        = ()       => clearClothingTexture("shirt");
  window.clearPants        = ()       => clearClothingTexture("pants");
  // ──────────────────────────────────────────────────────
}

function loadTextureFromBase64(base64Data, type) {
  const dataUri = base64Data.startsWith("data:") ? base64Data : `data:image/png;base64,${base64Data}`;
  const loader = new THREE.TextureLoader();
  loader.load(dataUri, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    applyClothingTexture(type, texture);
  });
}

function clearClothingTexture(type) {
  const targets = type === "shirt" ? shirtTargets : pantsTargets;
  targets.forEach((mesh) => {
    mesh.material.map = null;
    mesh.material.needsUpdate = true;
  });
}

function loadAvatar() {
  const loader = new GLTFLoader();
  loader.load("public/models/r15.glb", (gltf) => {
    avatar = gltf.scene;
    avatar.scale.set(0.25, 0.25, 0.25);
    avatar.rotation.y = Math.PI;
    scene.add(avatar);

    const shirtNameSet = new Set(r15ShirtPartNames);
    const pantsNameSet = new Set(r15PantsPartNames);

    avatar.traverse((obj) => {
      if (!obj.isMesh) return;
      obj.material = new THREE.MeshStandardMaterial({ color: 0xbfc5d1, metalness: 0, roughness: 0.95 });
      if (shirtNameSet.has(obj.name)) shirtTargets.push(obj);
      if (pantsNameSet.has(obj.name)) pantsTargets.push(obj);
    });

    // Demo: tự load áo mẫu để xem thử (giống như Kotlin gọi setShirtFromBase64)
    const demoLoader = new THREE.TextureLoader();
    demoLoader.load("public/image/shirts/1.png", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = false;
      applyClothingTexture("shirt", texture);
    });
    demoLoader.load("public/image/pants/10.png", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = false;
      applyClothingTexture("pants", texture);
    });
  }, undefined, (err) => console.error("Avatar load error:", err));
}

function applyClothingTexture(type, texture) {
  const targets = type === "shirt" ? shirtTargets : pantsTargets;
  targets.forEach((mesh) => {
    mesh.material.map = texture;
    mesh.material.needsUpdate = true;
  });
}

function resetView() {
  controls.target.set(0, 0.8, 0);
  camera.position.set(0.8, 1.2, 2.2);
  controls.update();
}

function saveScreenshot() {
  const link = document.createElement("a");
  link.download = "preview.png";
  link.href = renderer.domElement.toDataURL("image/png");
  link.click();
}

function onResize() {
  const w = canvasMount.clientWidth;
  const h = canvasMount.clientHeight;
  if (w && h) {
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}