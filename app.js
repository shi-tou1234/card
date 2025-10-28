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

/* ---------- 文本生成（3档“冗长度”） ---------- */
// 计算 UTF-8 字节长度（用于容量判断/提示）
function byteLengthUTF8(str) {
  let len = 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 0x80) len += 1;
    else if (c < 0x800) len += 2;
    else if (c >= 0xD800 && c <= 0xDBFF) { len += 4; i++; } // 代理对
    else len += 3;
  }
  return len;
}

// 详细模式（接近你原本内容，但去掉装饰符与全角冒号，减少若干常见超长点）
function makeTextVerbose(d) {
  return [
    "老人急救信息",
    `姓名:${d.name || "—"}`,
    `年龄:${d.age || "—"}岁`,
    `血型:${d.blood || "—"}`,
    `过敏史:${d.allergy || "—"}`,
    `常用药物:${d.meds || "—"}`,
    `基础疾病:${d.conditions || "—"}`,
    `住址:${d.address || "—"}`,
    "",
    "紧急联系人1:",
    `  姓名:${d.c1_name || "—"}`,
    `  关系:${d.c1_relation || "—"}`,
    `  电话:${d.c1_phone || "—"}`,
    "",
    "紧急联系人2:",
    `  姓名:${d.c2_name || "—"}`,
    `  关系:${d.c2_relation || "—"}`,
    `  电话:${d.c2_phone || "—"}`,
  ].join("\n").trim();
}

// 简洁模式（减少标签字数与空白）
function makeTextCompact(d) {
  const L = (k, v) => `${k}:${v || "—"}`;
  return [
    "老人急救信息",
    `${L("姓名", d.name)} ${L("年龄", d.age)} ${L("血型", d.blood)}`,
    `${L("过敏", d.allergy)}`,
    `${L("用药", d.meds)}`,
    `${L("病史", d.conditions)}`,
    `${L("住址", d.address)}`,
    `${L("紧急1", [d.c1_name, d.c1_relation, d.c1_phone].filter(Boolean).join("/")) || "紧急1:—"}`,
    `${L("紧急2", [d.c2_name, d.c2_relation, d.c2_phone].filter(Boolean).join("/")) || "紧急2:—"}`,
  ].join("\n");
}

// 极简模式（字段键缩写，分号/逗号分隔，最省字节；扫码仍可读）
function makeTextUltra(d) {
  // n 姓名, a 年龄, b 血型, al 过敏, m 用药, c 病史, ad 地址, c1/c2: 姓,关,电
  const kv = (k, v) => (v ? `${k}=${v}` : "");
  const line1 = [
    kv("n", d.name), kv("a", d.age), kv("b", d.blood),
    kv("al", d.allergy), kv("m", d.meds), kv("c", d.conditions), kv("ad", d.address)
  ].filter(Boolean).join(";");
  const c1 = [d.c1_name, d.c1_relation, d.c1_phone].filter(Boolean).join(",");
  const c2 = [d.c2_name, d.c2_relation, d.c2_phone].filter(Boolean).join(",");
  const parts = [line1, c1 ? `c1=${c1}` : "", c2 ? `c2=${c2}` : ""].filter(Boolean);
  return parts.join(";");
}

function makeText(mode, data) {
  switch (mode) {
    case "verbose": return makeTextVerbose(data);
    case "compact": return makeTextCompact(data);
    case "ultra":   return makeTextUltra(data);
    default:        return makeTextVerbose(data);
  }
}

/* ---------- 二维码渲染（自动回退） ---------- */
function renderQrWithLibToCanvas(wrap, text, ecl) {
  const canvas = document.createElement("canvas");
  wrap.appendChild(canvas);
  return window.QRCode.toCanvas(canvas, text, {
    errorCorrectionLevel: ecl, // 'L' | 'M'
    width: 180,
    margin: 1
  });
}

function renderQrWithLibCtor(wrap, text, ecl) {
  const opts = { text, width: 180, height: 180 };
  if (window.QRCode.CorrectLevel && ecl) {
    opts.correctLevel = (ecl === "L" ? window.QRCode.CorrectLevel.L : window.QRCode.CorrectLevel.M);
  }
  // qrcodejs 构造器是同步的，溢出会直接 throw
  new window.QRCode(wrap, opts);
}

function renderQrAuto(data) {
  const wrap = byId("qr-offline-wrap");
  if (!wrap) return;

  wrap.innerHTML = "";

  // 按“文本模式 × 纠错等级”尝试：verbose/compact/ultra × M/L
  const tries = [
    { mode: "verbose", ecl: "M" },
    { mode: "verbose", ecl: "L" },
    { mode: "compact", ecl: "M" },
    { mode: "compact", ecl: "L" },
    { mode: "ultra",  ecl: "M" },
    { mode: "ultra",  ecl: "L" },
  ];

  const lib = window.QRCode;
  if (!lib) {
    wrap.innerHTML = '<div style="color:#c62828;">二维码库未加载，无法生成</div>';
    console.error("未检测到 QRCode 库。请检查 <script src> 是否可访问。");
    return;
  }

  // 预先计算各模式长度，便于最后提示
  const lens = Object.fromEntries(
    ["verbose","compact","ultra"].map(m => [m, byteLengthUTF8(makeText(m, data))])
  );

  const isToCanvas = typeof lib.toCanvas === "function";
  let lastErr = null;

  // 逐一尝试直到成功
  const tryNext = async (i = 0) => {
    if (i >= tries.length) {
      wrap.innerHTML =
        `<div style="color:#c62828;">
          生成二维码失败（可能内容过长）。各模式字节数：
          详细≈${lens.verbose}，简洁≈${lens.compact}，极简≈${lens.ultra}。
          请优先精简“住址/病史/用药”等长文本，或使用两张卡片分开打印。
        </div>`;
      if (lastErr) console.error("最终失败原因：", lastErr);
      return;
    }

    const { mode, ecl } = tries[i];
    const text = makeText(mode, data);

    // 每次尝试都先清空容器（qrcodejs 会向 wrap 里塞入 img/canvas）
    wrap.innerHTML = "";

    try {
      if (isToCanvas) {
        await renderQrWithLibToCanvas(wrap, text, ecl);
      } else {
        renderQrWithLibCtor(wrap, text, ecl);
      }

      // 成功后追加提示（若使用了降级模式或 L 级纠错）
      if (mode !== "verbose" || ecl === "L") {
        const note = document.createElement("div");
        note.className = "tiny-hint in-card";
        note.textContent = `已使用${mode === "compact" ? "简洁" : (mode === "ultra" ? "极简" : "详细")}模式，纠错等级 ${ecl}`;
        wrap.appendChild(note);
      }
      return; // 成功结束
    } catch (err) {
      lastErr = err;
      // code length overflow 往下尝试
      if (String(err && (err.message || err)).toLowerCase().includes("overflow")) {
        return tryNext(i + 1);
      }
      // 其它错误直接提示并停止
      console.error(`生成二维码失败（mode=${mode}, ecl=${ecl}）：`, err);
      wrap.innerHTML = '<div style="color:#c62828;">生成二维码失败，请查看控制台</div>';
    }
  };

  tryNext(0);
}

/* ---------- 页面联动 ---------- */
function updateAll() {
  const data = readForm();
  fillPreview(data);
  renderQrAuto(data);
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

  try {
    updateAll();
  } catch (err) {
    console.error("初始化失败：", err);
    const wrap = byId("qr-offline-wrap");
    if (wrap) wrap.innerHTML = '<div style="color:#c62828;">初始化失败，请检查控制台</div>';
  }
});
