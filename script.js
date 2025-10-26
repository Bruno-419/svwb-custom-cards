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

// --- Crest and Faith icon croppers ---
const crestArtUpload = document.getElementById("crestArtUpload");
const faithArtUpload = document.getElementById("faithArtUpload");

const crestCropModal = document.getElementById("crestCropModal");
const crestCropImage = document.getElementById("crestCropImage");
const crestCropConfirm = document.getElementById("crestCropConfirm");
const crestCropCancel = document.getElementById("crestCropCancel");

const faithCropModal = document.getElementById("faithCropModal");
const faithCropImage = document.getElementById("faithCropImage");
const faithCropConfirm = document.getElementById("faithCropConfirm");
const faithCropCancel = document.getElementById("faithCropCancel");

let crestCropper = null;
let faithCropper = null;

let crestArt = null;
let faithArt = null;

const ICON_W = 56;
const ICON_H = 57;

// --- Art upload & crop ---
const artUpload = document.getElementById("artUpload");
const cropModal = document.getElementById("cropModal");
const cropImage = document.getElementById("cropImage");
const cropConfirm = document.getElementById("cropConfirm");
const cropCancel = document.getElementById("cropCancel");

let uploadedArt = null;
let cropper = null;
const artW = 450;
const artH = 560;
const artX = 200;
const artY = 350;

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

// --- Insert "----------" marker on double line break ---
Object.values(textInputs).forEach((textarea) => {
  textarea.addEventListener("input", () => {
    const cursorPos = textarea.selectionStart;
    const value = textarea.value;
    const before = value.slice(0, cursorPos);
    const after = value.slice(cursorPos);

    // Detect when user just typed "\n\n"
    if (before.endsWith("\n\n")) {
      // Insert "----------" on the previous line
      const newValue = before.slice(0, -1) + "----------\n" + after;
      textarea.value = newValue;
      textarea.selectionStart = textarea.selectionEnd = cursorPos + 10;
    }
  });
});

// --- Show Crest/Faith upload buttons only if those fields have input ---
function toggleIconUploads() {
  const crestHasText = textInputs.crest.value.trim() !== "";
  const faithHasText = textInputs.faith.value.trim() !== "";

  crestArtUpload.style.display = crestHasText ? "block" : "none";
  faithArtUpload.style.display = faithHasText ? "block" : "none";
}

textInputs.crest.addEventListener("input", toggleIconUploads);
textInputs.faith.addEventListener("input", toggleIconUploads);

// --- Draw the box with vertical stretch based on line breaks ---
function drawStretchBox(img, x, y, stretchCount = 0, key = "") {
  const stretchPerBreak = 50;
  const stretchAmount = stretchCount * stretchPerBreak;

  let topHeight = 40;
  let bottomHeight = 40;
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
    0,
    middleStartY,
    img.width,
    middleHeight,
    x,
    y + middleStartY,
    img.width,
    middleHeight + stretchAmount
  );
  ctx.drawImage(
    img,
    0,
    img.height - bottomHeight,
    img.width,
    bottomHeight,
    x,
    y + middleStartY + middleHeight + stretchAmount,
    img.width,
    bottomHeight
  );

  return topHeight + middleHeight + bottomHeight + stretchAmount;
}

// --- Keyword highlighting ---
const HIGHLIGHT_KEYWORDS = [
  "Fanfare", "Last Words", "Engage", "Strike", "Storm", "Ambush",
  "Bane", "Drain", "Ward", "Rush", "Overflow", "Evolve", "Super-Evolve",
  "Spellboost", "Clash", "Mode", "Intimidate", "Aura", "Barrier",
  "Fuse", "Necromancy", "Combo", "Earth Rite", "Rally", "Countdown",
  "Reanimate", "Earth Sigil", "Crystallize", "Invoke", "Invoked", "Sanguine",
  "Skybound Art", "Super Skybound Art", "Maneuver", "Enhance", "Union Burst",
  "Accelerate"
];
const HIGHLIGHT_REGEX = new RegExp(`\\b(${HIGHLIGHT_KEYWORDS.join("|")})\\b`, "g");

// --- Draw text and handle wrapping/stretching ---
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

  // Word wrapping
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
      } else {
        line = testLine;
      }
    }
    wrappedLines.push(line);
  }

  const stretchCount = wrappedLines.length - 1;
  const stretchAmount = stretchable.includes(key) ? stretchCount * 50 : 0;

  let boxHeight = 0;
  if (boxImg) {
    if (stretchable.includes(key)) {
      boxHeight = drawStretchBox(boxImg, x, startY, stretchCount, key);
    } else {
      ctx.drawImage(boxImg, x, startY);
      boxHeight = boxImg.height;
    }
  }

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

    // Draw text (skip drawing if '----------')
    if (line.includes("----------")) {
      ctx.globalAlpha = 0; // hide the dashes visually
    }

    // Highlight and draw text
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

    ctx.globalAlpha = 1; // reset visibility

    // Draw divider ONLY if line contains '----------'
    if (line.includes("----------")) {
      ctx.drawImage(dividerToUse, x, textY + -10);
    }

    textY += lineHeight;
  }

  return Math.max(boxHeight, textY - startY + 40);
}

