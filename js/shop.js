// Products section: loads products, draws the cards, filters, the product popup and WhatsApp links.
(function () {
  const { cfg, db, isConfigured, escapeHtml, formatPrice, waLink, placeholderImage } = window.SSS;

  const SAMPLE_PRODUCTS = [
    { id: "s1", name: "Boho Beaded Sling", category: "Mobile Slings", price: 449, in_stock: true,
      description: "Hand-strung beads on an adjustable crossbody strap. Fits most phone cases." },
    { id: "s2", name: "Pastel Pearl Sling", category: "Mobile Slings", price: 499, in_stock: true,
      description: "Soft pastel beads with faux pearls." },
    { id: "s3", name: "Sunny Bead Strap", category: "Mobile Slings", price: 399, in_stock: false,
      description: "Bright yellow and maroon beads, short wrist strap." },
    { id: "s4", name: "Floral Scrunchie", category: "Hair Accessories", price: 149, in_stock: true,
      description: "Soft satin scrunchie in a floral print." },
    { id: "s5", name: "Blush Scrunchie Set", category: "Hair Accessories", price: 249, in_stock: true,
      description: "Set of three scrunchies in blush tones." },
    { id: "s6", name: "Olive Velvet Scrunchie", category: "Hair Accessories", price: 179, in_stock: true,
      description: "Velvet scrunchie in deep olive." },
  ];

  const state = { products: [], category: "All" };
  const grid = document.getElementById("productGrid");
  const filtersEl = document.getElementById("filters");
  const modal = document.getElementById("productModal");

  // ---- Links from settings ----
  const hello = `Hi ${cfg.businessName}! I'd love to know more about your handmade pieces.`;
  document.querySelectorAll("[data-wa]").forEach((el) => el.setAttribute("href", waLink(hello)));
  document.querySelectorAll("[data-instagram]").forEach((el) => {
    if (cfg.instagram) el.setAttribute("href", cfg.instagram);
    else el.remove();
  });
  document.getElementById("year").textContent = new Date().getFullYear();

  // up to 3 photos per product (older products have just image_url)
  const photos = (p) => {
    if (Array.isArray(p.images) && p.images.length) return p.images.map((i) => i && i.url).filter(Boolean);
    return p.image_url ? [p.image_url] : [];
  };
  const image = (p) => photos(p)[0] || placeholderImage(p.id, p.name, p.category);
  const bulkLine = (p) => (p.bulk_price != null ? `${formatPrice(p.bulk_price)} each for ${p.bulk_min || 12}+ pieces` : "");
  const bulkText = (p) => `Hi ${cfg.businessName}! I'd like a bulk order of "${p.name}" (${p.bulk_min || 12}+ pieces). Please share the details.`;
  const pageLink = (p) => `${location.origin}${location.pathname}#p-${p.id}`;
  const orderText = (p) => p.in_stock
    ? `Hi ${cfg.businessName}! I'd like to order:\n\n*${p.name}*\nPrice: ${formatPrice(p.price)}\n${pageLink(p)}\n\nPlease share availability and delivery details.`
    : `Hi ${cfg.businessName}! Will "${p.name}" be back in stock?`;

  async function loadProducts() {
    if (!isConfigured) {
      document.getElementById("demoNotice").hidden = false;
      return SAMPLE_PRODUCTS;
    }
    const { data, error } = await db
      .from("products")
      .select("*")
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  }

  function renderFilters() {
    const cats = ["All", ...new Set(state.products.map((p) => p.category).filter(Boolean))];
    filtersEl.hidden = cats.length <= 2;
    filtersEl.innerHTML = cats.map((c) =>
      `<button class="chip" role="tab" aria-selected="${c === state.category}" data-cat="${escapeHtml(c)}">${escapeHtml(c)}</button>`).join("");
  }

  function renderGrid() {
    const list = state.category === "All" ? state.products : state.products.filter((p) => p.category === state.category);
    grid.innerHTML = list.length ? list.map((p) => `
      <article class="card${p.in_stock ? "" : " is-sold"}">
        <button class="card__media" data-open="${escapeHtml(p.id)}" aria-label="View ${escapeHtml(p.name)}">
          <img src="${escapeHtml(image(p))}" alt="${escapeHtml(p.name)}" loading="lazy" />
          ${photos(p)[1] ? `<img class="card__img2" src="${escapeHtml(photos(p)[1])}" alt="" loading="lazy" />` : ""}
          ${p.in_stock ? "" : `<span class="card__badge">Sold out</span>`}
          <span class="card__view">Quick view</span>
        </button>
        <div class="card__body">
          <h3 class="card__name"><button data-open="${escapeHtml(p.id)}">${escapeHtml(p.name)}</button></h3>
          <p class="card__price">${formatPrice(p.price)}</p>
          ${bulkLine(p) ? `<p class="card__bulk">Bulk: ${escapeHtml(bulkLine(p))}</p>` : ""}
          <a class="btn btn--outline btn--sm card__order" href="${escapeHtml(waLink(orderText(p)))}" target="_blank" rel="noopener">
            ${p.in_stock ? "Order on WhatsApp" : "Ask for restock"}
          </a>
        </div>
      </article>`).join("")
      : `<p class="grid__msg">New pieces are coming soon.</p>`;
    window.revealIn?.(grid);
  }

  function openProduct(id) {
    const p = state.products.find((x) => String(x.id) === String(id));
    if (!p) return;
    const img = document.getElementById("modalImg");
    const list = photos(p).length ? photos(p) : [image(p)];
    img.src = list[0];
    img.alt = p.name;
    document.getElementById("modalThumbs").innerHTML = list.length > 1
      ? list.map((u, i) => `<button type="button" class="modal__thumb${i ? "" : " is-active"}" data-src="${escapeHtml(u)}" aria-label="Photo ${i + 1}"><img src="${escapeHtml(u)}" alt="" /></button>`).join("")
      : "";
    const bulk = document.getElementById("modalBulk");
    bulk.hidden = !bulkLine(p);
    bulk.textContent = bulkLine(p) ? `Bulk orders: ${bulkLine(p)}` : "";
    const bulkBtn = document.getElementById("modalBulkOrder");
    bulkBtn.hidden = !bulkLine(p) || !p.in_stock;
    bulkBtn.href = waLink(bulkText(p));
    document.getElementById("modalCat").textContent = p.category;
    document.getElementById("modalName").textContent = p.name;
    document.getElementById("modalPrice").textContent = formatPrice(p.price) + (p.in_stock ? "" : " · Sold out");
    document.getElementById("modalDesc").textContent = p.description || "";
    const order = document.getElementById("modalOrder");
    order.textContent = p.in_stock ? "Order on WhatsApp" : "Ask for restock";
    order.href = waLink(orderText(p));
    history.replaceState(null, "", `#p-${p.id}`);
    modal.showModal();
  }

  modal.addEventListener("close", () => {
    if (location.hash.startsWith("#p-")) history.replaceState(null, "", location.pathname);
  });
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-close]")) return modal.close();
    const thumb = e.target.closest(".modal__thumb");
    if (!thumb) return;
    document.getElementById("modalImg").src = thumb.dataset.src;
    modal.querySelectorAll(".modal__thumb").forEach((b) => b.classList.toggle("is-active", b === thumb));
  });
  filtersEl.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-cat]");
    if (!btn) return;
    state.category = btn.dataset.cat;
    renderFilters();
    renderGrid();
  });
  grid.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-open]");
    if (btn) openProduct(btn.dataset.open);
  });

  loadProducts()
    .then((products) => {
      state.products = products;
      renderFilters();
      renderGrid();
      if (location.hash.startsWith("#p-")) openProduct(location.hash.slice(3));
    })
    .catch((err) => {
      console.error(err);
      grid.innerHTML = `<p class="grid__msg">Couldn't load the products right now. Please message me on WhatsApp.</p>`;
    });
})();
