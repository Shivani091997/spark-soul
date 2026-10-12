// Admin page: login, list, add, edit and delete products, upload up to 3 photos per product.
(function () {
  const { cfg, db, isConfigured, escapeHtml, formatPrice, placeholderImage } = window.SSS;
  const BUCKET = "product-images";
  const MAX_PHOTOS = 3;
  const BASE_CATEGORIES = ["Mobile Slings", "Hair Accessories"];
  const OTHER = "__other__";

  const $ = (id) => document.getElementById(id);
  const views = { setup: $("setupView"), login: $("loginView"), dash: $("dashView") };
  const modal = $("formModal");
  const form = $("productForm");

  // slots: up to 3 photos, each { url, path } (already uploaded) or { blob, preview } (new, not uploaded yet)
  const state = { products: [], editing: null, slots: [], search: "" };

  document.querySelectorAll("[data-business-name]").forEach((el) => (el.textContent = cfg.businessName || el.textContent));
  document.querySelectorAll("[data-currency]").forEach((el) => (el.textContent = cfg.currency || "₹"));

  function show(name) {
    Object.entries(views).forEach(([k, el]) => (el.hidden = k !== name));
    $("logoutBtn").hidden = name !== "dash";
  }

  function message(el, text, type = "error") {
    el.innerHTML = text ? `<div class="msg msg-${type}">${escapeHtml(text)}</div>` : "";
  }

  // Photos of a product (works for products saved before multi-photo support too).
  function photosOf(p) {
    if (Array.isArray(p?.images) && p.images.length) return p.images.filter((i) => i && i.url);
    return p?.image_url ? [{ url: p.image_url, path: p.image_path }] : [];
  }

  // ---------- Auth ----------
  async function checkSession() {
    const { data: { session } } = await db.auth.getSession();
    if (!session) return show("login");

    const { data: isAdmin, error } = await db.rpc("is_admin");
    if (error || !isAdmin) {
      await db.auth.signOut();
      show("login");
      message($("loginMsg"), "This account isn't an admin. Add its email to the admins table in Supabase (see README).");
      return;
    }
    show("dash");
    loadProducts();
  }

  $("loginForm").addEventListener("submit", async (e) => {
    e.preventDefault();
    message($("loginMsg"), "");
    const btn = e.submitter;
    btn.disabled = true;
    btn.textContent = "Logging in…";
    const { error } = await db.auth.signInWithPassword({
      email: $("email").value.trim(),
      password: $("password").value,
    });
    btn.disabled = false;
    btn.textContent = "Log in";
    if (error) return message($("loginMsg"), "Wrong email or password.");
    checkSession();
  });

  $("logoutBtn").addEventListener("click", async () => {
    await db.auth.signOut();
    show("login");
  });

  // ---------- List ----------
  async function loadProducts() {
    const { data, error } = await db
      .from("products")
      .select("*")
      .order("featured", { ascending: false })
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false });
    if (error) return message($("dashMsg"), "Couldn't load products: " + error.message);
    state.products = data;
    renderList();
  }

  function renderList() {
    const q = state.search.toLowerCase();
    const list = state.products.filter((p) =>
      !q || p.name.toLowerCase().includes(q) || p.category.toLowerCase().includes(q));
    $("count").textContent = `(${state.products.length})`;

    if (!state.products.length) {
      $("adminList").innerHTML = `<div class="panel" style="text-align:center;">
        <h2>No pieces yet</h2><p style="color:var(--ink-soft)">Click <strong>+ Add a piece</strong> to add your first one.</p></div>`;
      return;
    }
    if (!list.length) {
      $("adminList").innerHTML = `<p style="color:var(--ink-soft); text-align:center;">Nothing matches "${escapeHtml(state.search)}".</p>`;
      return;
    }

    $("adminList").innerHTML = list.map((p) => {
      const photos = photosOf(p);
      const bulk = p.bulk_price != null ? ` · Bulk ${formatPrice(p.bulk_price)} (${p.bulk_min || 12}+)` : "";
      return `
      <div class="admin-item">
        <img src="${escapeHtml(photos[0]?.url || placeholderImage(p.id, "", p.category))}" alt="" loading="lazy" />
        <div>
          <h3>${escapeHtml(p.name)}</h3>
          <p class="meta">${escapeHtml(p.category)} · ${formatPrice(p.price)}${bulk} · ${photos.length} photo${photos.length === 1 ? "" : "s"}</p>
          <div class="tags">
            ${p.in_stock ? "" : `<span class="tag tag-sold">Sold out</span>`}
            ${p.featured ? `<span class="tag tag-feat">Shown first</span>` : ""}
          </div>
        </div>
        <div class="admin-actions">
          <button class="icon-btn" data-act="stock" data-id="${p.id}">${p.in_stock ? "Mark sold out" : "Mark in stock"}</button>
          <button class="icon-btn" data-act="edit" data-id="${p.id}">Edit</button>
          <button class="icon-btn danger" data-act="delete" data-id="${p.id}">Delete</button>
        </div>
      </div>`;
    }).join("");
  }

  $("search").addEventListener("input", (e) => {
    state.search = e.target.value.trim();
    renderList();
  });

  $("adminList").addEventListener("click", async (e) => {
    const btn = e.target.closest("[data-act]");
    if (!btn) return;
    const p = state.products.find((x) => x.id === btn.dataset.id);
    if (!p) return;

    if (btn.dataset.act === "edit") openForm(p);

    if (btn.dataset.act === "stock") {
      btn.disabled = true;
      const { error } = await db.from("products").update({ in_stock: !p.in_stock }).eq("id", p.id);
      if (error) message($("dashMsg"), error.message);
      loadProducts();
    }

    if (btn.dataset.act === "delete") {
      if (!confirm(`Delete "${p.name}"? This can't be undone.`)) return;
      const { error } = await db.from("products").delete().eq("id", p.id);
      if (error) return message($("dashMsg"), error.message);
      const paths = [...new Set([p.image_path, ...photosOf(p).map((i) => i.path)].filter(Boolean))];
      if (paths.length) await db.storage.from(BUCKET).remove(paths);
      message($("dashMsg"), `Deleted "${p.name}".`, "ok");
      loadProducts();
    }
  });

  // ---------- Category: your categories + "Other…" with a text box ----------
  function fillCategories(current = "") {
    const cats = [...new Set([...BASE_CATEGORIES, ...state.products.map((p) => p.category).filter(Boolean)])];
    if (current && !cats.includes(current)) cats.push(current);
    $("fCategory").innerHTML =
      `<option value="" disabled ${current ? "" : "selected"}>Choose a category…</option>` +
      cats.map((c) => `<option value="${escapeHtml(c)}" ${c === current ? "selected" : ""}>${escapeHtml(c)}</option>`).join("") +
      `<option value="${OTHER}">Other… (type a new one)</option>`;
    toggleOther();
  }
  function toggleOther() {
    const other = $("fCategory").value === OTHER;
    $("fCategoryOther").hidden = !other;
    $("fCategoryOther").required = other;
    if (other) $("fCategoryOther").focus();
  }
  $("fCategory").addEventListener("change", toggleOther);

  // ---------- Photos: 3 slots ----------
  function renderSlots() {
    const box = $("photoSlots");
    box.innerHTML = Array.from({ length: MAX_PHOTOS }, (_, i) => {
      const s = state.slots[i];
      const src = s ? (s.preview || s.url) : "";
      return `
        <div class="slot${s ? " has-photo" : ""}">
          ${s ? `<img src="${escapeHtml(src)}" alt="Photo ${i + 1}" />` : `<span class="slot__empty">+<small>Add photo</small></span>`}
          ${i === 0 && s ? `<span class="slot__main">Main</span>` : ""}
          <label class="slot__pick" aria-label="${s ? "Replace" : "Add"} photo ${i + 1}">
            <input type="file" accept="image/*" data-slot="${i}" hidden />
          </label>
          ${s ? `<button type="button" class="slot__remove" data-remove="${i}" aria-label="Remove photo ${i + 1}">×</button>` : ""}
        </div>`;
    }).join("");
  }

  $("photoSlots").addEventListener("change", async (e) => {
    const input = e.target.closest("input[data-slot]");
    if (!input || !input.files[0]) return;
    const i = Number(input.dataset.slot);
    try {
      const blob = await cropAndCompress(input.files[0]);
      const old = state.slots[i];
      if (old?.preview) URL.revokeObjectURL(old.preview);
      state.slots[i] = { blob, preview: URL.createObjectURL(blob) };
      compactSlots();
      renderSlots();
    } catch {
      message($("formMsg"), "That file couldn't be read as an image. Try a JPG or PNG.");
    }
  });

  $("photoSlots").addEventListener("click", (e) => {
    const btn = e.target.closest("[data-remove]");
    if (!btn) return;
    const i = Number(btn.dataset.remove);
    if (state.slots[i]?.preview) URL.revokeObjectURL(state.slots[i].preview);
    state.slots[i] = null;
    compactSlots();
    renderSlots();
  });

  // keep photos in order with no gaps (so the first one is always the main photo)
  function compactSlots() {
    state.slots = state.slots.filter(Boolean).slice(0, MAX_PHOTOS);
  }

  // Crop to a centred square and shrink to max 1200×1200 so photos load fast and match the site.
  async function cropAndCompress(file) {
    const bitmap = await createImageBitmap(file);
    const ratio = 1;
    let sw = bitmap.width, sh = bitmap.height, sx = 0, sy = 0;
    if (sw / sh > ratio) { sw = Math.round(sh * ratio); sx = Math.round((bitmap.width - sw) / 2); }
    else { sh = Math.round(sw / ratio); sy = Math.round((bitmap.height - sh) / 2); }
    const outW = Math.min(1200, sw);
    const outH = Math.round(outW / ratio);
    const canvas = document.createElement("canvas");
    canvas.width = outW;
    canvas.height = outH;
    canvas.getContext("2d").drawImage(bitmap, sx, sy, sw, sh, 0, 0, outW, outH);
    const blob = await new Promise((res) => canvas.toBlob(res, "image/webp", 0.85));
    if (blob && blob.type === "image/webp") return blob;
    return new Promise((res) => canvas.toBlob(res, "image/jpeg", 0.85));
  }

  // ---------- Add / edit form ----------
  function openForm(p = null) {
    state.editing = p;
    form.reset();
    message($("formMsg"), "");
    $("formTitle").textContent = p ? "Edit piece" : "Add a piece";
    $("fName").value = p?.name ?? "";
    fillCategories(p?.category ?? "");
    $("fCategoryOther").value = "";
    $("fPrice").value = p?.price ?? "";
    $("fBulkPrice").value = p?.bulk_price ?? "";
    $("fBulkMin").value = p?.bulk_min ?? 12;
    $("fDesc").value = p?.description ?? "";
    $("fStock").checked = p ? p.in_stock : true;
    $("fFeatured").checked = p ? p.featured : false;
    $("fSort").value = p?.sort_order ?? 0;
    state.slots = photosOf(p).map((i) => ({ url: i.url, path: i.path }));
    renderSlots();
    modal.showModal();
  }

  $("addBtn").addEventListener("click", () => openForm());
  modal.addEventListener("click", (e) => {
    if (e.target === modal || e.target.closest("[data-close]")) modal.close();
  });

  async function upload(blob) {
    const ext = blob.type === "image/webp" ? "webp" : "jpg";
    const path = `products/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const { error } = await db.storage.from(BUCKET).upload(path, blob, { contentType: blob.type, cacheControl: "31536000" });
    if (error) throw error;
    return { url: db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl, path };
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const saveBtn = $("saveBtn");
    message($("formMsg"), "");

    const category = $("fCategory").value === OTHER ? $("fCategoryOther").value.trim() : $("fCategory").value;
    if (!category) return message($("formMsg"), "Please choose a category, or pick Other and type one.");
    const bulkRaw = $("fBulkPrice").value.trim();
    const bulkPrice = bulkRaw === "" ? null : Number(bulkRaw);
    const bulkMin = Math.max(2, Number($("fBulkMin").value) || 12);
    if (bulkPrice != null && bulkPrice >= Number($("fPrice").value)) {
      return message($("formMsg"), "The bulk price should be lower than the normal price.");
    }

    saveBtn.disabled = true;
    saveBtn.textContent = "Saving…";
    const uploaded = [];
    try {
      const p = state.editing;

      // upload new photos (in order), keep the ones already saved
      const images = [];
      for (const s of state.slots.filter(Boolean)) {
        if (s.blob) { const u = await upload(s.blob); uploaded.push(u.path); images.push(u); }
        else images.push({ url: s.url, path: s.path });
      }

      const row = {
        name: $("fName").value.trim(),
        category,
        price: Number($("fPrice").value),
        bulk_price: bulkPrice,
        bulk_min: bulkMin,
        description: $("fDesc").value.trim(),
        in_stock: $("fStock").checked,
        featured: $("fFeatured").checked,
        sort_order: Number($("fSort").value) || 0,
        images,
        image_url: images[0]?.url || null,   // main photo (kept for older parts of the site)
        image_path: images[0]?.path || null,
      };

      const { error } = p
        ? await db.from("products").update(row).eq("id", p.id)
        : await db.from("products").insert(row);
      if (error) throw error;

      // delete photos that were removed or replaced
      if (p) {
        const keep = new Set(images.map((i) => i.path));
        const removed = [...new Set([p.image_path, ...photosOf(p).map((i) => i.path)].filter((x) => x && !keep.has(x)))];
        if (removed.length) await db.storage.from(BUCKET).remove(removed);
      }

      modal.close();
      message($("dashMsg"), `Saved "${row.name}".`, "ok");
      loadProducts();
    } catch (err) {
      console.error(err);
      if (uploaded.length) await db.storage.from(BUCKET).remove(uploaded); // don't leave orphan photos behind
      const hint = /column .*(images|bulk_)/i.test(err.message || "")
        ? " The database needs the update in supabase/update-1-photos-bulk.sql."
        : "";
      message($("formMsg"), "Couldn't save: " + (err.message || err) + hint);
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = "Save piece";
    }
  });

  // ---------- Start ----------
  if (!isConfigured) show("setup");
  else checkSession();
})();
