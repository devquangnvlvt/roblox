import * as THREE from "https://esm.sh/three@0.160.0";
import { OrbitControls } from "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js";
import { GLTFLoader } from "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js";

const canvasMount = document.getElementById("canvasMount");
const shirtInput = document.getElementById("shirtInput");
const pantsInput = document.getElementById("pantsInput");
const clearShirtBtn = document.getElementById("clearShirt");
const clearPantsBtn = document.getElementById("clearPants");
const resetViewBtn = document.getElementById("resetView");
const screenshotBtn = document.getElementById("screenshot");
const showGridCb = document.getElementById("showGrid");
const lockCameraCb = document.getElementById("lockCamera");
const ambientSlider = document.getElementById("ambient");
const sunSlider = document.getElementById("sun");
const ambientVal = document.getElementById("ambientVal");
const sunVal = document.getElementById("sunVal");
const sidebar = document.getElementById("sidebar");
const toggleSidebarBtn = document.getElementById("toggleSidebar");
const workspace = document.querySelector(".workspace");

let scene;
let camera;
let renderer;
let controls;
let grid;
let ambient;
let dirLight;

const shirtTargets = [];
const pantsTargets = [];

let shirtTexture = null;
let pantsTexture = null;

const shirtNames = [
  "UpperTorso",
  "LowerTorso",
  "LeftUpperArm",
  "LeftLowerArm",
  "LeftHand",
  "RightUpperArm",
  "RightLowerArm",
  "RightHand",
];

const pantsNames = [
  "LeftUpperLeg",
  "LeftLowerLeg",
  "LeftFoot",
  "RightUpperLeg",
  "RightLowerLeg",
  "RightFoot",
];

init();
animate();

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0f1116);

  const w = canvasMount.clientWidth;
  const h = canvasMount.clientHeight;

  camera = new THREE.PerspectiveCamera(45, w / h, 0.1, 1000);
  camera.position.set(0.8, 1.2, 2.2);

  renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h);
  canvasMount.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.target.set(0, 0.8, 0);

  ambient = new THREE.AmbientLight(0xffffff, Number.parseFloat(ambientSlider.value));
  scene.add(ambient);

  const hemi = new THREE.HemisphereLight(0x445566, 0x080820, 0.2);
  scene.add(hemi);

  dirLight = new THREE.DirectionalLight(0xffffff, Number.parseFloat(sunSlider.value));
  dirLight.position.set(2, 3.5, 2.5);
  scene.add(dirLight);

  grid = new THREE.GridHelper(4, 40, 0x2a2f3a, 0x2a2f3a);
  scene.add(grid);

  window.addEventListener("resize", onResize);
  loadAvatar();
  bindUiEvents();
}

function bindUiEvents() {
  showGridCb.addEventListener("change", () => {
    grid.visible = showGridCb.checked;
  });

  lockCameraCb.addEventListener("change", () => {
    controls.enabled = !lockCameraCb.checked;
  });

  ambientSlider.addEventListener("input", () => {
    ambient.intensity = Number.parseFloat(ambientSlider.value);
    ambientVal.textContent = ambient.intensity.toFixed(2);
  });

  sunSlider.addEventListener("input", () => {
    dirLight.intensity = Number.parseFloat(sunSlider.value);
    sunVal.textContent = dirLight.intensity.toFixed(2);
  });

  shirtInput.addEventListener("change", (event) => handleTextureUpload(event, "shirt"));
  pantsInput.addEventListener("change", (event) => handleTextureUpload(event, "pants"));

  clearShirtBtn.addEventListener("click", () => clearTexture("shirt"));
  clearPantsBtn.addEventListener("click", () => clearTexture("pants"));

  resetViewBtn.addEventListener("click", resetView);
  screenshotBtn.addEventListener("click", saveScreenshot);

  toggleSidebarBtn?.addEventListener("click", () => {
    const closing = !sidebar.classList.contains("closed");
    sidebar.classList.toggle("closed", closing);
    workspace.classList.toggle("collapsed", closing);
    toggleSidebarBtn.setAttribute("aria-pressed", String(!closing));
    toggleSidebarBtn.textContent = closing ? "Controls <" : "Controls >";
    setTimeout(onResize, 50);
  });
}

function onResize() {
  const w = canvasMount.clientWidth;
  const h = canvasMount.clientHeight;
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  renderer.setSize(w, h);
}

function loadAvatar() {
  const loader = new GLTFLoader();
  loader.load(
    "public/models/r15.glb",
    (gltf) => {
      const avatar = gltf.scene;
      avatar.scale.set(0.25, 0.25, 0.25);
      avatar.rotation.y = Math.PI;
      scene.add(avatar);

      avatar.traverse((obj) => {
        if (!obj.isMesh) {
          return;
        }

        obj.material = new THREE.MeshStandardMaterial({
          color: 0xbfc5d1,
          metalness: 0,
          roughness: 0.95,
        });

        if (shirtNames.includes(obj.name)) {
          shirtTargets.push(obj);
        }

        if (pantsNames.includes(obj.name)) {
          pantsTargets.push(obj);
        }
      });
    },
    undefined,
    (error) => {
      // Show an inline warning so users know why the model is not visible.
      console.error("Failed to load model public/models/r15.glb", error);
      const msg = document.createElement("div");
      msg.style.position = "absolute";
      msg.style.top = "10px";
      msg.style.right = "10px";
      msg.style.background = "rgba(200,50,70,0.14)";
      msg.style.border = "1px solid rgba(200,50,70,0.4)";
      msg.style.padding = "8px 10px";
      msg.style.borderRadius = "8px";
      msg.textContent = "Missing model: place r15.glb under public/models/";
      canvasMount.appendChild(msg);
    }
  );
}

function handleTextureUpload(event, type) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  if (file.type !== "image/png") {
    alert("Please upload a PNG image.");
    event.target.value = "";
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  const loader = new THREE.TextureLoader();

  loader.load(
    objectUrl,
    (texture) => {
      URL.revokeObjectURL(objectUrl);
      texture.flipY = false;
      texture.colorSpace = THREE.SRGBColorSpace;
      applyClothingTexture(type, texture);
    },
    undefined,
    () => {
      URL.revokeObjectURL(objectUrl);
      alert("Cannot load this PNG file.");
      event.target.value = "";
    }
  );
}

function applyClothingTexture(type, texture) {
  const isShirt = type === "shirt";
  const previous = isShirt ? shirtTexture : pantsTexture;
  const targets = isShirt ? shirtTargets : pantsTargets;

  if (previous) {
    previous.dispose();
  }

  targets.forEach((mesh) => {
    mesh.material.map = texture;
    mesh.material.needsUpdate = true;
  });

  if (isShirt) {
    shirtTexture = texture;
  } else {
    pantsTexture = texture;
  }
}

function clearTexture(type) {
  const isShirt = type === "shirt";
  const targets = isShirt ? shirtTargets : pantsTargets;

  targets.forEach((mesh) => {
    mesh.material.map = null;
    mesh.material.needsUpdate = true;
  });

  if (isShirt) {
    if (shirtTexture) {
      shirtTexture.dispose();
      shirtTexture = null;
    }
    shirtInput.value = "";
    return;
  }

  if (pantsTexture) {
    pantsTexture.dispose();
    pantsTexture = null;
  }
  pantsInput.value = "";
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

function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.render(scene, camera);
}