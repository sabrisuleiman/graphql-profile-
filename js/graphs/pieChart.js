/**
 * pieChart.js (FIXED VERSION)
 * Audit-safe SVG graphs
 */

/* ─────────────────────────────
   GRAPH 1 — AUDIT RATIO DONUT
───────────────────────────── */

function renderAuditDonut(auditData) {
  const container = document.getElementById("graph-audit-ratio");

  const done = Number(auditData?.auditsDone?.aggregate?.sum?.amount || 0);
  const recv = Number(auditData?.auditsReceived?.aggregate?.sum?.amount || 0);

  const total = done + recv;

  if (!total) {
    container.innerHTML = `<div class="loading-text">No audit data</div>`;
    return;
  }

  const ratio = recv ? (done / recv).toFixed(2) : "∞";

  const cx = 115,
    cy = 115,
    R = 82,
    SW = 30;
  const circ = 2 * Math.PI * R;

  const doneFrac = done / total;
  const recvFrac = recv / total;

  const arc = (frac, offsetFrac) => {
    const len = frac * circ;
    const offset = -(offsetFrac * circ);
    return `stroke-dasharray="${len} ${circ}" stroke-dashoffset="${offset}"`;
  };

  container.innerHTML = `
    <svg viewBox="0 0 230 250" xmlns="http://www.w3.org/2000/svg">

      <circle cx="${cx}" cy="${cy}" r="${R}"
              fill="none" stroke="#252b38" stroke-width="${SW}"/>

      <circle cx="${cx}" cy="${cy}" r="${R}"
              fill="none" stroke="#00e5a0" stroke-width="${SW}"
              ${arc(doneFrac, 0)}
              transform="rotate(-90 ${cx} ${cy})"/>

      <circle cx="${cx}" cy="${cy}" r="${R}"
              fill="none" stroke="#7b5ea7" stroke-width="${SW}"
              ${arc(recvFrac, doneFrac)}
              transform="rotate(-90 ${cx} ${cy})"/>

      <text x="${cx}" y="${cy - 12}" text-anchor="middle"
            fill="#fff" font-size="26" font-weight="700">
        ${ratio}
      </text>

      <text x="${cx}" y="${cy + 12}" text-anchor="middle"
            fill="#aaa" font-size="11">Audit Ratio</text>

    </svg>
  `;

  if (typeof fmt === "function") {
    fmt(done);
    fmt(recv);
  }
}

/* ─────────────────────────────
   GRAPH 2 — PASS / FAIL PIE (FIXED)
───────────────────────────── */

function renderPassFail(resultData) {
  const container = document.getElementById("graph-passfail");

  const raw = resultData?.result || [];

  // 1. CLEAN DATA (important for audit correctness)
  const cleaned = raw.filter((r) => r && r.objectId != null && r.grade != null);

  // 2. DEDUPLICATE BY PROJECT (CRITICAL FIX)
  const unique = [...new Map(cleaned.map((r) => [r.objectId, r])).values()];

  const total = unique.length;

  if (!total) {
    container.innerHTML = `<div class="loading-text">No data</div>`;
    return;
  }

  // 3. NORMALIZE GRADE (CRITICAL FIX)
  const passed = unique.filter((r) => Number(r.grade) === 1).length;
  const failed = unique.filter((r) => Number(r.grade) === 0).length;

  // 4. SAFE PERCENTAGES
  const passPct = (passed / total) * 100;
  const failPct = (failed / total) * 100;

  container.innerHTML = `
    <svg viewBox="0 0 260 260" xmlns="http://www.w3.org/2000/svg">

      <circle cx="130" cy="130" r="90"
              fill="none" stroke="#252b38" stroke-width="30"/>

      <!-- PASS -->
      <circle cx="130" cy="130" r="90"
              fill="none" stroke="#00e5a0" stroke-width="30"
              stroke-dasharray="${passPct * 5.65} 565"
              transform="rotate(-90 130 130)"/>

      <!-- FAIL -->
      <circle cx="130" cy="130" r="90"
              fill="none" stroke="#e05a5a" stroke-width="30"
              stroke-dasharray="${failPct * 5.65} 565"
              stroke-dashoffset="-${passPct * 5.65}"
              transform="rotate(-90 130 130)"/>

      <!-- Center text -->
      <text x="130" y="125" text-anchor="middle"
            fill="#fff" font-size="24" font-weight="700">
        ${passPct.toFixed(0)}%
      </text>

      <text x="130" y="145" text-anchor="middle"
            fill="#aaa" font-size="11">
        PASS RATE
      </text>

    </svg>
  `;
}
