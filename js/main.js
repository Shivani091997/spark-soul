// Page motion: load animation, sticky header, scroll reveals, and the hero illustration details.
(function () {
  const cfg = window.SITE_CONFIG || {};
  const NS = "http://www.w3.org/2000/svg";

  // ---- Your own photos (optional, set in js/config.js) ----
  if (cfg.heroImage) {
    const photo = document.getElementById("heroPhoto");
    photo.src = cfg.heroImage;
    photo.alt = "Wearing a Spark Soul handmade mobile sling";
    photo.hidden = false;
    document.getElementById("heroIllustration").style.display = "none";
  }
  // ---- About Me "handmade map": drawings pop in, stitched paths sew in and items drift as you scroll ----
  const about = document.getElementById("about");
  if (about) {
    // braided blue/white sling straps and ruffled scrunchies
    about.querySelectorAll(".js-braid").forEach((g) => {
      const [x1, y1] = g.dataset.from.split(",").map(Number);
      const [x2, y2] = g.dataset.to.split(",").map(Number);
      for (let i = 0; i <= 11; i++) {
        const t = i / 11;
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", (x1 + (x2 - x1) * t).toFixed(1));
        c.setAttribute("cy", (y1 + (y2 - y1) * t).toFixed(1));
        c.setAttribute("r", 3.6);
        c.setAttribute("fill", i % 2 ? "#FFFFFF" : "#2E5BD8");
        c.setAttribute("stroke", "#2B2420");
        c.setAttribute("stroke-width", "1.5");
        g.appendChild(c);
      }
    });
    about.querySelectorAll(".js-scrunchie").forEach((g) => {
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", (60 + Math.cos(a) * 36).toFixed(1));
        c.setAttribute("cy", (60 + Math.sin(a) * 36).toFixed(1));
        c.setAttribute("r", 20);
        g.appendChild(c);
      }
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + 0.26;
        const d = document.createElementNS(NS, "circle");
        d.setAttribute("cx", (60 + Math.cos(a) * 44).toFixed(1));
        d.setAttribute("cy", (60 + Math.sin(a) * 44).toFixed(1));
        d.setAttribute("r", 3);
        d.setAttribute("fill", "#FFFFFF");
        d.setAttribute("stroke", "none");
        g.appendChild(d);
      }
    });

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const items = [...about.querySelectorAll(".m-el")].map((el) => ({ el, depth: parseFloat(el.dataset.depth) || 1 }));
    // desktop and phone stitches (one set is hidden at any time; its length is still read from the path data)
    const masks = [...about.querySelectorAll(".stitch-mask")].map((p) => {
      let len = 1500;
      try { len = p.getTotalLength() || len; } catch (e) { /* hidden in this browser: keep the safe default */ }
      p.style.strokeDasharray = `${len} ${len}`;
      p.style.strokeDashoffset = reduce ? 0 : len;
      return { p, len };
    });

    // pop the drawings in when the section comes into view
    if ("IntersectionObserver" in window) {
      new IntersectionObserver((entries, obs) => {
        if (entries[0].isIntersecting) { about.classList.add("is-in"); obs.disconnect(); }
      }, { threshold: 0.2 }).observe(about);
    } else {
      about.classList.add("is-in");
    }

    if (!reduce) {
      let ticking = false;
      const update = () => {
        ticking = false;
        const r = about.getBoundingClientRect();
        const vh = window.innerHeight;
        if (r.bottom < 0 || r.top > vh) return;
        const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height))); // 0 → 1 while the section passes
        items.forEach(({ el, depth }) => {
          el.style.transform = `translate3d(0, ${((0.5 - p) * depth * 140).toFixed(1)}px, 0) rotate(${((p - 0.5) * depth * 10).toFixed(2)}deg)`;
        });
        const draw = Math.min(1, Math.max(0, (p - 0.12) / 0.4)); // stitches sew in during the first half
        masks.forEach(({ p: path, len }) => { path.style.strokeDashoffset = (len * (1 - draw)).toFixed(1); });
      };
      const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } };
      window.addEventListener("scroll", onScroll, { passive: true });
      window.addEventListener("resize", onScroll);
      update();
    }
  }

  // ---- Hero illustration: beaded strap + ruffled scrunchie ----
  const beads = document.getElementById("beads");
  if (beads) {
    const colors = ["#F8CF2C", "#FBF6EC", "#C2405A", "#4A4419", "#E7899B"];
    // two strands rising from the phone's top corners
    const strands = [[[273, 410], [150, -40]], [[492, 391], [640, -40]]];
    strands.forEach(([[x1, y1], [x2, y2]], s) => {
      const steps = 15;
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const sag = Math.sin(t * Math.PI) * (s ? -28 : 28);
        const c = document.createElementNS(NS, "circle");
        c.setAttribute("cx", (x1 + (x2 - x1) * t + sag).toFixed(1));
        c.setAttribute("cy", (y1 + (y2 - y1) * t).toFixed(1));
        c.setAttribute("r", i % 3 === 1 ? 17 : 13);
        c.setAttribute("fill", colors[(i + s * 2) % colors.length]);
        c.setAttribute("stroke", "#1E1B16");
        c.setAttribute("stroke-width", "4");
        beads.appendChild(c);
      }
    });
  }
  const scrunchie = document.getElementById("scrunchie");
  if (scrunchie) {
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2;
      const c = document.createElementNS(NS, "circle");
      c.setAttribute("cx", (Math.cos(a) * 70).toFixed(1));
      c.setAttribute("cy", (Math.sin(a) * 70).toFixed(1));
      c.setAttribute("r", 38);
      scrunchie.appendChild(c);
    }
    for (let i = 0; i < 12; i++) {
      const a = (i / 12) * Math.PI * 2 + 0.26;
      const d = document.createElementNS(NS, "circle");
      d.setAttribute("cx", (Math.cos(a) * 84).toFixed(1));
      d.setAttribute("cy", (Math.sin(a) * 84).toFixed(1));
      d.setAttribute("r", 5);
      d.setAttribute("fill", "#FBF6EC");
      d.setAttribute("stroke", "none");
      scrunchie.appendChild(d);
    }
  }

  // ---- Announcement bar: repeat the messages so the loop never shows a gap, even on wide screens ----
  const track = document.getElementById("announceTrack");
  if (track) {
    const base = track.innerHTML;
    const fill = () => {
      track.innerHTML = base;
      while (track.scrollWidth < window.innerWidth + 200) track.insertAdjacentHTML("beforeend", base);
      track.insertAdjacentHTML("beforeend", track.innerHTML); // second identical half for the -50% loop
      track.style.animationDuration = `${Math.max(20, track.scrollWidth / 90)}s`; // same speed on any screen
    };
    fill();
    let resizeTimer;
    window.addEventListener("resize", () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(fill, 200); });
  }

  // ---- Load animation ----
  const start = () => requestAnimationFrame(() => document.body.classList.add("is-loaded"));
  if (document.fonts && document.fonts.ready) {
    Promise.race([document.fonts.ready, new Promise((r) => setTimeout(r, 1200))]).then(start);
  } else {
    start();
  }

  // ---- Header changes once you scroll ----
  const header = document.getElementById("header");
  const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 40);
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  // ---- Scroll reveals ----
  const io = "IntersectionObserver" in window
    ? new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("is-in");
          io.unobserve(e.target);
        });
      }, { threshold: 0.15, rootMargin: "0px 0px -40px 0px" })
    : null;

  // Called again by shop.js after the product cards are drawn.
  window.revealIn = function (root = document) {
    const items = root.querySelectorAll("[data-reveal]:not(.is-in), .card:not(.is-in)");
    let delay = 0;
    items.forEach((el) => {
      if (!io) { el.classList.add("is-in"); return; }
      if (el.classList.contains("card")) { el.style.transitionDelay = `${(delay++ % 3) * 0.12}s`; }
      io.observe(el);
    });
  };
  window.revealIn();
})();
