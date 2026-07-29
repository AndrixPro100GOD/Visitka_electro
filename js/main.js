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
