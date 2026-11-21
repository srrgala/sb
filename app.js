// Señor Busca — PWA solo cliente. Sin backend, sin analítica, sin peticiones a otros dominios.
// v2 (21 nov 2026): identidad del vídeo v7, una pregunta cada vez, papel aparte, gesto final. La privacidad no cambia.
// Todos los textos visibles salen de textos.js (generado literal desde textos_pwa.json).
import { T } from './textos.js';

const $ = (sel) => document.querySelector(sel);
const CAMINOS = ['utterson', 'jekyll', 'lanyon'];
const PAPELES = ['crema', 'rayado', 'verjurado', 'blanco'];
const SELLOS = ['anillo', 'estrella', 'rombo', 'flor'];

/* ---------- Almacenamiento local (puede fallar o estar vacío) ---------- */
const CLAVE = 'senorbusca.';
function leer(clave, porDefecto = '') {
  try {
    const v = window.localStorage.getItem(CLAVE + clave);
    return v === null ? porDefecto : v;
  } catch (e) { return porDefecto; }
}
function escribir(clave, valor) {
  try { window.localStorage.setItem(CLAVE + clave, valor); return true; } catch (e) { return false; }
}

/* ---------- Utilidades de texto ---------- */
function ruta(obj, camino) {
  return camino.split('.').reduce((o, k) => (o == null ? o : o[k]), obj);
}
// Pone un texto literal en un nodo y convierte "024" y "112" en enlaces tel:.
function textoConTelefonos(nodo, texto) {
  nodo.textContent = '';
  const nums = T.app.pie_enlaces;
  let resto = texto;
  while (resto.length) {
    let primero = null;
    for (const n of nums) {
      const i = resto.indexOf(n.texto);
      if (i !== -1 && (primero === null || i < primero.i)) primero = { i, n };
    }
    if (!primero) { nodo.append(resto); break; }
    if (primero.i > 0) nodo.append(resto.slice(0, primero.i));
    const a = document.createElement('a');
    a.href = primero.n.href;
    a.className = 'tel';
    a.textContent = primero.n.texto;
    nodo.append(a);
    resto = resto.slice(primero.i + primero.n.texto.length);
  }
}

/* ---------- Pintado inicial ---------- */
function pintarTextosFijos() {
  document.querySelectorAll('[data-t]').forEach((el) => {
    const v = ruta(T, el.dataset.t);
    if (typeof v === 'string') el.textContent = v;
  });
  textoConTelefonos($('#pie'), T.app.pie_fijo);
  $('#papel').placeholder = T.pantalla_3_carta.ayuda_papel;

  const ul = $('#tarjetas');
  T.pantalla_2_elegir.tarjetas.forEach((t) => {
    const li = document.createElement('li');
    const a = document.createElement('a');
    a.className = 'tarjeta';
    a.href = t.id === 'lanyon' ? '#aviso' : '#pregunta-' + t.id + '-1';
    a.dataset.camino = t.id;
    const img = document.createElement('img');
    img.className = 'tarjeta-retrato';
    img.src = 'img/' + t.id + '.jpg';
    img.alt = '';
    img.width = 600; img.height = 796;
    const txt = document.createElement('span');
    txt.className = 'tarjeta-texto';
    const h = document.createElement('span');
    h.className = 'tarjeta-titulo';
    h.textContent = t.titulo;
    const p = document.createElement('span');
    p.className = 'tarjeta-linea';
    p.textContent = t.linea;
    txt.append(h, p);
    a.append(img, txt);
    li.append(a);
    ul.append(li);
  });
  $('#fecha').textContent = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date());

  const op = $('#opciones-papel');
  PAPELES.forEach((p, i) => op.append(opcion('papel', p, i, (caja) => caja.classList.add('muestra-papel', 'papel-' + p))));
  const os = $('#opciones-sello');
  SELLOS.forEach((s, i) => os.append(opcion('sello', s, i, (caja) => caja.append(dibujarSello(s)))));
}

function opcion(grupo, valor, i, decorar) {
  const label = document.createElement('label');
  label.className = 'opcion';
  const input = document.createElement('input');
  input.type = 'radio';
  input.name = grupo;
  input.value = valor;
  input.className = 'opcion-radio';
  const caja = document.createElement('span');
  caja.className = 'opcion-caja';
  caja.setAttribute('aria-hidden', 'true');
  decorar(caja);
  label.append(input, caja);
  return label;
}

