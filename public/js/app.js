import * as THREE from "./lib/three.module.js";
import { OrbitControls } from "./lib/OrbitControls.js";
import { GLTFLoader } from "./lib/GLTFLoader.js";
import { OBJLoader } from "./lib/OBJLoader.js";

// Debug log
console.log("app.js starting execution...");

// DOM Elements
const canvasMount = document.getElementById("canvasMount");

// Scene state
let scene, camera, renderer, controls, grid, ambient, dirLight, avatar;
const shirtTargets = [];
const pantsTargets = [];
const headTargets = [];

const r15ShirtPartNames = ["UpperTorso", "LowerTorso", "LeftUpperArm", "LeftLowerArm", "LeftHand", "RightUpperArm", "RightLowerArm", "RightHand"];
const r15PantsPartNames = ["LeftUpperLeg", "LeftLowerLeg", "LeftFoot", "RightUpperLeg", "RightLowerLeg", "RightFoot"];

// Character config
const CHARACTERS = [
  {
    id: "default", label: "Nhân vật 1", icon: "1", path: "public/models/r15.glb", type: "glb", uvType: "raw",
    faceConfig: { offsetX: 70, offsetY: 45, scaleX: 1.2, scaleY: 1.2 },
    sockets: { eyesY: 0.55, noseY: 0.45, mouthY: 0.35, zOffset: 0.45 }
  },
  {
    id: "man", label: "Nhân vật man", icon: "2", path: "public/models/man-r15.glb", type: "glb", uvType: "composite",
    faceConfig: { offsetX: 70, offsetY: 55, scaleX: 1.2, scaleY: 1.2 },
    sockets: { eyesY: 0.58, noseY: 0.48, mouthY: 0.38, zOffset: 0.48 }
  },
  {
    id: "woman", label: "Nhân vật woman", icon: "3", path: "public/models/woman-r15.glb", type: "glb", uvType: "composite",
    faceConfig: { offsetX: 70, offsetY: 35, scaleX: 1.1, scaleY: 1.1 },
    sockets: { eyesY: 0.53, noseY: 0.43, mouthY: 0.33, zOffset: 0.42 }
  },
  {
    id: "rounded", label: "Nhân vật rounded", icon: "4", path: "public/models/rounded-r15.glb", type: "glb", uvType: "composite",
    faceConfig: { offsetX: 70, offsetY: 65, scaleX: 1.3, scaleY: 1.25 },
    sockets: { eyesY: 0.62, noseY: 0.52, mouthY: 0.42, zOffset: 0.55 }
  },
];
let currentCharId = "default";
let currentShirtTexture = null;
let currentPantsTexture = null;
let currentFaceTexture = null;
let isLoading = false;

// Face customization state
let faceOffsetX = 0;
let faceOffsetY = 0;
let faceScaleX = 1.0;
let faceScaleY = 1.0;


// New States for Part 6
let currentEnvMode = "dark";
const activeAccessories = {
  hair: null,
  glasses: null,
  wings: null,
  neck: null,
  righthand: null,
  lefthand: null,
  shoulder: null,
  hat: null,
  waist: null
};
let activeTuningCategory = "hair";
const activeCategoryModels = {
  hair: null,
  glasses: null,
  wings: null,
  neck: null,
  righthand: null,
  lefthand: null,
  shoulder: null,
  hat: null,
  waist: null
};

// New States for Accessory Adjustment
let accOffsetX = 0;
let accOffsetY = 0;
let accOffsetZ = 0;
let accRotationX = 0;
let accRotationY = 0;
let accRotationZ = 0;
let accScale = 1.0;

// Accessory Map for dynamic loading
let accessoryConfigMap = {};
let glassesConfigMap = {};
let wingsConfigMap = {};
let neckConfigMap = {};
let righthandConfigMap = {};
let lefthandConfigMap = {};
let shoulderConfigMap = {};
let hatConfigMap = {};
let waistConfigMap = {};

let compositeCanvas = null;
let compositeCtx = null;
let compositeTexture = null;

const shirtMappings = [
  [2, 10, 231, 8, 128, 64, 0], [2, 74, 231, 74, 128, 128, 0], [2, 202, 231, 204, 128, 64, 0], [130, 74, 361, 74, 64, 128, 0], [194, 74, 427, 74, 128, 128, 0], [322, 74, 165, 74, 64, 128, 0],
  [498, 2, 308, 289, 64, 64, 90], [498, 66, 506, 355, 64, 112, 0], [498, 218, 506, 467, 64, 16, 0], [562, 66, 308, 355, 64, 112, 0], [562, 218, 308, 467, 64, 16, 0], [626, 66, 374, 355, 64, 112, 0], [626, 218, 374, 467, 64, 16, 0], [690, 66, 440, 355, 64, 112, 0], [498, 238, 440, 467, 64, 16, 0], [694, 218, 308, 485, 64, 64, 0],
  [762, 2, 217, 289, 64, 64, 90], [762, 66, 151, 355, 64, 112, 0], [762, 218, 151, 467, 64, 16, 0], [826, 66, 217, 355, 64, 112, 0], [826, 218, 217, 467, 64, 16, 0], [890, 66, 19, 355, 64, 112, 0], [890, 218, 19, 467, 64, 16, 0], [954, 66, 85, 355, 64, 112, 0], [762, 238, 85, 467, 64, 16, 0], [958, 218, 217, 485, 64, 64, 0]
];

const pantsMappings = [
  [2, 10, 231, 8, 128, 64, 0], [2, 74, 231, 74, 128, 128, 0], [2, 202, 231, 204, 128, 64, 0], [130, 74, 361, 74, 64, 128, 0], [194, 74, 427, 74, 128, 128, 0], [322, 74, 165, 74, 64, 128, 0],
  [498, 286, 308, 289, 64, 64, 90], [498, 350, 506, 355, 64, 112, 0], [498, 502, 506, 467, 64, 16, 0], [562, 350, 308, 355, 64, 112, 0], [562, 502, 308, 467, 64, 16, 0], [626, 350, 374, 355, 64, 112, 0], [626, 502, 374, 467, 64, 16, 0], [690, 350, 440, 355, 64, 112, 0], [498, 522, 440, 467, 64, 16, 0], [694, 502, 308, 485, 64, 64, 0],
  [762, 286, 217, 289, 64, 64, 90], [762, 350, 151, 355, 64, 112, 0], [762, 502, 151, 467, 64, 16, 0], [826, 350, 217, 355, 64, 112, 0], [826, 502, 217, 467, 64, 16, 0], [890, 350, 19, 355, 64, 112, 0], [890, 502, 19, 467, 64, 16, 0], [954, 350, 85, 355, 64, 112, 0], [762, 522, 85, 467, 64, 16, 0], [958, 502, 217, 485, 64, 64, 0]
];

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
  window.THREE = THREE;
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

  if (!window.WebGLRenderingContext) {
    window.showError("Trình duyệt này không hỗ trợ WebGL.");
  }

  injectCharacterSwitcher();
  injectControlPanel();
  loadAvatar(currentCharId);
  bindUiEvents();
  loadAccessoryConfigs(); // Load JSON config at start

  setTimeout(onResize, 100);
}

