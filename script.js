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
const crestNameInput = document.getElementById("crestName");
const faithNameInput = document.getElementById("faithName");
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

/**
 * Draws a number, scaling down the font size to fit a max width.
 * @param {string} text - The number to draw (e.g., "100").
 * @param {number} x - The center x-coordinate.
 * @param {number} y - The baseline y-coordinate.
 * @param {number} maxFontSize - The font size to start at (e.g., 80).
 * @param {number} maxWidth - The maximum pixel width before shrinking.
 * @param {string} fontFace - The font family (e.g., 'Sv_numbers').
 * @param {number} letterSpacing - The letter spacing to apply.
 * @param {number} yNudgeCoefficient - The factor used to calculate the vertical correction (e.g., 0.4).
 */
function drawScaledNumber(text, x, y, maxFontSize, maxWidth, fontFace, letterSpacing = 0, yNudgeCoefficient) {
  ctx.textAlign = "center";
  ctx.letterSpacing = `${letterSpacing}px`; // Apply your letter spacing

  let fontSize = maxFontSize;
  ctx.font = `${fontSize}px '${fontFace}'`;
  let textWidth = ctx.measureText(text).width;

  // This loop shrinks the font size until the text fits
  while (textWidth > maxWidth && fontSize > 10) { // 10px is a safe minimum
    fontSize -= 2; // Shrink by 2px
    ctx.font = `${fontSize}px '${fontFace}'`;
    textWidth = ctx.measureText(text).width;
  }

  const yNudge = (maxFontSize - fontSize) * yNudgeCoefficient;

  ctx.fillText(text, x, y + yNudge);

  ctx.letterSpacing = "0px";
}

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

  // --- Common setup ---
  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
  const textStartX = x + 30;
  const wrapLimitX = 1716;
  const lineHeight = 50;
  const baseFont = "33px 'Memento'";

  // --- Pre-process text to wrap keywords in special tags for easier tokenizing ---
  const processedText = textValue.replace(HIGHLIGHT_REGEX, "<K>$&</K>");

  // --- Tokenizer that understands all formatting markers ---
  const tokenizerRegex = /(\*\*|_|<c>|<\/c>|<K>|<\/K>|----------|\n|\s+)/g;
  const allTokens = processedText.split(tokenizerRegex).filter(Boolean);

  // --- Dry Run: Calculate layout and line count without drawing anything ---
  let lineCount = 1;
  let currentX = textStartX;
  let dryStyle = { bold: false, italic: false, isKeyword: false };

  const setDryFont = () => {
    const weight = dryStyle.bold || dryStyle.isKeyword ? "bold " : "";
    const style = dryStyle.italic ? "italic " : "";
    ctx.font = `${weight}${style}${baseFont}`;
  };

  for (const token of allTokens) {
    // Update style state for measurement
    if (token === "**") { dryStyle.bold = !dryStyle.bold; continue; }
    if (token === "_") { dryStyle.italic = !dryStyle.italic; continue; }
    if (token === "<K>") { dryStyle.isKeyword = true; continue; }
    if (token === "</K>") { dryStyle.isKeyword = false; continue; }
    if (["<c>", "</c>"].includes(token)) continue; // Color doesn't affect width

    // Handle explicit line breaks and dividers
    // Handle explicit line breaks
    if (token === "\n") {
      lineCount++;
      currentX = textStartX;
      continue;
    }
    
    // Handle dividers
    if (token.trim() === "----------") {
      if (currentX > textStartX) { // Only add a line if not at the start
        lineCount++;
      }
      // The divider draws on the current line, and the
      // auto-inserter provides its own \n, so we just reset X.
      currentX = textStartX;
      continue;
    }
    
    // Measure token and check for wrapping
    setDryFont();
    const tokenWidth = ctx.measureText(token).width;
    
    if (currentX > textStartX && currentX + tokenWidth > wrapLimitX && token.trim() !== "") {
      lineCount++;
      currentX = textStartX;
    }

    currentX += tokenWidth;
    if (dryStyle.italic) currentX += 3; // Add extra space for italic slant
  }

  // --- Draw the stretchable box based on the calculated line count ---
  const boxImg = box ? await getImage(assets.boxes[box]) : null;
  const stretchCount = Math.max(0, lineCount - 1);

  const boxHeight = boxImg
    ? drawStretchBox(boxImg, x, startY, stretchCount, key)
    : 0;

  // --- Wet Run: Actually draw the text onto the canvas ---
  ctx.textAlign = "left";
  ctx.shadowColor = "black";
  ctx.shadowBlur = 4;

  let xPos = textStartX;
  let textY = startY + 50 + (key === "crest" || key === "faith" ? 90 : 0);
  let wetStyle = { bold: false, italic: false, color: null, isKeyword: false };

  const setWetStyle = () => {
    const weight = wetStyle.bold || wetStyle.isKeyword ? "bold " : "";
    const style = wetStyle.italic ? "italic " : "";
    ctx.font = `${weight}${style}${baseFont}`;
    ctx.fillStyle = wetStyle.color || (wetStyle.isKeyword ? "#f3d87d" : "#efeee9");
  };

  const dividerToUse = await getImage(
    assets.boxes[key === "card" ? "divider" : "small_divider"]
  );

  for (const token of allTokens) {
    // Update style state
    if (token === "**") { wetStyle.bold = !wetStyle.bold; continue; }
    if (token === "_") { wetStyle.italic = !wetStyle.italic; continue; }
    if (token === "<c>") { wetStyle.color = "#f3d87d"; continue; }
    if (token === "</c>") { wetStyle.color = null; continue; }
    if (token === "<K>") { wetStyle.isKeyword = true; continue; }
    if (token === "</K>") { wetStyle.isKeyword = false; continue; }
    
    // Handle line breaks
    if (token === "\n") {
      textY += lineHeight;
      xPos = textStartX;
      continue;
    }

    // Handle divider
    if (token.trim() === "----------") {
      if (xPos > textStartX) textY += lineHeight;
      ctx.drawImage(dividerToUse, x, textY - 10);
      xPos = textStartX;
      continue;
    }
    
    setWetStyle();
    const tokenWidth = ctx.measureText(token).width;

    // Check for wrapping
    if (xPos > textStartX && xPos + tokenWidth > wrapLimitX && token.trim() !== "") {
      textY += lineHeight;
      xPos = textStartX;
    }
    
    // Don't draw leading spaces on a new line
    if (xPos === textStartX && token.trim() === "") continue;

    ctx.fillText(token, xPos, textY);
    xPos += tokenWidth;
    if (wetStyle.italic) xPos += 0;
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
    const maskX = MAIN_ART_X;
    const maskY = MAIN_ART_Y;
    const maskW = MAIN_MASK_W;
    const maskH = MAIN_MASK_H;

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

  offCtx.drawImage(
    bg,
    textBoxX, textBoxY, textBoxW, textBoxH,
    0, 0, textBoxW, textBoxH
  );

  offCtx.filter = "blur(5px)";
  offCtx.drawImage(offCanvas, 0, 0);

  ctx.drawImage(offCanvas, textBoxX, textBoxY);

  ctx.drawImage(gem, 398, 863);
  ctx.drawImage(frame, 48, 153);

  const textBox = await getImage(assets.boxes.text_box);
  const textBoxNoBottom = await getImage(assets.boxes.text_box_no_bottom);
  const illustrator = document.getElementById("illustratorName").value.trim();

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

    // Shared logic for crest and faith
    const isCrest = key === "crest";
    const isFaith = key === "faith";
    if (isCrest || isFaith) {
      const t = getIconTransform(isCrest ? "crest" : "faith");
      const iconX = boxX + 120;
      const iconY = currentY + 32;
      const iconImg = isCrest ? crestArt : faithArt;
      const nameField = document.getElementById(isCrest ? "crestName" : "faithName");
      const nameValue = nameField ? nameField.value.trim() : "";

      // ✅ Draw circular icon if it exists
      if (iconImg && t) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(iconX + ICON_W / 2, iconY + ICON_H / 2, ICON_W / 2, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();

        ctx.drawImage(
          t.img,
          iconX + t.tx,
          iconY + t.ty,
          t.img.width * t.scale,
          t.img.height * t.scale
        );
        ctx.restore();
      }

      // ✅ Always draw text if there's any (even without art)
      if (nameValue) {
        ctx.save();
        ctx.font = "33px 'Memento'";
        ctx.fillStyle = "#f3d87d";
        ctx.textAlign = "left";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 4;
        ctx.fillText(nameValue, iconX + ICON_W + 17, iconY + ICON_H / 2 + 10);
        ctx.restore();
      } 
      else {
        if (isCrest){
          ctx.save();
          ctx.font = "33px 'Memento'";
          ctx.fillStyle = "#f3d87d";
          ctx.textAlign = "left";
          ctx.shadowColor = "black";
          ctx.shadowBlur = 4;
          ctx.fillText("Crest", iconX + ICON_W + 17, iconY + ICON_H / 2 + 10);
          ctx.restore();
        }
        else 
          if (isFaith){
           ctx.save();
          ctx.font = "33px 'Memento'";
          ctx.fillStyle = "#f3d87d";
          ctx.textAlign = "left";
          ctx.shadowColor = "black";
          ctx.shadowBlur = 4;
          ctx.fillText("Faith", iconX + ICON_W + 17, iconY + ICON_H / 2 + 10);
          ctx.restore();
        }
      }
    }

    currentY += blockHeight - 10;
  }



  ctx.shadowColor = "black";
  ctx.shadowBlur = 6;
  ctx.fillStyle = "#efeee9";
  ctx.font = "56px 'Memento'";
  ctx.textAlign = "left";
  const nameText = nameInput.value.trim() || "Unnamed Card";
  ctx.fillText(nameText, 163, 150);

  let secondaryFontSize = 42;
  ctx.font = `${secondaryFontSize}px 'Memento'`;
  let textWidth = ctx.measureText(nameText).width;
  const maxWidth = 363;
  const baseY = 331; // default position
  const offsetPerStep = -0.75; // how much lower it moves per shrink step
  let shrinkSteps = 0;
  while (textWidth > maxWidth && secondaryFontSize > 2) {
    secondaryFontSize -= 2;
    shrinkSteps++;
    ctx.font = `${secondaryFontSize}px 'Memento'`;
    textWidth = ctx.measureText(nameText).width;
  }
  const secondaryNameY = baseY + (shrinkSteps * offsetPerStep);
  ctx.textAlign = "center";
  ctx.fillText(nameText, 455, secondaryNameY);

  ctx.font = "33px 'Memento'";
  ctx.textAlign = "left";
  const traitText = traitInput.value.trim() || "—";
  ctx.fillText(traitText, 1306, 147);

  // --- This is your NEW code ---
  const numberSpacing = -5; // Your letter-spacing value
  const numberFont = 'Sv_numbers';
  // --- You can TWEAK these max widths ---
  const costMaxWidth = 95;  // Max width for the Cost circle
  const statMaxWidth = 90;  // Max width for the Atk/Def circles
  // --- NEW: Define specific nudge coefficients ---
  const COST_NUDGE = -0.2;  // Good starting point for 80px font
  const STAT_NUDGE = -0.2;  // Slightly higher for 82px font

  // Draw Cost
  drawScaledNumber(
    costInput.value,
    197, 335,      // X, Y coordinates
    80,             // Max font size
    costMaxWidth,   // Max width
    numberFont,
    numberSpacing,
    COST_NUDGE      // <-- PASSING NEW PARAMETER
  );

  // Draw Atk/Def
  if (typeSelect.value === "Follower") {
    // Attack
    drawScaledNumber(
      attackInput.value,
      201, 922,      // X, Y coordinates
      82,             // Max font size
      statMaxWidth,   // Max width
      numberFont,
      numberSpacing,
      STAT_NUDGE      // <-- PASSING NEW PARAMETER
    );
    // Defense
    drawScaledNumber(
      defenseInput.value,
      642, 917,      // X, Y coordinates
      82,             // Max font size
      statMaxWidth,   // Max width
      numberFont,
      numberSpacing,
      STAT_NUDGE      // <-- PASSING NEW PARAMETER
    );
  }
  ctx.letterSpacing = "0px"; // Reset for all other text!

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

