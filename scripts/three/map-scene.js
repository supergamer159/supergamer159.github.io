function parseAspectRatio(value) {
  if (!value || typeof value !== "string" || !value.includes("/")) return 1;
  const [left, right] = value.split("/").map((part) => Number(part.trim()) || 1);
  return left / right;
}

function cubicPoint(p0, p1, p2, p3, t) {
  const nt = 1 - t;
  return (
    (nt ** 3 * p0)
    + (3 * nt ** 2 * t * p1)
    + (3 * nt * t ** 2 * p2)
    + (t ** 3 * p3)
  );
}

function extractNumbers(path) {
  const matches = String(path || "").match(/-?\d*\.?\d+/g);
  return matches ? matches.map(Number) : [];
}

export class MapScene {
  constructor({ THREE, runtime, bridge, textureFactory }) {
    this.THREE = THREE;
    this.runtime = runtime;
    this.bridge = bridge;
    this.textureFactory = textureFactory;
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.camera = new THREE.PerspectiveCamera(31, 1, 0.1, 100);
    this.root = new THREE.Group();
    this.content = new THREE.Group();
    this.scene.add(this.root);
    this.root.add(this.content);

    this.nodeObjects = new Map();
    this.edgeObjects = new Map();
    this.decorationSprites = [];
    this.state = null;
    this.screenState = null;
    this.lastHoverNodeId = null;
    this.lastClickNodeId = null;
    this.lastClickAt = 0;
    this.builtMapId = null;

    const ambient = new THREE.AmbientLight(0xf0d0a0, 1.35);
    const key = new THREE.DirectionalLight(0xfff0ce, 1.9);
    key.position.set(3.5, 8.8, 3.8);
    const rim = new THREE.DirectionalLight(0x7d5636, 0.72);
    rim.position.set(-5.5, 4.6, -4.1);
    this.scene.add(ambient, key, rim);
  }

  get threeScene() {
    return this.scene;
  }

  setVisible(visible) {
    this.root.visible = visible;
  }

  sync(state, screenState) {
    this.state = state;
    this.screenState = screenState;
    if (!state) return;
    if (this.builtMapId !== `${state.mapIndex}:${state.nodes.length}:${state.decorations.length}:${state.edges.length}`) {
      this.buildScene(state);
      this.builtMapId = `${state.mapIndex}:${state.nodes.length}:${state.decorations.length}:${state.edges.length}`;
    }
    this.applyState();
    this.applyCameraBase();
  }

  handleResize(width, height) {
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
  }

  worldFromPercent(xPercent, yPercent) {
    const scene3d = this.state?.scene3d || {};
    const table = scene3d.table || {};
    const width = table.width || 11.2;
    const height = table.height || 16.2;
    return new this.THREE.Vector3(
      ((xPercent / 100) - 0.5) * width,
      scene3d.nodeLift || 0.16,
      (0.5 - (yPercent / 100)) * height,
    );
  }

  applyCameraBase() {
    if (!this.state?.scene3d) return;
    const { camera } = this.state.scene3d;
    this.camera.fov = camera?.fov || 31;
    this.baseCameraPosition = new this.THREE.Vector3(...(camera?.position || [0, 8.3, 8.9]));
    this.baseCameraLookAt = new this.THREE.Vector3(...(camera?.lookAt || [0, 0.1, 0.4]));
    this.camera.position.copy(this.baseCameraPosition);
    this.camera.lookAt(this.baseCameraLookAt);
    this.camera.updateProjectionMatrix();
  }

  clearContent() {
    while (this.content.children.length) {
      const child = this.content.children.pop();
      if (child.geometry) child.geometry.dispose?.();
      if (child.material) {
        if (Array.isArray(child.material)) child.material.forEach((material) => material.dispose?.());
        else child.material.dispose?.();
      }
    }
    this.nodeObjects.clear();
    this.edgeObjects.clear();
    this.decorationSprites = [];
  }

