const cards = document.querySelectorAll(".program-card, .day-card");

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("show");
      }
    });
  },
  {
    threshold: 0.12,
  }
);

cards.forEach((card) => {
  card.classList.add("hide");
  observer.observe(card);
});
