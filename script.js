// --- Assets ---
const assets = {
  follower: [
    "assets/follower/follower_bronze.png",
    "assets/follower/follower_silver.png",
    "assets/follower/follower_gold.png",
    "assets/follower/follower_legendary.png"
  ],
  spell: [
    "assets/spell/spell_bronze.png",
    "assets/spell/spell_silver.png",
    "assets/spell/spell_gold.png",
    "assets/spell/spell_legendary.png"
  ],
  amulet: [
    "assets/amulet/amulet_bronze.png",
    "assets/amulet/amulet_silver.png",
    "assets/amulet/amulet_gold.png",
    "assets/amulet/amulet_legendary.png"
  ],
  backgrounds: {
    Neutral: "assets/backgrounds/background_Neutral.png",
    Forestcraft: "assets/backgrounds/background_Forestcraft.png",
    Swordcraft: "assets/backgrounds/background_Swordcraft.png",
    Runecraft: "assets/backgrounds/background_Runecraft.png",
    Dragoncraft: "assets/backgrounds/background_Dragoncraft.png",
    Abysscraft: "assets/backgrounds/background_Abysscraft.png",
    Havencraft: "assets/backgrounds/background_Havencraft.png",
    Portalcraft: "assets/backgrounds/background_Portalcraft.png"
  },
  gems: {
    Neutral: "assets/gems/gem_Neutral.png",
    Forestcraft: "assets/gems/gem_Forestcraft.png",
    Swordcraft: "assets/gems/gem_Swordcraft.png",
    Runecraft: "assets/gems/gem_Runecraft.png",
    Dragoncraft: "assets/gems/gem_Dragoncraft.png",
    Abysscraft: "assets/gems/gem_Abysscraft.png",
    Havencraft: "assets/gems/gem_Havencraft.png",
    Portalcraft: "assets/gems/gem_Portalcraft.png"
  },
  boxes: {
    text_box: "assets/boxes/text_box.png",
    text_box_no_bottom: "assets/boxes/text_box_no_bottom.png",
    divider: "assets/boxes/divider.png",
    small_divider: "assets/boxes/small_divider.png",
    evolve: "assets/boxes/box_evolve.png",
    superEvolve: "assets/boxes/box_super_evolve.png",
    crest: "assets/boxes/box_crest.png",
    faith: "assets/boxes/box_faith.png"
  }
};

// --- DOM elements ---
const canvas = document.getElementById("previewCanvas");
const ctx = canvas.getContext("2d");
const nameInput = document.getElementById("cardName");
const traitInput = document.getElementById("cardTrait");
const classSelect = document.getElementById("cardClass");
const typeSelect = document.getElementById("cardType");
const raritySelect = document.getElementById("cardRarity");
const costInput = document.getElementById("costValue");
const attackInput = document.getElementById("attackValue");
const defenseInput = document.getElementById("defenseValue");
const tokenCheckbox = document.getElementById("tokenCheckbox");
const wordCountCheckbox = document.getElementById("wordCountCheckbox");
const textInputs = {
  card: document.getElementById("cardText"),
  evolve: document.getElementById("evolveText"),
  superEvolve: document.getElementById("superEvolveText"),
  crest: document.getElementById("crestText"),
  faith: document.getElementById("faithText")
};

// --- Crest and Faith uploads ---
const crestArtUpload = document.getElementById("crestArtUpload");
const faithArtUpload = document.getElementById("faithArtUpload");

let uploadedArt = null;
let crestArt = null;
let faithArt = null;

// --- Helpers ---
function loadImage(src) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => res(img);
    img.onerror = rej;
    img.src = src;
  });
}

const imageCache = {};
async function getImage(src) {
  if (imageCache[src]) return imageCache[src];
  const img = await loadImage(src);
  imageCache[src] = img;
  return img;
}

