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
    threshold: 0.16,
  }
);

revealElements.forEach((element) => {
  revealObserver.observe(element);
});

const heroWord = document.querySelector(".hero-word");

window.addEventListener("scroll", () => {
  const scrollY = window.scrollY;

  if (heroWord) {
    heroWord.style.transform = `translateX(${scrollY * 0.08}px) rotate(-4deg)`;
  }
});