// --- Live updates with Debouncing ---
let redrawDebounceTimer = null;
function debouncedDrawCard() {
  clearTimeout(redrawDebounceTimer);
  redrawDebounceTimer = setTimeout(() => {
    safeDrawCard();
  }, 250); // 250ms delay before redrawing
}

[
  nameInput, traitInput, classSelect, raritySelect, costInput, attackInput, defenseInput,
  tokenCheckbox, wordCountCheckbox,
  ...Object.values(textInputs),
  document.getElementById("illustratorName"),
  document.getElementById("crestName"),
  document.getElementById("faithName")
].forEach(el => el?.addEventListener("input", debouncedDrawCard));

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
    s.tx = (s.maskW - imgW) / 2;
  } else {
    const minX = s.maskW - imgW;
    const maxX = 0;
    if (s.tx < minX) s.tx = minX;
    if (s.tx > maxX) s.tx = maxX;
  }
  if (imgH <= s.maskH) {
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
  window.ICON_W = s.maskW;
  window.ICON_H = s.maskH;
}

function getIconTransform(which) {
  const s = previewState[which];
  if (!s || !s.img) return null;
  return {
    img: s.img,
    scale: s.scale,
    tx: s.tx,
    ty: s.ty,
    width: s.img.width * s.scale,
    height: s.img.height * s.scale
  };
}