// --- Auto insert "----------" marker ---
Object.values(textInputs).forEach((textarea) => {
  textarea.addEventListener("input", () => {
    const cursorPos = textarea.selectionStart;
    const value = textarea.value;
    const before = value.slice(0, cursorPos);
    const after = value.slice(cursorPos);
    if (before.endsWith("\n\n")) {
      const newValue = before.slice(0, -1) + "----------\n" + after;
      textarea.value = newValue;
      textarea.selectionStart = textarea.selectionEnd = cursorPos + 10;
    }
  });
});

// --- Toggle Crest/Faith upload buttons ---
function toggleIconUploads() {
  const crestHasText = textInputs.crest.value.trim() !== "";
  const faithHasText = textInputs.faith.value.trim() !== "";
  crestArtUpload.style.display = crestHasText ? "block" : "none";
  faithArtUpload.style.display = faithHasText ? "block" : "none";
}
textInputs.crest.addEventListener("input", toggleIconUploads);
textInputs.faith.addEventListener("input", toggleIconUploads);

// --- Text highlight keywords ---
const HIGHLIGHT_KEYWORDS = [
  "Fanfare","Last Words","Engage","Strike","Storm","Ambush","Bane","Drain","Ward","Rush",
  "Overflow","Evolve","Super-Evolve","Spellboost","Clash","Mode","Intimidate","Aura","Barrier",
  "Fuse","Necromancy","Combo","Earth Rite","Rally","Countdown","Reanimate","Earth Sigil",
  "Crystallize","Invoke","Invoked","Sanguine","Skybound Art","Super Skybound Art","Maneuver",
  "Enhance","Union Burst","Accelerate"
];
const HIGHLIGHT_REGEX = new RegExp(`\\b(${HIGHLIGHT_KEYWORDS.join("|")})\\b`, "g");

// --- drawStretchBox (used by text boxes) ---
function drawStretchBox(img, x, y, stretchCount = 0, key = "") {
  const stretchPerBreak = 50;
  const stretchAmount = stretchCount * stretchPerBreak;
  let topHeight = 40, bottomHeight = 40;
  let middleStartY = topHeight;
  let middleHeight = img.height - topHeight - bottomHeight;

  if (key === "crest" || key === "faith") {
    topHeight = 107;
    middleStartY = 107;
    middleHeight = 38;
    bottomHeight = 28;
  }

  ctx.drawImage(img, 0, 0, img.width, topHeight, x, y, img.width, topHeight);
  ctx.drawImage(
    img,
    0, middleStartY, img.width, middleHeight,
    x, y + middleStartY, img.width, middleHeight + stretchAmount
  );
  ctx.drawImage(
    img,
    0, img.height - bottomHeight, img.width, bottomHeight,
    x, y + middleStartY + middleHeight + stretchAmount,
    img.width, bottomHeight
  );
  return topHeight + middleHeight + bottomHeight + stretchAmount;
}

