document.addEventListener("DOMContentLoaded", () => {
  const navToggle = document.querySelector(".nav-toggle");
  const nav = document.querySelector(".site-nav");

  if (navToggle && nav) {
    navToggle.addEventListener("click", () => {
      const isOpen = nav.classList.toggle("open");
      navToggle.setAttribute("aria-expanded", String(isOpen));
    });

    nav.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        if (nav.classList.contains("open")) {
          nav.classList.remove("open");
          navToggle.setAttribute("aria-expanded", "false");
        }
      });
    });
  }

  highlightActiveNav();
  loadHomeHero();
});

function highlightActiveNav() {
  const links = Array.from(document.querySelectorAll(".site-nav a"));
  if (!links.length) return;

  const current = window.location.pathname.split("/").pop() || "index.html";

  links.forEach((link) => {
    const href = link.getAttribute("href");
    if (!href) return;
    if (href === current || (current === "" && href === "index.html")) {
      link.classList.add("active");
    }
  });
}

async function loadHomeHero() {
  const collage = document.querySelector(".hero-collage");
  if (!collage) return;

  try {
    const res = await fetch("data/home.json");
    if (!res.ok) return;
    const data = await res.json();
    const images = Array.isArray(data.heroImages) ? data.heroImages : [];
    if (!images.length) return;

    collage.innerHTML = "";
    images.slice(0, 3).forEach((item) => {
      const img = document.createElement("img");
      img.src = encodeURI(item.src);
      img.alt = item.alt || "Foto del taller";
      img.loading = "lazy";
      img.decoding = "async";
      collage.appendChild(img);
    });
  } catch (error) {
    // Si falla, dejamos las imágenes estáticas ya presentes en el HTML.
  }
}
