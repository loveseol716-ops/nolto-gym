const revealElements = document.querySelectorAll(".reveal");

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry, index) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          entry.target.classList.add("show");
        }, index * 70);
      }
    });
  },
  {
    threshold: 0.15,
  }
);

revealElements.forEach((element) => {
  revealObserver.observe(element);
});

const heroBgText = document.querySelector(".hero-bg-text");

window.addEventListener("scroll", () => {
  const y = window.scrollY;

  if (heroBgText) {
    heroBgText.style.transform = `translateX(${y * 0.08}px) rotate(-4deg)`;
  }
});
