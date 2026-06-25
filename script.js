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

const openSchedule = document.getElementById("openSchedule");
const closeSchedule = document.getElementById("closeSchedule");
const scheduleModal = document.getElementById("scheduleModal");

openSchedule.addEventListener("click", () => {
  scheduleModal.classList.add("is-open");
  document.body.style.overflow = "hidden";
});

closeSchedule.addEventListener("click", () => {
  scheduleModal.classList.remove("is-open");
  document.body.style.overflow = "";
});

scheduleModal.addEventListener("click", (event) => {
  if (event.target === scheduleModal) {
    scheduleModal.classList.remove("is-open");
    document.body.style.overflow = "";
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    scheduleModal.classList.remove("is-open");
    document.body.style.overflow = "";
  }
});
