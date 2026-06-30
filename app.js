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

  $('plan-emoji').textContent = plan.emoji;
  $('plan-tipo').textContent = plan.tipo;

  let ejHtml = '';
  plan.ejercicios.forEach((ej, i) => {
    ejHtml += `<li class="${reg.ejercicios[i] ? 'checked' : ''}" data-type="ej" data-i="${i}">
      <div class="check"></div>
      <div class="item-text">
        <div class="name">${ej.nombre}</div>
        ${ej.detalle ? `<div class="detail">${ej.detalle}</div>` : ''}
      </div>
    </li>`;
  });

  let comHtml = '';
  plan.comidas.forEach((com, i) => {
    comHtml += `<li class="${reg.comidas[i] ? 'checked' : ''}" data-type="com" data-i="${i}">
      <div class="check"></div>
      <div class="item-text">
        <div class="name">${com.momento}</div>
        <div class="detail">${com.desc}</div>
      </div>
    </li>`;
  });

  $('ej-list').innerHTML = ejHtml;
  $('com-list').innerHTML = comHtml;

  document.querySelectorAll('[data-type="ej"]').forEach(li => {
    li.addEventListener('click', () => {
      registro[k].ejercicios[parseInt(li.dataset.i)] ^= true;
      save('registro', registro);
      renderHoy();
    });
  });
  document.querySelectorAll('[data-type="com"]').forEach(li => {
    li.addEventListener('click', () => {
      registro[k].comidas[parseInt(li.dataset.i)] ^= true;
      save('registro', registro);
      renderHoy();
    });
  });

  const btn = $('btn-complete');
  if (reg.done) {
    btn.textContent = '✅ ¡Día completado!';
    btn.classList.add('completed');
  } else {
    btn.textContent = '✔ Marcar día como completado';
    btn.classList.remove('completed');
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
