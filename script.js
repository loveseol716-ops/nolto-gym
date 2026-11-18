const api = "https://tdhdmlhwahxcadoeywxi.supabase.co/functions/v1/nolto-trial";
const days = document.querySelector("#days");
const slots = document.querySelector("#slots");
const range = document.querySelector("#range-title");
const previous = document.querySelector("#prev");
const next = document.querySelector("#next");
const retry = document.querySelector("#retry");
const video = document.querySelector("#class-video");
document.querySelector("#watch").addEventListener("click", () => {
  video.showModal();
  video.querySelector("video").play().catch(() => {});
});
video.addEventListener("close", () => video.querySelector("video").pause());

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
    title.textContent = item.label || "그룹 PT";
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
