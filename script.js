// script.js
let cursos = [];
let usuarios = [];

const topicSelect = document.getElementById('topicSelect');
const levelSelect = document.getElementById('levelSelect');
const userSelect = document.getElementById('userSelect');
const loadUserBtn = document.getElementById('loadUserBtn');
const searchBtn = document.getElementById('searchBtn');
const results = document.getElementById('results');

// utility: normalizar texto (quita tildes y pasa a minúsculas)
function normalizeText(s){
  if(!s) return '';
  return s.toString().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'');
}

// carga los JSON (cursos y usuarios)
async function loadData(){
  try{
    const [cResp, uResp] = await Promise.all([
      fetch('data/cursos.json'),
      fetch('data/usuarios.json')
    ]);
    if(!cResp.ok) throw new Error('No se pudo cargar cursos.json');
    if(!uResp.ok) throw new Error('No se pudo cargar usuarios.json');
    cursos = await cResp.json();
    usuarios = await uResp.json();
    populateSelectors();
  } catch(err){
    console.error(err);
    results.innerHTML = `<div class="no-results">Error cargando datos: ${err.message}. Asegúrate de ejecutar la página desde un servidor local.</div>`;
  }
}

// llena selects: temas únicos y usuarios
function populateSelectors(){
  // temas únicos
  const temas = Array.from(new Set(cursos.map(c => c.tema))).filter(Boolean);
  temas.sort();
  temas.forEach(t => {
    const opt = document.createElement('option');
    opt.value = t;
    opt.textContent = t;
    topicSelect.appendChild(opt);
  });

  // usuarios
  usuarios.forEach(u => {
    const opt = document.createElement('option');
    opt.value = u.usuario; // id del usuario
    opt.textContent = `${u.usuario} — ${u.intereses}`;
    userSelect.appendChild(opt);
  });
}

// carga datos del usuario seleccionado y ajusta filtro
function loadSelectedUser(){
  const uid = userSelect.value;
  if(!uid) return alert('Selecciona primero un usuario');
  const u = usuarios.find(x => x.usuario === uid);
  if(!u) return alert('Usuario no encontrado');
  // intentar emparejar interés del usuario con un tema del catálogo
  // si existe tema igual o que contenga el texto, lo seleccionamos
  const userInterest = u.intereses || '';
  // intentamos buscar un tema que coincida parcialmente
  const normInterest = normalizeText(userInterest);
  const match = cursos.find(c => normalizeText(c.tema).includes(normInterest));
  if(match){
    topicSelect.value = match.tema;
  } else {
    // si no hay coincidencia directa, dejamos el interés en el select manualmente (si existe)
    const opt = Array.from(topicSelect.options).find(o => normalizeText(o.value).includes(normInterest));
    if(opt) topicSelect.value = opt.value;
  }
  // (opcional) si quieres ajustar nivel según ocupación podríamos hacerlo aquí
}

// función principal: filtro y render de resultados
function buscarYMostrar(){
  const topic = topicSelect.value.trim();
  const level = levelSelect.value.trim();

  const normTopic = normalizeText(topic);

  const filtrados = cursos.filter(c => {
    // filtrar por nivel si se escogió
    if(level){
      if(!c.nivel) return false;
      if(normalizeText(c.nivel) !== normalizeText(level)) return false;
    }
    // si no se escogió tema, pasa todo; si sí, verificamos
    if(!topic) return true;
    // coincidencia por tema o por nombre del curso
    if(normalizeText(c.tema).includes(normTopic)) return true;
    if(normalizeText(c.nombre).includes(normTopic)) return true;
    // coincidencia por descripcion
    if(c.descripcion && normalizeText(c.descripcion).includes(normTopic)) return true;
    return false;
  });

  renderResults(filtrados);
}

// muestra tarjetas
function renderResults(list){
  results.innerHTML = '';
  if(!list || list.length === 0){
    results.innerHTML = `<div class="no-results">No se encontraron cursos. Prueba otro tema o nivel.</div>`;
    return;
  }

  list.forEach(c => {
    const card = document.createElement('article');
    card.className = 'card';
    const title = document.createElement('h3');
    title.textContent = c.nombre;
    const desc = document.createElement('p');
    desc.textContent = c.descripcion || '';

    const modules = document.createElement('ul');
    modules.className = 'modules';
    if(Array.isArray(c.modulos)){
      c.modulos.forEach(m => {
        const li = document.createElement('li');
        li.textContent = m;
        modules.appendChild(li);
      });
    }

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `<span>${c.tema} · ${c.nivel || '—'}</span><span>${c.modalidad || ''}</span>`;

    const linkWrap = document.createElement('div');
    const a = document.createElement('a');
    a.className = 'btn-download';
    a.href = c.enlace_pdf || '#';
    a.target = '_blank';
    a.rel = 'noopener';
    a.textContent = 'Ver / Descargar PDF';
    // atributo download funciona si el archivo es del mismo origen y el navegador lo permite
    a.setAttribute('download','');

    linkWrap.appendChild(a);

    card.appendChild(title);
    card.appendChild(desc);
    card.appendChild(modules);
    card.appendChild(meta);
    card.appendChild(linkWrap);

    results.appendChild(card);
  });
}

// listeners
loadUserBtn.addEventListener('click', loadSelectedUser);
searchBtn.addEventListener('click', buscarYMostrar);

// cargar todo al inicio
loadData();