const SVG = 'http://www.w3.org/2000/svg';
function el(tag, attrs) {
  const n = document.createElementNS(SVG, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  return n;
}
function dibujarSello(tipo) {
  const svg = el('svg', { viewBox: '0 0 100 100', class: 'sello', focusable: 'false' });
  // Fondo del sello: borde irregular
  const puntos = [];
  for (let k = 0; k < 24; k++) {
    const ang = (k / 24) * Math.PI * 2;
    const r = k % 2 ? 46 : 49;
    puntos.push((50 + r * Math.cos(ang)).toFixed(1) + ',' + (50 + r * Math.sin(ang)).toFixed(1));
  }
  svg.append(el('polygon', { points: puntos.join(' '), class: 'sello-fondo' }));
  svg.append(el('circle', { cx: 50, cy: 50, r: 34, class: 'grabado' }));
  if (tipo === 'anillo') {
    svg.append(el('circle', { cx: 50, cy: 50, r: 22, class: 'grabado' }));
    svg.append(el('circle', { cx: 50, cy: 50, r: 6, class: 'grabado-lleno' }));
  } else if (tipo === 'estrella') {
    const p = [];
    for (let k = 0; k < 16; k++) {
      const ang = (k / 16) * Math.PI * 2 - Math.PI / 2;
      const r = k % 2 ? 10 : 26;
      p.push((50 + r * Math.cos(ang)).toFixed(1) + ',' + (50 + r * Math.sin(ang)).toFixed(1));
    }
    svg.append(el('polygon', { points: p.join(' '), class: 'grabado-lleno' }));
  } else if (tipo === 'rombo') {
    svg.append(el('polygon', { points: '50,22 74,50 50,78 26,50', class: 'grabado' }));
    svg.append(el('polygon', { points: '50,36 62,50 50,64 38,50', class: 'grabado-lleno' }));
  } else {
    [[50, 36], [64, 50], [50, 64], [36, 50]].forEach(([x, y]) =>
      svg.append(el('circle', { cx: x, cy: y, r: 11, class: 'grabado' })));
    svg.append(el('circle', { cx: 50, cy: 50, r: 4, class: 'grabado-lleno' }));
  }
  return svg;
}

/* ---------- Estado ---------- */
let caminoActual = leer('camino', 'utterson');
if (!CAMINOS.includes(caminoActual)) caminoActual = 'utterson';
let indicePregunta = 1;
let rutaAnterior = null;

function borrador(c = caminoActual) { return leer('borrador.' + c, ''); }
function hayAlgunBorrador() { return CAMINOS.some((c) => borrador(c).trim().length > 0); }

/* ---------- Aviso "borrador guardado" ---------- */
let temporizadorAviso = null;
function avisarGuardado() {
  const n = $('#aviso-guardado');
  n.textContent = T.pantalla_3_carta.al_salir_sin_terminar;
  n.classList.add('visible');
  clearTimeout(temporizadorAviso);
  temporizadorAviso = setTimeout(() => n.classList.remove('visible'), 4500);
}

/* ---------- Pantalla 3: la carta ---------- */
function avisoFijo(c) {
  const d = T.pantalla_3_carta.caminos[c];
  document.querySelectorAll('[data-aviso-fijo]').forEach((aviso) => {
    if (d.aviso_fijo) { textoConTelefonos(aviso, d.aviso_fijo); aviso.hidden = false; }
    else { aviso.textContent = ''; aviso.hidden = true; }
  });
}
// 3a · Una pregunta cada vez. n = 1..N. La primera lleva el ancla y el eco de la escena.
function prepararPregunta(c, n) {
  const d = T.pantalla_3_carta.caminos[c];
  const N = d.preguntas.length;
  n = Math.min(Math.max(1, n), N);
  indicePregunta = n;
  document.body.dataset.camino = c;
  avisoFijo(c);
  $('#pregunta-intro').hidden = n !== 1;
  $('#ancla-texto').textContent = d.ancla;
  $('#ancla-fuente').textContent = d.ancla_fuente;
  $('#eco').textContent = d.eco;
  $('#pregunta').textContent = d.preguntas[n - 1];
  const ol = $('#puntos');
  ol.textContent = '';
  for (let k = 1; k <= N; k++) { const li = document.createElement('li'); if (k === n) li.className = 'activo'; ol.append(li); }
  const otra = $('#otra-pregunta');
  otra.hidden = n === N;
  otra.href = `#pregunta-${c}-${n + 1}`;
  $('#ocultar-preguntas').href = '#carta-' + c;
  $('#anterior-pregunta').href = n > 1 ? `#pregunta-${c}-${n - 1}` : (c === 'lanyon' ? '#aviso' : '#elegir');
  escribir('pregunta.' + c, String(n));
}
// 3b · El papel
function prepararCarta(c) {
  document.body.dataset.camino = c;
  avisoFijo(c);
  $('#papel').value = borrador(c);
  caminoDelPapel = c;
  $('#ir-cerrar').href = '#cerrar-' + c;
  const n = parseInt(leer('pregunta.' + c, '1'), 10) || 1;
  $('#anterior-carta').href = `#pregunta-${c}-${n}`;
}

let temporizadorGuardado = null;
// Guarda el texto del papel en el camino al que pertenece (no en el camino que se abra después).
let caminoDelPapel = null;
function guardarBorrador() {
  clearTimeout(temporizadorGuardado);
  if (caminoDelPapel) escribir('borrador.' + caminoDelPapel, $('#papel').value);
}

/* ---------- Pantalla 4: cerrar ---------- */
function prepararCierre(c) {
  const d = T.pantalla_3_carta.caminos[c];
  document.body.dataset.camino = c;
  $('#linea-final').textContent = d.linea_final;
  $('#ir-fin').href = '#fin-' + c;
  $('#anterior-cerrar').href = '#carta-' + c;
  $('#anterior-fin').href = '#cerrar-' + c;
  const papel = PAPELES.includes(leer('papel')) ? leer('papel') : PAPELES[0];
  const sello = SELLOS.includes(leer('sello')) ? leer('sello') : SELLOS[0];
  document.querySelector(`input[name="papel"][value="${papel}"]`).checked = true;
  document.querySelector(`input[name="sello"][value="${sello}"]`).checked = true;
  $('#firma').value = leer('firma', '');
  actualizarCartaFinal();
}
function actualizarCartaFinal() {
  const papel = document.querySelector('input[name="papel"]:checked')?.value || PAPELES[0];
  const sello = document.querySelector('input[name="sello"]:checked')?.value || SELLOS[0];
  const carta = $('#carta-final');
  PAPELES.forEach((p) => carta.classList.toggle('papel-' + p, p === papel));
  $('#carta-cuerpo').textContent = borrador();
  const s = $('#carta-sello');
  s.textContent = '';
  s.append(dibujarSello(sello));
  $('#carta-firma').textContent = $('#firma').value;
}
function guardarCierre() {
  const papel = document.querySelector('input[name="papel"]:checked')?.value;
  const sello = document.querySelector('input[name="sello"]:checked')?.value;
  let ok = true;
  if (papel) ok = escribir('papel', papel) && ok;
  if (sello) ok = escribir('sello', sello) && ok;
  ok = escribir('firma', $('#firma').value) && ok;
  return ok;
}
function textoCompleto() {
  const firma = $('#firma').value.trim();
  return borrador() + (firma ? '\n\n' + firma : '');
}
function marcarHecho(boton) {
  boton.classList.add('hecho');
  setTimeout(() => boton.classList.remove('hecho'), 1600);
}
async function copiar(texto) {
  try {
    if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(texto); return true; }
  } catch (e) { /* sigue con el método antiguo */ }
  try {
    const ta = document.createElement('textarea');
    ta.value = texto;
    ta.setAttribute('readonly', '');
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.append(ta);
    ta.select();
    const ok = document.execCommand('copy');
    ta.remove();
    return ok;
  } catch (e) { return false; }
}

