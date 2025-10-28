// 简易 Base64 编解码（支持中文）
function encodeObj(obj){
  const json = JSON.stringify(obj);
  return btoa(unescape(encodeURIComponent(json)));
}
function decodeObj(b64){
  const json = decodeURIComponent(escape(atob(b64)));
  return JSON.parse(json);
}

function byId(id){return document.getElementById(id);}

const FORM_KEYS = [
  "name","age","blood","allergy","meds","conditions","address",
  "c1_name","c1_relation","c1_phone",
  "c2_name","c2_relation","c2_phone"
];

const STORAGE_KEY = "emergency_card_v1";

function readForm(){
  const data = {};
  FORM_KEYS.forEach(k => data[k] = (byId(k).value || "").trim());
  return data;
}
function writeForm(data){
  FORM_KEYS.forEach(k => { if (k in data) byId(k).value = data[k] || ""; });
}
function saveLocal(data){
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); }catch(e){}
}
function loadLocal(){
  try{
    const s = localStorage.getItem(STORAGE_KEY);
    if (!s) return null;
    return JSON.parse(s);
  }catch(e){ return null; }
}

function fillPreview(data){
  const set = (id, val) => byId(id).textContent = val || "—";
  set("pv-name", data.name);
  set("pv-age", data.age);
  set("pv-blood", data.blood);
  set("pv-allergy", data.allergy);
  set("pv-meds", data.meds);
  set("pv-conditions", data.conditions);
  set("pv-address", data.address);
  set("pv-c1-name", data.c1_name);
  set("pv-c1-relation", data.c1_relation);
  set("pv-c1-phone", data.c1_phone);
  set("pv-c2-name", data.c2_name);
  set("pv-c2-relation", data.c2_relation);
  set("pv-c2-phone", data.c2_phone);
}

let qrInstance = null;
function makeQRCode(text){
  const wrap = byId("qr-wrap");
  wrap.innerHTML = "";
  qrInstance = new QRCode(wrap, {
    text,
    width: 180,
    height: 180,
    correctLevel: QRCode.CorrectLevel.M
  });
}

function updateAll(){
 let qrOnline = null;
let qrOffline = null;

function updateAll(){
  const data = readForm();
  fillPreview(data);
  
  // ✅ 只生成离线二维码
  const offlineWrap = byId("qr-offline-wrap");
  offlineWrap.innerHTML = ""; // 清空容器
  const plainText = makePlainText(data);
  new QRCode(offlineWrap, {
    text: plainText,
    width: 180,
    height: 180,
    correctLevel: QRCode.CorrectLevel.M
  });

  saveLocal(data);
}
  function makePlainText(data) {
  return `【老人急救信息】
姓名：${data.name || "—"}
年龄：${data.age || "—"} 岁
血型：${data.blood || "—"}
过敏史：${data.allergy || "—"}
用药情况：${data.meds || "—"}
基础疾病：${data.conditions || "—"}
住址：${data.address || "—"}

紧急联系人1：
  姓名：${data.c1_name || "—"}
  关系：${data.c1_relation || "—"}
  电话：${data.c1_phone || "—"}

紧急联系人2：
  姓名：${data.c2_name || "—"}
  关系：${data.c2_relation || "—"}
  电话：${data.c2_phone || "—"}

（本信息由家属填写，请救助者协助联系）
`.trim();
}

  // 2. 新增：离线纯文本二维码
  const plainText = makePlainText(data);
  if (qrOffline) qrOffline.clear();
  qrOffline = new QRCode(byId("qr-offline-wrap"), {
    text: plainText,
    width: 180,
    height: 180,
    correctLevel: QRCode.CorrectLevel.M
  });

  saveLocal(data);
}
}

function copyShareLink(){
  const input = byId("share-link");
  input.select();
  input.setSelectionRange(0, 99999);
  navigator.clipboard?.writeText(input.value).catch(() => document.execCommand("copy"));
}

function clearAll(){
  FORM_KEYS.forEach(k => byId(k).value = "");
  updateAll();
}
 window.addEventListener("DOMContentLoaded", () => {
  // ❌ 不再调用 applyViewModeIfAny()
  
  const cached = loadLocal();
  if (cached) writeForm(cached);
  updateAll(); // 直接初始化

  // 保留按钮事件（但去掉“复制链接”相关）
  byId("btn-preview").addEventListener("click", updateAll);
  byId("btn-print").addEventListener("click", () => window.print());
  byId("btn-clear").addEventListener("click", () => {
    if (confirm("确定要清空当前填写的信息吗？")) clearAll();
  });
  
  // ❌ 删除“复制链接”按钮的事件（如果你也删了按钮）
  // byId("btn-copy").removeEventListener(...);
});