async function loadAccessoryConfigs() {
  try {
    const res = await fetch("public/models/accessories_config.json");
    if (!res.ok) throw new Error("Could not find accessories_config.json");
    accessoryConfigMap = await res.json();
    console.log("Accessory configurations loaded:", Object.keys(accessoryConfigMap).length);
    
    try {
      const gRes = await fetch("public/models/glasses_config.json");
      if (gRes.ok) {
        glassesConfigMap = await gRes.json();
        console.log("Glasses configurations loaded:", Object.keys(glassesConfigMap).length);
      }
    } catch(e) { console.warn("No glasses config found"); }
    
    try {
      const wRes = await fetch("public/models/wings_config.json");
      if (wRes.ok) {
        wingsConfigMap = await wRes.json();
        console.log("Wings configurations loaded:", Object.keys(wingsConfigMap).length);
      }
    } catch(e) { console.warn("No wings config found"); }

    try {
      const nRes = await fetch("public/models/neck_config.json");
      if (nRes.ok) {
        neckConfigMap = await nRes.json();
        console.log("Neck configurations loaded:", Object.keys(neckConfigMap).length);
      }
    } catch(e) { console.warn("No neck config found"); }

    try {
      const rhRes = await fetch("public/models/righthand_config.json");
      if (rhRes.ok) {
        righthandConfigMap = await rhRes.json();
        console.log("RightHand configurations loaded:", Object.keys(righthandConfigMap).length);
      }
    } catch(e) { console.warn("No righthand config found"); }

    try {
      const lhRes = await fetch("public/models/lefthand_config.json");
      if (lhRes.ok) {
        lefthandConfigMap = await lhRes.json();
        console.log("LeftHand configurations loaded:", Object.keys(lefthandConfigMap).length);
      }
    } catch(e) { console.warn("No lefthand config found"); }

    try {
      const shRes = await fetch("public/models/shoulder_config.json");
      if (shRes.ok) {
        shoulderConfigMap = await shRes.json();
        console.log("Shoulder configurations loaded:", Object.keys(shoulderConfigMap).length);
      }
    } catch(e) { console.warn("No shoulder config found"); }

    try {
      const hRes = await fetch("public/models/hat_config.json");
      if (hRes.ok) {
        hatConfigMap = await hRes.json();
        console.log("Hat configurations loaded:", Object.keys(hatConfigMap).length);
      }
    } catch(e) { console.warn("No hat config found"); }

    try {
      const waistRes = await fetch("public/models/waist_config.json");
      if (waistRes.ok) {
        waistConfigMap = await waistRes.json();
        console.log("Waist configurations loaded:", Object.keys(waistConfigMap).length);
      }
    } catch(e) { console.warn("No waist config found"); }
    
    populateAccessoryButtons();
  } catch (err) {
    console.warn("Accessory Config error:", err.message);
    const list = document.getElementById("hair-list");
    if (list) list.innerHTML = `<span style="font-size:11px;opacity:0.4">Không tải được danh sách config</span>`;
  }
}

function populateAccessoryButtons() {
  const selHair = document.getElementById("hair-select");
  const selGlasses = document.getElementById("glasses-select");
  const selWings = document.getElementById("wings-select");
  const selNeck = document.getElementById("neck-select");
  const selRighthand = document.getElementById("righthand-select");
  const selLefthand = document.getElementById("lefthand-select");
  const selShoulder = document.getElementById("shoulder-select");
  const selHat = document.getElementById("hat-select");
  const selWaist = document.getElementById("waist-select");
    if (!selHair || !selGlasses || !selWings || !selNeck || !selRighthand || !selLefthand || !selShoulder || !selHat || !selWaist) return;

  // Xóa option cũ, giữ option đầu tiên
  selHair.innerHTML = `<option value="">-- Chưa chọn --</option>`;
  selGlasses.innerHTML = `<option value="">-- Chưa chọn --</option>`;
  selWings.innerHTML = `<option value="">-- Chưa chọn --</option>`;
  selNeck.innerHTML = `<option value="">-- Chưa chọn --</option>`;
  selRighthand.innerHTML = `<option value="">-- Chưa chọn --</option>`;
  selLefthand.innerHTML = `<option value="">-- Chưa chọn --</option>`;
  selShoulder.innerHTML = `<option value="">-- Chưa chọn --</option>`;
  selHat.innerHTML = `<option value="">-- Chưa chọn --</option>`;
  selWaist.innerHTML = `<option value="">-- Chưa chọn --</option>`;
  Object.entries(accessoryConfigMap).forEach(([filename, config]) => {
    const opt = document.createElement("option");
    opt.value = filename;
    opt.textContent = config.label || filename;
    selHair.appendChild(opt);
  });

  Object.entries(glassesConfigMap).forEach(([filename, config]) => {
    const opt = document.createElement("option");
    opt.value = filename;
    opt.textContent = config.label || filename;
    selGlasses.appendChild(opt);
  });

  Object.entries(wingsConfigMap).forEach(([filename, config]) => {
    const opt = document.createElement("option");
    opt.value = filename;
    opt.textContent = config.label || filename;
    selWings.appendChild(opt);
  });

  Object.entries(neckConfigMap).forEach(([filename, config]) => {
    const opt = document.createElement("option");
    opt.value = filename;
    opt.textContent = config.label || filename;
    selNeck.appendChild(opt);
  });

  Object.entries(righthandConfigMap).forEach(([filename, config]) => {
    const opt = document.createElement("option");
    opt.value = filename;
    opt.textContent = config.label || filename;
    selRighthand.appendChild(opt);
  });
 Object.entries(lefthandConfigMap).forEach(([filename, config]) => {
    const opt = document.createElement("option");
    opt.value = filename;
    opt.textContent = config.label || filename;
    selLefthand.appendChild(opt);
  });

  Object.entries(shoulderConfigMap).forEach(([filename, config]) => {
    const opt = document.createElement("option");
    opt.value = filename;
    opt.textContent = config.label || filename;
    selShoulder.appendChild(opt);
  });

  Object.entries(hatConfigMap).forEach(([filename, config]) => {
    const opt = document.createElement("option");
    opt.value = filename;
    opt.textContent = config.label || filename;
    selHat.appendChild(opt);
  });

  Object.entries(waistConfigMap).forEach(([filename, config]) => {
    const opt = document.createElement("option");
    opt.value = filename;
    opt.textContent = config.label || filename;
    selWaist.appendChild(opt);
  });
  selHair.addEventListener("change", () => {
    const filename = selHair.value;
    clearAccessoryByCategory("hair");
    if (!filename) return;

    activeTuningCategory = "hair";
    document.getElementById("lbl-tuning-target").textContent = "🎯 Đang chỉnh: Tóc";
    activeAccessories.hair = filename;

    const config = accessoryConfigMap[filename];
    loadAccessoryFromFile("public/image/hair/" + filename, "hair", (config && config.attachment) || "Head", config);
  });

  selGlasses.addEventListener("change", () => {
    const filename = selGlasses.value;
    clearAccessoryByCategory("glasses");
    if (!filename) return;

    activeTuningCategory = "glasses";
    document.getElementById("lbl-tuning-target").textContent = "🎯 Đang chỉnh: Kính";
    activeAccessories.glasses = filename;

    const config = glassesConfigMap[filename];
    loadAccessoryFromFile("public/image/glasses/" + filename, "glasses", (config && config.attachment) || "FaceCenter", config);
  });

  selWings.addEventListener("change", () => {
    const filename = selWings.value;
    clearAccessoryByCategory("wings");
    if (!filename) return;

    activeTuningCategory = "wings";
    document.getElementById("lbl-tuning-target").textContent = "🎯 Đang chỉnh: Cánh";
    activeAccessories.wings = filename;

    const config = wingsConfigMap[filename];
    loadAccessoryFromFile("public/image/wing/" + filename, "wings", (config && config.attachment) || "BodyBack", config);
  });

  selNeck.addEventListener("change", () => {
    const filename = selNeck.value;
    clearAccessoryByCategory("neck");
    if (!filename) return;

    activeTuningCategory = "neck";
    document.getElementById("lbl-tuning-target").textContent = "🎯 Đang chỉnh: Vòng cổ";
    activeAccessories.neck = filename;

    const config = neckConfigMap[filename];
    loadAccessoryFromFile("public/image/neck/" + filename, "neck", (config && config.attachment) || "Neck", config);
  });

  selRighthand.addEventListener("change", () => {
    const filename = selRighthand.value;
    clearAccessoryByCategory("righthand");
    if (!filename) return;

    activeTuningCategory = "righthand";
    document.getElementById("lbl-tuning-target").textContent = "🎯 Đang chỉnh: Tay phải";
    activeAccessories.righthand = filename;

    const config = righthandConfigMap[filename];
    loadAccessoryFromFile("public/image/righthand/" + filename, "righthand", (config && config.attachment) || "RightGrip", config);
  });

  selLefthand.addEventListener("change", () => {
    const filename = selLefthand.value;
    clearAccessoryByCategory("lefthand");
    if (!filename) return;

    activeTuningCategory = "lefthand";
    document.getElementById("lbl-tuning-target").textContent = "🎯 Đang chỉnh: Tay trái";
    activeAccessories.lefthand = filename;

    const config = lefthandConfigMap[filename];
    loadAccessoryFromFile("public/image/lefthand/" + filename, "lefthand", (config && config.attachment) || "LeftGrip", config);
  });

  selShoulder.addEventListener("change", () => {
    const filename = selShoulder.value;
    clearAccessoryByCategory("shoulder");
    if (!filename) return;

    activeTuningCategory = "shoulder";
    document.getElementById("lbl-tuning-target").textContent = "🎯 Đang chỉnh: Vai";
    activeAccessories.shoulder = filename;

    const config = shoulderConfigMap[filename];
    loadAccessoryFromFile("public/image/shoulder/" + filename, "shoulder", (config && config.attachment) || "LeftShoulder", config);
  });

  selHat.addEventListener("change", () => {
    const filename = selHat.value;
    clearAccessoryByCategory("hat");
    if (!filename) return;

    activeTuningCategory = "hat";
    document.getElementById("lbl-tuning-target").textContent = "🎯 Đang chỉnh: Mũ";
    activeAccessories.hat = filename;

    const config = hatConfigMap[filename];
    loadAccessoryFromFile("public/image/hat/" + filename, "hat", (config && config.attachment) || "Hat", config);
  });

  selWaist.addEventListener("change", () => {
    const filename = selWaist.value;
    clearAccessoryByCategory("waist");
    if (!filename) return;

    activeTuningCategory = "waist";
    document.getElementById("lbl-tuning-target").textContent = "🎯 Đang chỉnh: Thắt lưng";
    activeAccessories.waist = filename;

    const config = waistConfigMap[filename];
    loadAccessoryFromFile("public/image/waist/" + filename, "waist", (config && config.attachment) || "WaistCenter", config);
  });
}

