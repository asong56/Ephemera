const MAX=10,KEY='ephemera_v2';
const $=id=>document.getElementById(id);
const N=$('N'),PL=$('PL'),PT=$('PT'),IL=$('IL'),UI=$('UI'),EM=$('EM'),FN=$('FN'),LI=$('LI'),ES=$('ES'),TT=$('TT');

let data=[];
try{data=JSON.parse(localStorage.getItem(KEY))||[];}catch{}
const save=()=>localStorage.setItem(KEY,JSON.stringify(data));

function parseURL(s){
  if(!(s=s&&s.trim()))return null;
  if(/^https?:\/\//i.test(s)){try{new URL(s);return s;}catch{return null;}}
  if(/^[a-z][a-z0-9+\-.]*:\/\//i.test(s))return null;
  try{
    const u=new URL('https://'+s);
    return(u.hostname==='localhost'||u.hostname.includes('.'))? 'https://'+s:null;
  }catch{return null;}
}

function decay(t){
  const h=(Date.now()-t)/3600000;
  return h<24?'fresh':h<72?'aging':h<168?'stale':'rot';
}

function age(t){
  const ms=Date.now()-t,m=ms/60000|0,h=ms/3600000|0,d=ms/86400000|0;
  if(m<2)return'<span class="nb">new</span>';
  if(h<1)return m+'m';
  if(h<24)return h+'h';
  return d+'d';
}

function title(url){
  try{
    const u=new URL(url),p=u.pathname.split('/').filter(Boolean);
    if(p.length){
      const r=p[p.length-1].replace(/[-_]/g,' ').replace(/\.(html?|php|aspx?)$/i,'');
      const l=r.replace(/\b\w/g,c=>c.toUpperCase());
      if(l.length>3)return l+' — '+u.hostname;
    }
    return u.hostname;
  }catch{return url.slice(0,60);}
}

function esc(s){return(''+s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

function render(aid){
  const n=data.length;
  N.textContent=n;
  N.classList.toggle('full',n>=MAX);
  PL.textContent=n?n>=MAX?'queue full':(MAX-n)+' remaining':'empty';

  PT.innerHTML='';
  for(let i=0;i<MAX;i++){const p=document.createElement('div');p.className='pip'+(i<n?' on':'');PT.appendChild(p);}

  IL.classList.toggle('full',n>=MAX);
  UI.disabled=n>=MAX;
  FN.classList.toggle('on',n>=MAX);
  ES.classList.toggle('on',n===0);

  LI.innerHTML='';
  if(!n)return;
  const f=document.createDocumentFragment();
  data.forEach(it=>{
    const d=decay(it.t),el=document.createElement('div');
    el.className='it'+(it.id===aid?' in':'');
    el.dataset.d=d;el.dataset.id=it.id;
    el.innerHTML='<div class="dd"></div><a class="it-t" href="'+esc(it.url)+'" target="_blank" rel="noopener">'+esc(it.title)+'</a><span class="it-a">'+age(it.t)+'</span><button class="db" data-id="'+it.id+'">&times;</button>';
    f.appendChild(el);
  });
  LI.appendChild(f);
}

function add(raw){
  clrErr();
  if(data.length>=MAX){err('Queue is full.');shake();return;}
  const url=parseURL(raw);
  if(!url){err('Enter a valid URL — e.g. vercel.com');shake();return;}
  if(data.some(i=>i.url===url)){err('Already in your queue.');shake();return;}
  const id=Date.now().toString(36)+Math.random().toString(36).slice(2,5);
  data.unshift({id,url,title:title(url),t:Date.now()});
  save();render(id);
  toast('Saved ('+data.length+'/10)');
  UI.value='';
}

function del(id){
  const el=LI.querySelector('[data-id="'+id+'"]');
  if(!el)return;
  el.classList.add('rm');
  setTimeout(()=>{data=data.filter(i=>i.id!==id);save();render();},210);
}

function err(m){EM.textContent=m;EM.classList.add('on');}
function clrErr(){EM.classList.remove('on');setTimeout(()=>{if(!EM.classList.contains('on'))EM.textContent='';},250);}
function shake(){IL.classList.remove('err');void IL.offsetWidth;IL.classList.add('err');setTimeout(()=>IL.classList.remove('err'),400);}

let tt;
function toast(m){TT.textContent=m;TT.classList.add('on');clearTimeout(tt);tt=setTimeout(()=>TT.classList.remove('on'),2200);}

UI.addEventListener('keydown',e=>{if(e.key==='Enter')add(e.target.value);else clrErr();});
$('SH').addEventListener('click',()=>add(UI.value));
IL.addEventListener('click',()=>UI.focus());
LI.addEventListener('click',e=>{const b=e.target.closest('.db');if(b){e.preventDefault();del(b.dataset.id);}});

document.addEventListener('keydown',e=>{
  if(e.target===UI)return;
  const n=+e.key;
  if(n>=1&&n<=9&&data[n-1]){e.shiftKey?del(data[n-1].id):open(data[n-1].url,'_blank');}
  if(e.key==='/'||e.key==='i'){e.preventDefault();UI.focus();}
});

document.addEventListener('paste',e=>{
  if(document.activeElement===UI)return;
  const t=e.clipboardData.getData('text');
  if(t&&parseURL(t)){e.preventDefault();add(t);}
});

setInterval(()=>{
  LI.querySelectorAll('.it').forEach(el=>{
    const it=data.find(i=>i.id===el.dataset.id);
    if(!it)return;
    el.dataset.d=decay(it.t);
    const a=el.querySelector('.it-a');
    if(a)a.innerHTML=age(it.t);
  });
},60000);

render();
