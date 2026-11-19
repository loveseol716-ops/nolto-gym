const api = "https://tdhdmlhwahxcadoeywxi.supabase.co/functions/v1/nolto-trial";
const days = document.querySelector("#days");
const slots = document.querySelector("#slots");
const range = document.querySelector("#range-title");
const previous = document.querySelector("#prev");
const next = document.querySelector("#next");
const retry = document.querySelector("#retry");
const programs = {
  "GENTLE STRENGTH": ["근력 기본기", "기본", "여유 있는 중량으로 동작을 반복하며 자세와 근지구력을 다져요."],
  "BOMB STRENGTH": ["고중량 근력", "도전", "세트 사이 충분히 쉬며 더 무거운 중량을 안정적으로 드는 연습을 해요."],
  "GENTLE SWEAT": ["지속형 유산소", "기본", "로잉과 스키 등에서 오래 유지할 수 있는 속도를 찾고 지구력을 길러요."],
  "BOMB SWEAT": ["고강도 인터벌", "도전", "짧고 강한 운동과 회복을 반복하며 여러 구간에서 높은 출력을 내는 연습을 해요."],
  "YOU IN": ["목요일 스페셜", "주제별", "주차별 프로그램에 따라 수업 내용과 강도가 달라져요."],
  "NOLTO & TEAM": ["팀 트레이닝", "팀 세션", "팀원과 함께 과제를 수행하며 호흡을 맞추는 수업이에요."],
  "NO MORE WEAK": ["일요일 집중 훈련", "90분", "긴 세션으로 그 주의 훈련 주제에 집중해요."]
};
const guide = document.querySelector("#class-guide");
for (const [name, [goal, level, description]] of Object.entries(programs)) {
  const term = document.createElement("dt");
  term.textContent = name + " · " + goal;
  const detail = document.createElement("dd");
  detail.textContent = level + " ｜ " + description;
  guide.append(term, detail);
}
const goal = document.querySelector("#goal");
const experience = document.querySelector("#experience");
const suggestion = document.querySelector("#suggestion");
function updateSuggestion() {
  suggestion.replaceChildren();
  if (!goal.value || !experience.value) return;
  const name = (experience.value + " " + goal.value).toUpperCase();
  const [focus, level, description] = programs[name];
  const heading = document.createElement("strong");
  heading.textContent = name + " · " + focus;
  const reason = document.createElement("p");
  reason.textContent = level + " 단계 ｜ " + description;
  suggestion.append(heading, reason);
  const match = entries.find(item => item.label?.trim().toUpperCase() === name);
  if (match) {
    const link = document.createElement("a");
    link.className = "text-link";
    link.href = "./trial/?" + new URLSearchParams({date:match.day, time:match.time});
    link.textContent = match.day.slice(5).replace("-", "/") + " " + match.time + " 체험 신청 ↗";
    suggestion.append(link);
  }
}
goal.addEventListener("change", updateSuggestion);
experience.addEventListener("change", updateSuggestion);

const dayInMs = 86400000;
const seoulToday = new Intl.DateTimeFormat("sv-SE", { timeZone:"Asia/Seoul" }).format(new Date());
const firstDay = Date.parse(seoulToday + "T00:00:00Z");
const dayAt = offset => new Date(firstDay + offset * dayInMs);
const keyAt = offset => dayAt(offset).toISOString().slice(0,10);
const weekDay = new Intl.DateTimeFormat("ko-KR", { timeZone:"UTC", weekday:"short" });
const shortDate = new Intl.DateTimeFormat("ko-KR", { timeZone:"UTC", month:"long", day:"numeric" });
let entries = [];
let start = 0;
let selected = "";

function message(text) {
  const p = document.createElement("p");
  p.textContent = text;
  slots.replaceChildren(p);
}
function showSessions() {
  for (const btn of days.querySelectorAll("button")) {
    btn.setAttribute("aria-pressed", String(btn.dataset.day === selected));
  }
  const items = entries.filter(item => item.day === selected);
  if (!items.length) { message("이 날짜에는 온라인으로 신청할 수 있는 수업이 없습니다."); return; }
  const links = items.map(item => {
    const link = document.createElement("a");
    link.className = "slot";
    const params = new URLSearchParams({ date:item.day, time:item.time });
    link.href = "./trial/?" + params;
    const time = document.createElement("time");
    time.dateTime = item.time;
    time.textContent = item.time;
    const title = document.createElement("small");
    const program = programs[item.label?.trim().toUpperCase()];
    title.textContent = program ? item.label + " · " + program[0] : item.label || "그룹 PT";
    const arrow = document.createElement("span");
    arrow.textContent = "↗";
    arrow.className = "arrow";
    arrow.setAttribute("aria-hidden","true");
    link.append(time,title,arrow);
    link.setAttribute("aria-label",item.day + " " + item.time + " " + title.textContent + " 체험 신청");
    return link;
  });
  slots.replaceChildren(...links);
}
function renderWeek() {
  const last = start + 6;
  previous.disabled = start === 0;
  next.disabled = start === 21;
  range.textContent = shortDate.format(dayAt(start)) + " – " + shortDate.format(dayAt(last));
  selected = entries.find(item => item.day >= keyAt(start) && item.day <= keyAt(last))?.day || keyAt(start);
  const buttons = Array.from({length:7}, (_, i) => {
    const offset = start + i;
    const date = dayAt(offset);
    const day = keyAt(offset);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.dataset.day = day;
    btn.setAttribute("aria-label",shortDate.format(date) + " " + weekDay.format(date) + "요일");
    const weekday = document.createElement("small");
    weekday.textContent = weekDay.format(date);
    const number = document.createElement("strong");
    number.textContent = date.getUTCDate();
    btn.append(weekday,number);
    btn.addEventListener("click", () => { selected = day; showSessions(); });
    return btn;
  });
  days.replaceChildren(...buttons);
  showSessions();
}
async function load() {
  retry.hidden = true;
  previous.disabled = next.disabled = true;
  message("수업 시간을 불러오는 중입니다.");
  try {
    const response = await fetch(api, {cache:"no-store",signal:AbortSignal.timeout(15000)});
    if (!response.ok) throw Error();
    const payload = await response.json();
    if (!Array.isArray(payload.slots)) throw Error();
    entries = payload.slots;
    updateSuggestion();
    renderWeek();
  } catch {
    days.replaceChildren();
    message("시간표를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.");
    retry.hidden = false;
  }
}
previous.addEventListener("click", () => { start -= 7; renderWeek(); });
next.addEventListener("click", () => { start += 7; renderWeek(); });
retry.addEventListener("click",load);
load();