// ── Character Switcher UI ────────────────────────────────────────────────────
function injectCharacterSwitcher() {
  const style = document.createElement("style");
  style.textContent = `
    #char-switcher {
      position: fixed;
      bottom: 24px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      gap: 10px;
      z-index: 200;
      background: rgba(11,14,17,0.72);
      backdrop-filter: blur(18px) saturate(130%);
      border: 1px solid rgba(255,255,255,0.09);
      border-radius: 999px;
      padding: 8px 14px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.45);
    }

    .char-btn {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 3px;
      background: transparent;
      border: 1.5px solid rgba(255,255,255,0.08);
      border-radius: 50px;
      padding: 8px 18px;
      cursor: pointer;
      transition: all 0.22s cubic-bezier(.4,0,.2,1);
      color: rgba(255,255,255,0.55);
      font-size: 11px;
      font-family: Inter, ui-sans-serif, system-ui, sans-serif;
      font-weight: 600;
      letter-spacing: .3px;
      min-width: 64px;
    }
    .char-btn .char-icon { font-size: 20px; line-height: 1; }
    .char-btn:hover {
      background: rgba(255,255,255,0.06);
      border-color: rgba(255,255,255,0.18);
      color: #fff;
      transform: translateY(-2px);
    }
    .char-btn.active {
      background: linear-gradient(135deg, #E63946 0%, #cf3441 100%);
      border-color: #E63946;
      color: #fff;
      box-shadow: 0 0 18px #E6394660;
      transform: translateY(-2px);
    }

    #char-loading {
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: none;
      flex-direction: column;
      align-items: center;
      gap: 14px;
      z-index: 500;
      pointer-events: none;
    }
    #char-loading.show { display: flex; }
    .char-spinner {
      width: 44px; height: 44px;
      border: 3.5px solid rgba(255,255,255,0.12);
      border-top-color: #E63946;
      border-radius: 50%;
      animation: spin .75s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    #char-loading span {
      color: rgba(255,255,255,0.6);
      font-size: 13px;
      font-family: Inter, sans-serif;
      font-weight: 500;
    }
  `;
  document.head.appendChild(style);

  // Switcher bar
  const bar = document.createElement("div");
  bar.id = "char-switcher";
  bar.setAttribute("role", "group");
  bar.setAttribute("aria-label", "Chọn nhân vật");

  CHARACTERS.forEach((char) => {
    const btn = document.createElement("button");
    btn.className = "char-btn" + (char.id === currentCharId ? " active" : "");
    btn.id = `char-btn-${char.id}`;
    btn.setAttribute("aria-label", `Nhân vật ${char.label}`);
    btn.innerHTML = `<span class="char-icon">${char.icon}</span><span>${char.label}</span>`;
    btn.addEventListener("click", () => switchCharacter(char.id));
    bar.appendChild(btn);
  });

  document.body.appendChild(bar);

  // Loading spinner
  const loader = document.createElement("div");
  loader.id = "char-loading";
  loader.innerHTML = `<div class="char-spinner"></div><span>Đang tải nhân vật…</span>`;
  document.body.appendChild(loader);
}

function setLoadingVisible(visible) {
  const el = document.getElementById("char-loading");
  if (el) el.classList.toggle("show", visible);
}

function setActiveCharBtn(id) {
  CHARACTERS.forEach((c) => {
    const btn = document.getElementById(`char-btn-${c.id}`);
    if (btn) btn.classList.toggle("active", c.id === id);
  });
}

// ── Switch character ──────────────────────────────────────────────────────────
function switchCharacter(id) {
  if (id === currentCharId || isLoading) return;
  currentCharId = id;
  setActiveCharBtn(id);
  loadAvatar(id);

}

// ── Load avatar (GLB or OBJ) ─────────────────────────────────────────────────
function loadAvatar(id) {
  const char = CHARACTERS.find((c) => c.id === id);
  if (!char) return;

  isLoading = true;
  setLoadingVisible(true);

  // Clear accessories when changing character
  clearAccessoryByCategory("hair", false);
  clearAccessoryByCategory("glasses", false);
  clearAccessoryByCategory("wings", false);
  clearAccessoryByCategory("neck", false);
  clearAccessoryByCategory("righthand", false);
  clearAccessoryByCategory("lefthand", false);
  clearAccessoryByCategory("shoulder", false);
  clearAccessoryByCategory("hat", false);
  clearAccessoryByCategory("waist", false);

  // Remove old avatar
  if (avatar) {
    scene.remove(avatar);
    avatar.traverse((obj) => {
      if (obj.geometry) obj.geometry.dispose();
      if (obj.material) {
        if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
        else obj.material.dispose();
      }
    });
    avatar = null;
    shirtTargets.length = 0;
    pantsTargets.length = 0;
    headTargets.length = 0;
  }

  if (char.type === "glb") {
    loadGLB(char.path);
  } else {
    loadOBJ(char.path);
  }
}

