function lerp(current, target, amount) {
  return current + ((target - current) * amount);
}

export class BattleScene {
  constructor({ THREE, runtime, bridge, textureFactory }) {
    this.THREE = THREE;
    this.runtime = runtime;
    this.bridge = bridge;
    this.textureFactory = textureFactory;
    this.scene = new THREE.Scene();
    this.scene.background = null;
    this.camera = new THREE.PerspectiveCamera(33, 1, 0.1, 100);

    this.root = new THREE.Group();
    this.staticGroup = new THREE.Group();
    this.slotGroup = new THREE.Group();
    this.dynamicGroup = new THREE.Group();
    this.scene.add(this.root);
    this.root.add(this.staticGroup, this.slotGroup, this.dynamicGroup);

    this.queueCards = new Map();
    this.boardCards = new Map();
    this.handCards = new Map();
    this.itemProps = new Map();
    this.slotMeshes = { player: [], enemy: [] };
    this.interactives = [];
    this.state = null;
    this.screenState = null;
    this.staticBuilt = false;

    const ambient = new THREE.AmbientLight(0xf0ceb0, 1.2);
    const key = new THREE.DirectionalLight(0xfff1d6, 1.8);
    key.position.set(3.4, 8.2, 5.4);
    const fill = new THREE.DirectionalLight(0x7e5a3a, 0.56);
    fill.position.set(-5.8, 4.4, -4.2);
    this.scene.add(ambient, key, fill);
  }

  get threeScene() {
    return this.scene;
  }

  setVisible(visible) {
    this.root.visible = visible;
  }

  handleResize(width, height) {
    this.camera.aspect = width / Math.max(height, 1);
    this.camera.updateProjectionMatrix();
  }

  sync(state, screenState) {
    this.state = state;
    this.screenState = screenState;
    if (!state) return;
    this.applyCameraBase();
    if (!this.staticBuilt) this.buildStaticScene();
    this.slotGroup.visible = false;
    this.dynamicGroup.visible = false;
    this.syncDeckProps();
    this.syncScale();
    this.rebuildInteractives();
  }

  applyCameraBase() {
    const scene3d = this.state?.scene3d || {};
    const camera = scene3d.camera || {};
    this.camera.fov = camera.fov || 33;
    this.baseCameraPosition = new this.THREE.Vector3(...(camera.position || [0, 8.7, 8.8]));
    this.baseCameraLookAt = new this.THREE.Vector3(...(camera.lookAt || [0, 0.7, -0.65]));
    this.camera.position.copy(this.baseCameraPosition);
    this.camera.lookAt(this.baseCameraLookAt);
    this.camera.updateProjectionMatrix();
  }

  laneX(lane) {
    return this.state?.scene3d?.laneXs?.[lane] ?? 0;
  }

  boardZ(side) {
    return side === "enemy" ? (this.state?.scene3d?.enemyRowZ ?? -2.24) : (this.state?.scene3d?.playerRowZ ?? 2.28);
  }

