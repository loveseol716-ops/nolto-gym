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


/* Infinite Overview Carousel */

const featureScroll = document.getElementById("featureScroll");
const originalCards = Array.from(document.querySelectorAll(".feature-card"));
const slideDots = document.querySelectorAll(".slide-dot");
const carouselToggle = document.getElementById("carouselToggle");
const carouselControl = document.getElementById("carouselControl");

let currentFeature = 0;
let currentPosition = 0;
let carouselTimer = null;
let isPaused = false;
const slideDuration = 5000;

if (featureScroll && originalCards.length > 0) {
  const originalCount = originalCards.length;
  const beforeClones = originalCards.map((card) => card.cloneNode(true));
  const afterClones = originalCards.map((card) => card.cloneNode(true));

  featureScroll.innerHTML = "";

  beforeClones.forEach((card, index) => {
    card.classList.add("clone");
    card.dataset.realIndex = index;
    featureScroll.appendChild(card);
  });

  originalCards.forEach((card, index) => {
    card.dataset.realIndex = index;
    featureScroll.appendChild(card);
  });

  afterClones.forEach((card, index) => {
    card.classList.add("clone");
    card.dataset.realIndex = index;
    featureScroll.appendChild(card);
  });

  const allCards = Array.from(featureScroll.querySelectorAll(".feature-card"));
  currentPosition = originalCount;

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

  function scrollToPosition(position, smooth = true) {
    currentPosition = position;

    if (!allCards[currentPosition]) return;

    allCards[currentPosition].scrollIntoView({
      behavior: smooth ? "smooth" : "auto",
      inline: "center",
      block: "nearest",
    });
  }

  function normalizePosition() {
    if (currentPosition < originalCount) {
      currentPosition += originalCount;
      scrollToPosition(currentPosition, false);
    }

    if (currentPosition >= originalCount * 2) {
      currentPosition -= originalCount;
      scrollToPosition(currentPosition, false);
    }
  }

  function goToFeature(index) {
    currentFeature = (index + originalCount) % originalCount;
    scrollToPosition(originalCount + currentFeature, true);
    updateDots();
  }

  function goNextFeature() {
    currentPosition += 1;

    if (!allCards[currentPosition]) return;

    const realIndex = Number(allCards[currentPosition].dataset.realIndex);
    currentFeature = realIndex;

    scrollToPosition(currentPosition, true);
    updateDots();

    setTimeout(() => {
      normalizePosition();
    }, 520);
  }

  function startCarousel() {
    clearTimeout(carouselTimer);

    if (isPaused) return;

    carouselTimer = setTimeout(() => {
      goNextFeature();
      startCarousel();
    }, slideDuration);
  }

  function pauseCarousel() {
    isPaused = true;
    clearTimeout(carouselTimer);

    if (carouselControl) carouselControl.classList.add("paused");
    if (carouselToggle) {
      carouselToggle.classList.add("playing");
      carouselToggle.setAttribute("aria-label", "슬라이드 재생");
    }
  }

  function resumeCarousel() {
    isPaused = false;

    if (carouselControl) carouselControl.classList.remove("paused");
    if (carouselToggle) {
      carouselToggle.classList.remove("playing");
      carouselToggle.setAttribute("aria-label", "슬라이드 일시정지");
    }

    updateDots();
    startCarousel();
  }

  function detectClosestCard() {
    const center = featureScroll.scrollLeft + featureScroll.offsetWidth / 2;

    let closestIndex = 0;
    let closestDistance = Infinity;

    allCards.forEach((card, index) => {
      const cardCenter = card.offsetLeft + card.offsetWidth / 2;
      const distance = Math.abs(center - cardCenter);

      if (distance < closestDistance) {
        closestDistance = distance;
        closestIndex = index;
      }
    });

    currentPosition = closestIndex;
    currentFeature = Number(allCards[currentPosition].dataset.realIndex);

    updateDots();

    setTimeout(() => {
      normalizePosition();
    }, 80);
  }

  setTimeout(() => {
    scrollToPosition(originalCount, false);
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

  if (carouselToggle) {
    carouselToggle.addEventListener("click", () => {
      if (isPaused) {
        resumeCarousel();
      } else {
        pauseCarousel();
      }
    });
  }

  let scrollEndTimer = null;

  featureScroll.addEventListener("pointerdown", () => {
    pauseCarousel();
  });

  featureScroll.addEventListener("scroll", () => {
    clearTimeout(scrollEndTimer);

    scrollEndTimer = setTimeout(() => {
      detectClosestCard();
    }, 130);
  });
}


/* Program Accordion */

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

    if (!data) return;

    programItems.forEach((el) => el.classList.remove("active"));
    item.classList.add("active");

    if (programArt) {
      programArt.classList.remove("gentle-art", "bomb-art", "weekend-art");
      programArt.classList.add(data.artClass);
    }

    if (artLabel) artLabel.textContent = data.label;
    if (artTitle) artTitle.textContent = data.title;
  });
});


