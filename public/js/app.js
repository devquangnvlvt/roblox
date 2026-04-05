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
const accessories = [];


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

  setTimeout(onResize, 100);
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
  clearAccessories();

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
    demoLoader.load("public/image/faces/2.png", (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace; tex.flipY = false;
      currentFaceTexture = tex; applyFaceTexture();
    }, undefined, (e) => console.warn("Demo face failed", e));
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
  `;
  document.head.appendChild(style);

  panel.innerHTML = `
    <div class="panel-section">
      <div class="panel-title">Môi Trường</div>
      <div class="theme-grid">
        <div class="theme-circle active" data-theme="dark" style="background:#11151c" title="Dark"></div>
        <div class="theme-circle" data-theme="light" style="background:#f0f2f5" title="Light"></div>
        <div class="theme-circle" data-theme="studio" style="background:#555b6e" title="Studio"></div>
        <div class="theme-circle" data-theme="sunset" style="background:linear-gradient(to bottom, #ff9e00, #ff0054)" title="Sunset"></div>
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-title">Tùy Chỉnh Khuôn Mặt</div>
      <div class="slider-container">
        <span>Vị trí X (Ngang)</span>
        <div class="slider-row">
          <input type="range" id="face-x" min="-100" max="100" value="0">
        </div>
        <span>Vị trí Y (Dọc)</span>
        <div class="slider-row">
          <input type="range" id="face-y" min="-100" max="100" value="0">
        </div>
        <span>Độ rộng (X)</span>
        <div class="slider-row">
          <input type="range" id="face-sx" min="50" max="150" value="100">
        </div>
        <span>Độ cao (Y)</span>
        <div class="slider-row">
          <input type="range" id="face-sy" min="50" max="150" value="100">
        </div>
      </div>
    </div>

    <div class="panel-section">
      <div class="panel-title">Phụ Kiện Thông Minh</div>
      <div class="theme-grid" style="grid-template-columns: 1fr 1fr">
        <button class="panel-btn" id="btn-smart-glasses">🕶 Kính</button>
        <button class="panel-btn" id="btn-smart-mask">😷 Bịt mặt</button>
      </div>
      <button class="panel-btn" id="btn-clear-acc" style="margin-top:4px">❌ Xóa Trang Sức</button>
    </div>

     <div class="panel-section">
      <div class="panel-title">Hiển Thị</div>
      <button class="panel-btn" id="btn-toggle-grid">Toggle Grid</button>
    </div>
  `;

  document.body.appendChild(panel);

  // Events
  document.querySelectorAll(".theme-circle").forEach(circle => {
    circle.addEventListener("click", function () {
      document.querySelectorAll(".theme-circle").forEach(c => c.classList.remove("active"));
      this.classList.add("active");
      updateEnvironment(this.getAttribute("data-theme"));
    });
  });

  document.getElementById("btn-smart-glasses").addEventListener("click", () => addSmartAccessory("Glasses"));
  document.getElementById("btn-smart-mask").addEventListener("click", () => addSmartAccessory("Mask"));
  document.getElementById("btn-clear-acc").addEventListener("click", clearAccessories);
  document.getElementById("btn-toggle-grid").addEventListener("click", () => {
    grid.visible = !grid.visible;
  });

  // Face Sliders
  document.getElementById("face-x").addEventListener("input", (e) => {
    faceOffsetX = parseInt(e.target.value);
    applyFaceTexture();
  });
  document.getElementById("face-y").addEventListener("input", (e) => {
    faceOffsetY = parseInt(e.target.value);
    applyFaceTexture();
  });
  document.getElementById("face-sx").addEventListener("input", (e) => {
    faceScaleX = parseInt(e.target.value) / 100;
    applyFaceTexture();
  });
  document.getElementById("face-sy").addEventListener("input", (e) => {
    faceScaleY = parseInt(e.target.value) / 100;
    applyFaceTexture();
  });
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
  const target = avatar.getObjectByName(attachmentName);
  if (target) {
    target.add(mesh);
    accessories.push(mesh);
  } else {
    // Fallback if Head not found (for some models)
    avatar.add(mesh);
    accessories.push(mesh);
  }
}

function clearAccessories() {
  accessories.forEach(acc => {
    if (acc.parent) acc.parent.remove(acc);
    if (acc.geometry) acc.geometry.dispose();
    if (acc.material) acc.material.dispose();
  });
  accessories.length = 0;
}

function addTestAccessory(type) {
  clearAccessories();
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
  clearAccessories();

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
