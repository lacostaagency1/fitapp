// ── Utils ──────────────────────────────────────────────
const $ = id => document.getElementById(id);
const dateKey = d => d.toISOString().slice(0, 10);
const today = () => new Date();
const todayKey = () => dateKey(today());

const DAYS_ES = ['domingo','lunes','martes','miercoles','jueves','viernes','sabado'];
const DAYS_LABEL = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const DAYS_SHORT = ['D','L','M','X','J','V','S'];
const DAYS_PILL = ['L','M','X','J','V','S','D'];
const DAYS_PILL_KEYS = ['lunes','martes','miercoles','jueves','viernes','sabado','domingo'];
const MONTHS_ES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

// ── Storage ────────────────────────────────────────────
function load(key, def) {
  try { return JSON.parse(localStorage.getItem(key)) ?? def; } catch { return def; }
}
function save(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

let registro = load('registro', {});
let pesos = load('pesos', []);
let customPlan = load('customPlan', {});

// ── API KEY & SETTINGS ─────────────────────────────────
let geminiKey = localStorage.getItem('geminiKey') || '';

function toggleSettings(forceShow) {
  const overlay = $('settings-overlay');
  const modal   = $('settings-modal');
  const show = forceShow !== undefined ? forceShow : overlay.style.display === 'none';
  overlay.style.display = show ? 'block' : 'none';
  modal.style.display   = show ? 'block' : 'none';
  if (show) {
    $('key-status').textContent = geminiKey
      ? '✅ Clave configurada · ' + geminiKey.slice(0,6) + '...'
      : '';
    $('api-key-input').value = '';
    $('api-key-input').placeholder = geminiKey ? 'Introduce nueva clave para cambiarla' : 'AIza...';
  }
}
$('btn-settings').addEventListener('click', () => toggleSettings(true));
$('btn-close-settings').addEventListener('click', () => toggleSettings(false));
$('settings-overlay').addEventListener('click', () => toggleSettings(false));
$('btn-save-key').addEventListener('click', () => {
  const k = $('api-key-input').value.trim();
  if (!k) return showToast('Introduce la clave');
  geminiKey = k;
  localStorage.setItem('geminiKey', k);
  showToast('✅ API key guardada');
  toggleSettings(false);
});

// ── ESTIMADOR LOCAL (sin internet) ────────────────────
function parseDuration(texto) {
  const t = texto.toLowerCase();
  // Expresiones especiales primero
  if (/hora y media|1[.,]5\s*h/.test(t)) return 1.5;
  if (/media hora|30\s*min/.test(t)) return 0.5;
  if (/dos horas?/.test(t)) return 2;
  if (/tres horas?/.test(t)) return 3;
  if (/una hora/.test(t) && !/y/.test(t)) return 1;
  let h = 0;
  const hm = t.match(/(\d+(?:[.,]\d+)?)\s*h(?:ora)?s?/);
  const mm = t.match(/(\d+)\s*min(?:uto)?s?/);
  if (hm) h += parseFloat(hm[1].replace(',', '.'));
  if (mm) h += parseInt(mm[1]) / 60;
  return h || 1;
}

function estimarLocal(texto, tipo) {
  const t = texto.toLowerCase();
  const horas = parseDuration(t);

  if (tipo === 'ej') {
    // kcal/hora para persona de ~86 kg, intensidad moderada
    const acts = [
      { k: ['pádel','padel'], r: 480 },
      { k: ['tenis','tennis'], r: 460 },
      { k: ['fútbol','futbol','football'], r: 520 },
      { k: ['correr','running','carrera'], r: 580 },
      { k: ['bici','ciclismo','cycling'], r: 400 },
      { k: ['nadar','natación','piscina','swim'], r: 480 },
      { k: ['caminar','paseo','andar','walk'], r: 260 },
      { k: ['gym','gimnasio','pesas','musculación'], r: 340 },
      { k: ['yoga','pilates'], r: 180 },
      { k: ['baloncesto','basket'], r: 500 },
      { k: ['boxeo','kickboxing'], r: 560 },
      { k: ['crossfit','hiit','funcional'], r: 540 },
      { k: ['cinta','elíptica','eliptica'], r: 380 },
      { k: ['escalada'], r: 440 },
    ];
    for (const a of acts) {
      if (a.k.some(k => t.includes(k))) return Math.round(a.r * horas);
    }
    return Math.round(340 * horas);
  } else {
    const foods = [
      { k: ['pizza'], c: 500 },
      { k: ['hamburguesa','burger'], c: 500 },
      { k: ['bocadillo','bocata','sandwich'], c: 380 },
      { k: ['ensalada'], c: 150 },
      { k: ['arroz'], c: 200 },
      { k: ['pasta','macarrones','espagueti'], c: 350 },
      { k: ['pechuga','pollo'], c: 250 },
      { k: ['salmón','salmon','pescado'], c: 250 },
      { k: ['huevos','huevo'], c: 160 },
      { k: ['cerveza'], c: 150 },
      { k: ['vino'], c: 120 },
      { k: ['chocolate'], c: 200 },
      { k: ['tarta','pastel'], c: 350 },
      { k: ['patatas fritas','fritas'], c: 350 },
      { k: ['fruta','manzana','plátano','naranja'], c: 80 },
    ];
    for (const f of foods) {
      if (f.k.some(k => t.includes(k))) {
        const n = t.match(/(\d+)\s*(?:porci|trozo|ración|vaso|copa|pieza|unidad)/);
        return f.c * (n ? parseInt(n[1]) : 1);
      }
    }
    return 400;
  }
}

// ── GEMINI API (gratis) ────────────────────────────────
async function callGemini(prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey}`;
  const resp = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] })
  });
  if (!resp.ok) {
    const err = await resp.json().catch(() => ({}));
    throw new Error(err.error?.message || `Error ${resp.status}`);
  }
  const data = await resp.json();
  return data.candidates[0].content.parts[0].text.trim();
}

async function estimarCalorias(texto, tipo) {
  if (geminiKey) {
    try {
      const prompt = tipo === 'ej'
        ? `Persona sedentaria de 86 kg que hace deporte recreativo (no élite). Actividad realizada: "${texto}". Dame una estimación REALISTA y CONSERVADORA de calorías quemadas. Usa MET moderado. Responde SOLO con un número entero (sin texto, sin unidades). El resultado debe estar entre 100 y 1200.`
        : `Estimación realista de calorías de esta ingesta: "${texto}". Porciones normales si no se especifica. Responde SOLO con un número entero entre 50 y 2000.`;
      const raw = await callGemini(prompt);
      const kcal = parseInt(raw.replace(/[^0-9]/g, ''));
      if (!isNaN(kcal) && kcal > 50 && kcal < 3000) return kcal;
    } catch (_) { /* usa estimación local */ }
  }
  return estimarLocal(texto, tipo);
}

// ── REGISTRO LIBRE ─────────────────────────────────────
let aiTipo = 'ej';

function renderRegistroLibre() {
  const k = todayKey();
  const entradas = registro[k]?.entradas || [];
  const list = $('ai-entries-list');
  if (entradas.length === 0) {
    list.innerHTML = '';
    return;
  }
  let html = '<div class="ai-entries">';
  entradas.forEach((e, i) => {
    const icon = e.tipo === 'ej' ? '🔥' : '🍽';
    const sign = e.tipo === 'ej' ? '−' : '+';
    const cls  = e.tipo === 'ej' ? 'green' : 'kcal-red';
    html += `<div class="ai-entry">
      <span class="ai-entry-icon">${icon}</span>
      <span class="ai-entry-texto">${escHtml(e.texto)}</span>
      <span class="ai-entry-kcal ${cls}">${sign}${e.kcal} kcal</span>
      <button class="btn-del-entry" data-entry-i="${i}">✕</button>
    </div>`;
  });
  html += '</div>';
  list.innerHTML = html;

  document.querySelectorAll('[data-entry-i]').forEach(btn => {
    btn.addEventListener('click', () => {
      const k2 = todayKey();
      registro[k2].entradas.splice(parseInt(btn.dataset.entryI), 1);
      save('registro', registro);
      const plan = getPlan(DAYS_ES[today().getDay()]);
      renderRegistroLibre();
      updateCalBalance(plan, registro[k2]);
    });
  });
}

$('ai-type-ej').addEventListener('click', () => {
  aiTipo = 'ej';
  $('ai-type-ej').classList.add('active');
  $('ai-type-com').classList.remove('active');
  $('ai-input').placeholder = 'Ej: partido de pádel 1h 30min, correr 5 km, bici 45 min...';
});
$('ai-type-com').addEventListener('click', () => {
  aiTipo = 'com';
  $('ai-type-com').classList.add('active');
  $('ai-type-ej').classList.remove('active');
  $('ai-input').placeholder = 'Ej: pizza margarita 2 porciones, bocadillo de jamón, 2 cervezas...';
});

function setAiStatus(msg, type) {
  const el = $('ai-status-msg');
  if (!el) return;
  el.textContent = msg;
  el.className = 'ai-status ' + (type || '');
}

$('btn-ai-calc').addEventListener('click', async () => {
  const texto = $('ai-input').value.trim();
  if (!texto) { setAiStatus('✏️ Escribe primero qué has hecho o comido', 'warn'); return; }
  if (!geminiKey) {
    setAiStatus('⚙️ Primero configura tu API key de Gemini (botón ⚙️ arriba a la derecha)', 'warn');
    toggleSettings(true);
    return;
  }
  const btn = $('btn-ai-calc');
  btn.disabled = true;
  btn.textContent = '⏳ Calculando...';
  setAiStatus('Consultando a la IA...', 'info');
  try {
    const kcal = await estimarCalorias(texto, aiTipo);
    const k = todayKey();
    const plan = getPlan(DAYS_ES[today().getDay()]);
    if (!registro[k]) registro[k] = { ejercicios: plan.ejercicios.map(() => false), comidas: plan.comidas.map(() => false), done: false, entradas: [] };
    if (!registro[k].entradas) registro[k].entradas = [];
    registro[k].entradas.push({ tipo: aiTipo, texto, kcal });
    save('registro', registro);
    $('ai-input').value = '';
    setAiStatus('');
    renderRegistroLibre();
    updateCalBalance(plan, registro[k]);
    showToast(`✅ ${kcal} kcal añadidas`);
  } catch (err) {
    setAiStatus('❌ ' + (err.message || 'Error al conectar con la IA'), 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = '✨ Calcular calorías con IA';
  }
});

function getPlan(dayName) {
  return customPlan[dayName] || PLAN[dayName];
}

// ── Nav ────────────────────────────────────────────────
const sections = ['inicio', 'hoy', 'rutina', 'calendario', 'progreso'];
function navigate(id) {
  sections.forEach(s => {
    document.getElementById('sec-' + s).classList.toggle('active', s === id);
    document.getElementById('nav-' + s).classList.toggle('active', s === id);
  });
  if (id === 'inicio') renderInicio();
  if (id === 'hoy') renderHoy();
  if (id === 'rutina') renderRutina();
  if (id === 'calendario') renderCalendario();
  if (id === 'progreso') renderProgreso();
}
sections.forEach(s => {
  $('nav-' + s).addEventListener('click', () => navigate(s));
});

// ── Header ─────────────────────────────────────────────
function updateHeader() {
  const dayName = DAYS_ES[today().getDay()];
  const plan = getPlan(dayName);
  $('header-sub').textContent = `${plan?.emoji ?? ''} Hoy: ${plan?.tipo ?? ''}`;
}

// ── Racha ──────────────────────────────────────────────
function calcStreak() {
  let streak = 0;
  const d = new Date(today());
  d.setDate(d.getDate() - 1);
  while (true) {
    const k = dateKey(d);
    if (registro[k]?.done) { streak++; d.setDate(d.getDate() - 1); }
    else break;
  }
  if (registro[todayKey()]?.done) streak++;
  return streak;
}
function calcTotalDone() {
  return Object.values(registro).filter(r => r.done).length;
}

// ── Inicio ─────────────────────────────────────────────
function renderInicio() {
  $('streak-num').textContent = calcStreak();
  $('total-num').textContent = calcTotalDone();
  renderMiniCal();
}

function renderMiniCal() {
  const t = today();
  const year = t.getFullYear(), month = t.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  $('mini-cal-month').textContent = `${MONTHS_ES[month]} ${year}`;

  let html = DAYS_SHORT.map(d => `<div class="day-label">${d}</div>`).join('');
  for (let i = 0; i < firstDay; i++) html += `<div class="day empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(year, month, d);
    const k = dateKey(date);
    const isToday = d === t.getDate();
    const isFuture = date > t;
    const r = registro[k];
    let cls = 'day';
    if (isFuture) cls += ' future';
    else if (r?.done) cls += ' done';
    else if (r && (r.ejercicios?.some(Boolean) || r.comidas?.some(Boolean))) cls += ' partial';
    else if (r && !r.done && !isFuture && date < t) cls += ' missed';
    if (isToday) cls += ' today';
    html += `<div class="${cls}">${d}</div>`;
  }
  $('mini-cal').innerHTML = html;
}

