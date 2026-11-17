
(function(){
  var KEY='sc_catalogo_v1', AUTH='sc_admin_ok';
  function get(){ try{var c=JSON.parse(localStorage.getItem(KEY));
    if(c&&c.length)return c;}catch(e){} return (window.CATALOGO_SEED||[]).slice(); }
  function set(c){ try{localStorage.setItem(KEY,JSON.stringify(c));}catch(e){
    alert('Spazio esaurito nel browser: esporta il catalogo.');} }
  function eur(v){ var p=(Math.round(Number(v||0)*100)/100).toFixed(2).split('.');
    return '€ '+p[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.')+','+p[1]; }

  // ---- accesso ----
  var login=document.getElementById('login'), app=document.getElementById('app');
  function entra(){ login.style.display='none'; app.style.display='';
    try{sessionStorage.setItem(AUTH,'1');}catch(e){} render(); }
  try{ if(sessionStorage.getItem(AUTH)==='1') entra(); }catch(e){}
  var fl=document.getElementById('flogin');
  if(fl)fl.addEventListener('submit',function(e){
    e.preventDefault();
    if(document.getElementById('pw').value===window.ADMIN_PW) entra();
    else document.getElementById('errl').textContent='Password non corretta.';
  });
  var ex=document.getElementById('esci');
  if(ex)ex.onclick=function(){ try{sessionStorage.removeItem(AUTH);}catch(e){}
    location.reload(); };

  // ---- tabella ----
  function render(){
    var c=get(), att=c.filter(function(p){return p.attivo;}),
        vend=c.filter(function(p){return p.prezzo>0;}),
        esa=vend.filter(function(p){return p.stock<=0;}),
        val=vend.reduce(function(s,p){return s+p.prezzo*Math.max(0,p.stock);},0);
    document.getElementById('kpi').innerHTML=
      '<div><div class="n">'+c.length+'</div><div class="l">Prodotti a catalogo</div></div>'
     +'<div><div class="n">'+att.length+'</div><div class="l">Pubblicati</div></div>'
     +'<div><div class="n">'+vend.length+'</div><div class="l">Con prezzo di vendita</div></div>'
     +'<div><div class="n">'+esa.length+'</div><div class="l">Esauriti</div></div>'
     +'<div><div class="n" style="font-size:30px">'+eur(val)+'</div>'
     +'<div class="l">Valore a magazzino</div></div>';
    var q=(document.getElementById('cerca').value||'').toLowerCase();
    var l=c.filter(function(p){return !q||p.nome.toLowerCase().indexOf(q)>=0
      ||(p.sku||'').toLowerCase().indexOf(q)>=0||p.categoria.toLowerCase().indexOf(q)>=0;});
    document.getElementById('corpo').innerHTML=l.map(function(p,i){
      var k=c.indexOf(p);
      return '<tr><td><img src="'+p.immagine+'" alt=""></td>'
        +'<td><strong>'+p.nome+'</strong><br><small style="color:var(--muted)">'
        +(p.sku||'')+'</small></td>'
        +'<td>'+p.categoria+'</td>'
        +'<td>'+(p.prezzo>0?eur(p.prezzo):'<em style="color:var(--muted)">preventivo</em>')+'</td>'
        +'<td>'+(p.prezzo>0?p.stock:'—')+'</td>'
        +'<td><span class="pill '+(p.attivo?'ok':'no')+'">'
        +(p.attivo?'Pubblicato':'Bozza')+'</span></td>'
        +'<td><div class="az"><button data-mod="'+k+'">Modifica</button>'
        +'<button data-dup="'+k+'">Duplica</button>'
        +'<button class="del" data-del="'+k+'">Elimina</button></div></td></tr>';
    }).join('')||'<tr><td colspan="7" style="padding:40px;text-align:center;'
      +'color:var(--muted)">Nessun prodotto trovato.</td></tr>';
  }
  document.getElementById('cerca').addEventListener('input',render);

  // ---- modale ----
  var mod=document.getElementById('modale'), idx=-1;
  function apri(k){
    idx=k; var c=get(), p=k>=0?c[k]:{id:'',nome:'',categoria:'Promozioni',sku:'',
      prezzo:0,prezzoListino:null,stock:0,misure:'',breve:'',descrizione:'',
      dotazione:[],immagine:'',attivo:true,evidenza:false,stripe:'',paypal:true};
    document.getElementById('mtit').textContent=k>=0?'Modifica prodotto':'Nuovo prodotto';
    var f=document.getElementById('fprod');
    f.elements.nome.value=p.nome; f.elements.categoria.value=p.categoria; f.elements.sku.value=p.sku||'';
    f.elements.prezzo.value=p.prezzo||''; f.elements.listino.value=p.prezzoListino||'';
    f.elements.stock.value=p.stock||0; f.elements.misure.value=p.misure||'';
    f.elements.breve.value=p.breve||''; f.elements.descrizione.value=p.descrizione||'';
    f.elements.dotazione.value=(p.dotazione||[]).join('\n');
    f.elements.immagine.value=p.immagine||''; f.elements.stripe.value=p.stripe||'';
    f.elements.attivo.checked=!!p.attivo; f.elements.evidenza.checked=!!p.evidenza;
    f.elements.paypal.checked=p.paypal!==false;
    ante(); mod.classList.add('on');
  }
  function ante(){ var v=document.getElementById('fprod').elements.immagine.value;
    document.getElementById('prev').innerHTML=v?'<img src="'+v+'" style="width:100%;'
      +'max-height:170px;object-fit:cover;border:1px solid var(--line)">':''; }
  document.getElementById('fprod').elements.immagine.addEventListener('input',ante);
  document.getElementById('chiudi').onclick=function(){mod.classList.remove('on');};
  mod.addEventListener('click',function(e){ if(e.target===mod)mod.classList.remove('on'); });
  document.getElementById('nuovo').onclick=function(){apri(-1);};

  document.getElementById('fprod').addEventListener('submit',function(e){
    e.preventDefault(); var f=e.target, c=get();
    var p={ nome:f.elements.nome.value.trim(), categoria:f.elements.categoria.value,
      sku:f.elements.sku.value.trim(), prezzo:parseFloat(f.elements.prezzo.value)||0,
      prezzoListino:parseFloat(f.elements.listino.value)||null,
      stock:parseInt(f.elements.stock.value,10)||0, misure:f.elements.misure.value.trim(),
      breve:f.elements.breve.value.trim(), descrizione:f.elements.descrizione.value,
      dotazione:f.elements.dotazione.value.split('\n').map(function(s){return s.trim();})
                 .filter(Boolean),
      immagine:f.elements.immagine.value.trim(), stripe:f.elements.stripe.value.trim(),
      attivo:f.elements.attivo.checked, evidenza:f.elements.evidenza.checked, paypal:f.elements.paypal.checked };
    if(idx>=0){ p.id=c[idx].id; c[idx]=p; }
    else { p.id='p-'+Date.now().toString(36); c.unshift(p); }
    set(c); mod.classList.remove('on'); render();
  });

  document.getElementById('corpo').addEventListener('click',function(e){
    var b=e.target.closest('button'); if(!b)return; var c=get();
    if(b.dataset.mod!==undefined) apri(+b.dataset.mod);
    else if(b.dataset.dup!==undefined){
      var d=JSON.parse(JSON.stringify(c[+b.dataset.dup]));
      d.id='p-'+Date.now().toString(36); d.nome+=' (copia)'; d.attivo=false;
      c.unshift(d); set(c); render();
    } else if(b.dataset.del!==undefined){
      var p=c[+b.dataset.del];
      if(confirm('Eliminare "'+p.nome+'"?\n\nL\'operazione non si puo\' annullare.')){
        c.splice(+b.dataset.del,1); set(c); render();
      }
    }
  });

  // ---- esporta / importa / ripristina ----
  document.getElementById('esporta').onclick=function(){
    var txt='/* Catalogo Smart Cucine — esportato il '
      +new Date().toLocaleString('it-IT')+' */\nwindow.CATALOGO_SEED = '
      +JSON.stringify(get(),null,1)+';\n';
    var a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([txt],{type:'text/javascript'}));
    a.download='catalogo.js'; a.click();
  };
  document.getElementById('importa').onclick=function(){
    document.getElementById('file').click(); };
  document.getElementById('file').addEventListener('change',function(e){
    var f=e.target.files[0]; if(!f)return; var r=new FileReader();
    r.onload=function(){
      try{
        var t=r.result, i=t.indexOf('['), j=t.lastIndexOf(']');
        var c=JSON.parse(t.slice(i,j+1));
        if(!Array.isArray(c))throw 0;
        set(c); render(); alert('Importati '+c.length+' prodotti.');
      }catch(err){ alert('File non valido.'); }
    };
    r.readAsText(f); e.target.value='';
  });
  document.getElementById('ripristina').onclick=function(){
    if(confirm('Ripristinare il catalogo originale?\n\nLe modifiche non esportate '
      +'andranno perse.')){ try{localStorage.removeItem(KEY);}catch(e){} render(); }
  };
})();