// pantsMaxY, headMinY: ngưỡng Y (local geometry space) chỉ dùng khi isOBJ=true
function onAvatarLoaded(obj, isOBJ = false, pantsMaxY = null, headMinY = null) {
  avatar = obj;
  avatar.rotation.y = Math.PI;
  scene.add(avatar);

  const shirtNameSet = new Set(r15ShirtPartNames);
  const pantsNameSet = new Set(r15PantsPartNames);

  avatar.traverse((child) => {
    if (!child.isMesh) return;

    // Giữ lại thuộc tính skinning/morph của material gốc (nếu có)
    const cloned = child.material && child.material.isMaterial ? child.material.clone() : new THREE.MeshStandardMaterial();
    cloned.color.set(0xbfc5d1);
    cloned.metalness = 0;
    cloned.roughness = 0.9;
    cloned.side = isOBJ ? THREE.DoubleSide : THREE.FrontSide;
    // Đảm bảo skinned mesh vẫn render đúng
    cloned.skinning = !!child.isSkinnedMesh;
    cloned.morphTargets = !!child.morphTargetInfluences;
    child.material = cloned;

    if (isOBJ && pantsMaxY !== null) {
      // ── Phân 3 vùng theo Y-centroid (local geometry space) ────────────
      // Zone 1 (dưới): centroid < pantsMaxY   → pants (chân)
      // Zone 2 (giữa): pantsMaxY ≤ centroid < headMinY → shirt (áo)
      // Zone 3 (đầu): centroid ≥ headMinY        → không texture (đầu, da)
      const pos = child.geometry && child.geometry.attributes.position;
      if (pos && pos.count > 0) {
        let sumY = 0;
        for (let i = 0; i < pos.count; i++) sumY += pos.getY(i);
        const centroidY = sumY / pos.count;
        if (centroidY < pantsMaxY) {
          pantsTargets.push(child);
        } else if (centroidY < headMinY) {
          shirtTargets.push(child);
        } else {
          headTargets.push(child);
        }
      }
    } else {
      // GLB: dùng tên mesh chuẩn của Roblox R15 (linh hoạt hơn với chữ hoa/thường)
      const lowName = child.name.toLowerCase();
      if (shirtNameSet.has(child.name)) shirtTargets.push(child);
      else if (pantsNameSet.has(child.name)) pantsTargets.push(child);
      else if (lowName.includes("head")) headTargets.push(child);
    }
  });

  // ── Fallback 1: Nếu tìm được áo/quần nhưng vẫn thiếu Đầu ───────────────────
  if (headTargets.length === 0) {
    const parts = [];
    let gMaxY = -Infinity;
    avatar.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      child.geometry.computeBoundingBox();
      const maxY = child.geometry.boundingBox.max.y;
      parts.push({ mesh: child, maxY });
      if (maxY > gMaxY) gMaxY = maxY;
    });
    // Lấy mesh có điểm cao nhất làm Đầu
    const topPart = parts.find(p => p.maxY === gMaxY);
    if (topPart) headTargets.push(topPart.mesh);
  }

  // ── Fallback 2: Model hoàn toàn không có tên mesh chuẩn R15 ─────────────────
  if (shirtTargets.length === 0 && pantsTargets.length === 0) {
    console.log("No R15 named parts found — geometry fallback");
    const parts = [];
    let gMinY = Infinity, gMaxY = -Infinity;

    avatar.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      const pos = child.geometry.attributes.position;
      if (!pos || pos.count === 0) return;
      let minY = Infinity, maxY = -Infinity, sumY = 0;
      for (let i = 0; i < pos.count; i++) {
        const y = pos.getY(i);
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        sumY += y;
      }
      const cy = sumY / pos.count;
      parts.push({ mesh: child, minY, maxY, cy });
      if (minY < gMinY) gMinY = minY;
      if (maxY > gMaxY) gMaxY = maxY;
    });

    const sizeY = gMaxY - gMinY || 1;
    const pantsMaxY = gMinY + sizeY * 0.55;  // mọi mesh có maxY thấp hơn ngưỡng này → quần
    const headMinY = gMaxY - sizeY * 0.18;  // mesh có minY cao hơn ngưỡng này → đầu (bỏ qua)

    parts.forEach((p) => {
      if (p.maxY < pantsMaxY) {
        pantsTargets.push(p.mesh);
      } else if (p.minY > headMinY) {
        headTargets.push(p.mesh);
      } else {
        shirtTargets.push(p.mesh);
      }
    });

    // Nếu vẫn thiếu, ưu tiên quần theo minY thấp nhất
    if (pantsTargets.length === 0 || shirtTargets.length === 0) {
      pantsTargets.length = 0;
      shirtTargets.length = 0;
      headTargets.length = 0;
      parts.sort((a, b) => a.minY - b.minY);           // đáy thấp nhất trước
      const pantsCount = Math.max(1, Math.round(parts.length * 0.4));
      const headCount = Math.max(1, Math.round(parts.length * 0.1));
      parts.forEach((p, idx) => {
        if (idx < pantsCount) pantsTargets.push(p.mesh);
        else if (idx >= parts.length - headCount) headTargets.push(p.mesh);
        else shirtTargets.push(p.mesh);
      });
    }

    console.log(`Geometry fallback result — shirt:${shirtTargets.length} pants:${pantsTargets.length}`);
  }

  console.log(`Avatar (${currentCharId}) loaded — shirt:${shirtTargets.length} pants:${pantsTargets.length}`);

  // Giữ nguyên quần áo khi đổi nhân vật
  if (currentShirtTexture) applyClothingTexture("shirt", currentShirtTexture);
  if (currentPantsTexture) applyClothingTexture("pants", currentPantsTexture);
  if (currentFaceTexture) applyFaceTexture();

  isLoading = false;
  setLoadingVisible(false);

  // Demo textures — chỉ load lần đầu (khi chưa có outfit nào)
  if (!currentShirtTexture && !currentPantsTexture && !currentFaceTexture) {
    const demoLoader = new THREE.TextureLoader();
    demoLoader.load("public/image/shirts/1.png", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false;
      currentShirtTexture = tex; applyClothingTexture("shirt", tex);
    }, undefined, (e) => console.warn("Demo shirt failed", e));

    demoLoader.load("public/image/pants/1.png", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false;
      currentPantsTexture = tex; applyClothingTexture("pants", tex);
    }, undefined, (e) => console.warn("Demo pants failed", e));

    // Demo face
    demoLoader.load("public/image/faces/1.png", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false;
      currentFaceTexture = tex; applyFaceTexture();
    }, undefined, (e) => console.warn("Demo face failed", e));
  }

  // Reload tất cả phụ kiện đang active với tọa độ của nhân vật mới
  if (activeAccessories.hair) {
    const filename = activeAccessories.hair;
    const config = accessoryConfigMap[filename];
    clearAccessoryByCategory("hair", false);
    loadAccessoryFromFile("public/image/hair/" + filename, "hair", (config && config.attachment) || "Head", config);
  }
  if (activeAccessories.glasses) {
    const filename = activeAccessories.glasses;
    const config = glassesConfigMap[filename];
    clearAccessoryByCategory("glasses", false);
    loadAccessoryFromFile("public/image/glasses/" + filename, "glasses", (config && config.attachment) || "FaceCenter", config);
  }
  if (activeAccessories.wings) {
    const filename = activeAccessories.wings;
    const config = wingsConfigMap[filename];
    clearAccessoryByCategory("wings", false);
    loadAccessoryFromFile("public/image/wing/" + filename, "wings", (config && config.attachment) || "BodyBack", config);
  }
  if (activeAccessories.neck) {
    const filename = activeAccessories.neck;
    const config = neckConfigMap[filename];
    clearAccessoryByCategory("neck", false);
    loadAccessoryFromFile("public/image/neck/" + filename, "neck", (config && config.attachment) || "Neck", config);
  }
  if (activeAccessories.righthand) {
    const filename = activeAccessories.righthand;
    const config = righthandConfigMap[filename];
    clearAccessoryByCategory("righthand", false);
    loadAccessoryFromFile("public/image/righthand/" + filename, "righthand", (config && config.attachment) || "RightGrip", config);
  }
  if (activeAccessories.lefthand) {
    const filename = activeAccessories.lefthand;
    const config = lefthandConfigMap[filename];
    clearAccessoryByCategory("lefthand", false);
    loadAccessoryFromFile("public/image/lefthand/" + filename, "lefthand", (config && config.attachment) || "LeftGrip", config);
  }
  if (activeAccessories.shoulder) {
    const filename = activeAccessories.shoulder;
    const config = shoulderConfigMap[filename];
    clearAccessoryByCategory("shoulder", false);
    loadAccessoryFromFile("public/image/shoulder/" + filename, "shoulder", (config && config.attachment) || "LeftShoulder", config);
  }
  if (activeAccessories.hat) {
    const filename = activeAccessories.hat;
    const config = hatConfigMap[filename];
    clearAccessoryByCategory("hat", false);
    loadAccessoryFromFile("public/image/hat/" + filename, "hat", (config && config.attachment) || "Hat", config);
  }
  if (activeAccessories.waist) {
    const filename = activeAccessories.waist;
    const config = waistConfigMap[filename];
    clearAccessoryByCategory("waist", false);
    loadAccessoryFromFile("public/image/waist/" + filename, "waist", (config && config.attachment) || "WaistCenter", config);
  }
}

// ── fitModel: scale bất kỳ model về 1.8 world units và căn giữa ──────────────────
// Dùng local geometry bounds (không cần model trong scene).
// Tất cả nhân vật (GLB, OBJ) đều cùng kích thước.
function fitModel(obj) {
  // 1. Giả lập trạng thái hiển thị cuối cùng (xoay 180 độ) để đo đạc chuẩn xác
  obj.position.set(0, 0, 0);
  obj.scale.set(1, 1, 1);
  obj.rotation.y = Math.PI; // Đây là góc xoay cuối cùng trong onAvatarLoaded
  obj.updateMatrixWorld(true);

  // 2. Đo đạc bao cảnh dựa trên trạng thái đã xoay
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  box.getSize(size);
  box.getCenter(center);

  if (size.y === 0) return { minY: 0, maxY: 0, sizeY: 0, scale: 1 };

  // 3. Tính toán tỉ lệ scale (chiều cao chuẩn 1.8)
  const scale = 1.8 / size.y;
  obj.scale.set(scale, scale, scale);

  // 4. Dịch chuyển để đưa trung tâm (đã xoay) về (0,0,0) và chân chạm sàn
  // Vì center đã bao gồm góc xoay PI, nên việc trừ đi center * scale sẽ đưa nó về 0 tuyệt đối
  obj.position.x = -center.x * scale;
  obj.position.y = -box.min.y * scale;
  obj.position.z = -center.z * scale;

  console.log(`fitModel (Final Sync) — id:${currentCharId} scale:${scale.toFixed(4)}`);
  return { minY: box.min.y, maxY: box.max.y, sizeY: size.y, scale };
}

