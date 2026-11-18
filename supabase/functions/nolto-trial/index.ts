const site = "https://loveseol716-ops.github.io";
const cors = { "Access-Control-Allow-Origin": site, "Access-Control-Allow-Methods":"GET, POST, OPTIONS",
  "Access-Control-Allow-Headers":"content-type", "Cache-Control":"no-store", "Vary":"Origin" };
const encoder = new TextEncoder();
const hex = (b: ArrayBuffer) => Array.from(new Uint8Array(b), i => i.toString(16).padStart(2,"0")).join("");
const get = (key: string) => Deno.env.get(key)?.trim() || "";
const serverKey = get("SUPABASE_SERVICE_ROLE_KEY");
const base = get("SUPABASE_URL");
const json = (value: unknown, status=200) => Response.json(value, { status, headers:cors });

async function rpc(name: string, body: Record<string,unknown> = {}) {
  const r = await fetch(base + "/rest/v1/rpc/nolto_trial_" + name, { method:"POST",
    headers:{ "Content-Type":"application/json", apikey:serverKey, Authorization:"Bearer " + serverKey },
    body:JSON.stringify(body),signal:AbortSignal.timeout(12000) });
  if (!r.ok) throw new Error("database");
  const text = await r.text();
  return text ? JSON.parse(text) : null;
}
async function sign(secret: string, value: string) {
  const key = await crypto.subtle.importKey("raw",encoder.encode(secret), {name:"HMAC",hash:"SHA-256"},false,["sign"]);
  return hex(await crypto.subtle.sign("HMAC",key,encoder.encode(value)));
}
type Job = { id:string; recipient:"member"|"owner"; name:string; phone:string; day:string; time:string };
type Delivery = { status:"accepted"|"pending"|"review"; reason:string|null; group:string|null };
async function send(job: Job, key: string, secret: string, from: string, owner: string): Promise<Delivery> {
  const date = new Date().toISOString();
  const salt = crypto.randomUUID().replaceAll("-","");
  const signature = await sign(secret,date+salt);
  const visit = job.day + " " + job.time;
  const member = job.recipient === "member";
  const text = member
    ? "[놀토짐] 1주 체험 신청을 받았습니다. 희망 일정 " + visit + ". 코치가 자리 확인 후 연락드립니다. 체험비 39,000원은 첫 방문 시 현장에서 결제해 주세요."
    : "[놀토짐] 1주 체험 신규 신청\n" + job.name + " / " + job.phone + "\n희망 일정 " + visit + "\n자리 확인 후 신청자에게 연락해 주세요.";
  try {
    const response = await fetch("https://api.solapi.com/messages/v4/send-many/detail",{
      method:"POST", signal:AbortSignal.timeout(9000),
      headers:{"Content-Type":"application/json",Authorization:"HMAC-SHA256 apiKey="+key+", date="+date+", salt="+salt+", signature="+signature},
      body:JSON.stringify({messages:[{to:member?job.phone:owner,from,text,customFields:{trialNotice:job.id}}]})
    });
    if (response.status === 429 || response.status === 401 || response.status === 403) {
      return { status:"pending", reason:"provider_"+response.status, group:null };
    }
    if (!response.ok) return { status:"review", reason:"provider_"+response.status, group:null };
    const data = await response.json();
    const group = data.groupInfo?.groupId ?? null;
    if (!group || data.groupInfo?.count?.registeredSuccess !== 1 || data.failedMessageList?.length) {
      return {status:"review",reason:"provider_not_accepted",group};
    }
    return {status:"accepted",reason:null,group};
  } catch {
    // Ambiguous provider results require reconciliation; never blindly resend.
    return {status:"review",reason:"unknown_delivery",group:null};
  }
}
async function dispatch(ticket: unknown) {
  if (typeof ticket !== "string" || !/^[0-9a-f-]{36}$/i.test(ticket)) return json({},403);
  const key=get("SOLAPI_API_KEY"), secret=get("SOLAPI_API_SECRET");
  const from=get("SOLAPI_FROM").replace(/[-\s]/g,""), owner=get("NOLTO_TRIAL_OWNER_PHONE").replace(/[-\s]/g,"");
  const configured = Boolean(key && secret && /^\d{8,11}$/.test(from) && /^010\d{8}$/.test(owner));
  const jobs:Job[] = await rpc("claim",{p_ticket:ticket,p_configured:configured});
  await Promise.all(jobs.map(async job => {
    const delivery = await send(job,key,secret,from,owner);
    await rpc("finish",{p_id:job.id,p_status:delivery.status,p_reason:delivery.reason,p_group:delivery.group});
  }));
  return json({ok:true});
}

Deno.serve(async request => {
  const path = new URL(request.url).pathname.replace(/\/$/,"");
  const worker = path.endsWith("/dispatch");
  try {
    if (request.method === "OPTIONS") return new Response(null,{status:204,headers:cors});
    if (!worker && request.method === "GET") return json({slots:await rpc("slots")});
    if (request.method !== "POST") return json({},405);
    if (!worker && request.headers.get("origin") !== site) return json({},403);
    if (!request.headers.get("content-type")?.includes("application/json")) return json({},415);
    if (Number(request.headers.get("content-length"))>2048) return json({},413);
    const reader=request.body?.getReader();
    if (!reader) return json({},400);
    const decoder=new TextDecoder();
    let raw="",length=0;
    while (true) {
      const {done,value}=await reader.read();
      if (done) break;
      length+=value.length;
      if (length>2048) { await reader.cancel(); return json({},413); }
      raw+=decoder.decode(value,{stream:true});
    }
    let data;
    try { data=JSON.parse(raw+decoder.decode()); } catch { return json({},400); }
    if (!data || typeof data !== "object") return json({},400);
    if (worker) return await dispatch(data.ticket);
    if (typeof data.name !== "string" || typeof data.phone !== "string" ||
        typeof data.day !== "string" || typeof data.time !== "string" || data.consent !== true) return json({},400);
    const ip=request.headers.get("cf-connecting-ip") || request.headers.get("x-real-ip") ||
      request.headers.get("x-forwarded-for")?.split(",").pop()?.trim() || "unavailable";
    const token=await sign(serverKey,"nolto-trial/"+ip);
    const result=await rpc("submit",{p_name:data.name.trim(),p_phone:data.phone.replace(/[-\s]/g,""),
      p_day:data.day,p_time:data.time,p_consent:true,p_ip_hash:token});
    if (result === "accepted") return json({accepted:true},201);
    return json({accepted:false},result==="limited"?429:result==="slot_changed"?409:400);
  } catch {
    return json({error:"temporarily_unavailable"},503);
  }
});
