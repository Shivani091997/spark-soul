// Shared helpers for the shop and admin pages.
(function () {
  const cfg = window.SITE_CONFIG || {};

  const isConfigured = Boolean(
    cfg.supabaseUrl && cfg.supabaseKey && window.supabase && window.supabase.createClient
  );

  const db = isConfigured ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey) : null;

  function escapeHtml(str) {
    return String(str ?? "").replace(/[&<>"']/g, (c) => ({
      "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    })[c]);
  }

  function formatPrice(value) {
    const n = Number(value) || 0;
    const formatted = n.toLocaleString("en-IN", {
      minimumFractionDigits: n % 1 ? 2 : 0,
      maximumFractionDigits: 2,
    });
    return `${cfg.currency || "₹"}${formatted}`;
  }

  function waLink(message) {
    const number = String(cfg.whatsappNumber || "").replace(/\D/g, "");
    const text = message ? `?text=${encodeURIComponent(message)}` : "";
    return `https://wa.me/${number}${text}`;
  }

  // Illustrated placeholder for products without a photo yet (and the sample products).
  // Hair accessories get a scrunchie; everything else gets a beaded sling.
  const BACKS = ["#F6D2CF", "#FBE7A6", "#E9E4C8", "#F2DCC9", "#F8E1E5", "#EFE6D2"];
  const COLORS = ["#C2405A", "#F8CF2C", "#4A4419", "#E7899B", "#6E0B12", "#FBF6EC"];
  function placeholderImage(seed, label, category = "") {
    let h = 0;
    for (const ch of String(seed)) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
    const back = BACKS[h % BACKS.length];
    const main = COLORS[(h * 7) % 5];
    let art = "";
    if (/hair/i.test(category)) {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        art += `<circle cx="${(200 + Math.cos(a) * 80).toFixed(1)}" cy="${(190 + Math.sin(a) * 80).toFixed(1)}" r="44"/>`;
      }
      art = `<g fill="${main}" stroke="#1E1B16" stroke-width="4">${art}</g><circle cx="200" cy="190" r="42" fill="${back}" stroke="#1E1B16" stroke-width="4"/>`;
    } else {
      for (let i = 0; i <= 16; i++) {
        const t = i / 16;
        const x = 70 + 260 * t;
        const y = 70 + Math.sin(t * Math.PI) * 230;
        art += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${i % 4 === 2 ? 17 : 12}" fill="${COLORS[(i + h) % COLORS.length]}" stroke="#1E1B16" stroke-width="3.5"/>`;
      }
      art = `<rect x="148" y="250" width="104" height="70" rx="14" fill="${main}" stroke="#1E1B16" stroke-width="4"/>` + art;
    }
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
      <rect width="400" height="400" fill="${back}"/>${art}
      <text x="200" y="372" text-anchor="middle" font-family="Georgia, serif" font-style="italic" font-size="22" fill="#1E1B16" opacity=".7">${escapeHtml(label || "")}</text></svg>`;
    return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
  }

  window.SSS = { cfg, db, isConfigured, escapeHtml, formatPrice, waLink, placeholderImage };
})();
