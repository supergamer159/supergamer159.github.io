export class TextureFactory {
  constructor(THREE, onInvalidate = null) {
    this.THREE = THREE;
    this.onInvalidate = onInvalidate;
    this.loader = new THREE.TextureLoader();
    this.imageTextures = new Map();
    this.imageCache = new Map();
    this.cardTextures = new Map();
    this.labelTextures = new Map();
    this.paperTexture = null;
  }

  invalidateDynamicTextures() {
    this.cardTextures.forEach((texture) => texture.dispose());
    this.labelTextures.forEach((texture) => texture.dispose());
    this.cardTextures.clear();
    this.labelTextures.clear();
    if (typeof this.onInvalidate === "function") this.onInvalidate();
  }

  getImageTexture(url) {
    if (!url) return null;
    if (!this.imageTextures.has(url)) {
      const texture = this.loader.load(url, () => {
        texture.colorSpace = this.THREE.SRGBColorSpace;
        texture.needsUpdate = true;
      });
      texture.colorSpace = this.THREE.SRGBColorSpace;
      this.imageTextures.set(url, texture);
    }
    return this.imageTextures.get(url);
  }

  getLoadedImage(url) {
    if (!url) return null;
    const cached = this.imageCache.get(url);
    if (cached?.status === "loaded") return cached.image;
    if (cached?.status === "loading") return null;
    const image = new Image();
    image.onload = () => {
      this.imageCache.set(url, { status: "loaded", image });
      this.invalidateDynamicTextures();
    };
    image.onerror = () => {
      this.imageCache.set(url, { status: "error", image: null });
      this.invalidateDynamicTextures();
    };
    image.src = url;
    this.imageCache.set(url, { status: "loading", image: null });
    return null;
  }

  buildCanvasTexture(width, height, draw) {
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    draw(context, canvas);
    const texture = new this.THREE.CanvasTexture(canvas);
    texture.colorSpace = this.THREE.SRGBColorSpace;
    texture.anisotropy = 4;
    texture.needsUpdate = true;
    return texture;
  }

  getPaperTexture() {
    if (this.paperTexture) return this.paperTexture;
    this.paperTexture = this.buildCanvasTexture(512, 512, (context, canvas) => {
      const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, "#ddbb85");
      gradient.addColorStop(1, "#c89f67");
      context.fillStyle = gradient;
      context.fillRect(0, 0, canvas.width, canvas.height);
      for (let index = 0; index < 1800; index += 1) {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const alpha = 0.015 + Math.random() * 0.03;
        const radius = 0.4 + Math.random() * 1.2;
        context.fillStyle = `rgba(70, 40, 18, ${alpha})`;
        context.beginPath();
        context.arc(x, y, radius, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 0.08;
      context.fillStyle = "#7b4e26";
      context.fillRect(0, 0, canvas.width, 18);
      context.fillRect(0, canvas.height - 22, canvas.width, 22);
      context.globalAlpha = 1;
    });
    this.paperTexture.wrapS = this.THREE.RepeatWrapping;
    this.paperTexture.wrapT = this.THREE.RepeatWrapping;
    this.paperTexture.repeat.set(2.4, 2.4);
    return this.paperTexture;
  }

  getGlyphTexture(text, options = {}) {
    const key = JSON.stringify({ text, options });
    if (this.labelTextures.has(key)) return this.labelTextures.get(key);
    const texture = this.buildCanvasTexture(options.width || 256, options.height || 256, (context, canvas) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = options.fill || "#070605";
      context.font = options.font || "bold 156px Georgia, serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(text || "?"), canvas.width / 2, canvas.height / 2);
    });
    this.labelTextures.set(key, texture);
    return texture;
  }

  getLabelTexture(text, options = {}) {
    const key = JSON.stringify({ text, options });
    if (this.labelTextures.has(key)) return this.labelTextures.get(key);
    const texture = this.buildCanvasTexture(options.width || 320, options.height || 128, (context, canvas) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      context.fillStyle = options.background || "rgba(14, 9, 7, 0.84)";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.strokeStyle = options.border || "rgba(224, 196, 148, 0.68)";
      context.lineWidth = 6;
      context.strokeRect(6, 6, canvas.width - 12, canvas.height - 12);
      context.fillStyle = options.color || "#efe1bf";
      context.font = options.font || "bold 34px Georgia, serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(text || ""), canvas.width / 2, canvas.height / 2);
    });
    this.labelTextures.set(key, texture);
    return texture;
  }

  getMapNodeTexture(visual) {
    if (!visual) return this.getGlyphTexture("?");
    if (visual.asset) return this.getImageTexture(visual.asset);
    return this.getGlyphTexture(visual.glyph || "?", {
      width: 256,
      height: 256,
      font: "bold 164px Georgia, serif",
      fill: "#070605",
    });
  }

  getCardTexture(card, assetCatalog) {
    const key = JSON.stringify({
      id: card.id,
      uid: card.uid,
      name: card.name,
      portrait: card.portrait,
      emission: card.emission,
      costBlood: card.costBlood,
      costBones: card.costBones,
      attack: card.attack,
      health: card.health,
      maxHealth: card.maxHealth,
      sigils: card.sigils,
      addedSigils: card.addedSigils,
      frame: card.frame,
      rare: card.rare,
      text: card.text,
    });
    if (this.cardTextures.has(key)) return this.cardTextures.get(key);
    const frameUrl = assetCatalog?.frames?.[card.frame || (card.rare ? "rare" : "normal")] || assetCatalog?.frames?.normal;
    const portrait = this.getLoadedImage(card.portrait);
    const emission = this.getLoadedImage(card.emission);
    const frame = this.getLoadedImage(frameUrl);
    const costUrl = card.costBlood > 0
      ? assetCatalog?.costs?.[`blood-${card.costBlood}`]
      : card.costBones > 0
        ? assetCatalog?.costs?.[`bone-${card.costBones}`]
        : "";
    const cost = this.getLoadedImage(costUrl);
    const sigils = (card.sigils || []).slice(0, 3).map((sigilId) => ({
      id: sigilId,
      image: this.getLoadedImage(assetCatalog?.sigils?.[sigilId]),
      added: (card.addedSigils || []).includes(sigilId),
    }));
    const texture = this.buildCanvasTexture(420, 630, (context, canvas) => {
      context.clearRect(0, 0, canvas.width, canvas.height);
      const background = context.createLinearGradient(0, 0, 0, canvas.height);
      background.addColorStop(0, "#d6ba8d");
      background.addColorStop(1, "#c8a16b");
      context.fillStyle = background;
      context.fillRect(0, 0, canvas.width, canvas.height);

      context.save();
      context.beginPath();
      context.rect(84, 116, 254, 254);
      context.clip();
      if (portrait) {
        const sourceWidth = portrait.width || 1;
        const sourceHeight = portrait.height || 1;
        const scale = Math.max(254 / sourceWidth, 254 / sourceHeight);
        const drawWidth = sourceWidth * scale;
        const drawHeight = sourceHeight * scale;
        context.drawImage(portrait, 84 + ((254 - drawWidth) / 2), 116 + ((254 - drawHeight) / 2), drawWidth, drawHeight);
      } else {
        context.fillStyle = "#816543";
        context.fillRect(84, 116, 254, 254);
      }
      if (emission) {
        context.globalAlpha = 0.38;
        const sourceWidth = emission.width || 1;
        const sourceHeight = emission.height || 1;
        const scale = Math.max(254 / sourceWidth, 254 / sourceHeight);
        const drawWidth = sourceWidth * scale;
        const drawHeight = sourceHeight * scale;
        context.drawImage(emission, 84 + ((254 - drawWidth) / 2), 116 + ((254 - drawHeight) / 2), drawWidth, drawHeight);
        context.globalAlpha = 1;
      }
      context.restore();

      if (frame) {
        context.drawImage(frame, 0, 0, canvas.width, canvas.height);
      } else {
        context.strokeStyle = "#443126";
        context.lineWidth = 12;
        context.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
      }

      context.fillStyle = "#0f0b08";
      context.font = "bold 28px Georgia, serif";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.fillText(String(card.name || "").toUpperCase(), canvas.width / 2, 84);

      if (cost) {
        context.drawImage(cost, 44, 438, 74, 98);
      }

      context.font = "bold 50px Georgia, serif";
      context.textAlign = "left";
      context.fillText(String(card.attack ?? 0), 58, 573);
      context.textAlign = "right";
      context.fillText(String(card.health ?? 0), 365, 573);

      sigils.forEach((sigil, index) => {
        const x = 154 + (index * 54);
        const y = 470;
        if (sigil.image) context.drawImage(sigil.image, x, y, 46, 46);
        else {
          context.fillStyle = "#1b140f";
          context.beginPath();
          context.arc(x + 23, y + 23, 18, 0, Math.PI * 2);
          context.fill();
        }
        if (sigil.added) {
          context.strokeStyle = "rgba(92, 24, 19, 0.8)";
          context.lineWidth = 4;
          context.strokeRect(x + 2, y + 2, 42, 42);
        }
      });
    });
    this.cardTextures.set(key, texture);
    return texture;
  }
}
