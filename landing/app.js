const canvas = document.getElementById("ore-scan");
const ctx = canvas.getContext("2d");
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

let width = 0;
let height = 0;
let dpr = 1;
let points = [];
let lastTime = 0;

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
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  width = Math.max(1, Math.floor(rect.width));
  height = Math.max(1, Math.floor(rect.height));
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  createPoints();
}

function createPoints() {
  const count = width < 720 ? 120 : 220;
  points = Array.from({ length: count }, (_, index) => {
    const layer = index % 5;
    const angle = Math.random() * Math.PI * 2;
    const radius = 0.18 + Math.random() * 0.38 + layer * 0.028;
    const y = (Math.random() - 0.5) * 0.68;
    const grade = Math.random();
    return { angle, radius, y, layer, grade, pulse: Math.random() * Math.PI * 2 };
  });
}

function projectPoint(point, time) {
  const cx = width * 0.69;
  const cy = height * 0.43;
  const scale = Math.min(width, height) * 0.72;
  const spin = time * 0.00008;
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
  const cx = width * 0.69;
  const cy = height * 0.43;
  const base = Math.min(width, height) * 0.22;
  ctx.save();
  ctx.translate(cx, cy);
  ctx.rotate(time * 0.000045);
  ctx.scale(1.25, 0.52);

  for (let i = 0; i < 5; i += 1) {
    ctx.beginPath();
    ctx.ellipse(0, 0, base + i * 46, base + i * 46, 0, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(149, 165, 170, ${0.18 - i * 0.018})`;
    ctx.lineWidth = i === 0 ? 1.4 : 1;
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(0, 0, base + 156, -0.4, 0.72);
  ctx.strokeStyle = "rgba(207, 134, 78, 0.46)";
  ctx.lineWidth = 4;
  ctx.stroke();

  ctx.restore();
}

function drawOreBody(time) {
  const projected = points.map((point) => projectPoint(point, time));

  ctx.save();
  ctx.globalCompositeOperation = "lighter";

  for (const point of projected) {
    const alpha = Math.max(0.05, 0.26 + point.z * 0.18);
    const isHit = point.glow > 0.92;
    ctx.beginPath();
    ctx.arc(point.x, point.y, isHit ? point.size * 1.8 : point.size, 0, Math.PI * 2);
    ctx.fillStyle = isHit
      ? `rgba(244, 199, 111, ${0.54 + Math.sin(time * 0.002 + point.pulse) * 0.16})`
      : `rgba(190, 200, 202, ${alpha})`;
    ctx.fill();
  }

  ctx.restore();

  ctx.save();
  ctx.strokeStyle = "rgba(166, 181, 184, 0.18)";
  ctx.lineWidth = 1;
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
  const cx = width * 0.69;
  const cy = height * 0.43;
  const radius = Math.min(width, height) * 0.45;
  const angle = time * 0.00018;
  const x = Math.cos(angle) * radius;
  const y = Math.sin(angle) * radius * 0.38;

  const gradient = ctx.createLinearGradient(cx - x, cy - y, cx + x, cy + y);
  gradient.addColorStop(0, "rgba(244, 199, 111, 0)");
  gradient.addColorStop(0.48, "rgba(166, 181, 184, 0.04)");
  gradient.addColorStop(0.5, "rgba(244, 199, 111, 0.5)");
  gradient.addColorStop(0.52, "rgba(56, 208, 131, 0.2)");
  gradient.addColorStop(1, "rgba(244, 199, 111, 0)");

  ctx.save();
  ctx.strokeStyle = gradient;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - x, cy - y);
  ctx.lineTo(cx + x, cy + y);
  ctx.stroke();
  ctx.restore();
}

function render(time) {
  if (!lastTime) {
    lastTime = time;
  }

  ctx.clearRect(0, 0, width, height);
  drawScanRings(time);
  drawOreBody(time);
  drawScanBeam(time);

  if (!reduceMotion) {
    requestAnimationFrame(render);
  }
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

window.addEventListener("resize", resizeCanvas);
resizeCanvas();
render(0);
if (!reduceMotion) {
  requestAnimationFrame(render);
}