// --- drawTextBlock ---
async function drawTextBlock(key, box, x, startY) {
  const textValue = textInputs[key].value.trim();
  if (!textValue) return 0;

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;

  const boxImg = box ? await getImage(assets.boxes[box]) : null;
  const stretchable = ["card", "evolve", "superEvolve", "crest", "faith"];

  const wrapLimitX = 1716;
  const textStartX = x + 30;
  const maxLineWidthPx = Math.max(0, wrapLimitX - textStartX);
  const lineHeight = 50;

  ctx.font = "33px 'Memento'";
  const lines = textValue.split("\n");

  const wrappedLines = [];
  for (const rawLine of lines) {
    const words = rawLine.split(/\s+/).filter(Boolean);
    let line = "";
    for (const word of words) {
      const testLine = line ? `${line} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;
      if (testWidth > maxLineWidthPx && line !== "") {
        wrappedLines.push(line);
        line = word;
      } else line = testLine;
    }
    wrappedLines.push(line);
  }

  const stretchCount = wrappedLines.length - 1;
  const boxHeight = boxImg
    ? stretchable.includes(key)
      ? drawStretchBox(boxImg, x, startY, stretchCount, key)
      : (ctx.drawImage(boxImg, x, startY), boxImg.height)
    : 0;

  ctx.font = "33px 'Memento'";
  ctx.fillStyle = "#efeee9";
  ctx.textAlign = "left";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 4;

  const dividerToUse = await getImage(
    assets.boxes[key === "card" ? "divider" : "small_divider"]
  );

  let textY = startY + 50 + (key === "crest" || key === "faith" ? 90 : 0);
  for (let i = 0; i < wrappedLines.length; i++) {
    const line = wrappedLines[i];
    let xPos = textStartX;
    if (line.includes("----------")) ctx.globalAlpha = 0;
    const parts = line.split(HIGHLIGHT_REGEX);
    for (const part of parts) {
      if (HIGHLIGHT_KEYWORDS.includes(part)) {
        ctx.font = "bold 33px 'Memento'";
        ctx.fillStyle = "#f3d87d";
      } else {
        ctx.font = "33px 'Memento'";
        ctx.fillStyle = "#efeee9";
      }
      ctx.fillText(part, xPos, textY);
      xPos += ctx.measureText(part).width;
    }
    ctx.globalAlpha = 1;
    if (line.includes("----------")) ctx.drawImage(dividerToUse, x, textY - 10);
    textY += lineHeight;
  }
  return Math.max(boxHeight, textY - startY + 40);
}

// --- drawCard ---
async function drawCard() {
  const [bg, gem, frame] = await Promise.all([
    getImage(assets.backgrounds[classSelect.value]),
    getImage(assets.gems[classSelect.value]),
    getImage(
      assets[typeSelect.value.toLowerCase()][
        ["bronze", "silver", "gold", "legendary"].indexOf(
          raritySelect.value.toLowerCase()
        )
      ]
    )
  ]);

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  // === Masked Main Art ===
  if (uploadedArt) {
    const maskX = 200;
    const maskY = 350;
    const maskW = 450;
    const maskH = 560;

    ctx.save();
    ctx.beginPath();
    ctx.rect(maskX, maskY, maskW, maskH);
    ctx.closePath();
    ctx.clip();

    ctx.drawImage(uploadedArt, artX, artY, artW, artH);

    ctx.restore();
  }
  // === RE-ADD BLURRED BACKGROUND PATCH ===
  const textBoxX = 722;
  const textBoxY = 206;
  const textBoxW = 1078;
  const textBoxH = 762;

  const offCanvas = document.createElement("canvas");
  offCanvas.width = textBoxW;
  offCanvas.height = textBoxH;
  const offCtx = offCanvas.getContext("2d");

  // Copy the background region
  offCtx.drawImage(
    bg,
    textBoxX, textBoxY, textBoxW, textBoxH,
    0, 0, textBoxW, textBoxH
  );

  // Apply blur
  offCtx.filter = "blur(5px)";
  offCtx.drawImage(offCanvas, 0, 0);

  // Draw blurred area onto main canvas
  ctx.drawImage(offCanvas, textBoxX, textBoxY);

  const textBox = await getImage(assets.boxes.text_box);
  const textBoxNoBottom = await getImage(assets.boxes.text_box_no_bottom);
  const illustrator = document.getElementById("illustratorName").value.trim();

  ctx.drawImage(gem, 398, 863);
  ctx.drawImage(frame, 48, 153);

  if (wordCountCheckbox.checked || illustrator)
    ctx.drawImage(textBox, textBoxX, textBoxY);
  else ctx.drawImage(textBoxNoBottom, textBoxX, textBoxY);

  const boxX = 769;
  let currentY = 246;
  const textOrder = [
    { key: "card", box: null },
    { key: "evolve", box: "evolve" },
    { key: "superEvolve", box: "superEvolve" },
    { key: "crest", box: "crest" },
    { key: "faith", box: "faith" }
  ];

  for (const { key, box } of textOrder) {
    if (!textInputs[key].value.trim()) continue;
    const blockHeight = await drawTextBlock(key, box, boxX, currentY);
    if (key === "crest" && crestArt) {
      const x = boxX + 120, y = currentY + 22;
      ctx.save(); ctx.beginPath();
      ctx.arc(x + ICON_W / 2, y + ICON_H / 2, ICON_W / 2, 0, Math.PI * 2);
      ctx.clip(); ctx.drawImage(crestArt, x, y, ICON_W, ICON_H);
      ctx.restore();
    }
    if (key === "faith" && faithArt) {
      const x = boxX + 120, y = currentY + 27;
      ctx.save(); ctx.beginPath();
      ctx.arc(x + ICON_W / 2, y + ICON_H / 2, ICON_W / 2, 0, Math.PI * 2);
      ctx.clip(); ctx.drawImage(faithArt, x, y, ICON_W, ICON_H);
      ctx.restore();
    }
    currentY += blockHeight - 50;
  }

  ctx.shadowColor = "black";
  ctx.shadowBlur = 6;
  ctx.fillStyle = "#efeee9";

  // --- Primary name (top left) ---
  ctx.font = "56px 'Memento'";
  ctx.textAlign = "left";
  const nameText = nameInput.value.trim() || "Unnamed Card";
  ctx.fillText(nameText, 163, 150);

  // --- Secondary name (centered) ---
  let secondaryFontSize = 42;
  ctx.font = `${secondaryFontSize}px 'Memento'`;
  let textWidth = ctx.measureText(nameText).width;

  // dynamically shrink if too long
  while (textWidth > 363 && secondaryFontSize > 24) {
    secondaryFontSize -= 2;
    ctx.font = `${secondaryFontSize}px 'Memento'`;
    textWidth = ctx.measureText(nameText).width;
  }

  ctx.textAlign = "center";
  ctx.fillText(nameText, 455, 331);

  ctx.font = "33px 'Memento'";
  ctx.textAlign = "left";
  ctx.fillText(traitInput.value.trim(), 1306, 147);
  ctx.font = "80px 'Sv_numbers'";
  ctx.textAlign = "center";
  ctx.fillText(costInput.value, 198, 335);
  if (typeSelect.value === "Follower") {
    ctx.font = "82px 'Sv_numbers'";
    ctx.fillText(attackInput.value, 203, 920);
    ctx.fillText(defenseInput.value, 645, 920);
  }
  if (tokenCheckbox.checked) {
    ctx.font = "28px 'NotoSans'";
    ctx.textAlign = "right";
    ctx.fillText("*This is a token card.", 1788, 1025);
  }
  if (illustrator) {
    ctx.font = "28px 'NotoSans'";
    ctx.textAlign = "left";
    ctx.fillText(`Illustrator: ${illustrator}`, 790, 911);
  }
  if (wordCountCheckbox.checked) {
    const allText = Object.values(textInputs).map(t => t.value).join(" ");
    const wordCount = allText.split(/\s+/).filter(w => w.length).length;
    ctx.font = "28px 'NotoSans'";
    ctx.textAlign = "right";
    ctx.fillText(`Word count: ${wordCount}`, 1730, 911);
  }
  ctx.shadowColor = "transparent"; ctx.shadowBlur = 0;
}

// --- Live updates ---
[
  nameInput, traitInput, classSelect, raritySelect, costInput, attackInput, defenseInput,
  tokenCheckbox, wordCountCheckbox, ...Object.values(textInputs),
  document.getElementById("illustratorName")
].forEach(el => el.addEventListener("input", () => safeDrawCard()));

// --- Prevent overlapping draws ---
let isDrawing = false;
async function safeDrawCard() {
  if (isDrawing) return;
  isDrawing = true;
  try { await drawCard(); } catch (err) { console.error("drawCard error:", err); } finally { isDrawing = false; }
}

/***********************
  PREVIEW COLUMN HANDLERS (clamped)
***********************/
const MAIN_MASK_W = 450, MAIN_MASK_H = 560;
const MAIN_ART_X = 200, MAIN_ART_Y = 350;
const ICON_W = 56, ICON_H = 57;
let artX = MAIN_ART_X, artY = MAIN_ART_Y, artW = MAIN_MASK_W, artH = MAIN_MASK_H;
window.ICON_W = ICON_W; window.ICON_H = ICON_H;

const mainPreviewCanvas = document.getElementById("mainPreviewCanvas");
const mainPreviewCtx = mainPreviewCanvas ? mainPreviewCanvas.getContext("2d") : null;
const mainZoomSlider = document.getElementById("mainZoomSlider");
const crestPreviewCanvas = document.getElementById("crestPreviewCanvas");
const crestPreviewCtx = crestPreviewCanvas ? crestPreviewCanvas.getContext("2d") : null;
const crestZoomSlider = document.getElementById("crestZoomSlider");
const faithPreviewCanvas = document.getElementById("faithPreviewCanvas");
const faithPreviewCtx = faithPreviewCanvas ? faithPreviewCanvas.getContext("2d") : null;
const faithZoomSlider = document.getElementById("faithZoomSlider");
const artInput = document.getElementById("artUpload");
const crestInput = document.getElementById("crestArtUpload");
const faithInput = document.getElementById("faithArtUpload");

const previewState = {
  main: { img: null, scale: 1, tx: 0, ty: 0, maskW: MAIN_MASK_W, maskH: MAIN_MASK_H },
  crest: { img: null, scale: 1, tx: 0, ty: 0, maskW: ICON_W, maskH: ICON_H },
  faith: { img: null, scale: 1, tx: 0, ty: 0, maskW: ICON_W, maskH: ICON_H }
};

function loadImageFromFile(file) {
  return new Promise((res, rej) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); res(img); };
    img.onerror = e => { URL.revokeObjectURL(url); rej(e); };
    img.src = url;
  });
}

function fitImageToMask(img, s) {
  const scale = Math.max(s.maskW / img.width, s.maskH / img.height);
  s.scale = scale;
  s.tx = (s.maskW - img.width * scale) / 2;
  s.ty = (s.maskH - img.height * scale) / 2;
}

// clamp pan so that the image always covers the mask (or is centered if smaller)
function clampPan(s) {
  if (!s.img) return;
  const imgW = s.img.width * s.scale;
  const imgH = s.img.height * s.scale;
  if (imgW <= s.maskW) {
    // center horizontally
    s.tx = (s.maskW - imgW) / 2;
  } else {
    const minX = s.maskW - imgW;
    const maxX = 0;
    if (s.tx < minX) s.tx = minX;
    if (s.tx > maxX) s.tx = maxX;
  }
  if (imgH <= s.maskH) {
    // center vertically
    s.ty = (s.maskH - imgH) / 2;
  } else {
    const minY = s.maskH - imgH;
    const maxY = 0;
    if (s.ty < minY) s.ty = minY;
    if (s.ty > maxY) s.ty = maxY;
  }
}

function drawPreviewCanvas(ctx, canvasEl, s, shape) {
  if (!ctx || !canvasEl) return;
  const { img, scale, tx, ty, maskW, maskH } = s;
  ctx.clearRect(0, 0, canvasEl.width, canvasEl.height);
  ctx.fillStyle = "rgba(20,20,20,0.95)";
  ctx.fillRect(0, 0, canvasEl.width, canvasEl.height);

  if (!img) {
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    if (shape === "circle") {
      ctx.beginPath();
      ctx.arc(maskW / 2, maskH / 2, Math.min(maskW, maskH) / 2 - 1, 0, Math.PI * 2);
      ctx.stroke();
    } else {
      ctx.strokeRect(0.5, 0.5, maskW - 1, maskH - 1);
    }
    return;
  }

  ctx.save();
  if (shape === "circle") {
    ctx.beginPath();
    ctx.arc(maskW / 2, maskH / 2, Math.min(maskW, maskH) / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
  } else {
    ctx.beginPath();
    ctx.rect(0, 0, maskW, maskH);
    ctx.closePath();
    ctx.clip();
  }

  ctx.drawImage(img, tx, ty, img.width * scale, img.height * scale);
  ctx.restore();

  ctx.strokeStyle = "rgba(255,255,255,0.06)";
  ctx.lineWidth = 1;
  if (shape === "circle") {
    ctx.beginPath();
    ctx.arc(maskW / 2, maskH / 2, Math.min(maskW, maskH) / 2 - 1, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.strokeRect(0.5, 0.5, maskW - 1, maskH - 1);
  }
}

function syncMainToGlobals() {
  const s = previewState.main;
  if (!s.img) {
    uploadedArt = null;
    artW = MAIN_MASK_W;
    artH = MAIN_MASK_H;
    artX = MAIN_ART_X;
    artY = MAIN_ART_Y;
    return;
  }
  uploadedArt = s.img;
  artW = Math.round(s.img.width * s.scale);
  artH = Math.round(s.img.height * s.scale);
  artX = Math.round(MAIN_ART_X + s.tx);
  artY = Math.round(MAIN_ART_Y + s.ty);
}

function syncIconToGlobals(which) {
  const s = previewState[which];
  if (!s.img) {
    if (which === "crest") crestArt = null;
    else faithArt = null;
    return;
  }
  if (which === "crest") crestArt = s.img;
  else faithArt = s.img;
  // update global icon sizes to mask size
  window.ICON_W = s.maskW;
  window.ICON_H = s.maskH;
}

function updateAll() {
  // clamp pans first
  clampPan(previewState.main);
  clampPan(previewState.crest);
  clampPan(previewState.faith);

  // sync to globals
  syncMainToGlobals();
  syncIconToGlobals("crest");
  syncIconToGlobals("faith");

  // redraw card (serialized)
  safeDrawCard();

  // redraw previews
  drawPreviewCanvas(mainPreviewCtx, mainPreviewCanvas, previewState.main, "rect");
  drawPreviewCanvas(crestPreviewCtx, crestPreviewCanvas, previewState.crest, "circle");
  drawPreviewCanvas(faithPreviewCtx, faithPreviewCanvas, previewState.faith, "circle");
}

/* ---------- Upload handlers ---------- */
if (artInput) {
  artInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const img = await loadImageFromFile(file);
      previewState.main.img = img;
      fitImageToMask(img, previewState.main);
      if (mainZoomSlider) mainZoomSlider.value = previewState.main.scale;
      updateAll();
    } catch (err) {
      console.error("Failed to load main art:", err);
    }
  });
}
if (crestInput) {
  crestInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const img = await loadImageFromFile(file);
      previewState.crest.img = img;
      fitImageToMask(img, previewState.crest);
      if (crestZoomSlider) crestZoomSlider.value = previewState.crest.scale;
      updateAll();
    } catch (err) {
      console.error("Failed to load crest art:", err);
    }
  });
}
if (faithInput) {
  faithInput.addEventListener("change", async (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    try {
      const img = await loadImageFromFile(file);
      previewState.faith.img = img;
      fitImageToMask(img, previewState.faith);
      if (faithZoomSlider) faithZoomSlider.value = previewState.faith.scale;
      updateAll();
    } catch (err) {
      console.error("Failed to load faith art:", err);
    }
  });
}

/* ---------- Pan & zoom helpers ---------- */
function getEventPos(e, canvasEl) {
  const rect = canvasEl.getBoundingClientRect();
  if (e.touches && e.touches.length) {
    return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
  } else {
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }
}

function attachPanAndZoom(canvasEl, state, sliderEl) {
  if (!canvasEl) return;
  let dragging = false;
  let lastX = 0, lastY = 0;

  canvasEl.addEventListener("pointerdown", (e) => {
    if (!state.img) return;
    dragging = true;
    const p = getEventPos(e, canvasEl);
    lastX = p.x; lastY = p.y;
    if (canvasEl.setPointerCapture) try { canvasEl.setPointerCapture(e.pointerId); } catch (err) {}
  });

  canvasEl.addEventListener("pointermove", (e) => {
    if (!dragging || !state.img) return;
    const p = getEventPos(e, canvasEl);
    const dx = p.x - lastX, dy = p.y - lastY;
    lastX = p.x; lastY = p.y;
    state.tx += dx; state.ty += dy;
    clampPan(state);
    updateAll();
  });

  function stopDrag(e) {
    dragging = false;
    if (canvasEl.releasePointerCapture) try { canvasEl.releasePointerCapture(e.pointerId); } catch (err) {}
  }
  canvasEl.addEventListener("pointerup", stopDrag);
  canvasEl.addEventListener("pointerleave", stopDrag);

  // wheel zoom
  canvasEl.addEventListener("wheel", (ev) => {
    if (!state.img) return;
    ev.preventDefault();
    const delta = ev.deltaY > 0 ? -0.05 : 0.05;
    const oldScale = state.scale;
    const newScale = Math.max(0.1, state.scale + delta);
    // zoom around pointer
    const rect = canvasEl.getBoundingClientRect();
    const cx = ev.clientX - rect.left;
    const cy = ev.clientY - rect.top;
    const imgSpaceX = (cx - state.tx) / oldScale;
    const imgSpaceY = (cy - state.ty) / oldScale;
    state.scale = newScale;
    state.tx = cx - imgSpaceX * newScale;
    state.ty = cy - imgSpaceY * newScale;
    clampPan(state);
    if (sliderEl) sliderEl.value = state.scale;
    updateAll();
  }, { passive: false });

  // slider
  if (sliderEl) {
    sliderEl.addEventListener("input", (ev) => {
      if (!state.img) return;
      const newScale = parseFloat(ev.target.value);
      const oldScale = state.scale;
      // keep center stable
      const cx = state.maskW / 2, cy = state.maskH / 2;
      const imgSpaceX = (cx - state.tx) / oldScale;
      const imgSpaceY = (cy - state.ty) / oldScale;
      state.scale = newScale;
      state.tx = cx - imgSpaceX * newScale;
      state.ty = cy - imgSpaceY * newScale;
      clampPan(state);
      updateAll();
    });
  }
}

attachPanAndZoom(mainPreviewCanvas, previewState.main, mainZoomSlider);
attachPanAndZoom(crestPreviewCanvas, previewState.crest, crestZoomSlider);
attachPanAndZoom(faithPreviewCanvas, previewState.faith, faithZoomSlider);

// initial draw
document.fonts.ready.then(() => setTimeout(updateAll, 60));

// --- Ensure Crest/Faith upload buttons toggle correctly ---
window.addEventListener("DOMContentLoaded", () => {
  const crestText = document.getElementById("crestText");
  const crestBtn = document.getElementById("crestUploadBtn");
  const faithText = document.getElementById("faithText");
  const faithBtn = document.getElementById("faithUploadBtn");

  function toggleBtn(textEl, btnEl) {
    if (!textEl || !btnEl) return;
    btnEl.style.display = textEl.value.trim() ? "inline-block" : "none";
  }

  if (crestText && crestBtn) {
    crestText.addEventListener("input", () => toggleBtn(crestText, crestBtn));
    toggleBtn(crestText, crestBtn);
  }
  if (faithText && faithBtn) {
    faithText.addEventListener("input", () => toggleBtn(faithText, faithBtn));
    toggleBtn(faithText, faithBtn);
  }
});
