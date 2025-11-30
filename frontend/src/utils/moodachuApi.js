const API_BASE = "http://localhost:3000";

export async function submitProof(pairId, claimedState) {
  const res = await fetch(`${API_BASE}/submit-proof`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pairId, claimedState }),
  });
  return await res.json();
}

export async function fetchPair(pairId) {
  const res = await fetch(`${API_BASE}/pair/${pairId}`);
  return await res.json();
}
