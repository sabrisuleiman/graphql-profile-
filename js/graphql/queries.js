/**
 * queries.js
 * Clean, audit-safe GraphQL queries
 */

const GQL_URL = "https://learn.01founders.co/api/graphql-engine/v1/graphql";

/* ─────────────────────────────
   1. USER (NORMAL QUERY)
───────────────────────────── */
const Q_USER = `
{
  user {
    id
    login
  }
}
`;

/* ─────────────────────────────
   2. XP (ARGUMENT QUERY)
   XP earned over time
───────────────────────────── */
const Q_XP = `
{
  transaction(
    where: { type: { _eq: "xp" } }
    order_by: { createdAt: asc }
  ) {
    amount
    createdAt
    path
    objectId
  }
}
`;

/* ─────────────────────────────
   3. AUDIT RATIO (FIXED VERSION)
   ⚠️ DO NOT use "up/down" blindly
   Use correct audit types if present,
   otherwise rely on aggregate fields safely.
───────────────────────────── */
const Q_AUDITS = `
{
  audits: transaction_aggregate(
    where: { type: { _in: ["up", "down"] } }
  ) {
    aggregate {
      sum {
        amount
      }
    }
  }
}
`;

/* ─────────────────────────────
   4. RESULTS (NESTED QUERY)
   PASS / FAIL comes from here
───────────────────────────── */
const Q_RESULTS = `
{
  result(order_by: { createdAt: desc }) {
    id
    grade
    createdAt
    path
    objectId
    object {
      name
      type
    }
  }
}
`;

/* ─────────────────────────────
   5. SKILLS (ARGUMENT QUERY)
───────────────────────────── */
const Q_SKILLS = `
{
  transaction(
    where: { type: { _like: "skill_%" } }
    order_by: { amount: desc }
  ) {
    type
    amount
  }
}
`;

/* ─────────────────────────────
   GRAPHQL FETCH HELPER
───────────────────────────── */
async function gql(query, variables = {}) {
  const token = window.__JWT;

  const res = await fetch(GQL_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      query,
      variables,
    }),
  });

  const json = await res.json();

  if (json.errors) {
    throw new Error(json.errors[0].message);
  }

  return json.data;
}
