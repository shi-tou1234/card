function byId(id) {
  return document.getElementById(id);
}

const FORM_KEYS = [
  "name", "age", "blood", "allergy", "meds", "conditions", "address",
  "c1_name", "c1_relation", "c1_phone",
  "c2_name", "c2_relation", "c2_phone"
];

const STORAGE_KEY = "elder_emergency_card_v1";

function readForm() {
  const data = {};
  FORM_KEYS.forEach(k => {
    data[k] = (byId(k).value || "").trim();
  });
  return data;
}

function writeForm(data) {
  FORM_KEYS.forEach(k => {
    if (k in data) byId(k).value = data[k] || "";
  });
}

function saveLocal(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn("保存失败", e);
  }
}

function loadLocal() {
  try {
    const s = localStorage.getItem(STORAGE_KEY);
    return s ? JSON.parse(s) : null;
  } catch (e) {
    return null;
  }
}

function fillPreview(data) {
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

function makePlainText(data) {
  return `【老人急救信息】
姓名：${data.name || "—"}
年龄：${data.age || "—"} 岁
血型：${data.blood || "—"}
过敏史：${data.allergy || "—"}
常用药物：${data.meds || "—"}
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

function updateAll() {
  const data = readForm();
  fillPreview(data);
  
  const wrap = byId("qr-offline-wrap");
  wrap.innerHTML = "";
  const text = makePlainText(data);
  new QRCode(wrap, {
    text: text,
    width: 180,
    height: 180,
    correctLevel: QRCode.CorrectLevel.M
  });

  saveLocal(data);
}

function clearAll() {
  if (!confirm("确定清空所有信息？")) return;
  FORM_KEYS.forEach(k => byId(k).value = "");
  updateAll();
}

window.addEventListener("DOMContentLoaded", () => {
  const cached = loadLocal();
  if (cached) writeForm(cached);
  updateAll();

  byId("btn-preview").addEventListener("click", updateAll);
  byId("btn-print").addEventListener("click", () => window.print());
  byId("btn-clear").addEventListener("click", clearAll);
});
