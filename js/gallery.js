const dataCache = {};
const lightbox = createLightbox();
const OBJECT_CATEGORY_LABELS = {
  CajasMadera: "Cajas de Madera",
  EsculturasAnimales: "Esculturas de animales",
  EsculturasHumanas: "Esculturas humanas",
  PortaRegalos: "Porta regalos",
  TablasPicoteo: "Tablas de Picoteo",
  otros: "Otros",
};

document.addEventListener("DOMContentLoaded", () => {
  initObjectsPage();
  initPeoplePage();
  initFeaturedObjects();
  initCommunityPreview();
});

async function loadJSON(path) {
  if (dataCache[path]) return dataCache[path];
  const response = await fetch(path);
  if (!response.ok) {
    throw new Error(`No se pudo cargar ${path}`);
  }
  const data = await response.json();
  dataCache[path] = data;
  return data;
}

function createLightbox() {
  const overlay = document.createElement("div");
  overlay.className = "lightbox";
  overlay.setAttribute("role", "dialog");
  overlay.setAttribute("aria-modal", "true");

  overlay.innerHTML = `
    <div class="lightbox-content">
      <button class="close-btn" aria-label="Cerrar">✕</button>
      <button class="nav-btn prev-btn" aria-label="Anterior">◀</button>
      <img alt="" />
      <button class="nav-btn next-btn" aria-label="Siguiente">▶</button>
      <div class="lightbox-meta">
        <span class="lightbox-caption"></span>
        <div class="lightbox-steps"></div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const imgEl = overlay.querySelector("img");
  const captionEl = overlay.querySelector(".lightbox-caption");
  const stepsEl = overlay.querySelector(".lightbox-steps");
  const closeBtn = overlay.querySelector(".close-btn");
  const prevBtn = overlay.querySelector(".prev-btn");
  const nextBtn = overlay.querySelector(".next-btn");

  let items = [];
  let index = 0;

  const close = () => {
    overlay.classList.remove("open");
    document.body.classList.remove("no-scroll");
  };

  const update = () => {
    if (!items.length) return;
    const current = items[index];
    imgEl.src = encodeURI(current.src);
    imgEl.alt = current.alt || "";
    captionEl.textContent = current.alt || "Foto";
    stepsEl.textContent = `${index + 1} / ${items.length}`;
  };

  const showNext = () => {
    if (!items.length) return;
    index = (index + 1) % items.length;
    update();
  };

  const showPrev = () => {
    if (!items.length) return;
    index = (index - 1 + items.length) % items.length;
    update();
  };

  closeBtn.addEventListener("click", close);
  nextBtn.addEventListener("click", showNext);
  prevBtn.addEventListener("click", showPrev);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) {
      close();
    }
  });

  document.addEventListener("keydown", (e) => {
    if (!overlay.classList.contains("open")) return;
    if (e.key === "Escape") close();
    if (e.key === "ArrowRight") showNext();
    if (e.key === "ArrowLeft") showPrev();
  });

  return {
    open(list, startIndex) {
      items = [...list];
      index = startIndex;
      overlay.classList.add("open");
      document.body.classList.add("no-scroll");
      update();
    },
    close,
  };
}

function formatObjectCategory(cat) {
  return OBJECT_CATEGORY_LABELS[cat] || cat;
}

async function initObjectsPage() {
  const gallery = document.querySelector('[data-gallery="objects"]');
  const chipContainer = document.querySelector('[data-filter-container="objects"]');
  if (!gallery) return;

  try {
    const data = await loadJSON("data/objects.json");
    const allItems = data.flatMap((cat) =>
      cat.items.map((item) => ({ ...item, category: cat.category }))
    );
    const categories = data.map((cat) => cat.category);
    const urlCategory = decodeURIComponent(
      new URLSearchParams(window.location.search).get("cat") || ""
    );
    const defaultFilter = categories.includes(urlCategory) ? urlCategory : "Todos";

    setupFilterChips(
      chipContainer,
      categories,
      (category) => {
        const filtered =
          category && category !== "Todos"
            ? allItems.filter((item) => item.category === category)
            : allItems;
        renderGallery(filtered, gallery);
      },
      defaultFilter,
      {
        allText: "Todas las fotos",
        formatLabel: formatObjectCategory,
      }
    );
  } catch (error) {
    renderError(gallery, error.message);
  }
}

async function initPeoplePage() {
  const gallery = document.querySelector('[data-gallery="people"]');
  const chipContainer = document.querySelector('[data-filter-container="people"]');
  if (!gallery) return;

  try {
    const data = await loadJSON("data/people.json");
    const allItems = data.flatMap((group) =>
      group.items.map((item) => ({ ...item, group: group.group }))
    );
    const groups = data.map((group) => group.group);

    setupFilterChips(
      chipContainer,
      groups,
      (groupName) => {
        const filtered =
          groupName && groupName !== "Todos"
            ? allItems.filter((item) => item.group === groupName)
            : allItems;
        renderGallery(filtered, gallery);
      },
      "Todos",
      {
        allText: "Todas las fotos",
      }
    );
  } catch (error) {
    renderError(gallery, error.message);
  }
}

async function initFeaturedObjects() {
  const container = document.querySelector("[data-featured-objects]");
  if (!container) return;
  try {
    const data = await loadJSON("data/objects.json");
    const featured = data.slice(0, 8);
    if (!featured.length) {
      container.textContent = "Pronto compartiremos nuestros objetos.";
      return;
    }
    container.innerHTML = "";
    featured.forEach((cat) => {
      const cover = cat.items[0];
      const card = document.createElement("a");
      card.className = "card object-card";
      card.href = `objects.html?cat=${encodeURIComponent(cat.category)}`;

      const img = document.createElement("img");
      img.src = encodeURI(cover.src);
      img.alt = cover.alt || cat.category;
      img.loading = "lazy";
      img.decoding = "async";

      const meta = document.createElement("div");
      meta.className = "meta";
      meta.innerHTML = `<span>${formatObjectCategory(
        cat.category
      )}</span><span class="link">Ver más →</span>`;

      card.appendChild(img);
      card.appendChild(meta);
      container.appendChild(card);
    });
  } catch (error) {
    renderError(container, error.message);
  }
}

async function initCommunityPreview() {
  const container = document.querySelector("[data-community-preview]");
  if (!container) return;
  try {
    const data = await loadJSON("data/people.json");
    const flattened = data.flatMap((group) =>
      group.items.map((item) => ({ ...item, group: group.group }))
    );
    const previewItems = flattened.slice(0, 9);
    container.innerHTML = "";
    previewItems.forEach((item, index) => {
      const fig = document.createElement("figure");
      fig.className = "gallery-item";
      fig.tabIndex = 0;

      const img = document.createElement("img");
      img.src = encodeURI(item.src);
      img.alt = item.alt || item.group || "Comunidad";
      img.loading = "lazy";
      img.decoding = "async";

      fig.appendChild(img);
      container.appendChild(fig);

      const openLightbox = () => lightbox.open(previewItems, index);
      fig.addEventListener("click", openLightbox);
      fig.addEventListener("keypress", (e) => {
        if (e.key === "Enter") openLightbox();
      });
    });
  } catch (error) {
    renderError(container, error.message);
  }
}

function setupFilterChips(
  container,
  labels,
  onChange,
  defaultValue = "Todos",
  options = {}
) {
  if (!container) return;
  container.innerHTML = "";
  const allLabel = "Todos";
  const allValue = "Todos";
  const { allText = "Todos", formatLabel = (label) => label } = options;
  const chipOptions = [
    { label: allLabel, value: allValue, text: allText },
    ...labels.map((label) => ({
      label,
      value: label,
      text: formatLabel(label),
    })),
  ];
  const initial = chipOptions.some((opt) => opt.value === defaultValue)
    ? defaultValue
    : allValue;

  chipOptions.forEach(({ value, text }) => {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "chip" + (value === initial ? " active" : "");
    btn.textContent = text;
    btn.dataset.value = value;
    btn.setAttribute("aria-pressed", value === initial ? "true" : "false");

    btn.addEventListener("click", () => {
      container.querySelectorAll(".chip").forEach((chip) => {
        chip.classList.remove("active");
        chip.setAttribute("aria-pressed", "false");
      });
      btn.classList.add("active");
      btn.setAttribute("aria-pressed", "true");
      onChange(value);
    });

    container.appendChild(btn);
  });

  onChange(initial);
}

function renderGallery(items, container) {
  if (!container) return;
  container.innerHTML = "";
  if (!items.length) {
    container.textContent = "Aún no tenemos fotos para mostrar aquí.";
    return;
  }

  items.forEach((item, index) => {
    const fig = document.createElement("figure");
    fig.className = "gallery-item";
    fig.tabIndex = 0;

    const img = document.createElement("img");
    img.src = encodeURI(item.src);
    img.alt = item.alt || "";
    img.loading = "lazy";
    img.decoding = "async";

    fig.appendChild(img);
    container.appendChild(fig);

    const openLightbox = () => lightbox.open(items, index);
    fig.addEventListener("click", openLightbox);
    fig.addEventListener("keypress", (e) => {
      if (e.key === "Enter") openLightbox();
    });
  });
}

function renderError(container, message) {
  if (!container) return;
  container.innerHTML = `<div class="info-block">${message || "No pudimos cargar la galería."}</div>`;
}
