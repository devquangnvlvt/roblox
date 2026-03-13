import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "./lib/OrbitControls.js";
import { GLTFLoader } from "./lib/GLTFLoader.js";


// Debug log
console.log("app.js starting execution...");

// DOM Elements

const canvasMount = document.getElementById("canvasMount");

// Scene state
let scene, camera, renderer, controls, grid, ambient, dirLight, avatar;
const shirtTargets = [];
const pantsTargets = [];

const r15ShirtPartNames = ["UpperTorso", "LowerTorso", "LeftUpperArm", "LeftLowerArm", "LeftHand", "RightUpperArm", "RightLowerArm", "RightHand"];
const r15PantsPartNames = ["LeftUpperLeg", "LeftLowerLeg", "LeftFoot", "RightUpperLeg", "RightLowerLeg", "RightFoot"];

// Global Error Catching for WebView
window.showError = (msg) => {
  console.error("AppError:", msg);
  const overlay = document.getElementById("error-overlay");
  const msgEl = document.getElementById("error-message");
  if (overlay && msgEl) {
    overlay.style.display = "block";
    msgEl.innerText += "\n> " + msg;
  }
};

window.onerror = (message, source, lineno, colno, error) => {
  window.showError(`${message} (${source}:${lineno})`);
  return false;
};

// Start logic
try {
  init();
  animate();
} catch (err) {
  window.showError("Init/Animate error: " + err.message);
}

function init() {
  window.THREE = THREE; // Để script diagnostic kiểm tra được
  scene = new THREE.Scene();

  scene.background = new THREE.Color(0x0b0e11);

  const w = canvasMount.clientWidth || window.innerWidth;
  const h = canvasMount.clientHeight || window.innerHeight;

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
  camera.position.set(0, 1.2, 3);

  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  canvasMount.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 1.0, 0);
  controls.minDistance = 1.0;
  controls.maxDistance = 6.0;
  controls.enablePan = false;

  ambient = new THREE.AmbientLight(0xffffff, 0.6);
  scene.add(ambient);

  dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
  dirLight.position.set(2, 3.5, 2.5);
  scene.add(dirLight);

  grid = new THREE.GridHelper(4, 40, 0x2a2f3a, 0x2a2f3a);
  scene.add(grid);

  window.addEventListener("resize", onResize);
  
  // Kiểm tra WebGL
  if (!window.WebGLRenderingContext) {
    window.showError("Trình duyệt này không hỗ trợ WebGL.");
  }

  loadAvatar();
  bindUiEvents();
  
  // Force resize after 100ms to ensure canvas matches layout in WebView
  setTimeout(onResize, 100);
}


function bindUiEvents() {

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

    console.log("Avatar loaded successfully");

    // Demo: tự load áo mẫu để xem thử (giống như Kotlin gọi setShirtFromBase64)
    const demoLoader = new THREE.TextureLoader();
    demoLoader.load("public/image/shirts/1.png", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = false;
      applyClothingTexture("shirt", texture);
    }, undefined, (e) => console.warn("Demo shirt failed", e));
    
    demoLoader.load("public/image/pants/14.png", (texture) => {
      texture.colorSpace = THREE.SRGBColorSpace;
      texture.flipY = false;
      applyClothingTexture("pants", texture);
    }, undefined, (e) => console.warn("Demo pants failed", e));
    
  }, undefined, (err) => {
    window.showError("Avatar load error: " + err.message + "\nPath: public/models/r15.glb");
  });
}


function applyClothingTexture(type, texture) {
  const targets = type === "shirt" ? shirtTargets : pantsTargets;
  targets.forEach((mesh) => {
    mesh.material.map = texture;
    mesh.material.needsUpdate = true;
  });
}



function onResize() {
  const w = canvasMount.clientWidth;
  const h = canvasMount.clientHeight;
  if (w && h) {
    camera.aspect = w / h;
    
    // Adjust FOV for mobile to ensure character is centered and visible
    if (w < 600) {
      camera.fov = 55;
    } else {
      camera.fov = 45;
    }
    
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}