  createInteractivePlane(width, height, action) {
    const plane = new this.THREE.Mesh(
      new this.THREE.PlaneGeometry(width, height),
      new this.THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }),
    );
    plane.userData.action = action;
    return plane;
  }

  buildStaticScene() {
    const scene3d = this.state.scene3d || {};
    const table = scene3d.table || {};
    const tableWidth = table.width || 18;
    const tableHeight = table.height || 13.4;

    const tableMesh = new this.THREE.Mesh(
      new this.THREE.BoxGeometry(tableWidth, table.thickness || 0.45, tableHeight),
      new this.THREE.MeshStandardMaterial({ color: 0x2e1c14, roughness: 0.94, metalness: 0.04 }),
    );
    tableMesh.position.set(0, -0.23, 0);
    this.staticGroup.add(tableMesh);

    const surface = new this.THREE.Mesh(
      new this.THREE.PlaneGeometry(tableWidth - 0.82, tableHeight - 0.82),
      new this.THREE.MeshStandardMaterial({
        color: 0x54351f,
        roughness: 0.96,
        metalness: 0.02,
      }),
    );
    surface.rotation.x = -Math.PI / 2;
    surface.position.y = 0.01;
    this.staticGroup.add(surface);

    const cueBand = new this.THREE.Mesh(
      new this.THREE.PlaneGeometry(12.2, 1.16),
      new this.THREE.MeshStandardMaterial({ color: 0x22150f, roughness: 0.95, metalness: 0.02 }),
    );
    cueBand.rotation.x = -Math.PI / 2;
    cueBand.position.set(0, 0.02, this.state.scene3d.queueZ || -4.55);
    this.staticGroup.add(cueBand);

    this.buildScale();
    this.buildDeckMeshes();
    this.buildBellMesh();
    this.staticBuilt = true;
  }

  buildScale() {
    const scaleCenterZ = this.state.scene3d.scaleZ ?? -0.2;
    this.scaleGroup = new this.THREE.Group();
    this.scaleGroup.position.set(0, 0.24, scaleCenterZ);

    const post = new this.THREE.Mesh(
      new this.THREE.CylinderGeometry(0.08, 0.12, 1.06, 16),
      new this.THREE.MeshStandardMaterial({ color: 0x7b6149, roughness: 0.68 }),
    );
    post.position.y = 0.48;
    this.scaleGroup.add(post);

    this.beamGroup = new this.THREE.Group();
    this.beamGroup.position.y = 0.98;

    const beam = new this.THREE.Mesh(
      new this.THREE.BoxGeometry(this.state.scene3d.scaleWidth || 4.8, 0.08, 0.12),
      new this.THREE.MeshStandardMaterial({ color: 0xa79072, roughness: 0.55 }),
    );
    this.beamGroup.add(beam);

    this.scalePans = ["enemy", "player"].map((side, index) => {
      const group = new this.THREE.Group();
      group.position.x = index === 0 ? -2.12 : 2.12;
      const arm = new this.THREE.Mesh(
        new this.THREE.CylinderGeometry(0.03, 0.03, 0.46, 8),
        new this.THREE.MeshStandardMaterial({ color: 0xa79072, roughness: 0.55 }),
      );
      arm.position.y = -0.18;
      group.add(arm);
      const pan = new this.THREE.Mesh(
        new this.THREE.CylinderGeometry(0.42, 0.42, 0.05, 18),
        new this.THREE.MeshStandardMaterial({ color: 0x7d6650, roughness: 0.72 }),
      );
      pan.rotation.x = Math.PI / 2;
      pan.position.y = -0.42;
      group.add(pan);
      this.beamGroup.add(group);
      return group;
    });

    this.scaleGroup.add(this.beamGroup);
    this.staticGroup.add(this.scaleGroup);
  }

  buildDeckMeshes() {
    const left = this.state.scene3d.deckLeft || { x: -7.2, z: 5.48 };
    const right = this.state.scene3d.deckRight || { x: 7.2, z: 5.48 };
    this.mainDeckMesh = this.createDeckMesh(this.state.assets.battleSkin.mainDeck, { type: "draw-main" });
    this.mainDeckMesh.position.set(left.x, 0.18, left.z);
    this.staticGroup.add(this.mainDeckMesh);
    this.mainDeckLabel = this.createLabelPlane();
    this.mainDeckLabel.position.set(left.x, 0.72, left.z - 0.1);
    this.staticGroup.add(this.mainDeckLabel);

    this.sideDeckMesh = this.createDeckMesh(this.state.assets.battleSkin.sideDeck, { type: "draw-side" });
    this.sideDeckMesh.position.set(right.x, 0.18, right.z);
    this.staticGroup.add(this.sideDeckMesh);
    this.sideDeckLabel = this.createLabelPlane();
    this.sideDeckLabel.position.set(right.x, 0.72, right.z - 0.1);
    this.staticGroup.add(this.sideDeckLabel);
  }

  createDeckMesh(textureUrl, action) {
    const group = new this.THREE.Group();
    const box = new this.THREE.Mesh(
      new this.THREE.BoxGeometry(1.58, 0.66, 2.12),
      new this.THREE.MeshStandardMaterial({ color: 0x2f2016, roughness: 0.84 }),
    );
    group.add(box);
    const face = new this.THREE.Mesh(
      new this.THREE.PlaneGeometry(1.52, 2.04),
      new this.THREE.MeshBasicMaterial({
        map: this.textureFactory.getImageTexture(textureUrl),
        transparent: true,
      }),
    );
    face.rotation.x = -Math.PI / 2;
    face.position.y = 0.34;
    group.add(face);
    const hit = this.createInteractivePlane(1.7, 2.2, action);
    hit.rotation.x = -Math.PI / 2;
    hit.position.y = 0.38;
    group.add(hit);
    return group;
  }

  buildBellMesh() {
    const bellPos = this.state.scene3d.bell || { x: 0, z: 5.66 };
    this.bellGroup = new this.THREE.Group();
    this.bellGroup.position.set(bellPos.x, 0.22, bellPos.z);
    const base = new this.THREE.Mesh(
      new this.THREE.CylinderGeometry(0.5, 0.62, 0.18, 24),
      new this.THREE.MeshStandardMaterial({ color: 0x7a4d20, roughness: 0.68 }),
    );
    this.bellGroup.add(base);
    const dome = new this.THREE.Mesh(
      new this.THREE.SphereGeometry(0.42, 24, 18, 0, Math.PI * 2, 0, Math.PI / 2),
      new this.THREE.MeshStandardMaterial({ color: 0xb58a45, roughness: 0.36, metalness: 0.2 }),
    );
    dome.position.y = 0.28;
    this.bellGroup.add(dome);
    const handle = new this.THREE.Mesh(
      new this.THREE.CylinderGeometry(0.08, 0.1, 0.24, 12),
      new this.THREE.MeshStandardMaterial({ color: 0xa07b3e, roughness: 0.32, metalness: 0.24 }),
    );
    handle.position.y = 0.58;
    this.bellGroup.add(handle);
    const hit = this.createInteractivePlane(1.6, 1.6, { type: "ring-bell" });
    hit.rotation.x = -Math.PI / 2;
    hit.position.y = 0.72;
    this.bellGroup.add(hit);
    this.staticGroup.add(this.bellGroup);
  }

  createLabelPlane() {
    const plane = new this.THREE.Mesh(
      new this.THREE.PlaneGeometry(1.4, 0.44),
      new this.THREE.MeshBasicMaterial({ transparent: true }),
    );
    plane.rotation.x = -0.72;
    return plane;
  }

  createCardRecord(card, action, useBack = false, backTextureUrl = "") {
    const group = new this.THREE.Group();
    const body = new this.THREE.Mesh(
      new this.THREE.BoxGeometry(1.46, 0.08, 2.02),
      new this.THREE.MeshStandardMaterial({ color: 0x2f2018, roughness: 0.78 }),
    );
    body.position.y = 0.04;
    group.add(body);

    const face = new this.THREE.Mesh(
      new this.THREE.PlaneGeometry(1.44, 2.0),
      new this.THREE.MeshBasicMaterial({
        map: useBack
          ? this.textureFactory.getImageTexture(backTextureUrl)
          : this.textureFactory.getCardTexture(card, this.state.assets),
        transparent: true,
      }),
    );
    face.rotation.x = -Math.PI / 2;
    face.position.y = 0.082;
    group.add(face);

    const hit = this.createInteractivePlane(1.56, 2.1, action);
    hit.rotation.x = -Math.PI / 2;
    hit.position.y = 0.1;
    group.add(hit);

    group.userData.basePosition = new this.THREE.Vector3();
    group.userData.baseRotation = new this.THREE.Euler(0, 0, 0);
    group.userData.baseScale = 1;
    group.userData.animation = null;
    return { group, body, face, hit, card };
  }

  ensureRecord(map, key, builder) {
    if (!map.has(key)) {
      const record = builder();
      map.set(key, record);
      this.dynamicGroup.add(record.group);
    }
    return map.get(key);
  }

  removeMissingRecords(map, validKeys) {
    [...map.keys()].forEach((key) => {
      if (validKeys.has(key)) return;
      const record = map.get(key);
      this.dynamicGroup.remove(record.group);
      map.delete(key);
    });
  }

  syncSlots() {
    ["enemy", "player"].forEach((side) => {
      for (let lane = 0; lane < this.state.maxLanes; lane += 1) {
        if (!this.slotMeshes[side][lane]) {
          const slot = new this.THREE.Mesh(
            new this.THREE.PlaneGeometry(1.78, 2.36),
            new this.THREE.MeshStandardMaterial({
              color: 0x1a120e,
              transparent: true,
              opacity: 0.18,
              roughness: 0.9,
            }),
          );
          slot.rotation.x = -Math.PI / 2;
          slot.position.set(this.laneX(lane), 0.012, this.boardZ(side));
          slot.userData.action = { type: "select-lane", side, lane };
          this.slotMeshes[side][lane] = slot;
          this.slotGroup.add(slot);
        }
        const slot = this.slotMeshes[side][lane];
        const occupied = side === "player" ? Boolean(this.state.playerBoard[lane]) : Boolean(this.state.enemyBoard[lane]);
        let color = 0x17100c;
        let opacity = occupied ? 0.1 : 0.16;
        if (side === "player" && this.state.selection?.type === "play-card" && !occupied) {
          color = 0x6a5a2e;
          opacity = 0.4;
        } else if (side === "player" && this.state.selection?.type === "sacrifice" && occupied) {
          color = 0x6e2319;
          opacity = 0.42;
        } else if (side === "enemy" && ["item-target-enemy", "hook-target"].includes(this.state.selection?.type) && occupied) {
          color = 0x6c241a;
          opacity = 0.46;
        }
        slot.material.color.setHex(color);
        slot.material.opacity = opacity;
        slot.position.set(this.laneX(lane), 0.012, this.boardZ(side));
      }
    });
  }

  updateCardTexture(record, card, useBack = false, backTextureUrl = "") {
    const nextTexture = useBack
      ? this.textureFactory.getImageTexture(backTextureUrl)
      : this.textureFactory.getCardTexture(card, this.state.assets);
    if (record.face.material.map !== nextTexture) {
      record.face.material.map = nextTexture;
      record.face.material.needsUpdate = true;
    }
  }

  syncQueueCards() {
    const validKeys = new Set();
    this.state.queue.forEach((slot) => {
      if (!slot.cardId) return;
      const key = `queue:${slot.lane}`;
      validKeys.add(key);
      const record = this.ensureRecord(this.queueCards, key, () => this.createCardRecord(slot, null, true, slot.back));
      this.updateCardTexture(record, slot, true, slot.back);
      record.group.userData.basePosition.set(this.laneX(slot.lane), 0.1, this.state.scene3d.queueZ || -4.55);
      record.group.userData.baseRotation.set(0, 0, (slot.lane - 1.5) * 0.03);
      record.group.userData.baseScale = slot.isBoss ? 1.05 : 1;
    });
    this.removeMissingRecords(this.queueCards, validKeys);
  }

  syncBoardCards(side) {
    const validKeys = new Set();
    const board = side === "enemy" ? this.state.enemyBoard : this.state.playerBoard;
    board.forEach((card, lane) => {
      if (!card) return;
      const key = `${side}:${card.uid}`;
      validKeys.add(key);
      const record = this.ensureRecord(this.boardCards, key, () => this.createCardRecord(card, { type: "select-lane", side, lane }));
      this.updateCardTexture(record, card);
      record.hit.userData.action = { type: "select-lane", side, lane };
      record.group.userData.basePosition.set(this.laneX(lane), 0.11, this.boardZ(side));
      record.group.userData.baseRotation.set(0, 0, (lane - 1.5) * (side === "enemy" ? -0.03 : 0.03));
      record.group.userData.baseScale = this.state.inspect?.uid === card.uid ? 1.06 : 1;
    });
    [...this.boardCards.keys()].forEach((key) => {
      if (!key.startsWith(`${side}:`) || validKeys.has(key)) return;
      const record = this.boardCards.get(key);
      this.dynamicGroup.remove(record.group);
      this.boardCards.delete(key);
    });
  }

  syncHandCards() {
    const validKeys = new Set();
    const hand = this.state.hand || [];
    const count = hand.length;
    const span = Math.max(2.8, Math.min(6.4, count * 1.02));
    hand.forEach((card, index) => {
      const key = `hand:${card.uid}`;
      validKeys.add(key);
      const record = this.ensureRecord(this.handCards, key, () => this.createCardRecord(card, { type: "select-hand-card", handUid: card.uid }));
      this.updateCardTexture(record, card);
      const normalized = count <= 1 ? 0 : ((index / (count - 1)) - 0.5);
      const x = normalized * span;
      const z = (this.state.scene3d.handZ || 5.5) + Math.abs(normalized) * 0.4;
      const y = this.state.selection?.handUid === card.uid ? 0.34 : 0.15;
      record.hit.userData.action = { type: "select-hand-card", handUid: card.uid };
      record.group.userData.basePosition.set(x, y, z);
      record.group.userData.baseRotation.set(
        0,
        0,
        normalized * -0.26,
      );
      record.group.userData.baseScale = this.state.selection?.handUid === card.uid ? 1.05 : 1;
    });
    this.removeMissingRecords(this.handCards, validKeys);
  }

  syncItems() {
    const validKeys = new Set();
    const origin = this.state.scene3d.itemOrigin || { x: -8.08, z: 1.8 };
    const step = this.state.scene3d.itemStepZ || 1.58;
    (this.state.items || []).forEach((item, index) => {
      const key = `item:${index}`;
      validKeys.add(key);
      const record = this.ensureRecord(this.itemProps, key, () => this.createItemProp(item, index));
      record.group.visible = Boolean(item);
      record.hit.userData.action = item ? { type: "select-item", itemId: item.id } : null;
      record.group.userData.basePosition.set(origin.x, 0.22, origin.z + (index * step));
      record.group.userData.baseRotation.set(0, 0, 0);
      record.group.userData.baseScale = 1;
      if (item) {
        record.label.material.map = this.textureFactory.getLabelTexture(item.name, {
          width: 280,
          height: 88,
          font: "bold 28px Georgia, serif",
          background: "rgba(22, 14, 10, 0.88)",
        });
        record.label.material.needsUpdate = true;
      }
    });
    this.removeMissingRecords(this.itemProps, validKeys);
  }

  createItemProp(item, index) {
    const group = new this.THREE.Group();
    const body = new this.THREE.Mesh(
      new this.THREE.BoxGeometry(0.74, 0.64, 0.74),
      new this.THREE.MeshStandardMaterial({ color: 0x5d3c21, roughness: 0.68 }),
    );
    group.add(body);
    const label = new this.THREE.Mesh(
      new this.THREE.PlaneGeometry(1.2, 0.34),
      new this.THREE.MeshBasicMaterial({
        map: this.textureFactory.getLabelTexture(item?.name || "Empty", {
          width: 280,
          height: 88,
          font: "bold 28px Georgia, serif",
          background: "rgba(22, 14, 10, 0.88)",
        }),
        transparent: true,
      }),
    );
    label.rotation.x = -0.72;
    label.position.y = 0.7;
    group.add(label);
    const hit = this.createInteractivePlane(1.22, 1.22, item ? { type: "select-item", itemId: item.id } : null);
    hit.rotation.x = -Math.PI / 2;
    hit.position.y = 0.52;
    group.add(hit);
    group.userData.basePosition = new this.THREE.Vector3();
    group.userData.baseRotation = new this.THREE.Euler(0, 0, 0);
    group.userData.baseScale = 1;
    group.userData.animation = null;
    this.dynamicGroup.add(group);
    return { group, body, label, hit };
  }

  syncDeckProps() {
    this.mainDeckLabel.material.map = this.textureFactory.getLabelTexture(`Deck ${this.state.mainDeckCount}`, {
      width: 300,
      height: 96,
      font: "bold 30px Georgia, serif",
    });
    this.mainDeckLabel.material.needsUpdate = true;
    this.sideDeckLabel.material.map = this.textureFactory.getLabelTexture(`Squir ${this.state.sideDeckCount}`, {
      width: 300,
      height: 96,
      font: "bold 30px Georgia, serif",
    });
    this.sideDeckLabel.material.needsUpdate = true;
  }

  syncScale() {
    this.targetBeamRotation = -(this.state.scale || 0) * 0.08;
  }

  rebuildInteractives() {
    this.interactives = [];
  }

  startAnimation(targetGroup, animation) {
    targetGroup.userData.animation = {
      ...animation,
      start: performance.now(),
    };
  }

  handleEffect(event) {
    if (!event) return;
    if (event.effect === "bell") {
      this.startAnimation(this.bellGroup, { kind: "bell", duration: 260 });
    }
  }

  animationOffset(group, now) {
    const animation = group.userData.animation;
    if (!animation) return { position: new this.THREE.Vector3(), rotation: new this.THREE.Euler(), scale: 1 };
    const progress = Math.min(1, (now - animation.start) / animation.duration);
    const swing = Math.sin(progress * Math.PI);
    if (progress >= 1) group.userData.animation = null;
    if (animation.kind === "queue-takeoff") {
      return {
        position: new this.THREE.Vector3(0, swing * 0.86, swing * 0.38),
        rotation: new this.THREE.Euler(-swing * 0.08, 0, 0),
        scale: 1 + (swing * 0.04),
      };
    }
    if (animation.kind === "enemy-deploy") {
      return {
        position: new this.THREE.Vector3(0, Math.sin(progress * Math.PI) * 0.62, 0),
        rotation: new this.THREE.Euler(swing * 0.06, 0, 0),
        scale: 0.94 + (swing * 0.08),
      };
    }
    if (animation.kind === "attack-player") {
      return {
        position: new this.THREE.Vector3(0, swing * 0.18, -swing * 2.2),
        rotation: new this.THREE.Euler(-swing * 0.08, 0, 0),
        scale: 1 + (swing * 0.06),
      };
    }
    if (animation.kind === "attack-enemy") {
      return {
        position: new this.THREE.Vector3(0, swing * 0.18, swing * 2),
        rotation: new this.THREE.Euler(-swing * 0.08, 0, 0),
        scale: 1 + (swing * 0.06),
      };
    }
    if (animation.kind === "bell") {
      return {
        position: new this.THREE.Vector3(0, swing * 0.26, 0),
        rotation: new this.THREE.Euler(0, 0, swing * 0.08),
        scale: 1 + (swing * 0.08),
      };
    }
    return { position: new this.THREE.Vector3(), rotation: new this.THREE.Euler(), scale: 1 };
  }

  updateCardRecord(record, now, delta) {
    const basePosition = record.group.userData.basePosition;
    const baseRotation = record.group.userData.baseRotation;
    const baseScale = record.group.userData.baseScale || 1;
    const offset = this.animationOffset(record.group, now);
    record.group.position.x = lerp(record.group.position.x, basePosition.x + offset.position.x, Math.min(1, delta * 9));
    record.group.position.y = lerp(record.group.position.y, basePosition.y + offset.position.y, Math.min(1, delta * 9));
    record.group.position.z = lerp(record.group.position.z, basePosition.z + offset.position.z, Math.min(1, delta * 9));
    record.group.rotation.x = lerp(record.group.rotation.x, baseRotation.x + offset.rotation.x, Math.min(1, delta * 9));
    record.group.rotation.y = lerp(record.group.rotation.y, baseRotation.y + offset.rotation.y, Math.min(1, delta * 9));
    record.group.rotation.z = lerp(record.group.rotation.z, baseRotation.z + offset.rotation.z, Math.min(1, delta * 9));
    const targetScale = baseScale * offset.scale;
    record.group.scale.x = lerp(record.group.scale.x, targetScale, Math.min(1, delta * 9));
    record.group.scale.y = record.group.scale.x;
    record.group.scale.z = record.group.scale.x;
  }

  update(time, delta) {
    if (!this.state) return;
    const drift = this.state.scene3d?.drift || { amount: 0.055, speed: 0.22 };
    if (!this.screenState?.reducedMotion) {
      this.camera.position.x = this.baseCameraPosition.x + Math.sin(time * drift.speed) * drift.amount;
      this.camera.position.y = this.baseCameraPosition.y + Math.cos(time * drift.speed * 0.62) * (drift.amount * 0.45);
      this.camera.position.z = this.baseCameraPosition.z + Math.cos(time * drift.speed) * (drift.amount * 0.5);
    }
    this.camera.lookAt(this.baseCameraLookAt);
    this.beamGroup.rotation.z = lerp(this.beamGroup.rotation.z, this.targetBeamRotation || 0, Math.min(1, delta * 6));

    [...this.queueCards.values(), ...this.boardCards.values(), ...this.handCards.values(), ...this.itemProps.values()].forEach((record) => {
      this.updateCardRecord(record, performance.now(), delta);
    });
    if (this.bellGroup) {
      const bellOffset = this.animationOffset(this.bellGroup, performance.now());
      const base = this.state.scene3d.bell || { x: 0, z: 5.66 };
      this.bellGroup.position.x = lerp(this.bellGroup.position.x, base.x + bellOffset.position.x, Math.min(1, delta * 8));
      this.bellGroup.position.y = lerp(this.bellGroup.position.y, 0.22 + bellOffset.position.y, Math.min(1, delta * 8));
      this.bellGroup.position.z = lerp(this.bellGroup.position.z, base.z + bellOffset.position.z, Math.min(1, delta * 8));
      const bellScale = bellOffset.scale || 1;
      this.bellGroup.scale.x = lerp(this.bellGroup.scale.x, bellScale, Math.min(1, delta * 8));
      this.bellGroup.scale.y = this.bellGroup.scale.x;
      this.bellGroup.scale.z = this.bellGroup.scale.x;
    }
  }

  pickAction(pointer, raycaster) {
    raycaster.setFromCamera(pointer, this.camera);
    const hits = raycaster.intersectObjects(this.interactives.filter(Boolean), false);
    return hits.find((hit) => hit.object?.userData?.action)?.object?.userData?.action || null;
  }

  async handleClick({ pointer, raycaster }) {
    const action = this.pickAction(pointer, raycaster);
    if (!action) return;
    await this.bridge.dispatch(action);
  }

  async handlePointerMove() {}

  async handlePointerLeave() {}
}