  buildScene(state) {
    this.clearContent();
    const scene3d = state.scene3d || {};
    const table = scene3d.table || {};
    const width = table.width || 11.2;
    const height = table.height || 16.2;
    const tableMesh = new this.THREE.Mesh(
      new this.THREE.BoxGeometry(width + 1.4, 0.32, height + 1.6),
      new this.THREE.MeshStandardMaterial({ color: 0x3b2418, roughness: 0.92, metalness: 0.04 }),
    );
    tableMesh.position.set(0, -0.22, 0);
    this.content.add(tableMesh);

    const parchment = new this.THREE.Mesh(
      new this.THREE.BoxGeometry(width, table.raise || 0.12, height),
      [
        new this.THREE.MeshStandardMaterial({ color: 0x5c3922, roughness: 0.96 }),
        new this.THREE.MeshStandardMaterial({ color: 0x5c3922, roughness: 0.96 }),
        new this.THREE.MeshStandardMaterial({ map: this.textureFactory.getPaperTexture(), roughness: 0.98 }),
        new this.THREE.MeshStandardMaterial({ color: 0x603c23, roughness: 0.96 }),
        new this.THREE.MeshStandardMaterial({ color: 0x603c23, roughness: 0.96 }),
        new this.THREE.MeshStandardMaterial({ color: 0x603c23, roughness: 0.96 }),
      ],
    );
    parchment.position.set(0, 0, 0);
    this.content.add(parchment);

    const borderLoop = new this.THREE.LineLoop(
      new this.THREE.BufferGeometry().setFromPoints([
        new this.THREE.Vector3(-width / 2 + 0.22, table.raise + 0.02, -height / 2 + 0.24),
        new this.THREE.Vector3(width / 2 - 0.22, table.raise + 0.02, -height / 2 + 0.24),
        new this.THREE.Vector3(width / 2 - 0.22, table.raise + 0.02, height / 2 - 0.24),
        new this.THREE.Vector3(-width / 2 + 0.22, table.raise + 0.02, height / 2 - 0.24),
      ]),
      new this.THREE.LineBasicMaterial({ color: 0x5d2118, transparent: true, opacity: 0.92 }),
    );
    this.content.add(borderLoop);

    for (let x = -2; x <= 2; x += 1) {
      const xPos = (x / 2) * (width * 0.38);
      const line = new this.THREE.Line(
        new this.THREE.BufferGeometry().setFromPoints([
          new this.THREE.Vector3(xPos, table.raise + 0.01, -height / 2 + 0.18),
          new this.THREE.Vector3(xPos, table.raise + 0.01, height / 2 - 0.18),
        ]),
        new this.THREE.LineBasicMaterial({ color: 0x8c6a41, transparent: true, opacity: 0.18 }),
      );
      this.content.add(line);
    }
    for (let z = -4; z <= 4; z += 1) {
      const zPos = (z / 4) * (height * 0.42);
      const line = new this.THREE.Line(
        new this.THREE.BufferGeometry().setFromPoints([
          new this.THREE.Vector3(-width / 2 + 0.18, table.raise + 0.01, zPos),
          new this.THREE.Vector3(width / 2 - 0.18, table.raise + 0.01, zPos),
        ]),
        new this.THREE.LineBasicMaterial({ color: 0x8c6a41, transparent: true, opacity: 0.18 }),
      );
      this.content.add(line);
    }

    state.decorations.forEach((decoration) => this.buildDecoration(decoration));
    state.edges.forEach((edge) => this.buildEdge(edge));
    state.nodes.forEach((node) => this.buildNode(node));
  }

  buildDecoration(decoration) {
    if (!decoration?.visual?.asset) return;
    const texture = this.textureFactory.getImageTexture(decoration.visual.asset);
    const material = new this.THREE.SpriteMaterial({
      map: texture,
      color: 0xffffff,
      transparent: true,
      opacity: decoration.opacity ?? 1,
      depthWrite: false,
    });
    const sprite = new this.THREE.Sprite(material);
    const scene3d = this.state.scene3d || {};
    const table = scene3d.table || {};
    const width = table.width || 11.2;
    const aspect = parseAspectRatio(decoration.visual.aspectRatio);
    const worldWidth = (decoration.visual.baseWidth || 20) * (decoration.scale || 1) * (width / 100);
    sprite.scale.set(worldWidth, worldWidth / Math.max(aspect, 0.001), 1);
    const world = this.worldFromPercent(decoration.x, decoration.y);
    sprite.position.set(world.x, (scene3d.decorationLift || 0.05) + (decoration.kind === "tree" ? 0.85 : 0.52), world.z);
    if (decoration.rotation) sprite.material.rotation = (decoration.rotation * Math.PI) / 180;
    this.decorationSprites.push(sprite);
    this.content.add(sprite);
  }

