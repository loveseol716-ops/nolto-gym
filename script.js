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
    threshold: 0.14,
  }
);

revealElements.forEach((element) => {
  revealObserver.observe(element);
});

const bgWord = document.querySelector(".bg-word");

window.addEventListener("scroll", () => {
  const y = window.scrollY;

  if (bgWord) {
    bgWord.style.transform = `translateX(${y * 0.08}px) rotate(-4deg)`;
  }
});

const programData = {
  gentle: {
    label: "GENTLE",
    title: "MOVE BETTER",
    artClass: "gentle-art",
  },
  bomb: {
    label: "BOMB",
    title: "SWEAT HARDER",
    artClass: "bomb-art",
  },
  weekend: {
    label: "WEEKEND",
    title: "TRAIN TOGETHER",
    artClass: "weekend-art",
  },
};

const programItems = document.querySelectorAll(".program-item");
const programArt = document.getElementById("programArt");
const artLabel = document.getElementById("artLabel");
const artTitle = document.getElementById("artTitle");

programItems.forEach((item) => {
  item.addEventListener("click", () => {
    const key = item.dataset.program;
    const data = programData[key];

    programItems.forEach((el) => el.classList.remove("active"));
    item.classList.add("active");

    programArt.classList.remove("gentle-art", "bomb-art", "weekend-art");
    programArt.classList.add(data.artClass);

    artLabel.textContent = data.label;
    artTitle.textContent = data.title;
  });
});

const openVideo = document.getElementById("openVideo");
const closeVideo = document.getElementById("closeVideo");
const videoModal = document.getElementById("videoModal");

if (openVideo && closeVideo && videoModal) {
  openVideo.addEventListener("click", () => {
    videoModal.classList.add("open");
    document.body.style.overflow = "hidden";
  });

  closeVideo.addEventListener("click", () => {
    videoModal.classList.remove("open");
    document.body.style.overflow = "";
  });

  videoModal.addEventListener("click", (event) => {
    if (event.target === videoModal) {
      videoModal.classList.remove("open");
      document.body.style.overflow = "";
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      videoModal.classList.remove("open");
      document.body.style.overflow = "";
    }
  });
}
