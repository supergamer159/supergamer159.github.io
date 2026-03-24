import * as THREE from "../vendor/three.module.js";
import { TextureFactory } from "./texture-factory.js";
import { MapScene } from "./map-scene.js";
import { BattleScene } from "./battle-scene.js";

const ENABLE_3D_BATTLE = true;

export class ThreeRuntime {
  constructor({ root, bridge }) {
    this.root = root;
    this.bridge = bridge;
    this.renderer = null;
    this.textureFactory = null;
    this.mapScene = null;
    this.battleScene = null;
    this.activeSceneName = null;
    this.activeScene = null;
    this.unsubscribe = null;
    this.pointer = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();
    this.lastFrameTime = 0;
    this.refreshQueued = false;

    this.handleResize = this.handleResize.bind(this);
    this.handlePointerMove = this.handlePointerMove.bind(this);
    this.handleClick = this.handleClick.bind(this);
    this.handlePointerLeave = this.handlePointerLeave.bind(this);
    this.animate = this.animate.bind(this);
  }

  init() {
    if (!window.WebGLRenderingContext) {
      this.setRendererMode(null);
      return false;
    }
    try {
      this.renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true,
        powerPreference: "high-performance",
      });
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      this.renderer.setClearColor(0x000000, 0);
      this.renderer.outputColorSpace = THREE.SRGBColorSpace;
      this.root.appendChild(this.renderer.domElement);
    } catch (error) {
      console.warn("Three runtime failed to initialize", error);
      this.setRendererMode(null);
      return false;
    }

    this.textureFactory = new TextureFactory(THREE, () => {
      this.refreshQueued = true;
    });
    this.mapScene = new MapScene({
      THREE,
      runtime: this,
      bridge: this.bridge,
      textureFactory: this.textureFactory,
    });
    this.battleScene = new BattleScene({
      THREE,
      runtime: this,
      bridge: this.bridge,
      textureFactory: this.textureFactory,
    });

    this.unsubscribe = this.bridge.subscribe((event) => this.handleBridgeEvent(event));
    this.root.addEventListener("pointermove", this.handlePointerMove);
    this.root.addEventListener("click", this.handleClick);
    this.root.addEventListener("pointerleave", this.handlePointerLeave);
    window.addEventListener("resize", this.handleResize);
    this.handleResize();
    this.updateFromBridge();
    requestAnimationFrame(this.animate);
    return true;
  }

  destroy() {
    this.unsubscribe?.();
    window.removeEventListener("resize", this.handleResize);
    this.root.removeEventListener("pointermove", this.handlePointerMove);
    this.root.removeEventListener("click", this.handleClick);
    this.root.removeEventListener("pointerleave", this.handlePointerLeave);
    this.renderer?.dispose?.();
    this.root.textContent = "";
    this.setRendererMode(null);
  }

  setRendererMode(sceneName) {
    const appShell = document.getElementById("app-shell");
    if (!appShell) return;
    if (!sceneName) {
      delete appShell.dataset.renderer;
      delete appShell.dataset.threeScene;
      return;
    }
    appShell.dataset.renderer = "3d";
    appShell.dataset.threeScene = sceneName;
  }

  handleBridgeEvent(event) {
    if (event?.type === "battle-effect" && this.battleScene) {
      this.battleScene.handleEffect(event);
    }
    this.refreshQueued = true;
  }

  updateFromBridge() {
    if (!this.bridge) return;
    const screenState = this.bridge.getScreenState();
    let nextSceneName = null;
    if (screenState.screenId === "map-screen" && this.bridge.getMapState()?.active) nextSceneName = "map";
    if (ENABLE_3D_BATTLE && screenState.screenId === "battle-screen" && this.bridge.getBattleState()?.active) nextSceneName = "battle";

    if (!nextSceneName) {
      this.activeSceneName = null;
      this.activeScene = null;
      this.mapScene?.setVisible(false);
      this.battleScene?.setVisible(false);
      this.setRendererMode(null);
      return;
    }

    if (nextSceneName === "map") {
      this.mapScene.sync(this.bridge.getMapState(), screenState);
      this.activeScene = this.mapScene;
    } else {
      this.battleScene.sync(this.bridge.getBattleState(), screenState);
      this.activeScene = this.battleScene;
    }
    this.activeSceneName = nextSceneName;
    this.mapScene.setVisible(nextSceneName === "map");
    this.battleScene.setVisible(nextSceneName === "battle");
    this.setRendererMode(nextSceneName);
  }

  handleResize() {
    if (!this.renderer) return;
    const width = this.root.clientWidth;
    const height = this.root.clientHeight;
    this.renderer.setSize(width, height, false);
    this.mapScene?.handleResize(width, height);
    this.battleScene?.handleResize(width, height);
  }

  normalizePointer(event) {
    const rect = this.root.getBoundingClientRect();
    this.pointer.x = ((event.clientX - rect.left) / Math.max(rect.width, 1)) * 2 - 1;
    this.pointer.y = -(((event.clientY - rect.top) / Math.max(rect.height, 1)) * 2 - 1);
  }

  async handlePointerMove(event) {
    if (!this.activeScene) return;
    this.normalizePointer(event);
    await this.activeScene.handlePointerMove({
      event,
      pointer: this.pointer,
      raycaster: this.raycaster,
    });
  }

  async handleClick(event) {
    if (!this.activeScene) return;
    this.normalizePointer(event);
    await this.activeScene.handleClick({
      event,
      pointer: this.pointer,
      raycaster: this.raycaster,
    });
  }

  async handlePointerLeave() {
    if (!this.activeScene) return;
    await this.activeScene.handlePointerLeave();
  }

  projectWorld(worldPosition, element, camera = this.activeScene?.camera) {
    if (!camera || !element) return { x: 0, y: 0, visible: false };
    const projected = worldPosition.clone().project(camera);
    const rootRect = this.root.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();
    const screenX = ((projected.x + 1) * 0.5) * rootRect.width;
    const screenY = ((-projected.y + 1) * 0.5) * rootRect.height;
    return {
      x: screenX - (elementRect.left - rootRect.left),
      y: screenY - (elementRect.top - rootRect.top),
      visible: projected.z > -1 && projected.z < 1,
    };
  }

  animate(timestamp) {
    if (this.refreshQueued) {
      this.refreshQueued = false;
      this.updateFromBridge();
    }
    if (this.renderer && this.activeScene) {
      const delta = this.lastFrameTime ? (timestamp - this.lastFrameTime) / 1000 : 0.016;
      this.lastFrameTime = timestamp;
      this.activeScene.update(timestamp / 1000, delta);
      this.renderer.render(this.activeScene.threeScene, this.activeScene.camera);
    } else {
      this.lastFrameTime = timestamp;
    }
    requestAnimationFrame(this.animate);
  }
}
