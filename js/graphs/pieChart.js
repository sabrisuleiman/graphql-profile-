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
  const pctLabel = (pct * 100).toFixed(0) + "%";

  // ── Donut geometry ──
  const cx = 200,
    cy = 200,
    R = 150,
    SW = 40;
  const circ = 2 * Math.PI * R;

  const passFrac = passed / total;
  const failFrac = failed / total;

  const passLen = (passFrac * circ).toFixed(2);
  const failLen = (failFrac * circ).toFixed(2);
  // fail segment starts where pass ends
  const failOffset = (-(passFrac * circ)).toFixed(2);

  // ── Per-project mini bars below ──
  const slice = results.slice(0, 30);
  const totalW = 380;
  const barW = ((totalW - 10) / slice.length - 2).toFixed(1);
  const startX = (400 - totalW) / 2; // centre the strip

  const projBars = slice
    .map((r, i) => {
      const col = r.grade >= 1 ? "#00e5a0" : "#e05a5a";
      const name =
        r.object && r.object.name ? r.object.name : projectName(r.path);
      const grade = r.grade >= 1 ? "PASS" : "FAIL";
      const x = (startX + i * (parseFloat(barW) + 2)).toFixed(1);
      return `<rect x="${x}" y="0" width="${barW}" height="28" rx="3"
      fill="${col}" opacity="0.85" class="graph-dot"
      data-label="${name}" data-grade="${grade}">
      <animate attributeName="height" from="0" to="28"
               dur="0.35s" begin="${(i * 0.025).toFixed(3)}s" fill="freeze"/>
    </rect>`;
    })
    .join("");

  container.innerHTML = `
    <svg viewBox="0 0 400 480" xmlns="http://www.w3.org/2000/svg"
         style="width:100%;max-width:420px;display:block;margin:0 auto"
         role="img" aria-label="Pass and fail ratio donut chart">

      <!-- Background ring -->
      <circle cx="${cx}" cy="${cy}" r="${R}"
              fill="none" stroke="#252b38" stroke-width="${SW}"/>

      <!-- PASS segment (green) — animated from top -->
      <circle cx="${cx}" cy="${cy}" r="${R}"
              fill="none" stroke="#00e5a0" stroke-width="${SW}"
              stroke-dasharray="0 ${circ.toFixed(2)}"
              stroke-dashoffset="0"
              transform="rotate(-90 ${cx} ${cy})">
        <animate attributeName="stroke-dasharray"
                 from="0 ${circ.toFixed(2)}"
                 to="${passLen} ${circ.toFixed(2)}"
                 dur="1.2s" fill="freeze" calcMode="spline"
                 keySplines="0.4 0 0.2 1"/>
      </circle>

      <!-- FAIL segment (red) — starts after pass -->
      <circle cx="${cx}" cy="${cy}" r="${R}"
              fill="none" stroke="#e05a5a" stroke-width="${SW}"
              stroke-dasharray="${failLen} ${circ.toFixed(2)}"
              stroke-dashoffset="${failOffset}"
              transform="rotate(-90 ${cx} ${cy})">
        <animate attributeName="stroke-dasharray"
                 from="0 ${circ.toFixed(2)}"
                 to="${failLen} ${circ.toFixed(2)}"
                 dur="1.2s" begin="1s" fill="freeze"/>
      </circle>

      <!-- Centre percentage -->
      <text x="${cx}" y="${cy - 18}" text-anchor="middle"
            fill="#e8eaf0" font-size="52" font-weight="700"
            font-family="Space Mono, monospace">${pctLabel}</text>
      <text x="${cx}" y="${cy + 18}" text-anchor="middle"
            fill="#6b7280" font-size="14" letter-spacing="3"
            font-family="Space Mono, monospace">PASS RATE</text>

      <!-- Legend -->
      <rect x="100" y="370" width="14" height="14" rx="3" fill="#00e5a0"/>
      <text x="120" y="382" fill="#9ca3af" font-size="13"
            font-family="Space Mono, monospace">PASS (${passed})</text>

      <rect x="230" y="370" width="14" height="14" rx="3" fill="#e05a5a"/>
      <text x="250" y="382" fill="#9ca3af" font-size="13"
            font-family="Space Mono, monospace">FAIL (${failed})</text>

      <!-- Per-project strip -->
      <text x="${startX}" y="410" fill="#4b5563" font-size="9"
            font-family="Space Mono, monospace" letter-spacing="1">PROJECTS</text>
      <g transform="translate(0, 418)">${projBars}</g>
    </svg>`;

  addDotTooltips();
}