/* ---------- Gesto final ---------- */
const sinMovimiento = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function prepararGesto() {
  const g = $('#gesto');
  const pl = $('#pliegue');
  pl.textContent = '';
  const papel = PAPELES.includes(leer('papel')) ? leer('papel') : PAPELES[0];
  for (let k = 1; k <= 3; k++) {
    const t = document.createElement('div');
    t.className = 'tercio tercio-' + k;
    const h = document.createElement('div');
    h.className = 'hoja-mini papel-' + papel;
    const r = document.createElement('div');
    r.className = 'reverso';
    t.append(h, r);
    pl.append(t);
  }
  const textos = $('#fin-textos');
  g.className = 'gesto';
  textos.classList.add('oculto');
  void g.offsetWidth; // reinicia la animación
  if (sinMovimiento()) {
    // Sin animación de pliegue: fundido simple al estado final.
    g.classList.add('simple');
    requestAnimationFrame(() => { g.classList.add('final'); textos.classList.remove('oculto'); });
    return;
  }
  g.classList.add('animar');
  clearTimeout(prepararGesto.t);
  prepararGesto.t = setTimeout(() => { g.classList.remove('animar'); g.classList.add('final'); textos.classList.remove('oculto'); }, 2300);
}

/* ---------- Navegación por hash ---------- */
function rutaDesdeHash() {
  const h = (location.hash || '#portada').slice(1);
  const [nombre, c, n] = h.split('-');
  if (['pregunta', 'carta', 'cerrar', 'fin'].includes(nombre)) {
    const camino = CAMINOS.includes(c) ? c : caminoActual;
    return { nombre, camino, n: parseInt(n, 10) || 1 };
  }
  if (['portada', 'elegir', 'aviso'].includes(nombre)) return { nombre };
  return { nombre: 'portada' };
}
function aplicar(r) {
  if (rutaAnterior && rutaAnterior.nombre === 'carta') {
    guardarBorrador();
    // Al salir del papel sin pasar a cerrarla: se avisa de que el borrador queda en el móvil.
    if (!['cerrar', 'carta', 'fin', 'pregunta'].includes(r.nombre) && borrador(rutaAnterior.camino).trim()) avisarGuardado();
  }
  if (r.camino) { caminoActual = r.camino; escribir('camino', r.camino); }
  if (r.nombre === 'pregunta') prepararPregunta(r.camino, r.n);
  if (r.nombre === 'carta') prepararCarta(r.camino);
  if (r.nombre === 'cerrar' || r.nombre === 'fin') prepararCierre(r.camino);
  if (!r.camino) delete document.body.dataset.camino;

  document.querySelectorAll('.pantalla').forEach((s) => { s.hidden = s.dataset.pantalla !== r.nombre; });
  document.body.dataset.pantalla = r.nombre;
  window.scrollTo(0, 0);
  rutaAnterior = r;
  if (r.nombre === 'fin') prepararGesto();
}
// Transición entre pantallas: fade-through-black de 0,4 s (0,2 s a negro + 0,2 s de vuelta). Sin ella si reduce el movimiento.
const MEDIO = 200;
let turno = 0;
function mostrar() {
  const r = rutaDesdeHash();
  if (!rutaAnterior || sinMovimiento()) { aplicar(r); return; }
  const mio = ++turno;
  const velo = $('#velo');
  velo.classList.add('activo');
  setTimeout(() => {
    if (mio !== turno) return;
    aplicar(r);
    requestAnimationFrame(() => velo.classList.remove('activo'));
  }, MEDIO);
}

