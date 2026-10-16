const sb=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let R=[],C=[],cat=null;
const bs=n=>'Bs '+Number(n).toFixed(2);
async function init(){
  const [r,c]=await Promise.all([
    sb.from('restaurantes').select('*,restaurante_categorias(categoria_id),comidas(*)').eq('activo',true).order('nombre'),
    sb.from('categorias').select('*').order('nombre')]);
  if(r.error||c.error){$('#grid').innerHTML='<p class="empty">No se pudo conectar con la base de datos. Revise js/config.js</p>';return}
  R=r.data;C=c.data;drawChips();draw();
}
function drawChips(){
  $('#chips').innerHTML=`<button class="chip ${cat?'':'on'}" data-c="">Todas</button>`+
   C.map(x=>`<button class="chip ${cat==x.id?'on':''}" data-c="${x.id}">${esc(x.nombre)}</button>`).join('');
}
function catsOf(r){return r.restaurante_categorias.map(x=>C.find(c=>c.id==x.categoria_id)?.nombre).filter(Boolean)}
function draw(){
  const q=$('#q').value.trim().toLowerCase();
  const L=R.filter(r=>(!cat||r.restaurante_categorias.some(x=>x.categoria_id==cat))&&
    (!q||[r.nombre,r.direccion,r.descripcion,...r.comidas.map(f=>f.nombre)].join(' ').toLowerCase().includes(q)));
  $('#grid').innerHTML=L.length?L.map(r=>`<article class="card">
    ${r.imagen_url?`<img loading="lazy" src="${esc(r.imagen_url)}" alt="${esc(r.nombre)}">`:'<div class="ph">🍽️</div>'}
    <div class="b"><h3>${esc(r.nombre)}</h3><div>${catsOf(r).map(t=>`<span class="tag">${esc(t)}</span>`).join('')}</div>
    <p class="mu">${esc(r.descripcion)}</p><span>📍 ${esc(r.direccion)}</span>
    ${r.telefono?`<span>📞 <a href="tel:${esc(r.telefono)}">${esc(r.telefono)}</a></span>`:''}
    ${r.horario?`<span>🕒 ${esc(r.horario)}</span>`:''}
    <button class="btn" style="margin-top:auto" data-r="${r.id}">Ver comidas y precios (${r.comidas.length})</button></div></article>`).join(''):'<p class="empty">No se encontraron restaurantes.</p>';
  $('#count').textContent=L.length+' restaurante(s)';
}
function menu(id){
  const r=R.find(x=>x.id==id);$('#dt').textContent=r.nombre;
  $('#dbody').innerHTML=r.comidas.length?r.comidas.map(f=>`<div class="food">
    ${f.imagen_url?`<img loading="lazy" src="${esc(f.imagen_url)}" alt="">`:''}
    <div><strong>${esc(f.nombre)}</strong>${f.disponible?'':' <span class="tag">No disponible</span>'}<div class="mu">${esc(f.descripcion)}</div>
    <span class="tag">${esc(C.find(c=>c.id==f.categoria_id)?.nombre||'')}</span></div><span class="price">${bs(f.precio)}</span></div>`).join(''):'<p class="empty">Aún no hay comidas registradas.</p>';
  $('#dlg').showModal();
}
$('#q').oninput=draw;
$('#chips').onclick=e=>{const b=e.target.closest('[data-c]');if(!b)return;cat=b.dataset.c||null;drawChips();draw()};
$('#grid').onclick=e=>{const b=e.target.closest('[data-r]');if(b)menu(b.dataset.r)};
init();
