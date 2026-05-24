const canvas = document.getElementById("ore-scan");
const ctx = canvas.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isV3 = document.body.classList.contains("v3");

let width = 0;
let height = 0;
let dpr = 1;
let points = [];
let lastTime = 0;
let lastFrameTime = 0;
let patternCanvas = null;
let isScrolling = false;
let scrollTimer = 0;

const frameInterval = reduceMotion ? 160 : 1000 / 24;

const tickerData = {
  NEM: {
    ticker: "NEM",
    company: "Newmont Corporation",
    line: "Gold producer - Nevada, Australia, Canada",
    rating: "Watchlist candidate",
    confidence: "82%",
    project: "8.1",
    dilution: "Low",
    hype: "Neutral",
    catalysts: "3"
  },
  KGC: {
    ticker: "KGC",
    company: "Kinross Gold Corporation",
    line: "Gold producer - Americas and West Africa",
    rating: "High-risk watchlist candidate",
    confidence: "76%",
    project: "7.4",
    dilution: "Moderate",
    hype: "Rising",
    catalysts: "4"
  },
  UUUU: {
    ticker: "UUUU",
    company: "Energy Fuels Inc.",
    line: "Uranium and rare earths - United States",
    rating: "Speculative catalyst candidate",
    confidence: "71%",
    project: "7.8",
    dilution: "Medium",
    hype: "Elevated",
    catalysts: "5"
  }
};

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  width = Math.max(1, Math.floor(rect.width));
  height = Math.max(1, Math.floor(rect.height));
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  createPoints();
  createPatternLayer();
}

function createPoints() {
  const count = width < 720 ? 120 : isV3 ? 280 : 220;
  points = Array.from({ length: count }, (_, index) => {
    const layer = index % 5;
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.18 + Math.random() * 0.38 + layer * 0.028;
    const y = (Math.random() - 0.5) * 0.68;
    const grade = Math.random();
    return { angle, radius, y, layer, grade, pulse: Math.random() * Math.PI * 2 };
  });
}

function scanCenterX() {
  if (width < 720) {
    return width * 0.56;
  }

  return width * (isV3 ? 0.5 : 0.43);
}

function scanCenterY() {
  return height * (isV3 ? 0.44 : 0.42);
}

function scanScale() {
  return Math.min(width, height) * (width < 720 ? 0.68 : isV3 ? 1.02 : 0.86);
}

function projectPoint(point, time) {
  const cx = scanCenterX();
  const cy = scanCenterY();
  const scale = scanScale();
  const spin = time * (isV3 ? 0.00056 : 0.00042);
  const a = point.angle + spin * (1 + point.layer * 0.12);
  const x3 = Math.cos(a) * point.radius;
  const z3 = Math.sin(a) * point.radius;
  const y3 = point.y + Math.sin(a * 2 + point.layer) * 0.035;
  const perspective = 1 / (1.25 + z3);
  return {
    x: cx + x3 * scale * perspective,
    y: cy + y3 * scale * 0.74 * perspective,
    z: z3,
    size: (1.2 + point.grade * 2.6) * perspective,
    glow: point.grade,
    layer: point.layer,
    pulse: point.pulse
  };
}

