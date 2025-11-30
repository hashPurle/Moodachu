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

export async function fetchUserByUsername(username) {
  try {
    const res = await fetch(`${API_BASE}/users/username/${encodeURIComponent(username)}`);
    if (!res.ok) {
      const j = await res.json().catch(() => null);
      return { ok: false, error: j ? j.error : `Server returned ${res.status}` };
    }
    const j = await res.json();
    return { ok: true, user: j && j.user ? j.user : null };
  } catch (err) {
    return { ok: false, error: err.message || 'network error' };
  }
}
