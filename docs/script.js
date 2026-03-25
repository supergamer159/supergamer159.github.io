const panels = Array.from(document.querySelectorAll(".scroll-panel"));
const navLinks = Array.from(document.querySelectorAll(".nav-link"));
const bossTabs = Array.from(document.querySelectorAll(".boss-tab"));
const bossPanels = Array.from(document.querySelectorAll("[data-boss-panel]"));

const setActiveNav = (id) => {
  navLinks.forEach((link) => {
    const isMatch = link.getAttribute("href") === `#${id}`;
    link.classList.toggle("is-active", isMatch);
  });
};

if ("IntersectionObserver" in window) {
  const revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
        }
      });
    },
    { threshold: 0.12 }
  );

  panels.forEach((panel) => revealObserver.observe(panel));

  const sectionObserver = new IntersectionObserver(
    (entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

      if (visible?.target?.id) {
        setActiveNav(visible.target.id);
      }
    },
    {
      rootMargin: "-25% 0px -55% 0px",
      threshold: [0.2, 0.35, 0.5],
    }
  );

  panels.forEach((panel) => sectionObserver.observe(panel));
} else {
  panels.forEach((panel) => panel.classList.add("is-visible"));
}

bossTabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const boss = tab.dataset.boss;

    bossTabs.forEach((button) => {
      const active = button === tab;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    });

    bossPanels.forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.bossPanel === boss);
    });
  });
});
