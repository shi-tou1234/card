function byId(id) {
  return document.getElementById(id);
}

const FORM_KEYS = [
  "name", "age", "blood", "allergy", "meds", "conditions", "address",
  "c1_name", "c1_relation", "c1_phone",
  "c2_name", "c2_relation", "c2_phone"
];

const STORAGE_KEY = "elder_emergency_card_v1";

/* ---------- 数据读写 ---------- */
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
  } catch {
    return null;
  }
}

/* ---------- 预览填充 ---------- */
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

/* ---------- 三种文本模式：都包含全部字段和值 ---------- */
// 1) 详细-去装饰版（移除全角装饰和冗余空白，保持中文标签，尽量节省字节）
function makeTextVerboseSlim(d) {
  return [
    "老人急救信息",
    `姓名:${d.name || "—"}`,
    `年龄:${d.age || "—"}`,
    `血型:${d.blood || "—"}`,
    `过敏:${d.allergy || "—"}`,
    `用药:${d.meds || "—"}`,
    `病史:${d.conditions || "—"}`,
    `住址:${d.address || "—"}`,
    `紧急1:${[d.c1_name || "—", d.c1_relation || "—", d.c1_phone || "—"].join("/")}`,
    `紧急2:${[d.c2_name || "—", d.c2_relation || "—", d.c2_phone || "—"].join("/")}`,
  ].join("\n").trim();
}

// 2) 中文紧凑标签版（字段词更短，行更少）
function makeTextCompactCN(d) {
  const L = (k, v) => `${k}:${v || "—"}`;
  return [
    "老人急救信息",
    `${L("姓", d.name)} ${L("龄", d.age)} ${L("血", d.blood)}`,
    `${L("过敏", d.allergy)}`,
    `${L("用药", d.meds)}`,
    `${L("病史", d.conditions)}`,
    `${L("住址", d.address)}`,
    `${L("紧急1", [d.c1_name, d.c1_relation, d.c1_phone].filter(Boolean).join("/")) || "紧急1:—"}`,
    `${L("紧急2", [d.c2_name, d.c2_relation, d.c2_phone].filter(Boolean).join("/")) || "紧急2:—"}`,
  ].join("\n").trim();
}

// 3) 极简键值版（英文字母键，最省字节；仍保留全部值）
function makeTextUltraKV(d) {
  const kv = (k, v) => `${k}=${v || "-"}`;
  const line1 = [
    kv("n", d.name), kv("a", d.age), kv("b", d.blood),
    kv("al", d.allergy), kv("m", d.meds), kv("c", d.conditions), kv("ad", d.address)
  ].join(";");
  const c1 = [d.c1_name || "-", d.c1_relation || "-", d.c1_phone || "-"].join(",");
  const c2 = [d.c2_name || "-", d.c2_relation || "-", d.c2_phone || "-"].join(",");
  return `${line1};c1=${c1};c2=${c2}`;
}

// 计算 UTF-8 字节长度（仅用于日志/提示）
function byteLengthUTF8(str) {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80) len += 1;
    else if (c < 0x800) len += 2;
    else if (c >= 0xD800 && c <= 0xDBFF) { len += 4; i++; }
    else len += 3;
  }
  return len;
}

/* ---------- 单码渲染（强制单个二维码，必要时自动切换更紧凑模式） ---------- */
function libInfo() {
  const lib = window.QRCode;
  return {
    lib,
    hasLib: !!lib,
    isToCanvas: !!(lib && typeof lib.toCanvas === "function"),
    hasCorrectLevel: !!(lib && lib.CorrectLevel)
  };
}

function renderOneQRCode(wrap, text, ecl /* 'M' | 'L' */) {
  const { lib, isToCanvas, hasCorrectLevel } = libInfo();
  if (!lib) throw new Error("二维码库未加载");

  if (isToCanvas) {
    const canvas = document.createElement("canvas");
    wrap.appendChild(canvas);
    return lib.toCanvas(canvas, text, {
      errorCorrectionLevel: ecl,
      width: 180,
      margin: 1
    });
  } else {
    // qrcodejs：同步构造器，溢出会 throw
    const opts = { text, width: 180, height: 180 };
    if (hasCorrectLevel) {
      opts.correctLevel = (ecl === "L" ? lib.CorrectLevel.L : lib.CorrectLevel.M);
    }
    new lib(wrap, opts);
    return Promise.resolve();
  }
}

