/**
 * app.js
 * Main application orchestrator.
 */

// Use var to avoid re-declaration errors on live-reload
var _data = _data || {};

/* ══════════════════════════════════════════════
   NAVIGATION
══════════════════════════════════════════════ */
document.addEventListener("DOMContentLoaded", function () {
  document.querySelectorAll(".nav-tab").forEach(function (btn) {
    btn.addEventListener("click", function () {
      showPage(btn.dataset.page, btn);
    });
  });

  document
    .getElementById("gql-run-btn")
    .addEventListener("click", runExplorerQuery);

  document
    .getElementById("gql-editor")
    .addEventListener("keydown", function (e) {
      if (e.key === "Tab") {
        e.preventDefault();
        var el = e.target;
        var s = el.selectionStart;
        var end = el.selectionEnd;
        el.value = el.value.substring(0, s) + "  " + el.value.substring(end);
        el.selectionStart = el.selectionEnd = s + 2;
      }
    });
});

function showPage(id, btn) {
  document.querySelectorAll(".page").forEach(function (p) {
    p.classList.remove("active");
  });
  document.querySelectorAll(".nav-tab").forEach(function (t) {
    t.classList.remove("active");
  });
  document.getElementById("page-" + id).classList.add("active");
  btn.classList.add("active");
}

/* ══════════════════════════════════════════════
   DATA LOADING
══════════════════════════════════════════════ */
async function loadAllData() {
  try {
    var results = await Promise.all([
      gql(Q_USER),
      gql(Q_XP),
      gql(Q_AUDITS),
      gql(Q_RESULTS),
      gql(Q_SKILLS),
    ]);

    var userData = results[0];
    var xpData = results[1];
    var auditData = results[2];
    var resultData = results[3];
    var skillData = results[4];

    _data = { userData, xpData, auditData, resultData, skillData };

    renderUserCard(userData, xpData, auditData);
    renderXPCard(xpData);
    renderAuditCard(auditData, resultData);
    renderSkillsCard(skillData);

    renderXPTimeLine(xpData);
    renderAuditDonut(auditData);
    renderSkillGraph(skillData);
    renderPassFail(resultData);
  } catch (err) {
    console.error("Failed to load profile data:", err);
  }
}

/* ══════════════════════════════════════════════
   SECTION 1 — User Identification
══════════════════════════════════════════════ */
function renderUserCard(userData, xpData, auditData) {
  var user = userData.user[0];
  var initials = user.login.slice(0, 2).toUpperCase();
  var totalXP = xpData.transaction.reduce(function (s, t) {
    return s + t.amount;
  }, 0);
  var doneAmt =
    (auditData.auditsDone &&
      auditData.auditsDone.aggregate &&
      auditData.auditsDone.aggregate.sum &&
      auditData.auditsDone.aggregate.sum.amount) ||
    0;
  var recvAmt =
    (auditData.auditsReceived &&
      auditData.auditsReceived.aggregate &&
      auditData.auditsReceived.aggregate.sum &&
      auditData.auditsReceived.aggregate.sum.amount) ||
    0;
  var ratio = recvAmt > 0 ? (doneAmt / recvAmt).toFixed(2) : "∞";

  document.getElementById("user-card").innerHTML =
    '<div class="user-hero">' +
    '<div class="avatar">' +
    initials +
    "</div>" +
    "<div>" +
    '<div class="user-name">' +
    user.login +
    "</div>" +
    '<div class="user-id">ID: ' +
    user.id +
    "</div>" +
    "</div>" +
    "</div>" +
    '<div class="stats-grid" style="margin-top:1.5rem">' +
    '<div class="stat-item"><div class="stat-value">' +
    fmt(totalXP) +
    '</div><div class="stat-label">Total XP</div></div>' +
    '<div class="stat-item"><div class="stat-value">' +
    xpData.transaction.length +
    '</div><div class="stat-label">Transactions</div></div>' +
    '<div class="stat-item"><div class="stat-value">' +
    ratio +
    '</div><div class="stat-label">Audit Ratio</div></div>' +
    "</div>";
}

