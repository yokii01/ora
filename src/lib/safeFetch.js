export async function safeFetch(url, opts = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return await res.json();
  } finally {
    clearTimeout(timer);
  }
}