  buildEdge(edge) {
    const numbers = extractNumbers(edge.d);
    if (numbers.length < 8) return;
    const points = [];
    const [x0, y0, x1, y1, x2, y2, x3, y3] = numbers;
    for (let step = 0; step <= 24; step += 1) {
      const t = step / 24;
      const x = cubicPoint(x0, x1, x2, x3, t);
      const y = cubicPoint(y0, y1, y2, y3, t);
      const point = this.worldFromPercent(x, y);
      point.y = (this.state.scene3d?.table?.raise || 0.12) + 0.018;
      points.push(point);
    }
    const geometry = new this.THREE.BufferGeometry().setFromPoints(points);
    const material = new this.THREE.LineDashedMaterial({
      color: 0x060504,
      dashSize: 0.22,
      gapSize: 0.18,
      transparent: true,
      opacity: 0.8,
    });
    const line = new this.THREE.Line(geometry, material);
    line.computeLineDistances();
    this.edgeObjects.set(edge.id, line);
    this.content.add(line);
  }

  buildNode(node) {
    const group = new this.THREE.Group();
    const position = this.worldFromPercent(node.x, node.y);
    group.position.copy(position);

    const size = node.type === "boss" ? 0.96 : 0.72;
    const stamp = new this.THREE.Mesh(
      new this.THREE.PlaneGeometry(size, size),
      new this.THREE.MeshBasicMaterial({
        map: this.textureFactory.getMapNodeTexture(node.visual),
        transparent: true,
        color: 0xffffff,
        depthWrite: false,
      }),
    );
    stamp.rotation.x = -Math.PI / 2;
    group.add(stamp);

    const halo = new this.THREE.Mesh(
      new this.THREE.CircleGeometry(size * 0.74, 32),
      new this.THREE.MeshBasicMaterial({
        color: 0x1a120c,
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
    );
    halo.rotation.x = -Math.PI / 2;
    halo.position.y = -0.002;
    group.add(halo);

    const hit = new this.THREE.Mesh(
      new this.THREE.CircleGeometry(size * 0.9, 24),
      new this.THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    hit.rotation.x = -Math.PI / 2;
    hit.userData.nodeId = node.id;
    hit.userData.interactive = true;
    group.add(hit);

    group.userData.nodeId = node.id;
    group.userData.basePosition = position.clone();
    this.nodeObjects.set(node.id, { group, stamp, halo, hit });
    this.content.add(group);
  }

  applyState() {
    if (!this.state) return;
    this.edgeObjects.forEach((line, edgeId) => {
      const edge = this.state.edges.find((entry) => entry.id === edgeId);
      if (!edge) return;
      line.material.opacity = edge.traversed ? 0.42 : edge.frontier ? 0.96 : 0.8;
    });

    this.nodeObjects.forEach(({ group, stamp, halo }, nodeId) => {
      const node = this.state.nodes.find((entry) => entry.id === nodeId);
      if (!node) return;
      group.userData.targetLift = node.id === this.state.selectedNodeId || node.id === this.state.hoverNodeId
        ? (this.state.scene3d?.nodeLift || 0.16) + 0.12
        : this.state.scene3d?.nodeLift || 0.16;
      group.userData.targetScale = node.id === this.state.selectedNodeId
        ? 1.18
        : node.id === this.state.hoverNodeId
          ? 1.12
          : node.state === "available"
            ? 1.03
            : 1;
      const opacity = node.state === "cleared" ? 0.24 : node.state === "future" ? 0.62 : 0.98;
      stamp.material.opacity = opacity;
      halo.material.opacity = node.id === this.state.selectedNodeId
        ? 0.18
        : node.id === this.state.hoverNodeId || node.state === "available"
          ? 0.1
          : 0;
    });
  }

  update(time, delta) {
    if (!this.state) return;
    const drift = this.state.scene3d?.drift || { amount: 0.08, speed: 0.28 };
    if (!this.screenState?.reducedMotion) {
      this.camera.position.x = this.baseCameraPosition.x + Math.sin(time * drift.speed) * drift.amount;
      this.camera.position.y = this.baseCameraPosition.y + Math.cos(time * drift.speed * 0.6) * (drift.amount * 0.35);
      this.camera.position.z = this.baseCameraPosition.z + Math.cos(time * drift.speed) * (drift.amount * 0.45);
    }
    this.camera.lookAt(this.baseCameraLookAt);

    this.nodeObjects.forEach(({ group }) => {
      const base = group.userData.basePosition;
      const lift = group.userData.targetLift || (this.state.scene3d?.nodeLift || 0.16);
      const scale = group.userData.targetScale || 1;
      group.position.x = base.x;
      group.position.z = base.z;
      group.position.y += (lift - group.position.y) * Math.min(1, delta * 8);
      group.scale.x += (scale - group.scale.x) * Math.min(1, delta * 8);
      group.scale.y = group.scale.x;
      group.scale.z = group.scale.x;
    });

    this.decorationSprites.forEach((sprite) => {
      sprite.material.rotation += 0;
    });
    this.updateTooltipProjection();
  }

  updateTooltipProjection() {
    if (!this.state?.tooltipNodeId) return;
    const tooltip = document.getElementById("map-tooltip");
    const parchment = document.getElementById("map-parchment");
    const nodeObject = this.nodeObjects.get(this.state.tooltipNodeId);
    if (!tooltip || !parchment || !nodeObject || tooltip.classList.contains("hidden")) return;
    const world = nodeObject.group.getWorldPosition(new this.THREE.Vector3());
    world.y += 0.24;
    const projection = this.runtime.projectWorld(world, parchment, this.camera);
    if (!projection.visible) return;
    tooltip.style.visibility = "hidden";
    const rect = parchment.getBoundingClientRect();
    const tooltipRect = tooltip.getBoundingClientRect();
    const localX = projection.x;
    const localY = projection.y;
    let left = localX + 24;
    if (left + tooltipRect.width > rect.width - 18) left = localX - tooltipRect.width - 24;
    let top = localY - (tooltipRect.height / 2);
    if (top < 18) top = localY + 18;
    if (top + tooltipRect.height > rect.height - 18) top = localY - tooltipRect.height - 18;
    left = Math.max(18, Math.min(left, Math.max(18, rect.width - tooltipRect.width - 18)));
    top = Math.max(18, Math.min(top, Math.max(18, rect.height - tooltipRect.height - 18)));
    tooltip.dataset.anchor = left < localX ? "left" : "right";
    tooltip.style.left = `${left}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.visibility = "";
  }

  pickNode(pointer, raycaster) {
    raycaster.setFromCamera(pointer, this.camera);
    const hits = raycaster.intersectObjects([...this.nodeObjects.values()].map((entry) => entry.hit), false);
    return hits[0]?.object?.userData?.nodeId || null;
  }

  async handlePointerMove({ pointer, raycaster }) {
    const nodeId = this.pickNode(pointer, raycaster);
    if (nodeId === this.lastHoverNodeId) return;
    this.lastHoverNodeId = nodeId;
    if (nodeId) await this.bridge.dispatch({ type: "hover-node", nodeId });
    else await this.bridge.dispatch({ type: "clear-hover-node" });
  }

  async handleClick({ pointer, raycaster }) {
    const nodeId = this.pickNode(pointer, raycaster);
    if (!nodeId) return;
    const node = this.state?.nodes?.find((entry) => entry.id === nodeId);
    const now = performance.now();
    if (this.state?.selectedNodeId === nodeId && node?.state === "available") {
      await this.bridge.dispatch({ type: "enter-node", nodeId });
      return;
    }
    if (this.lastClickNodeId === nodeId && (now - this.lastClickAt) < 340 && node?.state === "available") {
      await this.bridge.dispatch({ type: "enter-node", nodeId });
      return;
    }
    this.lastClickNodeId = nodeId;
    this.lastClickAt = now;
    await this.bridge.dispatch({ type: "select-node", nodeId });
  }

  async handlePointerLeave() {
    this.lastHoverNodeId = null;
    await this.bridge.dispatch({ type: "clear-hover-node" });
  }
}
