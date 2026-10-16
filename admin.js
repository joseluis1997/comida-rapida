const sb=supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY);
const $=s=>document.querySelector(s);
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const toast=(m,e)=>{const t=$('#toast');t.textContent=m;t.className='show'+(e?' err':'');setTimeout(()=>t.className='',3500)};
let tab='restaurantes',D={restaurantes:[],categorias:[],comidas:[]},editing=null;
const F={
 restaurantes:[['nombre','Nombre','text',1],['descripcion','Descripción','textarea'],['direccion','Dirección','text',1],['telefono','Teléfono','tel'],['horario','Horario (ej. Lun-Dom 18:00-23:00)','text'],['cats','Categorías','multi'],['imagen_url','Fotografía (JPG/PNG/WEBP, máx. 2 MB)','img'],['activo','Visible en la web','check']],
 comidas:[['restaurante_id','Restaurante','selR',1],['categoria_id','Categoría','selC'],['nombre','Nombre de la comida','text',1],['descripcion','Descripción','textarea'],['precio','Precio (Bs)','number',1],['imagen_url','Fotografía (JPG/PNG/WEBP, máx. 2 MB)','img'],['disponible','Disponible','check']],
 categorias:[['nombre','Nombre','text',1],['descripcion','Descripción','textarea']]};
const HEAD={restaurantes:['','Nombre','Dirección','Teléfono','Visible'],comidas:['','Comida','Restaurante','Precio','Disponible'],categorias:['','Nombre','Descripción','','']};
const im=x=>x.imagen_url?`<img src="${esc(x.imagen_url)}" alt="">`:'';
const ROW={restaurantes:x=>[im(x),x.nombre,x.direccion,x.telefono||'-',x.activo?'Sí':'No'],
 comidas:x=>[im(x),x.nombre,x.restaurantes?.nombre,'Bs '+Number(x.precio).toFixed(2),x.disponible?'Sí':'No'],
 categorias:x=>['',x.nombre,x.descripcion||'','','']};

