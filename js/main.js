(() => {
  const header = document.getElementById("header");
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");

  /* Disable native image drag site-wide (keep link clicks) */
  document.addEventListener(
    "dragstart",
    (e) => {
      if (e.target instanceof HTMLImageElement || e.target.closest?.("img")) {
        e.preventDefault();
      }
    },
    true
  );
  document.querySelectorAll("img").forEach((img) => {
    img.setAttribute("draggable", "false");
  });

  /* Sticky header state */
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /*
   * MAX messenger: no public wa.me-style phone deep-link.
   * Open web client and put the business number on the clipboard
   * so the user can start a chat with +7 (904) 386-65-90 quickly.
   */
  document.querySelectorAll("[data-max-phone]").forEach((link) => {
    link.addEventListener("click", () => {
      const phone = link.getAttribute("data-max-phone");
      if (!phone || !navigator.clipboard?.writeText) return;
      const pretty = phone.startsWith("7") ? `+${phone}` : phone;
      navigator.clipboard.writeText(pretty).catch(() => {});
    });
  });

  /* Mobile menu */
  const closeMenu = () => {
    burger?.classList.remove("is-open");
    nav?.classList.remove("is-open");
    burger?.setAttribute("aria-expanded", "false");
    document.body.classList.remove("menu-open");
  };

  burger?.addEventListener("click", () => {
    const open = !nav?.classList.contains("is-open");
    burger.classList.toggle("is-open", open);
    nav?.classList.toggle("is-open", open);
    burger.setAttribute("aria-expanded", String(open));
    document.body.classList.toggle("menu-open", open);
  });

  nav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", closeMenu);
  });

  /* Smooth FAQ accordion — height animation, no page jump */
  const faqItems = Array.from(document.querySelectorAll(".faq__item"));

  const getPanel = (item) => item.querySelector(".faq__answer");

  const setExpanded = (item, expanded) => {
    item.classList.toggle("is-open", expanded);
    if (expanded) item.setAttribute("open", "");
    else item.removeAttribute("open");
    const summary = item.querySelector("summary");
    summary?.setAttribute("aria-expanded", String(expanded));
  };

  const expandItem = (item) => {
    const panel = getPanel(item);
    if (!panel) return;

    setExpanded(item, true);
    panel.style.height = "0px";
    // force reflow before animating to full height
    void panel.offsetHeight;
    panel.style.height = `${panel.scrollHeight}px`;

    const onEnd = (e) => {
      if (e.propertyName !== "height") return;
      panel.removeEventListener("transitionend", onEnd);
      if (item.classList.contains("is-open")) {
        panel.style.height = "auto";
      }
    };
    panel.addEventListener("transitionend", onEnd);
  };

  const collapseItem = (item) => {
    const panel = getPanel(item);
    if (!panel) return;

    // lock current height then animate to 0
    panel.style.height = `${panel.scrollHeight}px`;
    void panel.offsetHeight;
    panel.style.height = "0px";
    setExpanded(item, false);
  };

  faqItems.forEach((item) => {
    const summary = item.querySelector("summary");
    const panel = getPanel(item);
    if (!summary || !panel) return;

    // Initial state
    if (item.hasAttribute("open")) {
      setExpanded(item, true);
      panel.style.height = "auto";
    } else {
      setExpanded(item, false);
      panel.style.height = "0px";
    }

    summary.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();

      const willOpen = !item.classList.contains("is-open");

      // Close others smoothly first (same frame → stable layout)
      faqItems.forEach((other) => {
        if (other !== item && other.classList.contains("is-open")) {
          collapseItem(other);
        }
      });

      if (willOpen) expandItem(item);
      else collapseItem(item);
    });
  });

  // Keep open panel height correct on resize
  window.addEventListener("resize", () => {
    faqItems.forEach((item) => {
      if (!item.classList.contains("is-open")) return;
      const panel = getPanel(item);
      if (panel) panel.style.height = "auto";
    });
  });

  /**
   * Seamless infinite marquee (products + partners).
   * Sequence: card1 → card2 → … → cardN → card1 → …
   * Loop unit = one full group + 16px gap (same as item gap). No empty strip.
   * Hover: pause auto; wheel / drag for horizontal browse.
   */
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const GAP_PX = 16;

  const initMarquee = (root) => {
    const viewport = root.querySelector(".marquee__viewport");
    const track = root.querySelector(".marquee__track");
    const source = track?.querySelector(".marquee__group");
    if (!viewport || !track || !source) return;

    // Clean previous clones / spacers
    track
      .querySelectorAll(".marquee__group--clone, .marquee__set-gap")
      .forEach((n) => n.remove());

    const makeGap = () => {
      const gap = document.createElement("div");
      gap.className = "marquee__set-gap";
      gap.setAttribute("aria-hidden", "true");
      return gap;
    };

    const cloneGroup = () => {
      const c = source.cloneNode(true);
      c.classList.add("marquee__group--clone");
      c.setAttribute("aria-hidden", "true");
      c.querySelectorAll("img").forEach((img) => {
        img.alt = "";
        img.removeAttribute("loading");
        img.setAttribute("draggable", "false");
      });
      return c;
    };

    // Never drag raw images inside marquee
    source.querySelectorAll("img").forEach((img) => {
      img.setAttribute("draggable", "false");
    });

    // Build: [group][gap][group][gap]… until width ≥ 2× viewport
    // First unit stays: source + gap after it
    track.appendChild(makeGap());

    let setWidth = 0;
    let offset = 0;
    let paused = false;
    let dragging = false;
    let dragMoved = false;
    let lastX = 0;
    let rafId = 0;
    const speed = parseFloat(root.dataset.speed || "0.45");

    const fillClones = () => {
      // Remove extras except source + its following gap
      while (track.children.length > 2) {
        track.removeChild(track.lastChild);
      }

      // Measure one set: group width + gap
      const groupW = source.offsetWidth;
      if (groupW < 1) return;
      setWidth = groupW + GAP_PX;

      const minTrack = Math.max(viewport.offsetWidth * 2 + setWidth, setWidth * 2);
      let total = setWidth; // source + first gap already in track

      while (total < minTrack) {
        track.appendChild(cloneGroup());
        track.appendChild(makeGap());
        total += setWidth;
      }

      // Snap offset into range
      if (setWidth > 0) {
        offset = ((offset % setWidth) + setWidth) % setWidth;
      }
      apply();
    };

    const apply = () => {
      // Use integer pixels to avoid subpixel seam flicker
      track.style.transform = `translate3d(${-Math.round(offset)}px, 0, 0)`;
    };

    const wrap = () => {
      if (setWidth <= 0) return;
      offset = ((offset % setWidth) + setWidth) % setWidth;
    };

    const tick = () => {
      if (!paused && !dragging && !prefersReducedMotion && setWidth > 0) {
        offset += speed;
        wrap();
        apply();
      }
      rafId = requestAnimationFrame(tick);
    };

    viewport.addEventListener(
      "wheel",
      (e) => {
        if (setWidth <= 0) return;
        const delta =
          Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
        if (delta === 0) return;
        e.preventDefault();
        paused = true;
        root.classList.add("is-paused");
        offset += delta;
        wrap();
        apply();
      },
      { passive: false }
    );

    const resumeAuto = () => {
      if (prefersReducedMotion) return;
      paused = false;
      root.classList.remove("is-paused");
    };

    const pauseAuto = () => {
      paused = true;
      root.classList.add("is-paused");
    };

    viewport.addEventListener("pointerdown", (e) => {
      if (e.button !== 0 && e.pointerType === "mouse") return;
      dragging = true;
      dragMoved = false;
      pauseAuto();
      lastX = e.clientX;
      root.classList.add("is-dragging");
      viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
      if (Math.abs(dx) > 2) dragMoved = true;
      lastX = e.clientX;
      offset -= dx;
      wrap();
      apply();
    });

    const endDrag = (e) => {
      if (!dragging) return;
      dragging = false;
      root.classList.remove("is-dragging");
      try {
        viewport.releasePointerCapture(e.pointerId);
      } catch (_) {
        /* ignore */
      }

      // Touch / pen: always resume after release (no reliable :hover)
      // Mouse: resume only if pointer left the marquee
      const isTouch = e.pointerType === "touch" || e.pointerType === "pen";
      const stillHover =
        e.pointerType === "mouse" && root.matches(":hover");

      if (isTouch || !stillHover) {
        resumeAuto();
      } else {
        pauseAuto(); // mouse still over strip — keep paused
      }
    };
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);
    viewport.addEventListener("lostpointercapture", () => {
      if (!dragging) return;
      dragging = false;
      root.classList.remove("is-dragging");
      resumeAuto();
    });

    // Suppress click after drag so partner links don't fire accidentally
    track.addEventListener(
      "click",
      (e) => {
        if (dragMoved) {
          e.preventDefault();
          e.stopPropagation();
          dragMoved = false;
        }
      },
      true
    );

    // Desktop hover pause / leave resume
    root.addEventListener("mouseenter", () => {
      if (prefersReducedMotion) return;
      pauseAuto();
    });
    root.addEventListener("mouseleave", () => {
      if (dragging) return;
      resumeAuto();
    });

    // Touch leave (when finger leaves element without cancel in some browsers)
    root.addEventListener(
      "touchend",
      () => {
        if (dragging) return;
        resumeAuto();
      },
      { passive: true }
    );

    const ro = new ResizeObserver(() => fillClones());
    ro.observe(source);
    ro.observe(viewport);

    const imgs = [...source.querySelectorAll("img")];
    const waitImages = () =>
      Promise.all(
        imgs.map(
          (img) =>
            new Promise((resolve) => {
              if (img.complete) resolve();
              else {
                img.addEventListener("load", resolve, { once: true });
                img.addEventListener("error", resolve, { once: true });
              }
            })
        )
      );

    waitImages().then(() => {
      fillClones();
      requestAnimationFrame(fillClones);
    });

    window.addEventListener("load", fillClones);

    if (prefersReducedMotion) {
      paused = true;
      root.classList.add("is-paused");
    }

    rafId = requestAnimationFrame(tick);
  };

  document.querySelectorAll("[data-marquee]").forEach(initMarquee);

  /**
   * Yandex Maps JS API 2.1 — non-interactive map with native geo elements.
   * Placemark + iconCaption are drawn by the API (not CSS overlays).
   * Docs: Placemark, Map.behaviors, islands presets.
   */
  const initYandexMap = () => {
    const el = document.getElementById("yandex-map");
    if (!el || typeof ymaps === "undefined") return;

    const lat = parseFloat(el.dataset.lat || "56.8078");
    const lon = parseFloat(el.dataset.lon || "60.5645");
    const zoom = parseInt(el.dataset.zoom || "13", 10);
    const caption = el.dataset.caption || "Ясная улица, 31";
    const center = [lat, lon];

    // Full Yandex Maps page with point + search text
    const mapsUrl =
      `https://yandex.ru/maps/?pt=${lon},${lat}&z=16&l=map` +
      `&text=${encodeURIComponent(caption)}`;

    const openMaps = () => {
      window.open(mapsUrl, "_blank", "noopener,noreferrer");
    };

    ymaps.ready(() => {
      const map = new ymaps.Map(
        el,
        {
          center,
          zoom,
          controls: [],
          type: "yandex#map",
        },
        {
          suppressMapOpenBlock: true,
          yandexMapDisablePoiInteractivity: true,
        }
      );

      // No pan/zoom — only click to open full maps
      map.behaviors.disable([
        "drag",
        "multiTouch",
        "scrollZoom",
        "dblClickZoom",
        "rightMouseButtonMagnifier",
        "leftMouseButtonMagnifier",
      ]);

      const placemark = new ymaps.Placemark(
        center,
        {
          iconCaption: caption,
          hintContent: `${caption} — открыть в Яндекс.Картах`,
        },
        {
          preset: "islands#brownCircleDotIconWithCaption",
          iconCaptionMaxWidth: "220",
          hasBalloon: false,
          hasHint: true,
          openBalloonOnClick: false,
          openEmptyBalloon: false,
          cursor: "pointer",
        }
      );

      map.geoObjects.add(placemark);

      map.events.add("click", openMaps);
      placemark.events.add("click", (e) => {
        e.stopPropagation();
        openMaps();
      });

      el.classList.add("contacts__map--clickable");
      el.title = "Открыть в Яндекс.Картах";
      el.setAttribute("role", "link");
      el.tabIndex = 0;
      el.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          openMaps();
        }
      });

      map.container.fitToViewport();
    });
  };

  if (typeof ymaps !== "undefined") {
    initYandexMap();
  } else {
    // Script may still be loading (defer order)
    window.addEventListener("load", () => {
      if (typeof ymaps !== "undefined") initYandexMap();
    });
  }
})();