// ── HOY ────────────────────────────────────────────────
let editingItem = null; // { tipo: 'ej'|'com', i: number }

function renderHoy() {
  const dayName = DAYS_ES[today().getDay()];
  const plan = getPlan(dayName);
  const k = todayKey();

  if (!registro[k]) {
    registro[k] = {
      ejercicios: plan.ejercicios.map(() => false),
      comidas: plan.comidas.map(() => false),
      done: false
    };
  }
  const reg = registro[k];
  if (!reg.mods) reg.mods = {};

  $('plan-emoji').textContent = plan.emoji;
  $('plan-tipo').textContent = plan.tipo;

  function buildItem(tipo, orig, i, checked) {
    const modKey = tipo + '_' + i;
    const mod = reg.mods[modKey];
    const nombre  = tipo === 'ej' ? orig.nombre : orig.momento;
    const detalle = mod ? mod.texto : (tipo === 'ej' ? orig.detalle : orig.desc);
    const kcal    = mod ? mod.kcal : orig.kcal;
    const isEd    = editingItem?.tipo === tipo && editingItem?.i === i;
    const preText = mod ? mod.texto : (tipo === 'ej'
      ? (orig.nombre + (orig.detalle ? ' · ' + orig.detalle : ''))
      : orig.desc);

    if (isEd) {
      return `<li class="editing-li" data-type="${tipo}" data-i="${i}">
        <div class="edit-inline-wrap">
          <div class="edit-inline-label">${escHtml(nombre)}</div>
          <textarea class="ai-textarea" id="edit-ta" rows="2">${escHtml(preText)}</textarea>
          <div class="edit-inline-btns">
            <button class="btn-ai-calc btn-recalc" id="btn-save-edit">✨ Recalcular con IA</button>
            <button class="btn-cancel btn-cancel-edit" id="btn-cancel-edit">Cancelar</button>
          </div>
        </div>
      </li>`;
    }

    const kcalBadge = kcal ? `<span class="kcal-pill${mod ? ' mod' : ''}">${kcal} kcal</span>` : '';
    return `<li class="${checked ? 'checked' : ''}" data-type="${tipo}" data-i="${i}">
      <div class="check"></div>
      <div class="item-text">
        <div class="name">${escHtml(nombre)}</div>
        ${detalle ? `<div class="detail">${escHtml(detalle)}</div>` : ''}
      </div>
      ${kcalBadge}
      <button class="btn-edit-item" data-edit-tipo="${tipo}" data-edit-i="${i}">✏️</button>
    </li>`;
  }

  $('ej-list').innerHTML  = plan.ejercicios.map((ej, i) => buildItem('ej', ej, i, reg.ejercicios[i])).join('');
  $('com-list').innerHTML = plan.comidas.map((com, i)  => buildItem('com', com, i, reg.comidas[i])).join('');

  updateCalBalance(plan, reg);
  renderRegistroLibre();

  // Toggle check (skip if in edit mode for that item)
  document.querySelectorAll('[data-type="ej"]:not(.editing-li)').forEach(li => {
    li.addEventListener('click', () => {
      registro[k].ejercicios[parseInt(li.dataset.i)] ^= true;
      save('registro', registro);
      renderHoy();
    });
  });
  document.querySelectorAll('[data-type="com"]:not(.editing-li)').forEach(li => {
    li.addEventListener('click', () => {
      registro[k].comidas[parseInt(li.dataset.i)] ^= true;
      save('registro', registro);
      renderHoy();
    });
  });

  // Edit buttons
  document.querySelectorAll('[data-edit-tipo]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      editingItem = { tipo: btn.dataset.editTipo, i: parseInt(btn.dataset.editI) };
      renderHoy();
      $('edit-ta')?.focus();
    });
  });

  // Save edit
  $('btn-save-edit')?.addEventListener('click', async () => {
    if (!editingItem) return;
    const texto = $('edit-ta')?.value.trim();
    if (!texto) return;
    if (!geminiKey) { showToast('⚙️ Configura tu API key en Ajustes'); toggleSettings(true); return; }
    const btn = $('btn-save-edit');
    btn.disabled = true; btn.textContent = '⏳ Calculando...';
    try {
      const kcal = await estimarCalorias(texto, editingItem.tipo);
      const modKey = editingItem.tipo + '_' + editingItem.i;
      registro[k].mods[modKey] = { texto, kcal };
      save('registro', registro);
      editingItem = null;
      renderHoy();
      showToast(`✅ ${kcal} kcal actualizadas`);
    } catch (err) {
      showToast('❌ ' + err.message);
      btn.disabled = false; btn.textContent = '✨ Recalcular con IA';
    }
  });

  // Cancel edit
  $('btn-cancel-edit')?.addEventListener('click', () => { editingItem = null; renderHoy(); });

  const btn = $('btn-complete');
  if (reg.done) { btn.textContent = '✅ ¡Día completado!'; btn.classList.add('completed'); }
  else { btn.textContent = '✔ Marcar día como completado'; btn.classList.remove('completed'); }
}