/* Schedule Selector */

const scheduleData = [
  {
    short: "MON",
    kr: "월요일",
    title: "Gentle로 시작하고 Bomb로 마무리하는 하루.",
    sessions: [
      { tag: "GENTLE", type: "gentle", time: "07:20", name: "Strength" },
      { tag: "BOMB", type: "bomb", time: "10:00", name: "Sweat" },
      { tag: "GENTLE", type: "gentle", time: "12:10", name: "Strength" },
      { tag: "GENTLE", type: "gentle", time: "18:20", name: "Strength" },
      { tag: "BOMB", type: "bomb", time: "19:30", name: "Sweat" },
      { tag: "GENTLE", type: "gentle", time: "20:40", name: "Strength" },
    ],
  },
  {
    short: "TUE",
    kr: "화요일",
    title: "가볍게 땀을 쌓고, 저녁에는 강하게 밀어붙이는 하루.",
    sessions: [
      { tag: "GENTLE", type: "gentle", time: "07:20", name: "Sweat" },
      { tag: "GENTLE", type: "gentle", time: "12:10", name: "Sweat" },
      { tag: "GENTLE", type: "gentle", time: "18:20", name: "Sweat" },
      { tag: "BOMB", type: "bomb", time: "19:30", name: "Strength" },
      { tag: "GENTLE", type: "gentle", time: "20:40", name: "Sweat" },
    ],
  },
  {
    short: "WED",
    kr: "수요일",
    title: "근력과 컨디셔닝을 번갈아 쌓는 중간 지점.",
    sessions: [
      { tag: "BOMB", type: "bomb", time: "07:20", name: "Strength" },
      { tag: "GENTLE", type: "gentle", time: "10:00", name: "Sweat" },
      { tag: "BOMB", type: "bomb", time: "12:10", name: "Strength" },
      { tag: "BOMB", type: "bomb", time: "18:20", name: "Strength" },
      { tag: "GENTLE", type: "gentle", time: "19:30", name: "Sweat" },
      { tag: "BOMB", type: "bomb", time: "20:40", name: "Strength" },
    ],
  },
  {
    short: "THU",
    kr: "목요일",
    title: "정해진 틀 밖에서 움직이는 스페셜 데이.",
    sessions: [
      { tag: "SPECIAL", type: "special", time: "19:30", name: "You in?" },
    ],
  },
  {
    short: "FRI",
    kr: "금요일",
    title: "한 주의 마지막을 가장 뜨겁게 마무리하는 하루.",
    sessions: [
      { tag: "BOMB", type: "bomb", time: "07:20", name: "Sweat" },
      { tag: "GENTLE", type: "gentle", time: "10:00", name: "Strength" },
      { tag: "BOMB", type: "bomb", time: "12:10", name: "Sweat" },
      { tag: "BOMB", type: "bomb", time: "18:20", name: "Sweat" },
      { tag: "GENTLE", type: "gentle", time: "19:30", name: "Strength" },
      { tag: "BOMB", type: "bomb", time: "20:40", name: "Sweat" },
    ],
  },
  {
    short: "SAT",
    kr: "토요일",
    title: "팀으로 함께 움직이는 놀토짐 주말 시그니처.",
    weekend: true,
    tag: "WEEKEND",
    time: "10:00",
    name: "Nolto & Team",
    desc: "90분 동안 팀으로 함께 움직이며, 놀토짐의 에너지와 커뮤니티를 가장 진하게 느낄 수 있는 수업.",
  },
  {
    short: "SUN",
    kr: "일요일",
    title: "한 주를 강하게 마무리하는 90분.",
    weekend: true,
    tag: "WEEKEND",
    time: "10:00",
    name: "No More Weak",
    desc: "강도 높은 트레이닝으로 한 주를 마무리하고, 다음 주를 더 강하게 준비하는 일요일 시그니처 수업.",
  },
];

