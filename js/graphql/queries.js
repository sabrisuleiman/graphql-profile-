/**
 * queries.js
 * All GraphQL query strings + the central gql() fetch helper.
 *
 * Query types demonstrated:
 *   1. Normal query    — Q_USER
 *   2. Nested query    — Q_RESULTS (result → object)
 *   3. Argument query  — Q_XP, Q_AUDITS, Q_SKILLS (where / order_by / limit)
 */

var GQL_URL = "https://learn.01founders.co/api/graphql-engine/v1/graphql";

/* ── 1. Normal query ── */
var Q_USER = "{" + "user {" + "id " + "login " + "}" + "}";

/* ── 2. Argument query — XP transactions ── */
var Q_XP =
  "{" +
  "transaction(" +
  'where: { type: { _eq: "xp" } }' +
  "order_by: { createdAt: asc }" +
  ") {" +
  "id " +
  "amount " +
  "createdAt " +
  "path " +
  "objectId " +
  "}" +
  "}";

/* ── 3. Argument query — audit aggregates ── */
var Q_AUDITS =
  "{" +
  'auditsDone: transaction_aggregate(where: { type: { _eq: "up" } }) {' +
  "aggregate { sum { amount } }" +
  "}" +
  'auditsReceived: transaction_aggregate(where: { type: { _eq: "down" } }) {' +
  "aggregate { sum { amount } }" +
  "}" +
  "}";

/* ── 4. Nested query — results with nested object, projects only ── */
var Q_RESULTS =
  "{" +
  "result(" +
  "where: {" +
  "_and: [" +
  '{ object: { type: { _eq: "project" } } },' +
  '{ path: { _nlike: "%piscine%" } }' +
  "]" +
  "}" +
  "order_by: { createdAt: desc }" +
  ") {" +
  "id " +
  "grade " +
  "createdAt " +
  "path " +
  "objectId " +
  "object {" +
  "name " +
  "type " +
  "}" +
  "}" +
  "}";

/* ── 5. Argument query with _like — skills ── */
var Q_SKILLS =
  "{" +
  'transaction(where: { type: { _like: "skill_%" } } order_by: { amount: desc }) {' +
  "type " +
  "amount " +
  "}" +
  "}";

/* ══════════════════════════════════════════════
   GRAPHQL FETCH HELPER
   All API calls go through here.
   JWT is read from window.__JWT set by auth.js.
══════════════════════════════════════════════ */
async function gql(query, variables) {
  variables = variables || {};

  var res = await fetch(GQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + window.__JWT,
    },
    body: JSON.stringify({ query: query, variables: variables }),
  });

  var json = await res.json();
  if (json.errors) throw new Error(json.errors[0].message);
  return json.data;
}