function updateCalBalance(plan, reg) {
  const entradas = reg.entradas || [];
  const mods = reg.mods || {};
  const eaten  = plan.comidas.reduce((s, c, i)  => {
    if (!reg.comidas[i]) return s;
    return s + (mods['com_' + i]?.kcal ?? c.kcal ?? 0);
  }, 0) + entradas.filter(e => e.tipo === 'com').reduce((s, e) => s + e.kcal, 0);
  const burned = plan.ejercicios.reduce((s, e, i) => {
    if (!reg.ejercicios[i]) return s;
    return s + (mods['ej_' + i]?.kcal ?? e.kcal ?? 0);
  }, 0) + entradas.filter(e => e.tipo === 'ej').reduce((s, e) => s + e.kcal, 0);
  const net    = eaten - burned;
  const deficit = TDEE_ESTIMADO - net;
  const hasData = eaten > 0 || burned > 0;

  $('cal-eaten').textContent  = hasData ? eaten  + ' kcal' : '— kcal';
  $('cal-burned').textContent = hasData ? burned + ' kcal' : '— kcal';
  $('cal-net').textContent    = hasData ? net    + ' kcal' : '— kcal';

  const statusEl = $('cal-status');
  if (!hasData) {
    statusEl.textContent = 'Marca comidas y ejercicios para ver tu balance';
    statusEl.className = 'cal-status-row neutral';
  } else if (deficit >= META_DEFICIT) {
    statusEl.textContent = `✅ Déficit conseguido · ${deficit} kcal por debajo de mantenimiento`;
    statusEl.className = 'cal-status-row good';
  } else if (deficit > 0) {
    statusEl.textContent = `⚠️ Déficit pequeño · solo ${deficit} kcal — haz más ejercicio`;
    statusEl.className = 'cal-status-row warn';
  } else {
    statusEl.textContent = `❌ Sin déficit · has comido ${Math.abs(deficit)} kcal por encima del mantenimiento`;
    statusEl.className = 'cal-status-row bad';
  }
}

