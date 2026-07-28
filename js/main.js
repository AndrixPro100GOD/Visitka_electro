(() => {
  const header = document.getElementById("header");
  const burger = document.getElementById("burger");
  const nav = document.getElementById("nav");
  const form = document.getElementById("lead-form");
  const statusEl = document.getElementById("form-status");

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

  /* Only one FAQ open at a time (accordion feel) */
  const faqItems = document.querySelectorAll(".faq__item");
  faqItems.forEach((item) => {
    item.addEventListener("toggle", () => {
      if (!item.open) return;
      faqItems.forEach((other) => {
        if (other !== item) other.open = false;
      });
    });
  });

  /* Lead form — client-side only (GitHub Pages) */
  form?.addEventListener("submit", (event) => {
    event.preventDefault();
    if (!statusEl) return;

    const data = new FormData(form);
    const name = String(data.get("name") || "").trim();
    const phone = String(data.get("phone") || "").trim();
    const offer = data.get("offer");
    const privacy = data.get("privacy");

    statusEl.hidden = false;
    statusEl.classList.remove("is-success", "is-error");

    if (!name || !phone || !offer || !privacy) {
      statusEl.textContent = "Заполните обязательные поля и подтвердите согласия.";
      statusEl.classList.add("is-error");
      return;
    }

    const digits = phone.replace(/\D/g, "");
    if (digits.length < 10) {
      statusEl.textContent = "Укажите корректный номер телефона.";
      statusEl.classList.add("is-error");
      return;
    }

    statusEl.textContent =
      "Спасибо! Заявка принята. Мы свяжемся с вами в ближайшее рабочее время.";
    statusEl.classList.add("is-success");
    form.reset();
  });

  /* Phone-friendly input mask (soft) */
  const phoneInput = form?.querySelector('input[name="phone"]');
  phoneInput?.addEventListener("input", () => {
    let value = phoneInput.value.replace(/[^\d+()\s-]/g, "");
    if (value.length > 20) value = value.slice(0, 20);
    phoneInput.value = value;
  });
})();
