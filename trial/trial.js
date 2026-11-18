const api = "https://tdhdmlhwahxcadoeywxi.supabase.co/functions/v1/nolto-trial";
const form = document.querySelector("#application");
const fields = form.elements;
const dates = fields.date;
const times = fields.time;
const submit = form.querySelector('button[type="submit"]');
const retry = document.querySelector("#reload");
const scheduleStatus = document.querySelector("#schedule-status");
const status = document.querySelector("#form-status");
const receipt = document.querySelector("#receipt");
const formatDate = new Intl.DateTimeFormat("ko-KR", { month:"long", day:"numeric", weekday:"short", timeZone:"Asia/Seoul" });
let slots = [];
let sending = false;
const requested = new URLSearchParams(location.search);
let prefillPending = requested.has("date") && requested.has("time");

function clearSelect(select, title) {
  select.replaceChildren(new Option(title, ""));
  select.disabled = true;
}
function dateLabel(value) {
  return formatDate.format(new Date(value + "T12:00:00+09:00"));
}
function showTimes() {
  clearSelect(times, "시간을 선택해 주세요");
  for (const slot of slots.filter(item => item.day === dates.value)) {
    times.add(new Option(slot.label ? slot.time + " · " + slot.label : slot.time, slot.time));
  }
  times.disabled = times.options.length < 2;
  submit.disabled = !times.value;
}
async function loadSlots() {
  slots = [];
  clearSelect(dates, "일정 불러오는 중…");
  clearSelect(times, "날짜를 먼저 선택해 주세요");
  retry.hidden = true;
  submit.disabled = true;
  scheduleStatus.textContent = "";
  try {
    const response = await fetch(api, { cache:"no-store", signal:AbortSignal.timeout(15000) });
    if (!response.ok) throw new Error();
    slots = (await response.json()).slots;
    if (!Array.isArray(slots)) throw new Error();
    clearSelect(dates, "날짜를 선택해 주세요");
    for (const day of new Set(slots.map(slot => slot.day))) dates.add(new Option(dateLabel(day), day));
    dates.disabled = !slots.length;
    if (prefillPending) {
      prefillPending = false;
      const day = requested.get("date"), time = requested.get("time");
      if (slots.some(slot => slot.day === day && slot.time === time)) {
        dates.value = day;
        showTimes();
        times.value = time;
        submit.disabled = false;
      } else {
        scheduleStatus.textContent = "선택한 수업의 일정이 바뀌었습니다. 다른 날짜나 시간을 선택해 주세요.";
      }
    }
    if (!slots.length) scheduleStatus.textContent = "현재 신청할 수 있는 일정이 없습니다.";
  } catch {
    scheduleStatus.textContent = "시간표를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.";
    retry.hidden = false;
  }
}
dates.addEventListener("change", showTimes);
times.addEventListener("change", () => { submit.disabled = !times.value; });
retry.addEventListener("click", loadSlots);
fields.phone.addEventListener("input", () => fields.phone.setCustomValidity(""));
fields.name.addEventListener("input", () => fields.name.setCustomValidity(""));
form.addEventListener("submit", async event => {
  event.preventDefault();
  if (sending || !form.reportValidity() || !times.value) return;
  const name = fields.name.value.trim();
  const phone = fields.phone.value.replace(/[\s-]/g, "");
  if (!name) fields.name.setCustomValidity("이름을 입력해 주세요.");
  if (!/^010\d{8}$/.test(phone)) fields.phone.setCustomValidity("010으로 시작하는 휴대폰 번호 11자리를 확인해 주세요.");
  if (!form.reportValidity()) return;
  const day = dates.value, time = times.value;
  sending = true;
  submit.disabled = true;
  form.setAttribute("aria-busy", "true");
  for (const group of form.querySelectorAll("fieldset")) group.disabled = true;
  status.textContent = "신청을 접수하고 있습니다…";
  try {
    const response = await fetch(api, {
      method:"POST", headers:{ "Content-Type":"application/json" },
      body:JSON.stringify({ name, phone, day, time, consent:fields.consent.checked }), signal:AbortSignal.timeout(18000)
    });
    const result = await response.json();
    if (response.status === 409) {
      await loadSlots();
      throw new Error("일정이 변경되었습니다. 날짜와 시간을 다시 선택해 주세요.");
    }
    if (response.status === 429) throw new Error("신청이 집중되고 있습니다. 잠시 후 다시 시도해 주세요.");
    if (response.status === 400) throw new Error("입력한 정보와 동의 여부를 확인해 주세요.");
    if (!response.ok || result.accepted !== true) throw new Error();
    document.querySelector("#receipt-slot").textContent = dateLabel(day) + " " + time;
    form.reset();
    form.hidden = true;
    receipt.hidden = false;
    receipt.focus();
  } catch (err) {
    const fallback = "접수 결과를 확인하지 못했습니다. 같은 정보로 다시 신청해 주세요. 중복 접수되지 않습니다.";
    status.textContent = err instanceof Error && /^(일정이|신청이|입력한)/.test(err.message) ? err.message : fallback;
  } finally {
    sending = false;
    form.removeAttribute("aria-busy");
    for (const group of form.querySelectorAll("fieldset")) group.disabled = false;
    submit.disabled = !times.value;
  }
});
loadSlots();
