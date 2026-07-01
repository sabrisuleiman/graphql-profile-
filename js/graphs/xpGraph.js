/**
 * xpGraph.js
 * Renders the "XP Earned Over Time" cumulative line chart using SVG.
 *
 * Graph type : Line chart (cumulative)
 * Data source: Q_XP — transaction(where: { type: { _eq: "xp" } })
 */

/**
 * Render the XP-over-time line graph into #graph-xp-time.
 * @param {object} xpData - Result of the Q_XP query.
 */
function renderXPTimeLine(xpData) {
  const container = document.getElementById("graph-xp-time");

  const txs = [...xpData.transaction].sort(
    (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
  );

  if (!txs.length) {
    container.innerHTML =
      '<div class="loading-text">No XP data available.</div>';
    return;
  }

  // Build cumulative XP data points
  let cumulative = 0;
  const points = txs.map((t) => {
    cumulative += t.amount;
    return {
      date: new Date(t.createdAt),
      xp: cumulative,
      label: projectName(t.path),
      raw: t.amount,
    };
  });

  // ── Layout constants ──
  const W = 700,
    H = 270;
  const PL = 64,
    PR = 20,
    PT = 24,
    PB = 44;
  const cW = W - PL - PR;
  const cH = H - PT - PB;

  const minT = points[0].date.getTime();
  const maxT = points[points.length - 1].date.getTime();
  const maxXP = points[points.length - 1].xp;

  // Map data → SVG coordinates
  const px = (p) => PL + ((p.date.getTime() - minT) / (maxT - minT || 1)) * cW;
  const py = (p) => PT + cH - (p.xp / maxXP) * cH;

  // ── SVG path strings ──
  const pathD = points
    .map(
      (p, i) => `${i === 0 ? "M" : "L"}${px(p).toFixed(1)},${py(p).toFixed(1)}`,
    )
    .join(" ");

  const areaD =
    pathD +
    ` L${px(points[points.length - 1]).toFixed(1)},${PT + cH}` +
    ` L${PL},${PT + cH} Z`;

  // ── Y-axis ticks ──
  const yTicks = [0, 0.25, 0.5, 0.75, 1]
    .map((f) => {
      const v = Math.round(maxXP * f);
      const y = PT + cH - f * cH;
      return `
        <line x1="${PL}" y1="${y}" x2="${W - PR}" y2="${y}"
              stroke="#252b38" stroke-width="1" stroke-dasharray="4 4"/>
        <text x="${PL - 8}" y="${y + 4}" text-anchor="end"
              fill="#4b5563" font-size="10">${fmt(v)}</text>`;
    })
    .join("");

  // ── X-axis labels (up to 6 evenly spaced) ──
  const step = Math.max(1, Math.floor(points.length / 5));
  const xLabels = points
    .filter((_, i) => i % step === 0 || i === points.length - 1)
    .map(
      (p) => `
      <text x="${px(p)}" y="${H - 8}" text-anchor="middle"
            fill="#4b5563" font-size="10">
        ${p.date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" })}
      </text>`,
    )
    .join("");

  // ── Interactive dots at sampled positions ──
  const dots = points
    .filter((_, i) => i % step === 0 || i === points.length - 1)
    .map(
      (p) => `
      <circle
        cx="${px(p).toFixed(1)}" cy="${py(p).toFixed(1)}"
        r="5" fill="var(--accent)" stroke="var(--card)" stroke-width="2"
        class="graph-dot"
        data-label="${p.label}"
        data-xp="${fmt(p.xp)}"
        data-date="${fmtDate(p.date.toISOString())}"/>`,
    )
    .join("");

  // ── Animated path length trick ──
  const totalLength = points
    .reduce((sum, p, i) => {
      if (i === 0) return 0;
      const prev = points[i - 1];
      const dx = px(p) - px(prev);
      const dy = py(p) - py(prev);
      return sum + Math.sqrt(dx * dx + dy * dy);
    }, 0)
    .toFixed(0);

  container.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
         style="width:100%;overflow:visible" role="img"
         aria-label="Cumulative XP over time line chart">
      <defs>
        <linearGradient id="xpAreaGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%"   stop-color="#00e5a0" stop-opacity="0.28"/>
          <stop offset="100%" stop-color="#00e5a0" stop-opacity="0"/>
        </linearGradient>
      </defs>

      <!-- Grid & axes -->
      ${yTicks}
      <line x1="${PL}" y1="${PT}" x2="${PL}" y2="${PT + cH}"
            stroke="#252b38" stroke-width="1"/>

      <!-- Area fill -->
      <path d="${areaD}" fill="url(#xpAreaGrad)"/>

      <!-- Line -->
      <path d="${pathD}" fill="none" stroke="#00e5a0" stroke-width="2.2"
            stroke-linejoin="round" stroke-linecap="round"
            stroke-dasharray="${totalLength}" stroke-dashoffset="${totalLength}">
        <animate attributeName="stroke-dashoffset"
                 from="${totalLength}" to="0"
                 dur="1.4s" fill="freeze" calcMode="spline"
                 keySplines="0.4 0 0.2 1"/>
      </path>

      <!-- Interactive dots -->
      ${dots}

      <!-- X labels -->
      ${xLabels}

      <!-- Y axis label -->
      <text x="${PL + 4}" y="${PT - 8}" fill="#4b5563" font-size="10">XP (cumulative)</text>
    </svg>`;

  addDotTooltips();
}