async function load(){
  const [r,c,m]=await Promise.all([
    sb.from('restaurantes').select('*,restaurante_categorias(categoria_id)').order('nombre'),
    sb.from('categorias').select('*').order('nombre'),
    sb.from('comidas').select('*,restaurantes(nombre)').order('nombre')]);
  if(r.error||c.error||m.error)return toast((r.error||c.error||m.error).message,1);
  D={restaurantes:r.data,categorias:c.data,comidas:m.data};render();
}
function render(){
  $('#th').innerHTML='<tr>'+HEAD[tab].map(h=>`<th>${h}</th>`).join('')+'<th>Acciones</th></tr>';
  $('#tb').innerHTML=D[tab].map(x=>'<tr>'+ROW[tab](x).map((v,i)=>`<td>${i==0?v:esc(v)}</td>`).join('')+
   `<td class="a"><button class="btn s" data-e="${x.id}">Editar</button> <button class="btn d s" data-d="${x.id}">Eliminar</button></td></tr>`).join('')
   ||'<tr><td colspan="6" class="empty">Sin registros</td></tr>';
}
function openForm(id){
  editing=id?D[tab].find(x=>x.id==id):null;const v=editing||{activo:true,disponible:true};
  $('#ft').textContent=(id?'Editar ':'Nuevo ')+tab;
  $('#fields').innerHTML=F[tab].map(([k,l,t,r])=>{
    const q=r?'required':'';let i;
    if(t=='textarea')i=`<textarea name="${k}" maxlength="500" rows="3">${esc(v[k])}</textarea>`;
    else if(t=='check')i=`<input type="checkbox" name="${k}" ${v[k]?'checked':''}>`;
    else if(t=='img')i=(v[k]?`<img class="prev" src="${esc(v[k])}">`:'')+'<input type="file" name="file" accept="image/jpeg,image/png,image/webp">';
    else if(t=='selR'||t=='selC'){const L=t=='selR'?D.restaurantes:D.categorias;
      i=`<select name="${k}" ${q}><option value="">— Seleccione —</option>${L.map(o=>`<option value="${o.id}" ${v[k]==o.id?'selected':''}>${esc(o.nombre)}</option>`).join('')}</select>`}
    else if(t=='multi'){const s=(v.restaurante_categorias||[]).map(x=>String(x.categoria_id));
      i=`<div class="chips">${D.categorias.map(o=>`<label><input type="checkbox" name="cats" value="${o.id}" ${s.includes(String(o.id))?'checked':''}> ${esc(o.nombre)}</label>`).join('')}</div>`}
    else i=`<input name="${k}" type="${t}" ${q} value="${esc(v[k])}" ${t=='number'?'min="0" max="9999" step="0.01"':'maxlength="120"'} ${t=='tel'?'pattern="[0-9+ \\-]{7,20}" title="Solo números, +, espacios o guiones"':''}>`;
    return `<label class="f"><span>${l}</span>${i}</label>`}).join('');
  $('#dlg').showModal();
}
const delImg=async u=>{const p=u&&u.split('/imagenes/')[1];if(p)await sb.storage.from('imagenes').remove([decodeURIComponent(p)])};
$('#form').onsubmit=async e=>{
  e.preventDefault();const fd=new FormData(e.target),btn=$('#save');btn.disabled=true;
  try{
    const o={};
    for(const [k,,t] of F[tab]){
      if(t=='multi'||t=='img')continue;
      if(t=='check')o[k]=fd.get(k)=='on';
      else{const x=(fd.get(k)||'').trim();o[k]=x===''?null:x}
    }
    if(tab=='comidas')o.precio=parseFloat(o.precio);
    const f=fd.get('file');
    if(f&&f.size){
      if(!['image/jpeg','image/png','image/webp'].includes(f.type))throw Error('Formato no permitido (use JPG, PNG o WEBP)');
      if(f.size>2*1024*1024)throw Error('La imagen supera los 2 MB');
      const path=`${tab}/${crypto.randomUUID()}.${f.type.split('/')[1]}`;
      const u=await sb.storage.from('imagenes').upload(path,f,{contentType:f.type});if(u.error)throw u.error;
      o.imagen_url=sb.storage.from('imagenes').getPublicUrl(path).data.publicUrl;
      if(editing)await delImg(editing.imagen_url);
    }
    const r=editing?await sb.from(tab).update(o).eq('id',editing.id).select().single():await sb.from(tab).insert(o).select().single();
    if(r.error)throw r.error;
    if(tab=='restaurantes'){
      await sb.from('restaurante_categorias').delete().eq('restaurante_id',r.data.id);
      const cs=fd.getAll('cats').map(c=>({restaurante_id:r.data.id,categoria_id:c}));
      if(cs.length){const q=await sb.from('restaurante_categorias').insert(cs);if(q.error)throw q.error}
    }
    $('#dlg').close();toast('Guardado correctamente');await load();
  }catch(err){toast(err.message.includes('duplicate')?'Ya existe un registro con ese nombre':err.message,1)}
  finally{btn.disabled=false}
};
$('#tb').onclick=async e=>{
  const b=e.target.closest('button');if(!b)return;
  if(b.dataset.e)return openForm(b.dataset.e);
  if(!b.dataset.d||!confirm('¿Eliminar este registro? Esta acción no se puede deshacer.'))return;
  const x=D[tab].find(i=>i.id==b.dataset.d);
  const r=await sb.from(tab).delete().eq('id',x.id);if(r.error)return toast(r.error.message,1);
  await delImg(x.imagen_url);
  if(tab=='restaurantes')for(const c of D.comidas.filter(c=>c.restaurante_id==x.id))await delImg(c.imagen_url);
  toast('Eliminado');load();
};
$('#tabs').onclick=e=>{const b=e.target.closest('[data-t]');if(!b)return;tab=b.dataset.t;
  document.querySelectorAll('#tabs button').forEach(x=>x.classList.toggle('on',x==b));render()};
$('#new').onclick=()=>openForm();
$('#lf').onsubmit=async e=>{e.preventDefault();
  const r=await sb.auth.signInWithPassword({email:$('#em').value,password:$('#pw').value});
  r.error?toast('Correo o contraseña incorrectos',1):show(true)};
$('#out').onclick=async()=>{await sb.auth.signOut();show(false)};
function show(on){$('#login').classList.toggle('hide',on);$('#app').classList.toggle('hide',!on);if(on)load()}
sb.auth.getSession().then(({data})=>show(!!data.session));
