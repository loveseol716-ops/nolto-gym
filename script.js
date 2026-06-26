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
    title: "처음부터 무리하지 않고, 기본기를 만드는 수업.",
    text:
      "Gentle Strength는 근력운동의 기본기와 움직임을 만들고, Gentle Sweat는 부담스럽지 않은 강도로 체력과 심폐지구력을 키웁니다.",
    visualText: "GENTLE IMAGE AREA",
    visualClass: "gentle-visual",
  },
  bomb: {
    label: "BOMB",
    title: "더 강하게 땀 흘리고, 수행능력을 끌어올리는 수업.",
    text:
      "Bomb Strength는 도전적인 근력 트레이닝, Bomb Sweat는 고강도 컨디셔닝을 통해 운동 수행능력을 끌어올립니다.",
    visualText: "BOMB IMAGE AREA",
    visualClass: "bomb-visual",
  },
  weekend: {
    label: "WEEKEND",
    title: "놀토짐의 팀 분위기와 에너지를 느끼는 90분 수업.",
    text:
      "토요일 Nolto & Team은 팀 기반 트레이닝, 일요일 No More Weak는 한 주를 강하게 마무리하는 고강도 프로그램입니다.",
    visualText: "WEEKEND IMAGE AREA",
    visualClass: "weekend-visual",
  },
};

const tabButtons = document.querySelectorAll(".tab-btn");
const programLabel = document.getElementById("programLabel");
const programTitle = document.getElementById("programTitle");
const programText = document.getElementById("programText");
const programVisual = document.getElementById("programVisual");
const programVisualText = document.getElementById("programVisualText");

tabButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const key = button.dataset.program;
    const data = programData[key];

    tabButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    programLabel.textContent = data.label;
    programTitle.textContent = data.title;
    programText.textContent = data.text;
    programVisualText.textContent = data.visualText;

    programVisual.classList.remove("gentle-visual", "bomb-visual", "weekend-visual");
    programVisual.classList.add(data.visualClass);
  });
});

const openVideo = document.getElementById("openVideo");
const closeVideo = document.getElementById("closeVideo");
const videoModal = document.getElementById("videoModal");

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