$('btn-complete').addEventListener('click', () => {
  const k = todayKey();
  const dayName = DAYS_ES[today().getDay()];
  const plan = getPlan(dayName);
  if (!registro[k]) registro[k] = { ejercicios: plan.ejercicios.map(() => false), comidas: plan.comidas.map(() => false), done: false };
  registro[k].done = !registro[k].done;
  save('registro', registro);
  renderHoy();
  if (registro[k].done) showToast('🎉 ¡Día marcado! Sigue así');
});

// ── RUTINA ─────────────────────────────────────────────
let rutinaDay = null;     // dayName seleccionado
let rutinaBuffer = null;  // copia editable

function renderRutina() {
  // Píldoras de días
  let html = '';
  DAYS_PILL_KEYS.forEach((day, i) => {
    const plan = getPlan(day);
    const isCustom = !!customPlan[day];
    const isSelected = day === rutinaDay;
    html += `<button class="day-pill${isSelected ? ' selected' : ''}" data-day="${day}">
      <span class="pill-letter">${DAYS_PILL[i]}</span>
      <span class="pill-emoji">${plan.emoji}</span>
      ${isCustom ? '<span class="pill-dot"></span>' : ''}
    </button>`;
  });
  $('day-pills').innerHTML = html;

  document.querySelectorAll('.day-pill').forEach(btn => {
    btn.addEventListener('click', () => {
      rutinaDay = btn.dataset.day;
      rutinaBuffer = JSON.parse(JSON.stringify(getPlan(rutinaDay)));
      renderRutina();
    });
  });

  if (!rutinaDay) {
    $('rutina-editor').style.display = 'none';
    return;
  }

  $('rutina-editor').style.display = '';
  $('rutina-emoji').textContent = rutinaBuffer.emoji;
  $('rutina-day-name').textContent = DAYS_LABEL[DAYS_ES.indexOf(rutinaDay)];

  // Ejercicios
  let ejHtml = `<div class="edit-tipo-row">
    <input class="edit-tipo-input" id="rutina-tipo" placeholder="Nombre del día" value="${escHtml(rutinaBuffer.tipo)}">
  </div>
  <div class="edit-section-label">🏋️ Ejercicios</div>`;
  rutinaBuffer.ejercicios.forEach((ej, i) => {
    ejHtml += `<div class="edit-item" data-ej="${i}">
      <input class="edit-input edit-icono" placeholder="🏋️" value="${escHtml(ej.icono || '')}" style="width:52px;text-align:center;font-size:18px;flex-shrink:0">
      <div class="edit-fields">
        <input class="edit-input edit-nombre" placeholder="Ejercicio" value="${escHtml(ej.nombre)}">
        <input class="edit-input edit-detalle" placeholder="Series / reps / tiempo" value="${escHtml(ej.detalle)}">
      </div>
      <button class="btn-del" data-del-ej="${i}">✕</button>
    </div>`;
  });
  ejHtml += `<button class="btn-add-item" id="rutina-add-ej">+ Añadir ejercicio</button>`;

  // Comidas
  let comHtml = `<div class="edit-section-label">🥗 Comidas</div>`;
  rutinaBuffer.comidas.forEach((com, i) => {
    comHtml += `<div class="edit-item" data-com="${i}">
      <div class="edit-fields">
        <input class="edit-input edit-momento" placeholder="Momento (ej. 🌅 Desayuno)" value="${escHtml(com.momento)}">
        <input class="edit-input edit-desc" placeholder="Descripción de la comida" value="${escHtml(com.desc)}">
      </div>
      <button class="btn-del" data-del-com="${i}">✕</button>
    </div>`;
  });
  comHtml += `<button class="btn-add-item" id="rutina-add-com">+ Añadir comida</button>`;

  $('rutina-edit-ej').innerHTML = ejHtml;
  $('rutina-edit-com').innerHTML = comHtml;

  bindRutinaEvents();
}