function drawScanRings(time) {
  const cx = scanCenterX();
  const cy = scanCenterY();
  const base = Math.min(width, height) * (width < 720 ? 0.22 : isV3 ? 0.32 : 0.27);
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time * 0.00032);
  ctx.scale(1.25, 0.52);

  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.ellipse(0, 0, base + i * 46, base + i * 46, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(157, 174, 179, ${0.32 - i * 0.035})`;
    ctx.lineWidth = i === 0 ? 2.2 : 1.35;
    ctx.stroke();
  }

  const sweep = time * 0.00115;
  ctx.beginPath();
  ctx.arc(0, 0, base + 156, sweep - 0.45, sweep + 0.85);
  ctx.strokeStyle = "rgba(207, 134, 78, 0.72)";
  ctx.lineWidth = 5.5;
  ctx.lineCap = "round";
  ctx.shadowColor = "rgba(244, 199, 111, 0.34)";
  ctx.shadowBlur = 18;
  ctx.stroke();

  ctx.restore();
}

function drawOreCore(time) {
  const cx = scanCenterX();
  const cy = scanCenterY();
  const radius = Math.min(width, height) * (width < 720 ? 0.18 : isV3 ? 0.24 : 0.2);
  const spin = time * (isV3 ? 0.00072 : 0.00055);
  const faces = isV3 ? 18 : 14;

  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(spin);
  ctx.scale(1.18, 0.74);

  for (let i = 0; i < faces; i += 1) {
    const a1 = (Math.PI * 2 * i) / faces;
    const a2 = (Math.PI * 2 * (i + 1)) / faces;
    const r1 = radius * (0.72 + 0.22 * Math.sin(i * 1.7));
    const r2 = radius * (0.76 + 0.2 * Math.cos(i * 1.2));
    const shade = 18 + ((i % 4) * 16);

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a1) * r1, Math.sin(a1) * r1);
    ctx.lineTo(Math.cos(a2) * r2, Math.sin(a2) * r2);
    ctx.closePath();
    ctx.fillStyle = `rgba(${shade + 22}, ${shade + 27}, ${shade + 29}, 0.22)`;
    ctx.fill();
    ctx.strokeStyle = "rgba(177, 190, 193, 0.16)";
    ctx.lineWidth = 1;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.moveTo(-radius * 0.82, -radius * 0.1);
  ctx.bezierCurveTo(-radius * 0.18, -radius * 0.24, radius * 0.08, radius * 0.2, radius * 0.72, radius * 0.03);
  ctx.strokeStyle = "rgba(244, 199, 111, 0.7)";
  ctx.lineWidth = 8;
  ctx.shadowColor = "rgba(244, 199, 111, 0.52)";
  ctx.shadowBlur = 22;
  ctx.stroke();

  ctx.restore();
}

function drawTriangleField(targetCtx, time) {
  const size = width < 720 ? 28 : 34;
  const drift = (time * 0.018) % size;

  targetCtx.save();
  targetCtx.globalAlpha = 1;

  for (let y = -size + drift; y < height + size; y += size) {
    for (let x = -size; x < width + size; x += size) {
      const cx = x + size / 2;
      const cy = y + size / 2;
      const dx = (cx - width * 0.52) / width;
      const dy = (cy - height * 0.34) / height;
      const falloff = Math.max(0, 1 - Math.sqrt(dx * dx + dy * dy) * 1.35);
      const shimmer = 0.012 + Math.sin((x + y) * 0.03 + time * 0.0008) * 0.004;
      const alpha = Math.max(0, falloff * 0.075 + shimmer);

      targetCtx.beginPath();
      targetCtx.moveTo(cx, cy + size * 0.26);
      targetCtx.lineTo(cx - size * 0.28, cy - size * 0.22);
      targetCtx.lineTo(cx + size * 0.28, cy - size * 0.22);
      targetCtx.closePath();
      targetCtx.strokeStyle = `rgba(135, 151, 156, ${alpha})`;
      targetCtx.lineWidth = 0.85;
      targetCtx.stroke();

      if ((x / size + y / size) % 7 === 0) {
        targetCtx.fillStyle = `rgba(122, 137, 142, ${alpha * 0.18})`;
        targetCtx.fill();
      }
    }
  }

  targetCtx.restore();
}

function createPatternLayer() {
  patternCanvas = document.createElement("canvas");
  patternCanvas.width = Math.floor(width * dpr);
  patternCanvas.height = Math.floor(height * dpr);

  const patternCtx = patternCanvas.getContext("2d");
  patternCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
  drawTriangleField(patternCtx, 0);
}

function drawPatternLayer() {
  if (patternCanvas) {
    ctx.drawImage(patternCanvas, 0, 0, width, height);
  }
}

function drawOreBody(time) {
  const projected = points.map((point) => projectPoint(point, time));

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (const point of projected) {
    const alpha = Math.max(0.05, 0.26 + point.z * 0.18);
    const isHit = point.glow > 0.92;
    ctx.beginPath();
    ctx.arc(point.x, point.y, isHit ? point.size * 2.25 : point.size * 1.18, 0, Math.PI * 2);
    ctx.fillStyle = isHit
      ? `rgba(244, 199, 111, ${0.72 + Math.sin(time * 0.002 + point.pulse) * 0.18})`
      : `rgba(190, 200, 202, ${alpha + 0.08})`;
    ctx.fill();
  }

  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(166, 181, 184, 0.28)";
  ctx.lineWidth = 1.15;
  for (let i = 0; i < projected.length - 1; i += 5) {
    const a = projected[i];
    const b = projected[(i + 13) % projected.length];
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    if (dx * dx + dy * dy < 26000) {
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }
  }
  ctx.restore();
}

function drawScanBeam(time) {
  const cx = scanCenterX();
  const cy = scanCenterY();
  const radius = Math.min(width, height) * (width < 720 ? 0.45 : isV3 ? 0.68 : 0.54);
  const angle = time * (isV3 ? 0.00175 : 0.00135);
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius * 0.38;

  const gradient = ctx.createLinearGradient(cx - x, cy - y, cx + x, cy + y);
  gradient.addColorStop(0, "rgba(244, 199, 111, 0)");
  gradient.addColorStop(0.48, "rgba(166, 181, 184, 0.04)");
  gradient.addColorStop(0.5, "rgba(244, 199, 111, 0.78)");
  gradient.addColorStop(0.52, "rgba(56, 208, 131, 0.3)");
  gradient.addColorStop(1, "rgba(244, 199, 111, 0)");

  ctx.save();
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - x, cy - y);
  ctx.lineTo(cx + x, cy + y);
  ctx.stroke();
  ctx.restore();
}

function drawOrbitMarkers(time) {
  const cx = scanCenterX();
  const cy = scanCenterY();
  const radius = Math.min(width, height) * (width < 720 ? 0.34 : isV3 ? 0.52 : 0.43);

  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1.25, 0.52);

  for (let i = 0; i < 7; i += 1) {
    const angle = time * 0.00105 + i * ((Math.PI * 2) / 7);
    const r = radius + Math.sin(time * 0.0014 + i) * 22;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    const pulse = 0.75 + Math.sin(time * 0.004 + i) * 0.25;

    ctx.beginPath();
    ctx.arc(x, y, (4 + i % 3) * pulse, 0, Math.PI * 2);
    ctx.fillStyle = i % 3 === 0
      ? `rgba(244, 199, 111, ${0.72 * pulse})`
      : `rgba(155, 172, 176, ${0.42 * pulse})`;
    ctx.shadowColor = "rgba(244, 199, 111, 0.45)";
    ctx.shadowBlur = 18;
    ctx.fill();
  }

  ctx.restore();
}

function render(time) {
  if (!lastTime) {
    lastTime = time;
  }

  if (time - lastFrameTime < frameInterval) {
    requestAnimationFrame(render);
    return;
  }

  lastFrameTime = time;

  const animationTime = time * (reduceMotion ? 0.55 : 1);
  ctx.clearRect(0, 0, width, height);
  drawPatternLayer();

  if (isScrolling) {
    requestAnimationFrame(render);
    return;
  }

  drawScanRings(animationTime);
  drawOreCore(animationTime);
  drawOreBody(animationTime);
  drawScanBeam(animationTime);
  drawOrbitMarkers(animationTime);

  requestAnimationFrame(render);
}

function updatePreview(rawValue) {
  const key = rawValue.trim().toUpperCase() || "NEM";
  const data = tickerData[key] || {
    ticker: key.slice(0, 6),
    company: rawValue.trim() || "Selected Mining Company",
    line: "Junior mining issuer - sources pending",
    rating: "Insufficient evidence",
    confidence: "54%",
    project: "Pending",
    dilution: "Review",
    hype: "Unknown",
    catalysts: "0"
  };

  document.getElementById("scan-ticker").textContent = data.ticker;
  document.getElementById("report-company").textContent = data.company;
  const reportLine = document.querySelector(".report-header span");
  reportLine.textContent = data.line;

  const ratingBlocks = document.querySelectorAll(".rating-row strong");
  ratingBlocks[0].textContent = data.rating;
  ratingBlocks[1].textContent = data.confidence;

  const scoreBlocks = document.querySelectorAll(".score-grid strong");
  scoreBlocks[0].textContent = data.project;
  scoreBlocks[1].textContent = data.dilution;
  scoreBlocks[2].textContent = data.hype;
  scoreBlocks[3].textContent = data.catalysts;
}

document.getElementById("ticker-form").addEventListener("submit", (event) => {
  event.preventDefault();
  const input = document.getElementById("ticker-input");
  updatePreview(input.value);
});

function initWorkflowScrollCards() {
  const cards = document.querySelectorAll(".workflow-grid article");

  if (!cards.length) {
    return;
  }

  if (!("IntersectionObserver" in window)) {
    cards.forEach((card) => card.classList.add("is-scroll-active"));
    return;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      entry.target.classList.toggle("is-scroll-active", entry.isIntersecting);
    });
  }, {
    root: null,
    rootMargin: "-45% 0px -45%",
    threshold: 0
  });

  cards.forEach((card) => observer.observe(card));
}

window.addEventListener("resize", resizeCanvas);
window.addEventListener("scroll", () => {
  isScrolling = true;
  window.clearTimeout(scrollTimer);
  scrollTimer = window.setTimeout(() => {
    isScrolling = false;
  }, 120);
}, { passive: true });
resizeCanvas();
initWorkflowScrollCards();
requestAnimationFrame(render);