function loadGLB(path) {
  const loader = new GLTFLoader();
  loader.load(path, (gltf) => {
    const obj = gltf.scene;
    fitModel(obj);                        // ← thực hiện scale+center giống OBJ
    onAvatarLoaded(obj, false, null, null);
  }, undefined, (err) => {
    isLoading = false;
    setLoadingVisible(false);
    window.showError("Avatar GLB load error: " + err.message);
  });
}

function loadOBJ(path) {
  const loader = new OBJLoader();
  loader.load(path, (obj) => {
    // Flip UV: OBJ dùng origin góc trái-dưới, texture flipY=false cần góc trái-trên
    obj.traverse((child) => {
      if (!child.isMesh || !child.geometry) return;
      const uv = child.geometry.attributes.uv;
      if (uv) {
        for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - uv.getY(i));
        uv.needsUpdate = true;
      }
    });

    const { minY, maxY, sizeY } = fitModel(obj);  // ← cùng fitModel

    // Ngưỡng 3 vùng cho Roblox R15
    const pantsMaxY = minY + sizeY * 0.45;  // dưới 45% → chân
    const headMinY = maxY - sizeY * 0.18;  // trên 18% → đầu (không texture)
    console.log(`OBJ zones — pants<${pantsMaxY.toFixed(2)} shirt<${headMinY.toFixed(2)}`);

    onAvatarLoaded(obj, true, pantsMaxY, headMinY);
  }, undefined, (err) => {
    isLoading = false;
    setLoadingVisible(false);
    window.showError("Avatar OBJ load error: " + (err.message || err));
  });
}

// ── UI Bindings ───────────────────────────────────────────────────────────────
function bindUiEvents() {
  // Kotlin Bridge
  window.setShirtFromBase64 = (base64) => loadTextureFromBase64(base64, "shirt");
  window.setPantsFromBase64 = (base64) => loadTextureFromBase64(base64, "pants");
  window.setFaceFromBase64 = (base64) => loadTextureFromBase64(base64, "face");
  window.clearShirt = () => clearClothingTexture("shirt");
  window.clearPants = () => clearClothingTexture("pants");
  window.clearFace = () => clearFaceTexture();
  // Expose character switcher to Kotlin
  window.switchCharacter = switchCharacter;
}

function loadTextureFromBase64(base64Data, type) {
  const dataUri = base64Data.startsWith("data:") ? base64Data : `data:image/png;base64,${base64Data}`;
  const loader = new THREE.TextureLoader();
  loader.load(dataUri, (texture) => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.flipY = false;
    if (type === "shirt") {
      currentShirtTexture = texture;
      applyClothingTexture(type, texture);
    } else if (type === "pants") {
      currentPantsTexture = texture;
      applyClothingTexture(type, texture);
    } else if (type === "face") {
      currentFaceTexture = texture;
      applyFaceTexture();
    }
  });
}

function updateCompositeTexture() {
  if (!compositeCanvas) {
    compositeCanvas = document.createElement("canvas");
    compositeCanvas.width = 1024;
    compositeCanvas.height = 1024;
    compositeCtx = compositeCanvas.getContext("2d", { willReadFrequently: true });
    compositeTexture = new THREE.CanvasTexture(compositeCanvas);
    compositeTexture.colorSpace = THREE.SRGBColorSpace;
    compositeTexture.flipY = false;
  }

  // Clear with skin background
  compositeCtx.fillStyle = "#bfc5d1";
  compositeCtx.fillRect(0, 0, 1024, 1024);

  const drawMaps = (img, mappings) => {
    if (!img) return;
    mappings.forEach(map => {
      const [dx, dy, sx, sy, w, h, rot] = map;
      if (rot === 90) {
        compositeCtx.save();
        compositeCtx.translate(dx + w / 2, dy + h / 2);
        compositeCtx.rotate(Math.PI / 2);
        compositeCtx.drawImage(img, sx, sy, w, h, -w / 2, -h / 2, w, h);
        compositeCtx.restore();
      } else {
        compositeCtx.drawImage(img, sx, sy, w, h, dx, dy, w, h);
      }
    });
  };

  if (currentPantsTexture && currentPantsTexture.image) {
    drawMaps(currentPantsTexture.image, pantsMappings);
  }
  if (currentShirtTexture && currentShirtTexture.image) {
    drawMaps(currentShirtTexture.image, shirtMappings);
  }

  compositeTexture.needsUpdate = true;
}

let faceCanvas = null;
let faceCtx = null;
let faceDisplayTexture = null;

function updateFaceTexture() {
  if (!faceCanvas) {
    faceCanvas = document.createElement("canvas");
    // Mở rộng lên 1024 để có "diện tích" dịch chuyển thoải mái không lo bị cắt
    faceCanvas.width = 1024;
    faceCanvas.height = 1024;
    faceCtx = faceCanvas.getContext("2d", { willReadFrequently: true });
    faceDisplayTexture = new THREE.CanvasTexture(faceCanvas);
    faceDisplayTexture.colorSpace = THREE.SRGBColorSpace;
    faceDisplayTexture.flipY = false;
  }

  // Màu nền da mặc định
  faceCtx.fillStyle = "#dfe3e6";
  faceCtx.fillRect(0, 0, faceCanvas.width, faceCanvas.height);

  if (currentFaceTexture && currentFaceTexture.image) {
    const char = CHARACTERS.find(c => c.id === currentCharId);
    const config = char ? char.faceConfig : { offsetX: 0, offsetY: 0, scaleX: 1, scaleY: 1 };

    // Tăng biên độ điều chỉnh cho phù hợp với canvas 1024
    const finalOffsetX = ((config.offsetX || 0) + faceOffsetX) * 2;
    const finalOffsetY = (config.offsetY + faceOffsetY) * 2;
    const finalScaleX = config.scaleX * faceScaleX * 2;
    const finalScaleY = config.scaleY * faceScaleY * 2;

    const img = currentFaceTexture.image;
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = img.width;
    tempCanvas.height = img.height;
    const tCtx = tempCanvas.getContext("2d");
    tCtx.drawImage(img, 0, 0);

    try {
      const imgData = tCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imgData.data;
      for (let i = 0; i < data.length; i += 4) {
        if (data[i] > 230 && data[i + 1] > 230 && data[i + 2] > 230) {
          data[i + 3] = 0;
        }
      }
      tCtx.putImageData(imgData, 0, 0);
    } catch (e) { console.warn("BG Removal Error:", e); }

    const w = 256 * finalScaleX;
    const h = 256 * finalScaleY;
    const x = (faceCanvas.width - w) / 2 - finalOffsetX;
    const y = (faceCanvas.height - h) / 2 - finalOffsetY;

    faceCtx.drawImage(tempCanvas, x, y, w, h);
  }
  faceDisplayTexture.needsUpdate = true;
}

function applyFaceTexture() {
  updateFaceTexture();
  headTargets.forEach((mesh) => {
    mesh.material.map = faceDisplayTexture;
    mesh.material.color.setHex(0xffffff); // Prevent double multiply
    mesh.material.needsUpdate = true;
  });
}

function clearFaceTexture() {
  currentFaceTexture = null;
  headTargets.forEach((mesh) => {
    mesh.material.map = null;
    mesh.material.color.setHex(0xbfc5d1);
    mesh.material.needsUpdate = true;
  });
}

function clearClothingTexture(type) {
  if (type === "shirt") currentShirtTexture = null;
  else currentPantsTexture = null;

  const charInfo = CHARACTERS.find(c => c.id === currentCharId);
  if (charInfo && charInfo.uvType === "composite") {
    updateCompositeTexture();
    return;
  }

  const targets = type === "shirt" ? shirtTargets : pantsTargets;
  targets.forEach((mesh) => {
    mesh.material.map = null;
    mesh.material.needsUpdate = true;
  });
}