function bindRutinaEvents() {
  $('rutina-tipo').addEventListener('input', e => { rutinaBuffer.tipo = e.target.value; });

  document.querySelectorAll('[data-ej]').forEach(row => {
    const i = parseInt(row.dataset.ej);
    row.querySelector('.edit-icono').addEventListener('input', e => { rutinaBuffer.ejercicios[i].icono = e.target.value; });
    row.querySelector('.edit-nombre').addEventListener('input', e => { rutinaBuffer.ejercicios[i].nombre = e.target.value; });
    row.querySelector('.edit-detalle').addEventListener('input', e => { rutinaBuffer.ejercicios[i].detalle = e.target.value; });
  });
  document.querySelectorAll('[data-com]').forEach(row => {
    const i = parseInt(row.dataset.com);
    row.querySelector('.edit-momento').addEventListener('input', e => { rutinaBuffer.comidas[i].momento = e.target.value; });
    row.querySelector('.edit-desc').addEventListener('input', e => { rutinaBuffer.comidas[i].desc = e.target.value; });
  });

  document.querySelectorAll('[data-del-ej]').forEach(btn => {
    btn.addEventListener('click', () => {
      rutinaBuffer.ejercicios.splice(parseInt(btn.dataset.delEj), 1);
      renderRutina();
    });
  });
  document.querySelectorAll('[data-del-com]').forEach(btn => {
    btn.addEventListener('click', () => {
      rutinaBuffer.comidas.splice(parseInt(btn.dataset.delCom), 1);
      renderRutina();
    });
  });

  $('rutina-add-ej').addEventListener('click', () => {
    rutinaBuffer.ejercicios.push({ icono: '', nombre: '', detalle: '' });
    renderRutina();
    document.querySelectorAll('.edit-nombre').forEach((el, i, arr) => { if (i === arr.length - 1) el.focus(); });
  });
  $('rutina-add-com').addEventListener('click', () => {
    rutinaBuffer.comidas.push({ momento: '', desc: '' });
    renderRutina();
    document.querySelectorAll('.edit-momento').forEach((el, i, arr) => { if (i === arr.length - 1) el.focus(); });
  });
}