// --- Crest Cropper ---
crestArtUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    crestCropImage.src = event.target.result;
    crestCropModal.style.display = "block";
  };
  reader.readAsDataURL(file);
});

crestCropImage.onload = () => {
  if (crestCropper) crestCropper.destroy();
  crestCropper = new Cropper(crestCropImage, {
    aspectRatio: ICON_W / ICON_H,
    viewMode: 1,
    autoCropArea: 1,
    cropBoxResizable: false,
    ready() {
      // Create circular crop mask
      const overlay = document.createElement('div');
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.borderRadius = '50%';
      overlay.style.boxShadow = '0 0 0 9999px rgba(0,0,0,0.6)';
      overlay.style.pointerEvents = 'none';
      this.cropper.cropper.querySelector('.cropper-crop-box').appendChild(overlay);
    }
  });
};

crestCropConfirm.addEventListener("click", () => {
  if (!crestCropper) return;
  const croppedCanvas = crestCropper.getCroppedCanvas({ width: ICON_W, height: ICON_H });
  crestArt = new Image();
  crestArt.onload = drawCard;
  crestArt.src = croppedCanvas.toDataURL();
  crestCropper.destroy();
  crestCropper = null;
  crestCropModal.style.display = "none";
});

crestCropCancel.addEventListener("click", () => {
  if (crestCropper) crestCropper.destroy();
  crestCropper = null;
  crestCropModal.style.display = "none";
});

// --- Faith Cropper ---
faithArtUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (event) => {
    faithCropImage.src = event.target.result;
    faithCropModal.style.display = "block";
  };
  reader.readAsDataURL(file);
});

faithCropImage.onload = () => {
  if (faithCropper) faithCropper.destroy();
  faithCropper = new Cropper(faithCropImage, {
    aspectRatio: ICON_W / ICON_H,
    viewMode: 1,
    autoCropArea: 1,
    cropBoxResizable: false,
    ready() {
      const overlay = document.createElement('div');
      overlay.style.position = 'absolute';
      overlay.style.top = '0';
      overlay.style.left = '0';
      overlay.style.width = '100%';
      overlay.style.height = '100%';
      overlay.style.borderRadius = '50%';
      overlay.style.boxShadow = '0 0 0 9999px rgba(0,0,0,0.6)';
      overlay.style.pointerEvents = 'none';
      this.cropper.cropper.querySelector('.cropper-crop-box').appendChild(overlay);
    }
  });
};

faithCropConfirm.addEventListener("click", () => {
  if (!faithCropper) return;
  const croppedCanvas = faithCropper.getCroppedCanvas({ width: ICON_W, height: ICON_H });
  faithArt = new Image();
  faithArt.onload = drawCard;
  faithArt.src = croppedCanvas.toDataURL();
  faithCropper.destroy();
  faithCropper = null;
  faithCropModal.style.display = "none";
});

faithCropCancel.addEventListener("click", () => {
  if (faithCropper) faithCropper.destroy();
  faithCropper = null;
  faithCropModal.style.display = "none";
});

// --- Image Upload & Cropping ---
artUpload.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = (event) => {
    cropImage.src = event.target.result;
    cropModal.style.display = "block";
  };
  reader.readAsDataURL(file);
});

cropImage.onload = () => {
  if (cropper) cropper.destroy();
  cropper = new Cropper(cropImage, {
    aspectRatio: artW / artH,
    viewMode: 1,
    autoCropArea: 1
  });
};

// Confirm crop
cropConfirm.addEventListener("click", () => {
  if (!cropper) return;

  const croppedCanvas = cropper.getCroppedCanvas({ width: artW, height: artH });
  uploadedArt = new Image();
  uploadedArt.onload = drawCard;
  uploadedArt.src = croppedCanvas.toDataURL();

  cropper.destroy();
  cropper = null;
  cropModal.style.display = "none";
});

// Cancel crop
cropCancel.addEventListener("click", () => {
  if (cropper) cropper.destroy();
  cropper = null;
  cropModal.style.display = "none";
});

