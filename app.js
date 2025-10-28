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

function makeShareLink(data){
  const b64 = encodeObj({v:1, data});
  const base = window.location.origin + window.location.pathname;
  return `${base}#data=${b64}`;
}

function updateAll(){
  const data = readForm();
  fillPreview(data);
  const link = makeShareLink(data);
  byId("share-link").value = link;
  makeQRCode(link);
  saveLocal(data);
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

function applyViewModeIfAny(){
  const hash = location.hash || "";
  const prefix = "#data=";
  if (hash.startsWith(prefix)){
    try{
      const b64 = hash.slice(prefix.length);
      const obj = decodeObj(b64);
      if (obj && obj.data){
        writeForm(obj.data);
        fillPreview(obj.data);
        const link = makeShareLink(obj.data);
