/**
 * skillGraph.js
 * Renders two skill visualisations:
 *   1. SVG horizontal bar chart → #graph-skills  (Statistics page)
 *   2. Animated skill bars      → #skills-card   (Profile page, bonus section)
 *
 * Data source: Q_SKILLS — transaction(where: { type: { _like: "skill_%" } })
 */

/* ══════════════════════════════════════════════
   GRAPH 3 — Skills Horizontal Bar Chart (SVG)
   Shown on the Statistics page.
══════════════════════════════════════════════ */

/**
 * Render an SVG horizontal bar chart of top skills.
 * @param {object} skillData - Result of Q_SKILLS.
 */
function renderSkillGraph(skillData) {
  const container = document.getElementById("graph-skills");

  // Deduplicate: keep the highest value seen per skill type
  const map = {};
  for (const t of skillData.transaction) {
    if (!map[t.type] || map[t.type] < t.amount) map[t.type] = t.amount;
  }

  const sorted = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (!sorted.length) {
    container.innerHTML =
      '<div class="loading-text">No skill data available.</div>';
    return;
  }

  const maxVal = sorted[0][1];
  const ROW_H = 34;
  const W = 340;
  const H = sorted.length * ROW_H + 16;
  const LABEL_W = 116;
  const BAR_MAX = W - LABEL_W - 52; // space for value label

  const bars = sorted
    .map(([type, amount], i) => {
      const name = type.replace("skill_", "").replace(/_/g, " ");
      const barW = ((amount / maxVal) * BAR_MAX).toFixed(1);
      const y = i * ROW_H + 8;
      const delay = (i * 0.07).toFixed(2);
      const colour = i % 2 === 0 ? "#00e5a0" : "#7b5ea7";

      return `
      <!-- Row ${i}: ${name} -->
      <text x="${LABEL_W - 6}" y="${y + 15}" text-anchor="end"
            fill="#9ca3af" font-size="11" text-transform="capitalize">${name}</text>

      <!-- Bar background -->
      <rect x="${LABEL_W}" y="${y + 4}" width="${BAR_MAX}" height="18" rx="4"
            fill="#252b38"/>

      <!-- Bar fill — animated -->
      <rect x="${LABEL_W}" y="${y + 4}" width="0" height="18" rx="4"
            fill="${colour}" opacity="0.9"
            class="graph-dot"
            data-label="${name}" data-xp="${amount}%">
        <animate attributeName="width"
                 from="0" to="${barW}"
                 dur="0.7s" begin="${delay}s" fill="freeze"
                 calcMode="spline" keySplines="0.4 0 0.2 1"/>
      </rect>

      <!-- Value label -->
      <text x="${LABEL_W + parseFloat(barW) + 6}" y="${y + 16}"
            fill="#6b7280" font-size="10">${amount}%</text>`;
    })
    .join("");

  container.innerHTML = `
    <svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg"
         style="width:100%;overflow:visible"
         role="img" aria-label="Top skills bar chart">
      ${bars}
    </svg>`;

  addDotTooltips();
}

/* ══════════════════════════════════════════════
   PROFILE SECTION 4 — Animated Skill Bars
   Shown on the Profile page as a bonus section.
══════════════════════════════════════════════ */

/**
 * Render animated CSS progress bars for the skills section
 * in the profile page (#skills-card).
 * @param {object} skillData - Result of Q_SKILLS.
 */
function renderSkillsCard(skillData) {
  const container = document.getElementById("skills-card");

  const map = {};
  for (const t of skillData.transaction) {
    if (!map[t.type] || map[t.type] < t.amount) map[t.type] = t.amount;
  }

  const sorted = Object.entries(map)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  if (!sorted.length) {
    container.innerHTML =
      '<div class="loading-text">No skill data available.</div>';
    return;
  }

  const max = sorted[0][1];
  const rows = sorted
    .map(([type, amount]) => {
      const name = type.replace("skill_", "").replace(/_/g, " ");
      const pct = Math.round((amount / max) * 100);
      return `
      <div class="skill-row">
        <span class="skill-name">${name}</span>
        <div class="skill-bar-bg">
          <div class="skill-bar-fill" data-pct="${pct}"></div>
        </div>
        <span class="skill-pct">${amount}%</span>
      </div>`;
    })
    .join("");

  container.innerHTML = `
    <div class="card-title"><span class="dot"></span>Top Skills</div>
    ${rows}`;

  // Trigger CSS transitions after a brief paint delay
  requestAnimationFrame(() => {
    setTimeout(() => {
      container.querySelectorAll(".skill-bar-fill").forEach((el) => {
        el.style.width = el.dataset.pct + "%";
      });
    }, 60);
  });
}
