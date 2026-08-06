(() => {
  const header = document.getElementById("header");
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");

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
   * - One source group in HTML; we clone it for a perfect loop (no gap).
   * - Auto-scroll via rAF; offset wraps by exact set width.
   * - Hover: pause auto, wheel / drag to scroll horizontally.
   */
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)"
  ).matches;

  const initMarquee = (root) => {
    const viewport = root.querySelector(".marquee__viewport");
    const track = root.querySelector(".marquee__track");
    const source = track?.querySelector(".marquee__group");
    if (!viewport || !track || !source) return;

    // Remove any previous clones (e.g. hot reload)
    track.querySelectorAll(".marquee__group--clone").forEach((n) => n.remove());

    const clone = source.cloneNode(true);
    clone.classList.add("marquee__group--clone");
    clone.setAttribute("aria-hidden", "true");
    clone.querySelectorAll("img").forEach((img) => {
      img.alt = "";
      img.removeAttribute("loading");
    });
    track.appendChild(clone);

    let setWidth = 0;
    let offset = 0;
    let paused = false;
    let dragging = false;
    let lastX = 0;
    let rafId = 0;
    const speed = parseFloat(root.dataset.speed || "0.4"); // px per frame @60fps

    const measure = () => {
      // scrollWidth of one group including its trailing padding
      setWidth = source.getBoundingClientRect().width;
      // If images load late, re-measure
      if (setWidth < 1) return;
      // Keep offset in range after resize
      if (setWidth > 0) {
        offset = ((offset % setWidth) + setWidth) % setWidth;
        apply();
      }
    };

    const apply = () => {
      track.style.transform = `translate3d(${-offset}px, 0, 0)`;
    };

    const wrap = () => {
      if (setWidth <= 0) return;
      // Keep offset in [0, setWidth)
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

    // Wheel → horizontal when pointer is over the marquee
    viewport.addEventListener(
      "wheel",
      (e) => {
        if (setWidth <= 0) return;
        // Prefer vertical wheel as horizontal strip control
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

    // Pointer drag
    viewport.addEventListener("pointerdown", (e) => {
      if (e.button !== 0) return;
      dragging = true;
      paused = true;
      lastX = e.clientX;
      root.classList.add("is-dragging", "is-paused");
      viewport.setPointerCapture(e.pointerId);
    });

    viewport.addEventListener("pointermove", (e) => {
      if (!dragging) return;
      const dx = e.clientX - lastX;
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
    };
    viewport.addEventListener("pointerup", endDrag);
    viewport.addEventListener("pointercancel", endDrag);

    // Hover: pause auto; leave: resume (unless reduced motion)
    root.addEventListener("mouseenter", () => {
      paused = true;
      root.classList.add("is-paused");
    });
    root.addEventListener("mouseleave", () => {
      if (dragging) return;
      if (!prefersReducedMotion) {
        paused = false;
        root.classList.remove("is-paused");
      }
    });

    // Measure after layout + images
    const ro = new ResizeObserver(() => measure());
    ro.observe(source);
    ro.observe(viewport);

    const imgs = source.querySelectorAll("img");
    let pending = imgs.length;
    if (pending === 0) measure();
    else {
      imgs.forEach((img) => {
        if (img.complete) {
          pending -= 1;
          if (pending === 0) measure();
        } else {
          img.addEventListener(
            "load",
            () => {
              pending -= 1;
              if (pending === 0) measure();
            },
            { once: true }
          );
          img.addEventListener(
            "error",
            () => {
              pending -= 1;
              if (pending === 0) measure();
            },
            { once: true }
          );
        }
      });
    }

    // Safety remeasure
    requestAnimationFrame(() => {
      measure();
      requestAnimationFrame(measure);
    });
    window.addEventListener("load", measure);

    if (prefersReducedMotion) {
      paused = true;
      root.classList.add("is-paused");
    }

    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      ro.disconnect();
    };
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