function applyClothingTexture(type, texture) {
  const charInfo = CHARACTERS.find(c => c.id === currentCharId);
  if (charInfo && charInfo.uvType === "composite") {
    updateCompositeTexture();
    const allTargets = shirtTargets.concat(pantsTargets);
    allTargets.forEach((mesh) => {
      mesh.material.map = compositeTexture;
      mesh.material.color.setHex(0xffffff); // Prevent darkening
      mesh.material.needsUpdate = true;
    });
  } else {
    const targets = type === "shirt" ? shirtTargets : pantsTargets;
    targets.forEach((mesh) => {
      mesh.material.map = type === "shirt" ? currentShirtTexture : currentPantsTexture;
      mesh.material.transparent = true;
      mesh.material.alphaTest = 0.5;
      mesh.material.needsUpdate = true;
    });
  }
}

function onResize() {
  const w = canvasMount.clientWidth;
  const h = canvasMount.clientHeight;
  if (w && h) {
    camera.aspect = w / h;
    camera.fov = w < 600 ? 55 : 45;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  }
}

function animate() {
  requestAnimationFrame(animate);
  controls.update();

  renderer.render(scene, camera);
}

// ── Control Panel UI ─────────────────────────────────────────────────────────
function injectControlPanel() {
  const panel = document.createElement("div");
  panel.id = "control-panel";

  const style = document.createElement("style");
  style.textContent = `
    #control-panel {
      position: fixed;
      top: 20px;
      right: 20px;
      width: 180px;
      background: rgba(11, 14, 17, 0.7);
      backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
      z-index: 300;
      color: white;
      font-family: Inter, sans-serif;
    }
    .panel-section {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .panel-title {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 1px;
      opacity: 0.5;
      font-weight: 700;
    }
    .panel-btn {
      background: rgba(255,255,255,0.05);
      border: 1px solid rgba(255,255,255,0.1);
      color: white;
      padding: 8px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 12px;
      transition: all 0.2s;
      text-align: left;
    }
    .panel-btn:hover { background: rgba(255,255,255,0.12); }
    .panel-btn.active { background: #E63946; border-color: #E63946; }
    
    .toggle-container {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 13px;
    }
    .toggle-switch {
      width: 40px; height: 20px;
      background: rgba(255,255,255,0.2);
      border-radius: 20px;
      position: relative;
      cursor: pointer;
    }
    .toggle-switch::after {
      content: "";
      position: absolute;
      top: 2px; left: 2px;
      width: 16px; height: 16px;
      background: white;
      border-radius: 50%;
      transition: 0.2s;
    }
    .toggle-switch.on { background: #4CAF50; }
    .toggle-switch.on::after { transform: translateX(20px); }

    .theme-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px;
    }
    .theme-circle {
      width: 100%; height: 32px;
      border-radius: 6px;
      cursor: pointer;
      border: 2px solid transparent;
      transition: 0.2s;
    }
    .theme-circle:hover { transform: scale(1.05); }
    .theme-circle.active { border-color: #E63946; }

    .slider-container {
      display: flex;
      flex-direction: column;
      gap: 4px;
      font-size: 11px;
    }
    .slider-row {
      display: flex;
      align-items: center;
      gap: 8px;
    }
    input[type=range] {
      flex: 1;
      height: 4px;
      accent-color: #E63946;
      cursor: pointer;
    }
    .num-input {
      width: 48px;
      background: rgba(255,255,255,0.06);
      border: 1px solid rgba(255,255,255,0.15);
      color: white;
      border-radius: 4px;
      font-size: 11px;
      padding: 3px;
      text-align: right;
    }
  `;
  document.head.appendChild(style);

  panel.innerHTML = `
    <div class="panel-section">
      <div class="panel-title">🎀 Chọn Tóc</div>
      <select id="hair-select" style="
        width:100%; padding:8px 10px;
        border:1px solid rgba(255,255,255,0.15);
        border-radius:8px; 
        font-size:12px; font-family:Inter,sans-serif;
        cursor:pointer; outline:none;
        appearance:none; -webkit-appearance:none;
      ">
        <option value="">-- Chưa chọn --</option>
      </select>
      
      <div class="panel-title" style="margin-top:8px">🕶️ Chọn Kính</div>
      <select id="glasses-select" style="
        width:100%; padding:8px 10px;
        border:1px solid rgba(255,255,255,0.15);
        border-radius:8px; 
        font-size:12px; font-family:Inter,sans-serif;
        cursor:pointer; outline:none;
        appearance:none; -webkit-appearance:none;
      ">
        <option value="">-- Chưa chọn --</option>
      </select>

      <div class="panel-title" style="margin-top:8px">🦅 Chọn Cánh</div>
      <select id="wings-select" style="
        width:100%; padding:8px 10px;
        border:1px solid rgba(255,255,255,0.15);
        border-radius:8px; 
        font-size:12px; font-family:Inter,sans-serif;
        cursor:pointer; outline:none;
        appearance:none; -webkit-appearance:none;
      ">
        <option value="">-- Chưa chọn --</option>
      </select>

      <div class="panel-title" style="margin-top:8px">💎 Chọn Vòng cổ</div>
      <select id="neck-select" style="
        width:100%; padding:8px 10px;
        border:1px solid rgba(255,255,255,0.15);
        border-radius:8px; 
        font-size:12px; font-family:Inter,sans-serif;
        cursor:pointer; outline:none;
        appearance:none; -webkit-appearance:none;
      ">
        <option value="">-- Chưa chọn --</option>
      </select>

      <div class="panel-title" style="margin-top:8px">🗡️ Tay phải</div>
      <select id="righthand-select" style="
        width:100%; padding:8px 10px;
        border:1px solid rgba(255,255,255,0.15);
        border-radius:8px; 
        font-size:12px; font-family:Inter,sans-serif;
        cursor:pointer; outline:none;
        appearance:none; -webkit-appearance:none;
      ">
        <option value="">-- Chưa chọn --</option>
      </select>
      <div class="panel-title" style="margin-top:8px">🗡️ Tay trái</div>
      <select id="lefthand-select" style="
        width:100%; padding:8px 10px;
        border:1px solid rgba(255,255,255,0.15);
        border-radius:8px; 
        font-size:12px; font-family:Inter,sans-serif;
        cursor:pointer; outline:none;
        appearance:none; -webkit-appearance:none;
      ">
        <option value="">-- Chưa chọn --</option>
      </select>

      <div class="panel-title" style="margin-top:8px">🐘 Chọn Vai</div>
      <select id="shoulder-select" style="
        width:100%; padding:8px 10px;
        border:1px solid rgba(255,255,255,0.15);
        border-radius:8px; 
        font-size:12px; font-family:Inter,sans-serif;
        cursor:pointer; outline:none;
        appearance:none; -webkit-appearance:none;
      ">
        <option value="">-- Chưa chọn --</option>
      </select>

      <div class="panel-title" style="margin-top:8px">🎩 Chọn Mũ</div>
      <select id="hat-select" style="
        width:100%; padding:8px 10px;
        border:1px solid rgba(255,255,255,0.15);
        border-radius:8px; 
        font-size:12px; font-family:Inter,sans-serif;
        cursor:pointer; outline:none;
        appearance:none; -webkit-appearance:none;
      ">
        <option value="">-- Chưa chọn --</option>
      </select>

      <div class="panel-title" style="margin-top:8px">🥋 Chọn Thắt lưng</div>
      <select id="waist-select" style="
        width:100%; padding:8px 10px;
        border:1px solid rgba(255,255,255,0.15);
        border-radius:8px; 
        font-size:12px; font-family:Inter,sans-serif;
        cursor:pointer; outline:none;
        appearance:none; -webkit-appearance:none;
      ">
        <option value="">-- Chưa chọn --</option>
      </select>

      <div style="display:flex; gap:6px; margin-top:6px; flex-wrap:wrap;">
        <button class="panel-btn" id="btn-clear-hair" style="flex:1; min-width:30%; padding:6px 0; text-align:center;">❌ Tóc</button>
        <button class="panel-btn" id="btn-clear-glasses" style="flex:1; min-width:30%; padding:6px 0; text-align:center;">❌ Kính</button>
        <button class="panel-btn" id="btn-clear-wings" style="flex:1; min-width:30%; padding:6px 0; text-align:center;">❌ Cánh</button>
        <button class="panel-btn" id="btn-clear-neck" style="flex:1; min-width:30%; padding:6px 0; text-align:center;">❌ Cổ</button>
        <button class="panel-btn" id="btn-clear-righthand" style="flex:1; min-width:30%; padding:6px 0; text-align:center;">❌ Tay phải</button>
        <button class="panel-btn" id="btn-clear-lefthand" style="flex:1; min-width:30%; padding:6px 0; text-align:center;">❌ Tay trái</button>
        <button class="panel-btn" id="btn-clear-shoulder" style="flex:1; min-width:30%; padding:6px 0; text-align:center;">❌ Vai</button>
        <button class="panel-btn" id="btn-clear-hat" style="flex:1; min-width:30%; padding:6px 0; text-align:center;">❌ Mũ</button>
        <button class="panel-btn" id="btn-clear-waist" style="flex:1; min-width:30%; padding:6px 0; text-align:center;">❌ Eo</button>
      </div>

      <div class="panel-title" id="lbl-tuning-target" style="margin-top:10px; color:#E63946; border-bottom:1px solid rgba(255,255,255,0.1); padding-bottom:4px;">🎯 Đang chỉnh: Tóc</div>
      <div class="slider-container" style="margin-top:6px">
        <span>Vị trí X (Ngang)</span>
        <div class="slider-row"><input type="range" id="acc-x" min="-700" max="1000" value="0"><input type="number" id="acc-x-num" min="-700" max="1000" value="0" class="num-input"></div>
        <span>Vị trí Y (Dọc)</span>
        <div class="slider-row"><input type="range" id="acc-y" min="-900" max="1000" value="0"><input type="number" id="acc-y-num" min="-700" max="1000" value="0" class="num-input"></div>
        <span>Vị trí Z (Sâu)</span>
        <div class="slider-row"><input type="range" id="acc-z" min="-900" max="1000" value="0"><input type="number" id="acc-z-num" min="-900" max="1000" value="0" class="num-input"></div>
        <span>Xoay (Trục X)</span>
        <div class="slider-row"><input type="range" id="acc-rx" min="-300" max="300" value="0"><input type="number" id="acc-rx-num" min="-300" max="300" value="0" class="num-input"></div>
        <span>Xoay (Trục Y)</span>
        <div class="slider-row"><input type="range" id="acc-ry" min="-300" max="300" value="0"><input type="number" id="acc-ry-num" min="-300" max="300" value="0" class="num-input"></div>
        <span>Phóng to (Scale)</span>
        <div class="slider-row"><input type="range" id="acc-scale" min="10" max="500" value="100"><input type="number" id="acc-scale-num" min="10" max="500" value="100" class="num-input"></div>
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-title">Hiển Thị</div>
      <button class="panel-btn" id="btn-toggle-grid">Toggle Grid</button>
    </div>
  `;

  document.body.appendChild(panel);

  // Events
  document.getElementById("btn-clear-hair").addEventListener("click", () => {
    clearAccessoryByCategory("hair");
    const sel = document.getElementById("hair-select");
    if (sel) sel.value = "";
  });
  document.getElementById("btn-clear-glasses").addEventListener("click", () => {
    clearAccessoryByCategory("glasses");
    const sel = document.getElementById("glasses-select");
    if (sel) sel.value = "";
  });
  document.getElementById("btn-clear-wings").addEventListener("click", () => {
    clearAccessoryByCategory("wings");
    const sel = document.getElementById("wings-select");
    if (sel) sel.value = "";
  });
  document.getElementById("btn-clear-neck").addEventListener("click", () => {
    clearAccessoryByCategory("neck");
    const sel = document.getElementById("neck-select");
    if (sel) sel.value = "";
  });
  document.getElementById("btn-clear-righthand").addEventListener("click", () => {
    clearAccessoryByCategory("righthand");
    const sel = document.getElementById("righthand-select");
    if (sel) sel.value = "";
  });
  document.getElementById("btn-clear-shoulder").addEventListener("click", () => {
    clearAccessoryByCategory("shoulder");
    const sel = document.getElementById("shoulder-select");
    if (sel) sel.value = "";
  });
  document.getElementById("btn-clear-hat").addEventListener("click", () => {
    clearAccessoryByCategory("hat");
    const sel = document.getElementById("hat-select");
    if (sel) sel.value = "";
  });
  document.getElementById("btn-clear-waist").addEventListener("click", () => {
    clearAccessoryByCategory("waist");
    const sel = document.getElementById("waist-select");
    if (sel) sel.value = "";
  });
  document.getElementById("btn-clear-lefthand").addEventListener("click", () => {
    clearAccessoryByCategory("lefthand");
    const sel = document.getElementById("lefthand-select");
    if (sel) sel.value = "";
  });
  document.getElementById("btn-toggle-grid").addEventListener("click", () => {
    grid.visible = !grid.visible;
  });


  // Accessory Sliders
  const setupSliderSync = (rangeId, numId, callback) => {
    const rangeEl = document.getElementById(rangeId);
    const numEl = document.getElementById(numId);
    if (!rangeEl || !numEl) return;
    
    rangeEl.addEventListener("input", (e) => {
      numEl.value = e.target.value;
      callback(parseFloat(e.target.value));
    });
    numEl.addEventListener("input", (e) => {
      rangeEl.value = e.target.value;
      callback(parseFloat(e.target.value));
    });
  };

  setupSliderSync("acc-x", "acc-x-num", (val) => { accOffsetX = val; updateAccessoriesTransform(); logAccessoryCoords(); });
  setupSliderSync("acc-y", "acc-y-num", (val) => { accOffsetY = val; updateAccessoriesTransform(); logAccessoryCoords(); });
  setupSliderSync("acc-z", "acc-z-num", (val) => { accOffsetZ = val; updateAccessoriesTransform(); logAccessoryCoords(); });
  setupSliderSync("acc-rx", "acc-rx-num", (val) => { accRotationX = val; updateAccessoriesTransform(); logAccessoryCoords(); });
  setupSliderSync("acc-ry", "acc-ry-num", (val) => { accRotationY = val; updateAccessoriesTransform(); logAccessoryCoords(); });
  setupSliderSync("acc-scale", "acc-scale-num", (val) => { accScale = val / 100; updateAccessoriesTransform(); logAccessoryCoords(); });
}