$('btn-save-rutina').addEventListener('click', () => {
  rutinaBuffer.tipo = $('rutina-tipo')?.value || rutinaBuffer.tipo;
  rutinaBuffer.ejercicios = rutinaBuffer.ejercicios.filter(e => e.nombre.trim());
  rutinaBuffer.comidas = rutinaBuffer.comidas.filter(c => c.momento.trim() || c.desc.trim());
  customPlan[rutinaDay] = rutinaBuffer;
  save('customPlan', customPlan);
  // Reset registro del próximo día igual al editado si es hoy
  if (rutinaDay === DAYS_ES[today().getDay()]) {
    const k = todayKey();
    registro[k] = { ejercicios: rutinaBuffer.ejercicios.map(() => false), comidas: rutinaBuffer.comidas.map(() => false), done: false };
    save('registro', registro);
  }
  updateHeader();
  showToast(`✅ ${DAYS_LABEL[DAYS_ES.indexOf(rutinaDay)]} guardado`);
  rutinaBuffer = JSON.parse(JSON.stringify(customPlan[rutinaDay]));
  renderRutina();
});

$('btn-reset-rutina').addEventListener('click', () => {
  if (!rutinaDay) return;
  delete customPlan[rutinaDay];
  save('customPlan', customPlan);
  rutinaBuffer = JSON.parse(JSON.stringify(PLAN[rutinaDay]));
  showToast('↩ Plan por defecto restaurado');
  renderRutina();
});

