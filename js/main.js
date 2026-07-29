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

  /* Only one FAQ open at a time */
  const faqItems = document.querySelectorAll(".faq__item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

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
          // hide «Открыть в Яндекс.Картах» promo block if present
          suppressMapOpenBlock: true,
          yandexMapDisablePoiInteractivity: true,
        }
      );

      // Non-interactive: no pan/zoom/scroll
      map.behaviors.disable([
        "drag",
        "multiTouch",
        "scrollZoom",
        "dblClickZoom",
        "rightMouseButtonMagnifier",
        "leftMouseButtonMagnifier",
      ]);

      // Native placemark with text caption drawn by Maps API
      const placemark = new ymaps.Placemark(
        center,
        {
          iconCaption: caption,
          hintContent: caption,
          balloonContentHeader: "Интекс-Электро",
          balloonContentBody: `${caption}<br>оф. 107, Екатеринбург`,
        },
        {
          preset: "islands#brownCircleDotIconWithCaption",
          iconCaptionMaxWidth: "220",
          hasBalloon: false,
          hasHint: true,
          openBalloonOnClick: false,
          openEmptyBalloon: false,
          cursor: "default",
        }
      );

      map.geoObjects.add(placemark);

      // Keep caption visible; reflow after container paint
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