function updateAll() {
  clampPan(previewState.main);
  clampPan(previewState.crest);
  clampPan(previewState.faith);

  syncMainToGlobals();
  syncIconToGlobals("crest");
  syncIconToGlobals("faith");

  safeDrawCard();

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


// --- Text Formatting Toolbar (Bold / Italic / Color) ---
// --- Toolbar: Bold / Italic / Color (uses ** / _ / <c> tags) ---
document.querySelectorAll(".text-toolbar button").forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault();
    const format = button.dataset.format;
    const field = button.closest(".field");
    if (!field) return;
    const textarea = field.querySelector("textarea");
    if (!textarea) return;

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const value = textarea.value;
    const selected = value.slice(start, end);

    let openTag = "", closeTag = "";
    if (format === "bold") { openTag = "**"; closeTag = "**"; }
    else if (format === "italic") { openTag = "_"; closeTag = "_"; }
    else if (format === "color") { openTag = "<c>"; closeTag = "</c>"; }
    else return;

    // If text selected -> wrap (toggle removal if already wrapped exactly)
    if (start !== end) {
      const before = value.slice(0, start);
      const after = value.slice(end);
      const currentlyWrapped = before.endsWith(openTag) && after.startsWith(closeTag);
      if (currentlyWrapped) {
        // remove wrapping
        const newBefore = before.slice(0, before.length - openTag.length);
        const newAfter = after.slice(closeTag.length);
        textarea.value = newBefore + selected + newAfter;
        textarea.setSelectionRange(newBefore.length, newBefore.length + selected.length);
      } else {
        // wrap (nesting is allowed)
        textarea.value = before + openTag + selected + closeTag + after;
        // select the inner text (optional); place caret after wrapped text
        textarea.setSelectionRange(start + openTag.length, end + openTag.length);
      }
      textarea.focus();
      textarea.dispatchEvent(new Event("input"));
      return;
    }

    // No selection -> insert open+close and position caret between them
    const before = value.slice(0, start);
    const after = value.slice(start);
    textarea.value = before + openTag + closeTag + after;
    const caret = before.length + openTag.length;
    textarea.setSelectionRange(caret, caret);
    textarea.focus();
    textarea.dispatchEvent(new Event("input"));
  });
});





// initial draw
document.fonts.ready.then(() => setTimeout(updateAll, 60));

/* === High-Quality Download (Lossless PNG) === */
document.getElementById("downloadBtn").addEventListener("click", () => {
  try {
    const canvas = document.getElementById("previewCanvas");
    const link = document.createElement("a");
    link.download = `${(nameInput.value.trim() || "card")}.png`;
    link.href = canvas.toDataURL("image/png", 1.0); // full quality, no compression
    link.click();
  } catch (err) {
    console.error("Download failed:", err);
    alert("Error: Could not save image. Try again.");
  }
});