// ── CALENDARIO ─────────────────────────────────────────
let calYear, calMonth;
function initCal() {
  const t = today();
  calYear = t.getFullYear();
  calMonth = t.getMonth();
}

function renderCalendario() {
  const t = today();
  const firstDay = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
  $('cal-month-name').textContent = `${MONTHS_ES[calMonth]} ${calYear}`;

  let html = DAYS_SHORT.map(d => `<div class="day-label">${d}</div>`).join('');
  for (let i = 0; i < firstDay; i++) html += `<div class="day empty"></div>`;
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(calYear, calMonth, d);
    const k = dateKey(date);
    const isToday = calYear === t.getFullYear() && calMonth === t.getMonth() && d === t.getDate();
    const isFuture = date > t;
    const r = registro[k];
    let cls = 'day';
    if (isFuture) cls += ' future';
    else if (r?.done) cls += ' done';
    else if (r && (r.ejercicios?.some(Boolean) || r.comidas?.some(Boolean))) cls += ' partial';
    else if (r && !r.done && !isFuture && date < t) cls += ' missed';
    if (isToday) cls += ' today';
    html += `<div class="${cls}">${d}</div>`;
  }
  $('full-cal').innerHTML = html;
}

$('cal-prev').addEventListener('click', () => {
  calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendario();
});
$('cal-next').addEventListener('click', () => {
  calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendario();
});