/* ---------- Eventos ---------- */
function conectar() {
  window.addEventListener('hashchange', mostrar);

  const papel = $('#papel');
  papel.addEventListener('input', () => {
    clearTimeout(temporizadorGuardado);
    temporizadorGuardado = setTimeout(guardarBorrador, 400);
  });
  papel.addEventListener('blur', guardarBorrador);


  document.querySelectorAll('input[name="papel"], input[name="sello"]').forEach((i) =>
    i.addEventListener('change', () => { guardarCierre(); actualizarCartaFinal(); }));
  $('#firma').addEventListener('input', () => { guardarCierre(); actualizarCartaFinal(); });

  $('#enviar').addEventListener('click', async (ev) => {
    const boton = ev.currentTarget;
    guardarCierre();
    const texto = textoCompleto();
    if (navigator.share) {
      try { await navigator.share({ text: texto }); return; }
      catch (e) { if (e && e.name === 'AbortError') return; }
    }
    if (await copiar(texto)) marcarHecho(boton);
  });
  $('#imprimir').addEventListener('click', () => { guardarCierre(); actualizarCartaFinal(); window.print(); });
  $('#guardar').addEventListener('click', () => {
    guardarBorrador();
    guardarCierre();
    avisarGuardado();
  });

  // Si la app se cierra o pasa a segundo plano, el borrador queda guardado.
  const alSalir = () => { if (rutaAnterior && rutaAnterior.nombre === 'carta') guardarBorrador(); };
  window.addEventListener('pagehide', alSalir);
  document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') alSalir(); });
}

/* ---------- Arranque ---------- */
pintarTextosFijos();
conectar();
mostrar();
if (rutaAnterior.nombre === 'portada' && hayAlgunBorrador()) avisarGuardado();

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js', { scope: './' }).catch(() => { /* sin conexión o no permitido */ });
  });
}