// 通过试渲染判断“是否能在指定纠错等级下放进单码”，不污染真实容器
async function canFitSingle(text, ecl) {
  const temp = document.createElement("div");
  try {
    await renderOneQRCode(temp, text, ecl);
    return true;
  } catch (err) {
    const s = String(err && (err.message || err)).toLowerCase();
    if (s.includes("overflow") || s.includes("length")) return false;
    throw err; // 非容量错误直接抛出
  } finally {
    temp.innerHTML = "";
  }
}

async function renderSingleQR(wrap, data) {
  wrap.innerHTML = "";
  const modes = [
    { name: "详细", builder: makeTextVerboseSlim },
    { name: "紧凑", builder: makeTextCompactCN },
    { name: "极简", builder: makeTextUltraKV },
  ];
  // 优先 M，尽量保证容错；不行再用 L
  const ecls = ["M", "L"];

  // 预先统计各模式字节数（用于调试/提示）
  const lens = {};
  modes.forEach(m => lens[m.name] = byteLengthUTF8(m.builder(data)));

  let lastErr = null;

  for (const ecl of ecls) {
    for (const m of modes) {
      const text = m.builder(data);
      try {
        const ok = await canFitSingle(text, ecl);
        if (!ok) continue;

        // 真正渲染
        await renderOneQRCode(wrap, text, ecl);

        // 如非“详细 + M”，加个小提示说明已使用更紧凑/更低容错
        if (!(m.name === "详细" && ecl === "M")) {
          const hint = document.createElement("div");
          hint.className = "tiny-hint in-card";
          hint.textContent = `已使用${m.name}模式，纠错等级 ${ecl}（单码包含全部字段与数值）`;
          wrap.appendChild(hint);
        }
        return;
      } catch (err) {
        lastErr = err;
        const s = String(err && (err.message || err)).toLowerCase();
        // 容量溢出：尝试下一个模式/等级；其它错误直接报
        if (!(s.includes("overflow") || s.includes("length"))) {
          console.error("生成二维码失败（非容量问题）：", err);
          wrap.innerHTML = '<div style="color:#c62828;">生成二维码失败，请查看控制台</div>';
          return;
        }
      }
    }
  }

  // 所有模式在 L 下仍放不下：提示用户精简大字段
  console.error("所有单码尝试均溢出。各模式字节数：", lens);
  wrap.innerHTML =
    `<div style="color:#c62828;">
      无法在单个二维码内容纳全部文本（即使用极简模式与 L 级纠错）。
      请适度缩短“住址/病史/用药”等长文本后再试。
    </div>`;
}

/* ---------- 页面联动 ---------- */
function updateAll() {
  const data = readForm();
  fillPreview(data);
  const wrap = byId("qr-offline-wrap");
  if (!wrap) return;

  if (!window.QRCode) {
    wrap.innerHTML = '<div style="color:#c62828;">二维码库未加载，无法生成</div>';
    return;
  }

  renderSingleQR(wrap, data)
    .catch(err => {
      console.error("生成二维码失败：", err);
      wrap.innerHTML = '<div style="color:#c62828;">生成二维码失败，请查看控制台</div>';
    });

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
  // 先绑定事件，避免初始化异常影响按钮
  const bind = (id, handler) => {
    const el = byId(id);
    if (el) el.addEventListener("click", e => {
      e?.preventDefault?.();
      handler();
    });
  };
  bind("btn-preview", updateAll);
  bind("btn-print", () => window.print());
  bind("btn-clear", clearAll);

  const cached = loadLocal();
  if (cached) writeForm(cached);

  updateAll();
});