// --- Draw card ---
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

  // --- Draw full background ---
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  // --- Draw cropped art if available ---
  if (uploadedArt) {
    ctx.drawImage(uploadedArt, artX, artY, artW, artH);
  }

  // --- Define text box position ---
  const textBoxX = 722;
  const textBoxY = 206;
  const textBoxW = 1078; // width of your text_box image
  const textBoxH = 762; // approximate height of your text_box image

  // --- Create blurred background section ---
  const offCanvas = document.createElement("canvas");
  offCanvas.width = textBoxW;
  offCanvas.height = textBoxH;
  const offCtx = offCanvas.getContext("2d");

  // Draw portion of bg to the offscreen canvas
  offCtx.drawImage(
    bg,
    textBoxX, textBoxY, textBoxW, textBoxH,
    0, 0, textBoxW, textBoxH
  );

  // Apply blur filter
  offCtx.filter = "blur(5px)";
  offCtx.drawImage(offCanvas, 0, 0);

  // Draw blurred patch back onto main canvas
  ctx.drawImage(offCanvas, textBoxX, textBoxY);

  // --- Continue drawing the rest of the card normally ---
  ctx.drawImage(gem, 398, 863);
  ctx.drawImage(frame, 48, 153);

  // --- Draw either text_box or text_box_no_bottom ---
  const textBox = await getImage(assets.boxes.text_box);
  const textBoxNoBottom = await getImage(assets.boxes.text_box_no_bottom);
  const illustrator = document.getElementById("illustratorName").value.trim();

  if (wordCountCheckbox.checked || illustrator !== "")
    ctx.drawImage(textBox, textBoxX, textBoxY);
  else ctx.drawImage(textBoxNoBottom, textBoxX, textBoxY);

  // --- Continue with text/boxes/etc ---
  const boxX = 769;
  let currentY = 246;
  const textOrder = [
    { key: "card", box: null },
    { key: "evolve", box: "evolve" },
    { key: "superEvolve", box: "superEvolve" },
    { key: "crest", box: "crest" },
    { key: "faith", box: "faith" }
  ];

  const filledBoxes = textOrder.filter(
    ({ key }) => textInputs[key].value.trim() !== ""
  );

  const GAP = -50;
  for (let i = 0; i < filledBoxes.length; i++) {
    const { key, box } = filledBoxes[i];
    let extraYOffset = 0;
    if (key !== "card") extraYOffset += -10;
    const crestExists = filledBoxes.some((b) => b.key === "crest");
    if (key === "faith" && crestExists) extraYOffset += 5;
    const blockHeight = await drawTextBlock(key, box, boxX, currentY + extraYOffset);
    // --- Inside your filledBoxes loop, after drawing each box ---
    if (key === "crest" && crestArt) {
      const crestCircleX = boxX + 120;  // adjust this to match your green circle
      const crestCircleY = currentY + 22; // adjust until it aligns visually
      ctx.save();
      ctx.beginPath();
      ctx.arc(crestCircleX + ICON_W / 2, crestCircleY + ICON_H / 2, ICON_W / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(crestArt, crestCircleX, crestCircleY, ICON_W, ICON_H);
      ctx.restore();
    }
    if (key === "faith" && faithArt) {
      const faithCircleX = boxX + 120;  // adjust as needed
      const faithCircleY = currentY + 27; // adjust as needed
      ctx.save();
      ctx.beginPath();
      ctx.arc(faithCircleX + ICON_W / 2, faithCircleY + ICON_H / 2, ICON_W / 2, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(faithArt, faithCircleX, faithCircleY, ICON_W, ICON_H);
      ctx.restore();
    }
    currentY += blockHeight + GAP;
  }

  // --- Name / Trait / Cost / Stats ---
  ctx.shadowColor = "black";
  ctx.shadowBlur = 6;
  ctx.font = "56px 'Memento'";
  ctx.textAlign = "left";
  ctx.fillStyle = "#efeee9";
  const nameText = nameInput.value.trim() || "Unnamed Card";
  ctx.fillText(nameText, 163, 150);

  let secondaryFontSize = 42;
  ctx.font = `${secondaryFontSize}px 'Memento'`;
  let textWidth = ctx.measureText(nameText).width;
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
    ctx.fillText("*This is a token card.", 1785, 1025);
  }

  if (illustrator) {
    ctx.font = "28px 'NotoSans'";
    ctx.textAlign = "left";
    ctx.fillText(`Illustrator: ${illustrator}`, 790, 911);
  }

  if (wordCountCheckbox.checked) {
    const allText = Object.values(textInputs)
      .map((t) => t.value)
      .join(" ");
    const wordCount = allText.split(/\s+/).filter((w) => w.length > 0).length;
    ctx.font = "28px 'NotoSans'";
    ctx.textAlign = "right";
    ctx.fillText(`Word count: ${wordCount}`, 1730, 911);
  }

  ctx.shadowColor = "transparent";
  ctx.shadowBlur = 0;
}

// --- Update preview on input ---
[
  nameInput,
  traitInput,
  classSelect,
  raritySelect,
  costInput,
  attackInput,
  defenseInput,
  tokenCheckbox,
  wordCountCheckbox,
  ...Object.values(textInputs),
  document.getElementById("illustratorName")
].forEach((el) => el.addEventListener("input", drawCard));

Object.values(textInputs).forEach((textarea) => {
  textarea.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === "Backspace") {
      requestAnimationFrame(drawCard);
    }
  });
});

document.fonts.ready.then(drawCard);