/* ══════════════════════════════════════════════
   SECTION 2 — XP & Progress
══════════════════════════════════════════════ */
function renderXPCard(xpData) {
  var sorted = xpData.transaction
    .slice()
    .sort(function (a, b) {
      return new Date(b.createdAt) - new Date(a.createdAt);
    })
    .slice(0, 10);

  var rows = sorted
    .map(function (t) {
      return (
        '<li class="tx-item">' +
        '<span class="tx-name">' +
        projectName(t.path) +
        "</span>" +
        '<span class="tx-xp">+' +
        fmt(t.amount) +
        " XP</span>" +
        '<span class="tx-date">' +
        fmtDate(t.createdAt) +
        "</span>" +
        "</li>"
      );
    })
    .join("");

  document.getElementById("xp-card").innerHTML =
    '<div class="card-title"><span class="dot"></span>Recent XP Transactions</div>' +
    '<ul class="tx-list">' +
    rows +
    "</ul>";
}

/* ══════════════════════════════════════════════
   SECTION 3 — Audits
══════════════════════════════════════════════ */
function renderAuditCard(auditData, resultData) {
  var doneAmt =
    (auditData.auditsDone &&
      auditData.auditsDone.aggregate &&
      auditData.auditsDone.aggregate.sum &&
      auditData.auditsDone.aggregate.sum.amount) ||
    0;
  var recvAmt =
    (auditData.auditsReceived &&
      auditData.auditsReceived.aggregate &&
      auditData.auditsReceived.aggregate.sum &&
      auditData.auditsReceived.aggregate.sum.amount) ||
    0;
  var ratio = recvAmt > 0 ? doneAmt / recvAmt : 1;
  var barPct = Math.min(ratio * 50, 100).toFixed(0);

  var passed = resultData.result.filter(function (r) {
    return r.grade >= 1;
  }).length;
  var failed = resultData.result.filter(function (r) {
    return r.grade < 1;
  }).length;

  var recentRows = resultData.result
    .slice(0, 8)
    .map(function (r) {
      var name =
        r.object && r.object.name ? r.object.name : projectName(r.path);
      var badge =
        r.grade >= 1
          ? '<span class="badge badge-pass">PASS</span>'
          : '<span class="badge badge-fail">FAIL</span>';
      return (
        '<div class="audits-row"><span>' + name + "</span>" + badge + "</div>"
      );
    })
    .join("");

  document.getElementById("audit-card").innerHTML =
    '<div class="card-title"><span class="dot"></span>Audit Overview</div>' +
    '<div class="stats-grid">' +
    '<div class="stat-item"><div class="stat-value">' +
    fmt(doneAmt) +
    '</div><div class="stat-label">Audits Done</div></div>' +
    '<div class="stat-item"><div class="stat-value">' +
    fmt(recvAmt) +
    '</div><div class="stat-label">Audits Received</div></div>' +
    '<div class="stat-item"><div class="stat-value">' +
    passed +
    '</div><div class="stat-label">Projects Passed</div></div>' +
    '<div class="stat-item"><div class="stat-value">' +
    failed +
    '</div><div class="stat-label">Projects Failed</div></div>' +
    "</div>" +
    '<div style="margin-top:1.25rem">' +
    '<div style="font-size:0.8rem;color:var(--muted);margin-bottom:0.4rem">Audit ratio: ' +
    ratio.toFixed(2) +
    "</div>" +
    '<div class="ratio-bar"><div class="ratio-bar-inner" id="ratio-bar-fill"></div></div>' +
    "</div>" +
    '<div style="margin-top:1.5rem">' +
    '<div class="card-title" style="margin-bottom:0.8rem"><span class="dot"></span>Recent Results</div>' +
    recentRows +
    "</div>";

  requestAnimationFrame(function () {
    setTimeout(function () {
      var fill = document.getElementById("ratio-bar-fill");
      if (fill) fill.style.width = barPct + "%";
    }, 60);
  });
}

/* ══════════════════════════════════════════════
   GRAPHIQL EXPLORER
══════════════════════════════════════════════ */
async function runExplorerQuery() {
  var query = document.getElementById("gql-editor").value.trim();
  var resultEl = document.getElementById("gql-result");

  if (!query) {
    resultEl.textContent = "// Please enter a query.";
    return;
  }

  resultEl.textContent = "// Running…";

  try {
    var data = await gql(query);
    resultEl.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    resultEl.textContent = "// Error:\n" + err.message;
  }
}
