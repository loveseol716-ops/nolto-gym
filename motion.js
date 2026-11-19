const weeks = [...document.querySelectorAll(".week-stories article")];
const bars = document.querySelector("#week-bars");
// Relative effort illustrates the regular block, not an individual prescription.
const effort = [4, 5, 5.5, 6, 7, 8, 4, 6.5, 7.5, 8.5, 9, 9];
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
for (const [i, week] of weeks.entries()) {
  const button = document.createElement("button");
  button.type = "button";
  button.setAttribute("aria-label", (i + 1) + "주 " + week.dataset.phase);
  button.style.setProperty("--height", effort[i] * 10 + "%");
  button.addEventListener("click", () => week.scrollIntoView({block:"center", behavior:reduceMotion.matches ? "instant" : "smooth"}));
  const number = document.createElement("span");
  number.textContent = i + 1;
  button.append(number);
  bars.append(button);
}
let active = -1;
function highlightWeek() {
  const guide = innerHeight * (innerWidth < 761 ? .66 : .52);
  let index = 0;
  for (const [i, week] of weeks.entries()) {
    if (week.getBoundingClientRect().top <= guide) index = i;
  }
  if (index === active) return;
  active = index;
  weeks.forEach((week, i) => {
    week.classList.toggle("current", i === index);
    bars.children[i].classList.toggle("passed", i < index);
    bars.children[i].setAttribute("aria-pressed", String(i === index));
  });
  document.querySelector("#week-number").firstChild.textContent = String(index + 1).padStart(2, "0") + " ";
  document.querySelector("#week-focus").textContent = (index + 1) + "주 · " + weeks[index].dataset.phase;
}
let scheduled = false;
function requestWeek() {
  if (scheduled) return;
  scheduled = true;
  requestAnimationFrame(() => { scheduled = false; highlightWeek(); });
}
addEventListener("scroll", requestWeek, {passive:true});
addEventListener("resize", requestWeek);
highlightWeek();

const form = document.querySelector("#lift-form");
const kg = document.querySelector("#lift-kg");
const recent = document.querySelector("#recent-set");
const caption = document.querySelector("#lift-caption");
const result = document.querySelector("#lift-result");
const detail = document.querySelector("#lift-detail");
let frame;
form.addEventListener("input", () => {
  cancelAnimationFrame(frame);
  const estimate = form.elements.basis.value === "set";
  const switchMode = recent.disabled === estimate;
  recent.hidden = recent.disabled = !estimate;
  if (switchMode) kg.value = "";
  document.querySelector("#kg-label").textContent = estimate ? "최근 세트의 무게 (kg)" : "백 스쿼트 1RM (kg)";
  result.textContent = "—";
  caption.textContent = "백 스쿼트 · 첫 세트 예시";
  detail.textContent = "목표 8회 · RPE 7";
});
form.addEventListener("submit", event => {
  event.preventDefault();
  const weight = kg.valueAsNumber;
  const estimate = !recent.disabled;
  const reps = document.querySelector("#lift-reps").valueAsNumber;
  const rpe = Number(document.querySelector("#lift-rpe").value);
  const max = estimate && !(reps === 1 && rpe === 10) ? weight * (1 + (reps + 10 - rpe) / 30) : weight;
  const load = Math.min(max / (1 + 11 / 30), estimate ? weight * 1.05 : Infinity);
  const target = load < 2.5 ? Math.floor(load * 10) / 10 : Math.floor(load / 2.5) * 2.5;
  caption.textContent = document.querySelector("#lift-name").value.trim() + "님의 첫 세트 추천";
  detail.textContent = (estimate ? "추정" : "입력한") + " 1RM " + Number(max.toFixed(1)) + "kg 기준 · 8회 × RPE 7";
  const start = performance.now();
  cancelAnimationFrame(frame);
  function display(now) {
    const progress = reduceMotion.matches ? 1 : Math.min(1, (now - start) / 430);
    result.textContent = String(progress === 1 ? target : Math.round(target * progress));
    if (progress < 1) frame = requestAnimationFrame(display);
  }
  frame = requestAnimationFrame(display);
});

const switches = document.querySelectorAll("[data-compare]");
for (const button of switches) {
  button.addEventListener("click", () => {
    for (const option of switches) {
      const chosen = option === button;
      option.setAttribute("aria-pressed", String(chosen));
      document.getElementById(option.dataset.compare).hidden = !chosen;
    }
  });
}
