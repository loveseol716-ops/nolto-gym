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

const featureScroll = document.getElementById("featureScroll");
const featureCards = document.querySelectorAll(".feature-card");
const progressBar = document.getElementById("progressBar");
const carouselCount = document.getElementById("carouselCount");

let currentFeature = 0;
let carouselTimer;

function startProgress() {
  progressBar.classList.remove("running");
  void progressBar.offsetWidth;
  progressBar.classList.add("running");
}

function goToFeature(index) {
  if (!featureScroll || featureCards.length === 0) return;

  currentFeature = index % featureCards.length;

  featureCards[currentFeature].scrollIntoView({
    behavior: "smooth",
    inline: "start",
    block: "nearest",
  });

  carouselCount.textContent = `${String(currentFeature + 1).padStart(2, "0")} / ${String(featureCards.length).padStart(2, "0")}`;

  startProgress();
}

function startCarousel() {
  if (!featureScroll || featureCards.length === 0) return;

  startProgress();

  carouselTimer = setInterval(() => {
    goToFeature(currentFeature + 1);
  }, 5000);
}

if (featureScroll && featureCards.length > 0) {
  startCarousel();

  featureScroll.addEventListener("pointerdown", () => {
    clearInterval(carouselTimer);
    progressBar.classList.remove("running");
  });

  featureScroll.addEventListener("pointerup", () => {
    const cardWidth = featureCards[0].offsetWidth + 18;
    currentFeature = Math.round(featureScroll.scrollLeft / cardWidth);
    goToFeature(currentFeature);
    startCarousel();
  });
}

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
