const one = selector => document.querySelector(selector);
const sequence = one(".sequence");
const reduced = matchMedia("(prefers-reduced-motion: reduce)");
let pending = false;
function paint() {
  pending = false;
  const rect = sequence.getBoundingClientRect();
  const progress = Math.min(1, Math.max(0, -rect.top / Math.max(1,rect.height - one(".stage").offsetHeight)));
  const close = progress >= .5;
  sequence.style.setProperty("--progress", reduced.matches ? Number(close) : progress);
  one("#scene-step").textContent = close ? "02 / 02" : "01 / 02";
  one("#scene-title").textContent = close ? "한 사람의 다음 세트까지." : "같은 공간에서,";
  one("#scene-body").textContent = close ? "코치와 자세를 확인하고, 다음 세트의 무게를 정해요." : "오늘의 동작을 함께 익힙니다.";
}
function requestPaint(){if(!pending){pending=true;requestAnimationFrame(paint)}}
addEventListener("scroll",requestPaint,{passive:true});
addEventListener("resize",requestPaint);
paint();

const types = {
  sweat: [
    ["GENTLE SWEAT","내 페이스로 오래","순수 운동 30–40분 · RPE 4–6","운동 2–4 : 휴식 1"],
    ["BOMB SWEAT","짧고 강하게","순수 운동 15분 미만 · RPE 7–9","강한 구간 사이 충분히 회복"]
  ],
  strength: [
    ["GENTLE STRENGTH","자세를 익히며 여러 번","근지구력 · 여유 있는 중량","반복마다 같은 자세를 유지해요"],
    ["BOMB STRENGTH","한 번에 더 큰 힘을","최대근력 · 높은 중량","세트 사이 충분히 쉬어요"]
  ]
};
const curves=["0,28 5,14 22,14 24,26 28,26 31,14 49,14 52,26 56,26 59,14 78,14 81,26 85,26 88,14 100,14","0,28 4,28 7,3 13,3 16,28 35,28 38,3 44,3 47,28 69,28 72,3 78,3 81,28 100,28"];
let type="sweat", selected=0, entries=null, failure=false;
const cards=one("#cards"), slots=one("#slots");
function schedules(){
  const name=types[type][selected][0];
  one("#class-label").textContent=name;
  slots.replaceChildren();
  if(failure){
    slots.append("일정을 불러오지 못했어요. ");
    const retry=document.createElement("button");retry.textContent="다시 보기";retry.onclick=load;slots.append(retry);return;
  }
  if(!entries){slots.textContent="일정을 불러오고 있어요.";return}
  const times=entries.filter(s=>s.label?.trim().toUpperCase()===name).sort((a,b)=>(a.day+a.time).localeCompare(b.day+b.time)).slice(0,4);
  if(!times.length){slots.textContent="지금 신청할 수 있는 이 수업 일정이 없어요. 전체 시간표에서 다른 수업을 확인해 주세요.";return}
  const list=document.createElement("div");list.className="times";
  for(const s of times){
    const a=document.createElement("a");
    const day=new Intl.DateTimeFormat("ko-KR",{month:"numeric",day:"numeric",weekday:"short",timeZone:"Asia/Seoul"}).format(new Date(s.day+"T12:00:00+09:00"));
    a.href="../trial/?"+new URLSearchParams({date:s.day,time:s.time});
    a.className="time";a.textContent=day+" "+s.time+" ↗";list.append(a);
  }
  slots.append(list);
}
function choose(index){
  selected=index;
  [...cards.children].forEach((el,i)=>el.setAttribute("aria-pressed",String(index===i)));
  schedules();
}
function render(){
  const cardio=type==="sweat";
  one("#class-img").src="../assets/home/"+(cardio?"class-row.webp":"class-squat.webp");
  one("#class-img").alt=cardio?"놀토짐 로잉머신 운동":"놀토짐 백 스쿼트 운동";
  one("#photo-caption").textContent=cardio?"로잉머신에서 배우는 두 가지 페이스":"바벨로 배우는 두 가지 근력 훈련";
  cards.replaceChildren();
  types[type].forEach(([name,title,metric,rest],i)=>{
    const btn=document.createElement("button");btn.className="card";btn.type="button";
    btn.innerHTML='<span class="tag">'+name+'</span><b>'+title+'</b><div class="wave" aria-hidden="true"><svg viewBox="0 0 100 32" preserveAspectRatio="none"><polyline fill="none" vector-effect="non-scaling-stroke" stroke="currentColor" stroke-width="2" points="'+curves[i]+'"/></svg></div><small>'+metric+' · '+rest+'</small>';
    btn.onclick=()=>choose(i);cards.append(btn);
  });
  choose(0);
}
for(const tab of document.querySelectorAll("[data-type]")){
  tab.onclick=()=>{type=tab.dataset.type;document.querySelectorAll("[data-type]").forEach(t=>t.setAttribute("aria-pressed",String(t===tab)));render()};
}
one("#pause").onclick=event=>{const paused=cards.classList.toggle("paused");event.currentTarget.setAttribute("aria-pressed",String(paused));event.currentTarget.textContent=paused?"리듬 재생 ▷":"리듬 멈추기 Ⅱ"};
async function load(){
  failure=false;entries=null;schedules();
  try{
    const res=await fetch("https://tdhdmlhwahxcadoeywxi.supabase.co/functions/v1/nolto-trial",{cache:"no-store",signal:AbortSignal.timeout(15000)});
    if(!res.ok)throw Error();
    const payload=await res.json();if(!Array.isArray(payload.slots))throw Error();
    entries=payload.slots;
  }catch{failure=true}
  schedules();
}
render();load();
