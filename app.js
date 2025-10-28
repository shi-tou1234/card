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
  const set = (id, val) => {
    const el = byId(id);
    if (el) el.textContent = val || "—";
  };
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

（本信息由家属填写，请救助者协助联系）`.trim();
}

function renderQr(text) {
  const wrap = byId("qr-offline-wrap");
  if (!wrap) return;
  wrap.innerHTML = "";

  // 1) 兼容 qrcode 库（带 toCanvas 的版本）
  if (window.QRCode && typeof window.QRCode.toCanvas === "function") {
    const canvas = document.createElement("canvas");
    wrap.appendChild(canvas);
    // 该库使用 errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H'
    window.QRCode.toCanvas(canvas, text, {
      errorCorrectionLevel: "M",
      width: 180,
      margin: 1
    }).catch(err => {
      console.error("生成二维码失败(toCanvas)：", err);
      wrap.innerHTML = '<div style="color:#c62828;">生成二维码失败，请查看控制台</div>';
    });
    return;
  }

  // 2) 兼容 qrcodejs 库（new QRCode(...)）
  if (typeof window.QRCode === "function") {
    try {
      const opts = { text, width: 180, height: 180 };
      // 某些构建没有 CorrectLevel；仅在存在时设置
      if (window.QRCode.CorrectLevel) {
        opts.correctLevel = window.QRCode.CorrectLevel.M;
      }
      new window.QRCode(wrap, opts);
    } catch (err) {
      console.error("生成二维码失败(new QRCode)：", err);
      wrap.innerHTML = '<div style="color:#c62828;">生成二维码失败，请查看控制台</div>';
    }
    return;
  }

  // 3) 两个都没有，说明库未加载
  wrap.innerHTML = '<div style="color:#c62828;">二维码库未加载，无法生成二维码</div>';
}

function updateAll() {
  const data = readForm();
  fillPreview(data);
  renderQr(makePlainText(data));
  saveLocal(data);
}

function clearAll() {
  if (!confirm("确定清空所有信息？")) return;
  FORM_KEYS.forEach(k => {
    const el = byId(k);
    if (el) el.value = "";
  });
  try { localStorage.removeItem(STORAGE_KEY); } catch {}
  updateAll();
}

window.addEventListener("DOMContentLoaded", () => {
  // 先绑定事件，避免初始化报错影响按钮可用
  const bind = (id, handler) => {
    const el = byId(id);
    if (el) el.addEventListener("click", (e) => {
      e?.preventDefault?.();
      handler();
    });
  };
  bind("btn-preview", updateAll);
  bind("btn-print", () => window.print());
  bind("btn-clear", clearAll);

  const cached = loadLocal();
  if (cached) writeForm(cached);

  try {
    updateAll();
  } catch (err) {
    console.error("初始化失败：", err);
    const wrap = byId("qr-offline-wrap");
    if (wrap) wrap.innerHTML = '<div style="color:#c62828;">初始化失败，请检查控制台</div>';
  }
});