function updateAccessoriesTransform() {
  // Chỉ apply cho phụ kiện thuộc category đang được chỉnh
  const activeModel = activeCategoryModels[activeTuningCategory];
  if (!activeModel) return;

  activeModel.position.x = accOffsetX / 100;
  activeModel.position.y = accOffsetY / 100;
  activeModel.position.z = accOffsetZ / 100;
  activeModel.rotation.x = accRotationX * (Math.PI / 180);
  activeModel.rotation.y = accRotationY * (Math.PI / 180);
  activeModel.rotation.z = accRotationZ * (Math.PI / 180);
  activeModel.scale.setScalar(accScale);
}

function logAccessoryCoords() {
  const name = activeAccessories[activeTuningCategory];
  const model = activeCategoryModels[activeTuningCategory];

  if (!model) {
    console.log("%c[📍 Không có phụ kiện nào đang active cho category này]", "color:#888;font-size:12px;");
    return;
  }

  const toDeg = (r) => Math.round(r * (180 / Math.PI));
  console.log(
    `%c[📍 Tọa Độ: ${name}]`,
    "color:#E63946;font-weight:bold;font-size:13px;"
  );
  console.log(
    `  x: ${Math.round(model.position.x * 100)}  |  y: ${Math.round(model.position.y * 100)}  |  z: ${Math.round(model.position.z * 100)}  |  rx: ${toDeg(model.rotation.x)}  |  ry: ${toDeg(model.rotation.y)}  |  scale: ${model.scale.x.toFixed(2)}`
  );
  console.log(JSON.stringify({
    x: Math.round(model.position.x * 100),
    y: Math.round(model.position.y * 100),
    z: Math.round(model.position.z * 100),
    rx: toDeg(model.rotation.x),
    ry: toDeg(model.rotation.y),
    scale: parseFloat(model.scale.x.toFixed(2))
  }, null, 2));
}

