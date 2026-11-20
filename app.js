// Señor Busca — PWA solo cliente. Sin backend, sin analítica, sin peticiones a otros dominios.
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
    a.href = t.id === 'lanyon' ? '#aviso' : '#carta-' + t.id;
    a.dataset.camino = t.id;
    const h = document.createElement('span');
    h.className = 'tarjeta-titulo';
    h.textContent = t.titulo;
    const p = document.createElement('span');
    p.className = 'tarjeta-linea';
    p.textContent = t.linea;
    a.append(h, p);
    li.append(a);
    ul.append(li);
  });

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
  // Lacre: borde irregular
  const puntos = [];
  for (let k = 0; k < 24; k++) {
    const ang = (k / 24) * Math.PI * 2;
    const r = k % 2 ? 46 : 49;
    puntos.push((50 + r * Math.cos(ang)).toFixed(1) + ',' + (50 + r * Math.sin(ang)).toFixed(1));
  }
  svg.append(el('polygon', { points: puntos.join(' '), class: 'lacre' }));
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
let indicePregunta = 0;
let preguntasOcultas = false;
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
function prepararCarta(c) {
  const d = T.pantalla_3_carta.caminos[c];
  document.body.dataset.camino = c;
  $('#ancla-texto').textContent = d.ancla;
  $('#ancla-fuente').textContent = d.ancla_fuente;
  $('#eco').textContent = d.eco;
  const aviso = $('#aviso-fijo');
  if (d.aviso_fijo) { textoConTelefonos(aviso, d.aviso_fijo); aviso.hidden = false; }
  else { aviso.textContent = ''; aviso.hidden = true; }
  indicePregunta = 0;
  mostrarPregunta();
  $('#papel').value = borrador(c);
  caminoDelPapel = c;
  $('#ir-cerrar').href = '#cerrar-' + c;
}
function mostrarPregunta() {
  const d = T.pantalla_3_carta.caminos[caminoActual];
  $('#pregunta').textContent = d.preguntas[indicePregunta % d.preguntas.length];
  $('#guia').hidden = preguntasOcultas;
  $('#ocultar-preguntas').hidden = preguntasOcultas;
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
  $('#volver-carta').href = '#carta-' + c;
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

/* ---------- Navegación por hash ---------- */
function rutaDesdeHash() {
  const h = (location.hash || '#portada').slice(1);
  const [nombre, c] = h.split('-');
  if (nombre === 'carta' || nombre === 'cerrar') {
    const camino = CAMINOS.includes(c) ? c : caminoActual;
    return { nombre, camino };
  }
  if (['portada', 'elegir', 'aviso'].includes(nombre)) return { nombre };
  return { nombre: 'portada' };
}
function mostrar() {
  const r = rutaDesdeHash();
  if (rutaAnterior && rutaAnterior.nombre === 'carta') {
    guardarBorrador();
    // Al salir de la carta sin pasar a cerrarla: se avisa de que el borrador queda en el móvil.
    if (r.nombre !== 'cerrar' && r.nombre !== 'carta' && borrador(rutaAnterior.camino).trim()) avisarGuardado();
  }
  if (r.camino) { caminoActual = r.camino; escribir('camino', r.camino); }
  if (r.nombre === 'carta') { preguntasOcultas = false; prepararCarta(r.camino); }
  if (r.nombre === 'cerrar') prepararCierre(r.camino);
  if (r.nombre !== 'carta' && r.nombre !== 'cerrar') delete document.body.dataset.camino;

  document.querySelectorAll('.pantalla').forEach((s) => { s.hidden = s.dataset.pantalla !== r.nombre; });
  document.body.dataset.pantalla = r.nombre;
  window.scrollTo(0, 0);
  rutaAnterior = r;
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

  $('#otra-pregunta').addEventListener('click', () => {
    if (preguntasOcultas) preguntasOcultas = false; else indicePregunta++;
    mostrarPregunta();
  });
  $('#ocultar-preguntas').addEventListener('click', () => {
    preguntasOcultas = true;
    mostrarPregunta();
    $('#otra-pregunta').focus();
  });

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
