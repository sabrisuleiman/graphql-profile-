/**
 * pieChart.js
 * Renders two SVG graphs:
 *   1. Audit Ratio donut chart  → #graph-audit-ratio
 *   2. Pass / Fail ratio chart  → #graph-passfail
 *
 * Both use SVG-only rendering (no canvas, no external libraries).
 */

/* ══════════════════════════════════════════════
   GRAPH 1 — Audit Ratio Donut
   Data: Q_AUDITS (transaction_aggregate)
══════════════════════════════════════════════ */

/**
 * Render an animated donut chart showing audits done vs received.
 * @param {object} auditData - Result of Q_AUDITS.
 */
function renderAuditDonut(auditData) {
  const container = document.getElementById("graph-audit-ratio");

  const done = auditData.auditsDone?.aggregate?.sum?.amount || 0;
  const recv = auditData.auditsReceived?.aggregate?.sum?.amount || 0;
  const total = done + recv;

  if (!total) {
    container.innerHTML =
      '<div class="loading-text">No audit data available.</div>';
    return;
  }

  const ratio = recv > 0 ? (done / recv).toFixed(2) : "∞";
  const cx = 115,
    cy = 115,
    R = 82,
    SW = 30;
  const circ = 2 * Math.PI * R;

  const doneFrac = done / total;
  const recvFrac = recv / total;

  // SVG arc helper: returns stroke-dasharray + dashoffset for a fraction of the circle
  const arc = (frac, offsetFrac) => {
    const len = (frac * circ).toFixed(2);
    const offset = -(offsetFrac * circ).toFixed(2);
    return `stroke-dasharray="${len} ${circ.toFixed(2)}"
            stroke-dashoffset="${offset}"`;
  };

  container.innerHTML = `
    <svg viewBox="0 0 230 250" xmlns="http://www.w3.org/2000/svg"
         style="width:100%;max-width:300px;display:block;margin:0 auto"
         role="img" aria-label="Audit ratio donut chart">

      <!-- Background ring -->
      <circle cx="${cx}" cy="${cy}" r="${R}"
              fill="none" stroke="#252b38" stroke-width="${SW}"/>

      <!-- Done (green) segment — animated -->
      <circle cx="${cx}" cy="${cy}" r="${R}"
              fill="none" stroke="#00e5a0" stroke-width="${SW}"
              ${arc(doneFrac, 0)}
              transform="rotate(-90 ${cx} ${cy})">
        <animate attributeName="stroke-dasharray"
                 from="0 ${circ.toFixed(2)}"
                 to="${(doneFrac * circ).toFixed(2)} ${circ.toFixed(2)}"
                 dur="1s" fill="freeze"/>
      </circle>

      <!-- Received (purple) segment -->
      <circle cx="${cx}" cy="${cy}" r="${R}"
              fill="none" stroke="#7b5ea7" stroke-width="${SW}"
              ${arc(recvFrac, doneFrac)}
              transform="rotate(-90 ${cx} ${cy})">
        <animate attributeName="stroke-dasharray"
                 from="0 ${circ.toFixed(2)}"
                 to="${(recvFrac * circ).toFixed(2)} ${circ.toFixed(2)}"
                 dur="1s" begin="0.5s" fill="freeze"/>
      </circle>

      <!-- Centre text -->
      <text x="${cx}" y="${cy - 12}" text-anchor="middle"
            fill="#e8eaf0" font-size="28" font-weight="700">${ratio}</text>
      <text x="${cx}" y="${cy + 12}" text-anchor="middle"
            fill="#6b7280" font-size="11">Audit Ratio</text>

      <!-- Legend -->
      <rect x="16" y="202" width="13" height="13" rx="3" fill="#00e5a0"/>
      <text x="34" y="213" fill="#9ca3af" font-size="11">Done (${fmt(done)})</text>

      <rect x="120" y="202" width="13" height="13" rx="3" fill="#7b5ea7"/>
      <text x="138" y="213" fill="#9ca3af" font-size="11">Received (${fmt(recv)})</text>
    </svg>`;
}

/* ══════════════════════════════════════════════
   GRAPH 2 — Pass / Fail Ratio (Bonus)
   Data: Q_RESULTS (result with nested object)
══════════════════════════════════════════════ */

/**
 * Render a pass/fail summary bar + per-project colour-coded strip.
 * @param {object} resultData - Result of Q_RESULTS.
 */
function renderPassFail(resultData) {
  const container = document.getElementById("graph-passfail");

  const results = resultData.result;
  if (!results.length) {
    container.innerHTML =
      '<div class="loading-text">No result data available.</div>';
    return;
  }

  const passed = results.filter((r) => r.grade >= 1).length;
  const failed = results.filter((r) => r.grade < 1).length;
  const total = passed + failed;
  const pct = passed / total;

  const W = 620;
  const BAR_W = W - 120;
  const X = 60;

  // Per-project mini bars (most recent 24)
  const slice = results.slice(0, 24);
  const barW = ((W - 40) / slice.length - 2).toFixed(1);

  const projBars = slice
    .map((r, i) => {
      const col = r.grade >= 1 ? "#00e5a0" : "#e05a5a";
      const name = r.object?.name || projectName(r.path);
      const grade = r.grade >= 1 ? "PASS" : "FAIL";
      return `
      <rect
        x="${(20 + i * (parseFloat(barW) + 2)).toFixed(1)}" y="20"
        width="${barW}" height="40" rx="3"
        fill="${col}" opacity="0.85"
        class="graph-dot"
        data-label="${name}"
        data-grade="${grade}">
        <animate attributeName="height" from="0" to="40"
                 dur="0.4s" begin="${(i * 0.03).toFixed(2)}s" fill="freeze"/>
        <animate attributeName="y"      from="60" to="20"
                 dur="0.4s" begin="${(i * 0.03).toFixed(2)}s" fill="freeze"/>
      </rect>`;
    })
    .join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${W} 170" xmlns="http://www.w3.org/2000/svg"
         style="width:100%" role="img" aria-label="Pass and fail ratio chart">

      <!-- Summary bar track -->
      <rect x="${X}" y="10" width="${BAR_W}" height="30" rx="7" fill="#252b38"/>

      <!-- Pass fill — animated -->
      <rect x="${X}" y="10" width="0" height="30" rx="7" fill="#00e5a0">
        <animate attributeName="width"
                 from="0" to="${(pct * BAR_W).toFixed(1)}"
                 dur="1s" fill="freeze" calcMode="spline"
                 keySplines="0.4 0 0.2 1"/>
      </rect>

      <!-- Summary labels -->
      <text x="${(X + (pct * BAR_W) / 2).toFixed(1)}" y="30"
            text-anchor="middle" fill="#0b0e14"
            font-size="12" font-weight="700">${passed} PASS</text>
      <text x="${(X + pct * BAR_W + ((1 - pct) * BAR_W) / 2).toFixed(1)}" y="30"
            text-anchor="middle" fill="#e8eaf0"
            font-size="12" font-weight="700">${failed} FAIL</text>

      <!-- Pass rate label -->
      <text x="${X}" y="56" fill="#6b7280" font-size="10">
        ${(pct * 100).toFixed(0)}% pass rate · ${total} projects
      </text>

      <!-- Recent projects strip header -->
      <text x="20" y="84" fill="#4b5563" font-size="10"
            font-family="Space Mono, monospace">RECENT PROJECTS</text>

      <!-- Per-project bars -->
      <g transform="translate(0,90)">${projBars}</g>
    </svg>`;

  addDotTooltips();
}
