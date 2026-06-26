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

/* === Infinite Carousel === */

const featureScroll = document.getElementById("featureScroll");
const originalCards = Array.from(document.querySelectorAll(".feature-card"));
const slideDots = document.querySelectorAll(".slide-dot");
const carouselToggle = document.getElementById("carouselToggle");
const carouselControl = document.getElementById("carouselControl");

let currentFeature = 0;
let carouselTimer = null;
let isPaused = false;
const slideDuration = 5000;

if (featureScroll && originalCards.length > 0) {
  const firstClone = originalCards[0].cloneNode(true);
  const lastClone = originalCards[originalCards.length - 1].cloneNode(true);

  firstClone.classList.add("clone");
  lastClone.classList.add("clone");

  featureScroll.insertBefore(lastClone, originalCards[0]);
  featureScroll.appendChild(firstClone);

  const allCards = Array.from(featureScroll.querySelectorAll(".feature-card"));
  let visualIndex = 1;

  function resetDotAnimation() {
    slideDots.forEach((dot) => {
      const bar = dot.querySelector("span");

      if (bar) {
        bar.style.animation = "none";
        void bar.offsetWidth;
        bar.style.animation = "";
      }
    });
  }

  function updateDots() {
    slideDots.forEach((dot, index) => {
      dot.classList.toggle("active", index === currentFeature);
    });

    resetDotAnimation();
  }

  function scrollToVisual(index, smooth = true) {
    visualIndex = index;

    allCards[visualIndex].scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      inline: "center",
      block: "nearest",
    });
  }

  function goToFeature(index) {
    currentFeature = (index + originalCards.length) % originalCards.length;
    scrollToVisual(currentFeature + 1, true);
    updateDots();
  }

  function startCarousel() {
    clearTimeout(carouselTimer);

    if (isPaused) return;

    carouselTimer = setTimeout(() => {
      goToFeature(currentFeature + 1);
      startCarousel();
    }, slideDuration);
  }

  function pauseCarousel() {
    isPaused = true;
    clearTimeout(carouselTimer);
    carouselControl.classList.add("paused");
    carouselToggle.classList.add("playing");
    carouselToggle.setAttribute("aria-label", "슬라이드 재생");
  }

  function resumeCarousel() {
    isPaused = false;
    carouselControl.classList.remove("paused");
    carouselToggle.classList.remove("playing");
    carouselToggle.setAttribute("aria-label", "슬라이드 일시정지");
    updateDots();
    startCarousel();
  }

  function detectCurrentCard() {
    const scrollCenter = featureScroll.scrollLeft + featureScroll.offsetWidth / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    allCards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(scrollCenter - cardCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    visualIndex = closestIndex;

    if (visualIndex === 0) {
      currentFeature = originalCards.length - 1;
      setTimeout(() => {
        scrollToVisual(originalCards.length, false);
      }, 80);
    } else if (visualIndex === allCards.length - 1) {
      currentFeature = 0;
      setTimeout(() => {
        scrollToVisual(1, false);
      }, 80);
    } else {
      currentFeature = visualIndex - 1;
    }

    updateDots();
  }

  setTimeout(() => {
    scrollToVisual(1, false);
    updateDots();
    startCarousel();
  }, 100);

  slideDots.forEach((dot) => {
    dot.addEventListener("click", () => {
      const index = Number(dot.dataset.index);
      goToFeature(index);

      if (!isPaused) {
        startCarousel();
      }
    });
  });

  carouselToggle.addEventListener("click", () => {
    if (isPaused) {
      resumeCarousel();
    } else {
      pauseCarousel();
    }
  });

  let scrollEndTimer = null;

  featureScroll.addEventListener("pointerdown", () => {
    pauseCarousel();
  });

  featureScroll.addEventListener("scroll", () => {
    clearTimeout(scrollEndTimer);

    scrollEndTimer = setTimeout(() => {
      detectCurrentCard();
    }, 120);
  });
}

/* === Program Accordion === */

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

/* === Video Modal === */

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
