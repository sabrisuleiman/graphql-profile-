/**
 * utils.js
 * Shared helper functions used across the application.
 */

/**
 * Format a number into a short human-readable string.
 * e.g. 1500 → "1.5k", 2000000 → "2.0M"
 * @param {number} n
 * @returns {string}
 */
function fmt(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "k";
  return String(n);
}

/**
 * Format an ISO date string into a readable date.
 * e.g. "2021-07-26T13:04:02.301092+00:00" → "26 Jul 2021"
 * @param {string} iso
 * @returns {string}
 */
function fmtDate(iso) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/**
 * Extract a readable project name from a GraphQL path string.
 * e.g. "/madere/div-01/graphql" → "graphql"
 * @param {string} path
 * @returns {string}
 */
function projectName(path) {
  if (!path) return "Unknown";
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] || "Unknown";
}

/**
 * Attach mousemove/mouseleave tooltip behaviour to all elements
 * that have the class "graph-dot".
 * Reads data-label, data-xp, data-date, data-grade attributes.
 */
function addDotTooltips() {
  const tip = document.getElementById("tooltip");
  document.querySelectorAll(".graph-dot").forEach((el) => {
    el.style.cursor = "pointer";

    el.addEventListener("mousemove", (e) => {
      const parts = [
        el.dataset.label,
        el.dataset.xp ? `XP: ${el.dataset.xp}` : null,
        el.dataset.date ? `Date: ${el.dataset.date}` : null,
        el.dataset.grade ? `Grade: ${el.dataset.grade}` : null,
      ].filter(Boolean);

      tip.innerHTML = parts.join("<br>");
      tip.style.opacity = "1";
      tip.style.left = e.clientX + 14 + "px";
      tip.style.top = e.clientY - 10 + "px";
    });

    el.addEventListener("mouseleave", () => {
      tip.style.opacity = "0";
    });
  });
}