// ── PROGRESO — constantes ──────────────────────────────
const PESO_INICIAL = 86.1;
const PESO_OBJETIVO = 82;

// ── PROGRESO — peso semanal ─────────────────────────────
function getMondayKey(dateStr) {
  const d = new Date(dateStr);
  const day = d.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  return dateKey(d);
}

function getWeeklyAverages() {
  const groups = {};
  pesos.forEach(p => {
    const wk = getMondayKey(p.fecha);
    if (!groups[wk]) groups[wk] = [];
    groups[wk].push(p.peso);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([monday, vals]) => ({
      monday,
      avg: Math.round((vals.reduce((s, v) => s + v, 0) / vals.length) * 10) / 10,
      count: vals.length,
      label: monday.slice(5) // MM-DD
    }));
}

function renderProgreso() {
  renderChart();
  renderPesoLog();
}

function renderChart() {
  const wrap = $('chart');
  const weeks = getWeeklyAverages();

  if (weeks.length === 0) {
    wrap.innerHTML = '<div class="empty">Sin datos todavía — empieza a registrar tu peso</div>';
    $('peso-actual').textContent = '—';
    $('peso-diff').textContent = '—';
    $('progress-bar').style.width = '0%';
    $('peso-pct').textContent = '0%';
    return;
  }

  const last = weeks[weeks.length - 1].avg;
  const diff = (last - PESO_INICIAL).toFixed(1);
  $('peso-actual').textContent = `${last} kg`;
  $('peso-diff').textContent = diff <= 0 ? `${diff} kg` : `+${diff} kg`;
  $('peso-diff').style.color = diff <= 0 ? 'var(--green)' : 'var(--red)';

  // Barra de progreso
  const totalBajar = PESO_INICIAL - PESO_OBJETIVO;
  const bajado = PESO_INICIAL - last;
  const pct = Math.min(100, Math.max(0, Math.round((bajado / totalBajar) * 100)));
  $('progress-bar').style.width = pct + '%';
  $('peso-pct').textContent = pct + '%';

  const vals = weeks.map(w => w.avg);
  const min = Math.floor(Math.min(...vals)) - 1;
  const max = Math.ceil(Math.max(...vals)) + 1;
  const range = max - min || 1;
  const H = 80;

  let html = '';
  weeks.slice(-10).forEach(w => {
    const h = Math.max(6, Math.round(((w.avg - min) / range) * H));
    const countTxt = w.count > 1 ? `media ${w.count}` : '1 día';
    html += `<div class="bar-group">
      <div class="bar-val">${w.avg}</div>
      <div class="bar" style="height:${h}px" title="${countTxt}"></div>
      <div class="bar-date">S${w.label}</div>
    </div>`;
  });
  wrap.innerHTML = html;
}

function renderPesoLog() {
  const log = $('peso-log');
  if (pesos.length === 0) {
    log.innerHTML = '<div class="empty">Sin registros todavía</div>';
    return;
  }
  let html = '';
  pesos.slice(-10).reverse().forEach(p => {
    html += `<div class="medida-row">
      <span class="medida-name">${p.fecha}</span>
      <span class="medida-val">${p.peso} kg</span>
    </div>`;
  });
  log.innerHTML = html;
}

$('btn-add-peso').addEventListener('click', () => {
  const v = parseFloat($('input-peso').value);
  if (!v || v < 30 || v > 300) return showToast('Introduce un peso válido');
  pesos.push({ fecha: todayKey(), peso: v });
  save('pesos', pesos);
  $('input-peso').value = '';
  renderProgreso();
  showToast('✅ Peso guardado');
});

// ── Helpers ────────────────────────────────────────────
function escHtml(s) {
  return (s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 2500);
}

// ── Init ───────────────────────────────────────────────
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(regs => regs.forEach(r => r.unregister()));
  caches.keys().then(keys => keys.forEach(k => caches.delete(k)));
}
initCal();
updateHeader();
navigate('inicio');
