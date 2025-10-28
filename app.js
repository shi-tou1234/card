function byId(id) {
  return document.getElementById(id);
}

const FORM_KEYS = [
  "name", "age", "blood", "allergy", "meds", "conditions", "address",
  "c1_name", "c1_relation", "c1_phone",
  "c2_name", "c2_relation", "c2_phone"
];

const STORAGE_KEY = "elder_emergency_card_v1";

/* -------- 数据读写 -------- */
function readForm() {
  const data = {};
  for (const k of FORM_KEYS) {
    const el = byId(k);
    data[k] = el ? (el.value || "").trim() : "";
  }
  return data;
}
function writeForm(data) {
  FORM_KEYS.forEach(k => {
    const el = byId(k);
    if (el) el.value = (k in data ? data[k] : "") || "";
  });
}
function saveLocal(data) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) { console.warn("保存失败", e); }
}
function loadLocal() {
  try { const s = localStorage.getItem(STORAGE_KEY); return s ? JSON.parse(s) : null; } catch { return null; }
}

/* -------- 预览填充 -------- */
function fillPreview(data) {
  const set = (id, val) => { const el = byId(id); if (el) el.textContent = val || "—"; };
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

/* -------- 在线二维码：把完整 JSON 压缩到 URL hash -------- */
function buildViewerURL(data) {
  if (typeof LZString === "undefined") {
    throw new Error("LZString 未加载：请在 index.html 中引入 lz-string.min.js");
  }
  const json = JSON.stringify(data);
  const payload = LZString.compressToEncodedURIComponent(json);
  const viewer = new URL("view.html", location.href).toString();
  return `${viewer}#${payload}`;
}

/* -------- 离线二维码：仅联系人+病史+用药（更容易适配容量） -------- */
function makeOfflineText(d) {
  const s = v => (v && String(v).trim()) || "—";
  // 尽量保持简短标签，减少超长风险
  const c1 = [s(d.c1_name), s(d.c1_relation), s(d.c1_phone)].join("/");
  const c2 = [s(d.c2_name), s(d.c2_relation), s(d.c2_phone)].join("/");
  return [
    "老人应急联络",
    `紧急1:${c1}`,
    `紧急2:${c2}`,
    `病史:${s(d.conditions)}`,
    `用药:${s(d.meds)}`
  ].join("\n");
}

/* -------- 通用二维码渲染（兼容 qrcodejs/new QRCode 与 qrcode@1.x/toCanvas） -------- */
function hasToCanvas() {
  return !!(window.QRCode && typeof window.QRCode.toCanvas === "function");
}
function hasCorrectLevel() {
  return !!(window.QRCode && window.QRCode.CorrectLevel);
}

// 渲染到指定容器；ecl: 'M' | 'L'
function renderQRCode(container, text, ecl) {
  if (!window.QRCode) throw new Error("二维码库未加载");
  container.innerHTML = "";
  if (hasToCanvas()) {
    const canvas = document.createElement("canvas");
    container.appendChild(canvas);
    return window.QRCode.toCanvas(canvas, text, {
      errorCorrectionLevel: ecl,
      width: 180,
      margin: 1
    });
  } else {
    // qrcodejs: 同步构造器，溢出会 throw
    const opts = { text, width: 180, height: 180 };
    if (hasCorrectLevel()) {
      opts.correctLevel = (ecl === "L" ? window.QRCode.CorrectLevel.L : window.QRCode.CorrectLevel.M);
    }
    new window.QRCode(container, opts);
    return Promise.resolve();
  }
}

/* -------- 同时生成两个二维码 -------- */
async function renderBothQRCodes(data) {
  const onlineWrap = byId("qr-online-wrap");
  const offlineWrap = byId("qr-offline-wrap");

  // 在线：链接短，默认 M 应该足够
  try {
    const url = buildViewerURL(data);
    await renderQRCode(onlineWrap, url, "M");
  } catch (e) {
    console.error("在线二维码生成失败：", e);
    if (onlineWrap) onlineWrap.innerHTML = '<div style="color:#c62828;">在线二维码生成失败</div>';
  }

  // 离线：尝试 M，不行降到 L
  try {
    const text = makeOfflineText(data);
    try {
      await renderQRCode(offlineWrap, text, "M");
    } catch (errM) {
      // 容量溢出或其它问题，降级到 L
      const s = String(errM && (errM.message || errM)).toLowerCase();
      if (s.includes("overflow") || s.includes("length")) {
        await renderQRCode(offlineWrap, text, "L");
        const hint = document.createElement("div");
        hint.className = "tiny-hint in-card";
        hint.textContent = "已使用 L 级纠错以适配较长内容";
        offlineWrap.appendChild(hint);
      } else {
        throw errM;
      }
    }
  } catch (e) {
    console.error("离线二维码生成失败：", e);
    if (offlineWrap) offlineWrap.innerHTML = '<div style="color:#c62828;">离线二维码生成失败（请精简“病史/用药”）</div>';
  }
}

/* -------- 页面联动 -------- */
function updateAll() {
  const data = readForm();
  fillPreview(data);

  if (!window.QRCode) {
    const a = byId("qr-online-wrap");
    const b = byId("qr-offline-wrap");
    if (a) a.innerHTML = '<div style="color:#c62828;">二维码库未加载</div>';
    if (b) b.innerHTML = '<div style="color:#c62828;">二维码库未加载</div>';
  } else {
    renderBothQRCodes(data).catch(err => {
      console.error("生成二维码异常：", err);
    });
  }

  saveLocal(data);
}

function clearAll() {
  if (!confirm("确定清空所有信息？")) return;
  FORM_KEYS.forEach(k => { const el = byId(k); if (el) el.value = ""; });
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  updateAll();
}

window.addEventListener("DOMContentLoaded", () => {
  // 先绑定事件，避免初始化异常影响按钮
  const bind = (id, handler) => {
    const el = byId(id);
    if (el) el.addEventListener("click", e => { e?.preventDefault?.(); handler(); });
  };
  bind("btn-preview", updateAll);
  bind("btn-print", () => window.print());
  bind("btn-clear", clearAll);

  const cached = loadLocal();
  if (cached) writeForm(cached);
  updateAll();
});