const scheduleCard = document.getElementById("scheduleCard");
const scheduleShort = document.getElementById("scheduleShort");
const scheduleKr = document.getElementById("scheduleKr");
const scheduleTitle = document.getElementById("scheduleTitle");
const scheduleBody = document.getElementById("scheduleBody");
const dayTabs = document.querySelectorAll(".day-tab");
const schedulePrev = document.getElementById("schedulePrev");
const scheduleNext = document.getElementById("scheduleNext");

let currentDay = 0;

function renderSchedule(index) {
  if (!scheduleCard || !scheduleShort || !scheduleKr || !scheduleTitle || !scheduleBody) return;

  currentDay = (index + scheduleData.length) % scheduleData.length;
  const data = scheduleData[currentDay];

  scheduleCard.dataset.bg = data.short;
  scheduleCard.classList.toggle("is-weekend", Boolean(data.weekend));
  scheduleShort.textContent = data.short;
  scheduleKr.textContent = data.kr;
  scheduleTitle.textContent = data.title;

  dayTabs.forEach((tab, tabIndex) => {
    tab.classList.toggle("active", tabIndex === currentDay);
  });

  const activeTab = document.querySelector(".day-tab.active");
  if (activeTab) {
    activeTab.scrollIntoView({
      behavior: "smooth",
      inline: "center",
      block: "nearest",
    });
  }

  if (data.weekend) {
    scheduleBody.innerHTML = `
      <div class="schedule-weekend">
        <div class="weekend-topline">
          <span class="session-tag weekend-tag">${data.tag}</span>
          <p>90 MIN SIGNATURE</p>
        </div>

        <div class="weekend-main">
          <h3>${data.time}</h3>
          <strong>${data.name}</strong>
          <p>${data.desc}</p>
        </div>
      </div>
    `;
    return;
  }

  scheduleBody.innerHTML = `
    <div class="schedule-session-list">
      ${data.sessions
        .map(
          (session) => `
            <div class="schedule-session">
              <span class="session-tag ${session.type}-tag">${session.tag}</span>
              <time>${session.time}</time>
              <p>${session.name}</p>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}

if (scheduleCard) {
  renderSchedule(0);

  dayTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      renderSchedule(Number(tab.dataset.day));
    });
  });

  if (schedulePrev) {
    schedulePrev.addEventListener("click", () => {
      renderSchedule(currentDay - 1);
    });
  }

  if (scheduleNext) {
    scheduleNext.addEventListener("click", () => {
      renderSchedule(currentDay + 1);
    });
  }
}


/* Video Modal */

const openVideo = document.getElementById("openVideo");
const closeVideo = document.getElementById("closeVideo");
const closeVideoBackdrop = document.getElementById("closeVideoBackdrop");
const videoModal = document.getElementById("videoModal");
const introVideo = document.getElementById("introVideo");

function openVideoModal() {
  if (!videoModal) return;

  videoModal.classList.add("active");
  videoModal.setAttribute("aria-hidden", "false");
  document.body.style.overflow = "hidden";

  if (introVideo) {
    introVideo.currentTime = 0;
  }
}

function closeVideoModal() {
  if (!videoModal) return;

  videoModal.classList.remove("active");
  videoModal.setAttribute("aria-hidden", "true");
  document.body.style.overflow = "";

  if (introVideo) {
    introVideo.pause();
    introVideo.currentTime = 0;
  }
}

if (openVideo) {
  openVideo.addEventListener("click", openVideoModal);
}

if (closeVideo) {
  closeVideo.addEventListener("click", closeVideoModal);
}

if (closeVideoBackdrop) {
  closeVideoBackdrop.addEventListener("click", closeVideoModal);
}

if (videoModal) {
  videoModal.addEventListener("click", (event) => {
    if (event.target === videoModal) {
      closeVideoModal();
    }
  });
}

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeVideoModal();
  }
});
