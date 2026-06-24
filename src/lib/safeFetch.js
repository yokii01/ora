export async function safeFetch(url, opts = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  
  const abortHandler = () => controller.abort(opts.signal.reason);
  if (opts.signal) {
    if (opts.signal.aborted) throw opts.signal.reason || new DOMException('Aborted', 'AbortError');
    opts.signal.addEventListener('abort', abortHandler);
  }

  const timer = setTimeout(() => controller.abort(new Error("Timeout")), timeoutMs);
  
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    if (!res.ok) throw new Error(`HTTP_${res.status}`);
    return await res.json();
  } catch (err) {
    if (err.message === 'Timeout') {
      const timeoutErr = new Error(`Request timed out after ${timeoutMs}ms`);
      timeoutErr.name = 'TimeoutError';
      throw timeoutErr;
    }
    throw err;
  } finally {
    clearTimeout(timer);
    if (opts.signal) opts.signal.removeEventListener('abort', abortHandler);
  }
}