function updateEnvironment(theme) {
  currentEnvMode = theme;
  switch (theme) {
    case "dark":
      scene.background = new THREE.Color(0x0b0e11);
      ambient.intensity = 0.6;
      dirLight.intensity = 1.2;
      dirLight.color.setHex(0xffffff);
      break;
    case "light":
      scene.background = new THREE.Color(0xe3e6eb);
      ambient.intensity = 0.8;
      dirLight.intensity = 1.0;
      dirLight.color.setHex(0xffffff);
      break;
    case "studio":
      scene.background = new THREE.Color(0x2d3436);
      ambient.intensity = 1.2;
      dirLight.intensity = 0.8;
      dirLight.color.setHex(0xdff9fb);
      break;
    case "sunset":
      scene.background = new THREE.Color(0x2c1d3f);
      ambient.intensity = 0.5;
      dirLight.intensity = 1.8;
      dirLight.color.setHex(0xff7675);
      break;
  }
}

// ── Accessory System ─────────────────────────────────────────────────────────
function addAccessory(mesh, attachmentName = "Head") {
  if (!avatar) return;

  let target = null;
  // Ưu tiên dùng headTargets nếu đang muốn gắn vào Head
  if (attachmentName.toLowerCase().includes("head") && headTargets.length > 0) {
    target = headTargets[0];
  }

  // Nếu không thấy trong headTargets, tìm thủ công
  if (!target) {
    const lowTargetName = attachmentName.toLowerCase();
    avatar.traverse((child) => {
      if (target) return;
      const lowChildName = child.name.toLowerCase();
      if (lowChildName === lowTargetName || (lowChildName.includes(lowTargetName) && !lowChildName.includes("attachment"))) {
        target = child;
      }
    });
  }

  if (target) {
    const socket = target.getObjectByName(attachmentName + "Attachment") || target;
    socket.add(mesh);
    console.log(`Attached accessory to ${socket.name}`);
  } else {
    avatar.add(mesh);
  }
  // Không gọi updateAccessoriesTransform() để không ghi đè tọa độ riêng của từng tóc
}

function loadAccessoryFromFile(url, category, attachmentName = "Head", configObj = null) {
  if (!avatar) return;

  const filename = url.split("/").pop();
  let config = configObj;
  // Fallback map cho config trong trường hợp reload loadAvatar mà không có sẵn
  if (!config) {
    if (category === "glasses") config = glassesConfigMap[filename];
    else if (category === "wings") config = wingsConfigMap[filename];
    else if (category === "neck") config = neckConfigMap[filename];
    else if (category === "righthand") config = righthandConfigMap[filename];
    else if (category === "lefthand") config = lefthandConfigMap[filename];
    else if (category === "shoulder") config = shoulderConfigMap[filename];
    else if (category === "hat") config = hatConfigMap[filename];
    else if (category === "waist") config = waistConfigMap[filename];
    else config = accessoryConfigMap[filename];
  }

  // Ưu tiên: tọa độ của nhân vật hiện tại → fallback "default" → fallback top-level
  const charCoords = config
    ? (config[currentCharId] || config["default"] || config)
    : {};

  const localX  = charCoords.x  !== undefined ? charCoords.x  : accOffsetX;
  const localY  = charCoords.y  !== undefined ? charCoords.y  : accOffsetY;
  const localZ  = charCoords.z  !== undefined ? charCoords.z  : accOffsetZ;
  const localRx = charCoords.rx !== undefined ? charCoords.rx : accRotationX;
  const localRy = charCoords.ry !== undefined ? charCoords.ry : accRotationY;
  const localRz = charCoords.rz !== undefined ? charCoords.rz : accRotationZ;
  const localScale = charCoords.scale !== undefined ? charCoords.scale : accScale;
  if (config) attachmentName = config.attachment || attachmentName;

  // Cập nhật lại state toàn cục để không bị reset khi kéo một slider khác
  accOffsetX = localX;
  accOffsetY = localY;
  accOffsetZ = localZ;
  accRotationX = localRx;
  accRotationY = localRy;
  accRotationZ = localRz;
  accScale = localScale;

  console.log(`[${category}] Dùng tọa độ nhân vật "${currentCharId}" → x:${localX} y:${localY} z:${localZ} rx:${localRx} ry:${localRy} scale:${localScale}`);

  // Cập nhật thanh trượt UI theo kiểu tóc vừa chọn
  const syncUiSlider = (baseId, val) => {
    const el = document.getElementById(baseId);
    if (el) el.value = val;
    const numEl = document.getElementById(baseId + "-num");
    if (numEl) numEl.value = val;
  };
  
  syncUiSlider("acc-x", localX);
  syncUiSlider("acc-y", localY);
  syncUiSlider("acc-z", localZ);
  syncUiSlider("acc-rx", localRx);
  syncUiSlider("acc-ry", localRy);
  syncUiSlider("acc-scale", localScale * 100);

  setLoadingVisible(true);
  const loader = new GLTFLoader();
  loader.load(url, (gltf) => {
    const model = gltf.scene;

    // Căn giữa model về gốc (0,0,0)
    const box = new THREE.Box3().setFromObject(model);
    const center = new THREE.Vector3();
    box.getCenter(center);
    model.traverse((node) => {
      if (node.isMesh) {
        node.position.x -= center.x;
        node.position.y -= center.y;
        node.position.z -= center.z;
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    // Áp dụng tọa độ riêng của kiểu tóc này từ config
    model.position.set(
      localX / 100,
      localY / 100,
      localZ / 100
    );
    model.rotation.set(
      localRx * (Math.PI / 180),
      localRy * (Math.PI / 180),
      localRz * (Math.PI / 180)
    );
    model.scale.setScalar(localScale);

    // Lưu model pointer
    activeCategoryModels[category] = model;

    addAccessory(model, attachmentName);
    setLoadingVisible(false);
    console.log(`[Phụ kiện] Đã thêm: ${filename}`);
  }, undefined, (err) => {
    setLoadingVisible(false);
    // Bỏ active nút nếu load thất bại
    const failBtn = document.querySelector(`.hair-btn[data-filename="${filename}"]`);
    if (failBtn) failBtn.classList.remove("active");
    window.showError("Lỗi tải phụ kiện: " + err.message);
  });
}

function clearAccessoryByCategory(category, clearState = true) {
  const model = activeCategoryModels[category];
  if (model) {
    if (model.parent) model.parent.remove(model);
    model.traverse((child) => {
      if (child.geometry) child.geometry.dispose();
      if (child.material) {
        if (Array.isArray(child.material)) {
          child.material.forEach((m) => m.dispose());
        } else {
          child.material.dispose();
        }
      }
    });
    activeCategoryModels[category] = null;
  }
  if (clearState) {
    activeAccessories[category] = null;
  }
}

function addTestAccessory(type) {
  clearAccessoryByCategory("hair");
  if (type === "Hat") {
    // Create a simple procedural hat (Box)
    const group = new THREE.Group();
    const brim = new THREE.Mesh(
      new THREE.BoxGeometry(0.8, 0.05, 0.8),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    const top = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.4, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x333333 })
    );
    top.position.y = 0.2;
    group.add(brim);
    group.add(top);

    // Position on top of Head
    group.position.y = 0.4;
    addAccessory(group, "Head");
  }
}

function addSmartAccessory(type) {
  if (!avatar) return;
  clearAccessoryByCategory("glasses"); // as a fallback


  const char = CHARACTERS.find(c => c.id === currentCharId);
  const sockets = char ? char.sockets : { eyesY: 0.5, noseY: 0.4, mouthY: 0.3, zOffset: 0.5 };

  if (type === "Glasses") {
    const group = new THREE.Group();
    // Kính (đơn giản bằng Box)
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.6, 0.1, 0.1),
      new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.8, roughness: 0.2 })
    );
    const lensL = new THREE.Mesh(
      new THREE.BoxGeometry(0.2, 0.2, 0.05),
      new THREE.MeshStandardMaterial({ color: 0x000000, transparent: true, opacity: 0.7 })
    );
    const lensR = lensL.clone();
    lensL.position.set(-0.15, 0, 0.05);
    lensR.position.set(0.15, 0, 0.05);
    group.add(frame, lensL, lensR);

    // Tự động căn chỉnh theo sockets của nhân vật
    group.position.set(0, sockets.eyesY, sockets.zOffset);
    addAccessory(group, "Head");
  } else if (type === "Mask") {
    const mask = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.3, 0.15),
      new THREE.MeshStandardMaterial({ color: 0xeeeeee })
    );
    // Vị trí mũi/miệng
    mask.position.set(0, (sockets.noseY + sockets.mouthY) / 2, sockets.zOffset);
    addAccessory(mask, "Head");
  }
}
