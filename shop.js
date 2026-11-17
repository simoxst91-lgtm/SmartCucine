
(function(){
  var KEY='sc_catalogo_v1', CART='sc_carrello_v1';
  function store(k,v){try{if(v===undefined)return JSON.parse(localStorage.getItem(k));
    localStorage.setItem(k,JSON.stringify(v));}catch(e){return null;}}
  window.SC={
    cat:function(){ var c=store(KEY); return (c&&c.length)?c:(window.CATALOGO_SEED||[]); },
    salvaCat:function(c){ store(KEY,c); },
    resetCat:function(){ try{localStorage.removeItem(KEY);}catch(e){} },
    carrello:function(){ return store(CART)||{}; },
    salvaCarr:function(c){ store(CART,c); SC.badge(); },
    agg:function(id,q){ var c=SC.carrello(); c[id]=(c[id]||0)+(q||1); SC.salvaCarr(c); },
    via:function(id){ var c=SC.carrello(); delete c[id]; SC.salvaCarr(c); },
    nPezzi:function(){ var c=SC.carrello(),n=0; for(var k in c)n+=c[k]; return n; },
    eur:function(v){ var p=(Math.round(Number(v||0)*100)/100).toFixed(2).split('.');
      return '€ '+p[0].replace(/\B(?=(\d{3})+(?!\d))/g,'.')+','+p[1]; },
    badge:function(){
      var b=document.getElementById('cartbadge'); if(!b)return;
      var n=SC.nPezzi(); b.textContent=n>0?n:''; b.style.display=n>0?'flex':'none';
    }
  };
  SC.badge();

  // ---------- elenco negozio ----------
  var grid=document.getElementById('pgrid');
  if(grid){
    var tutti=SC.cat().filter(function(p){return p.attivo;}), filtro='Tutte', ord='nome';
    function dis(p){
      var vend=p.prezzo>0;
      return '<article class="pcard">'
        +(p.evidenza?'<span class="tag">In promozione</span>':'')
        +(vend&&p.stock<=0?'<span class="tag ko">Non disponibile</span>':'')
        +'<a class="ph" href="prodotto.html?id='+encodeURIComponent(p.id)+'">'
        +'<img src="'+p.immagine+'" alt="'+p.nome+'" loading="lazy"></a>'
        +'<div class="bd"><div class="cat">'+p.categoria+'</div>'
        +'<h3>'+p.nome+'</h3><p class="br">'+(p.breve||'')+'</p>'
        +'<div class="pz">'+(vend
            ?((p.prezzoListino?'<s>'+SC.eur(p.prezzoListino)+'</s>':'')+SC.eur(p.prezzo))
            :'<span style="font-size:22px">Su preventivo</span>')+'</div>'
        +'<div class="az"><a class="btn dark" href="prodotto.html?id='
        +encodeURIComponent(p.id)+'">Dettagli</a>'
        +(vend&&p.stock>0?'<button class="btn" data-add="'+p.id+'">Aggiungi</button>'
                         :'<a class="btn" href="preventivo.html">Chiedi preventivo</a>')
        +'</div></div></article>';
    }
    function render(){
      var l=tutti.filter(function(p){return filtro==='Tutte'||p.categoria===filtro;});
      l.sort(function(a,b){
        if(ord==='prezzo')return (a.prezzo||1e9)-(b.prezzo||1e9);
        if(ord==='prezzo-desc')return (b.prezzo||0)-(a.prezzo||0);
        return a.nome.localeCompare(b.nome);
      });
      grid.innerHTML=l.length?l.map(dis).join('')
        :'<p class="vuoto">Nessun prodotto in questa categoria.</p>';
      var n=document.getElementById('conta');
      if(n)n.textContent=l.length+(l.length===1?' prodotto':' prodotti');
    }
    var fb=document.querySelectorAll('[data-filtro]');
    for(var i=0;i<fb.length;i++)(function(b){
      b.addEventListener('click',function(){
        for(var j=0;j<fb.length;j++)fb[j].classList.remove('on');
        b.classList.add('on'); filtro=b.getAttribute('data-filtro'); render();
      });
    })(fb[i]);
    var so=document.getElementById('ordina');
    if(so)so.addEventListener('change',function(){ord=so.value;render();});
    grid.addEventListener('click',function(e){
      var b=e.target.closest('[data-add]'); if(!b)return;
      SC.agg(b.getAttribute('data-add'),1);
      b.textContent='Aggiunto ✓'; setTimeout(function(){b.textContent='Aggiungi';},1400);
    });
    render();
  }

  // ---------- dettaglio prodotto ----------
  var det=document.getElementById('pdet');
  if(det){
    var id=new URLSearchParams(location.search).get('id');
    var p=SC.cat().filter(function(x){return x.id===id&&x.attivo;})[0];
    if(!p){ det.innerHTML='<p class="vuoto">Prodotto non trovato. '
      +'<a href="negozio.html" style="color:var(--brass)">Torna al negozio</a></p>'; return; }
    document.title=p.nome+' — Smart Cucine';
    var vend=p.prezzo>0;
    det.innerHTML='<div class="foto"><img src="'+p.immagine+'" alt="'+p.nome+'"></div>'
      +'<div><div class="cat" style="font-size:10px;letter-spacing:.24em;'
      +'text-transform:uppercase;color:var(--brass)">'+p.categoria+'</div>'
      +'<h1>'+p.nome+'</h1>'
      +'<div class="prezzo">'+(vend
          ?((p.prezzoListino?'<s>'+SC.eur(p.prezzoListino)+'</s>':'')+SC.eur(p.prezzo))
          :'<span style="font-size:30px">Su preventivo</span>')+'</div>'
      +'<div class="meta"><span>Codice '+(p.sku||'—')+'</span>'
      +'<span>'+(p.misure||'')+'</span>'
      +'<span>'+(vend?(p.stock>0?'Disponibile':'Non disponibile'):'Su misura')+'</span></div>'
      +'<div class="prose" style="font-size:15.5px">'
      +(p.descrizione||'').split('\n\n').map(function(t){return '<p>'+t+'</p>';}).join('')
      +'</div>'
      +(p.dotazione&&p.dotazione.length
        ?'<h3 style="font-size:22px;margin:28px 0 12px">'
         +(vend?'La promozione include':'Finiture disponibili')+'</h3>'
         +'<ul style="list-style:none;font-size:14.5px">'
         +p.dotazione.map(function(d){return '<li style="padding:7px 0 7px 20px;'
           +'position:relative;border-top:1px solid var(--bone2)">'
           +'<span style="position:absolute;left:0;top:17px;width:8px;height:1px;'
           +'background:var(--brass)"></span>'+d+'</li>';}).join('')+'</ul>':'')
      +(vend&&p.stock>0
        ?'<div style="margin-top:30px"><label>Quantità</label>'
         +'<div class="qta"><button type="button" id="meno">−</button>'
         +'<input id="q" type="number" min="1" value="1"><button type="button" id="piu">+</button></div>'
         +'<div class="acq"><button class="btn dark" id="addc">Aggiungi al carrello</button>'
         +(p.stripe?'<a class="btn solid" href="'+p.stripe+'">Paga subito con carta</a>':'')
         +'</div></div>'
        :'<div class="acq" style="margin-top:30px">'
         +'<a class="btn dark" href="preventivo.html">Richiedi un preventivo</a>'
         +'<a class="btn" href="tel:'+(window.SC_TEL||'')+'">Chiamaci</a></div>')
      +'</div>';
    var q=document.getElementById('q');
    if(q){
      document.getElementById('meno').onclick=function(){q.value=Math.max(1,+q.value-1);};
      document.getElementById('piu').onclick=function(){q.value=+q.value+1;};
      document.getElementById('addc').onclick=function(){
        SC.agg(p.id,+q.value||1); this.textContent='Aggiunto al carrello ✓';
        var b=this; setTimeout(function(){b.textContent='Aggiungi al carrello';},1600);
      };
    }
  }

  // ---------- carrello ----------
  var cw=document.getElementById('carrello');
  if(cw){
    function disegna(){
      var c=SC.carrello(), cat=SC.cat(), tot=0, html='', n=0;
      for(var id in c){
        var p=cat.filter(function(x){return x.id===id;})[0]; if(!p)continue;
        var q=c[id], sub=p.prezzo*q; tot+=sub; n+=q;
        html+='<div class="riga"><img src="'+p.immagine+'" alt="'+p.nome+'">'
          +'<div><h3>'+p.nome+'</h3><div class="sub">'+(p.misure||'')
          +' · '+SC.eur(p.prezzo)+' × '+q+'</div>'
          +'<button class="via" data-via="'+id+'">Rimuovi</button></div>'
          +'<div class="pr">'+SC.eur(sub)+'</div></div>';
      }
      if(!n){ cw.innerHTML='<p class="vuoto">Il carrello è vuoto.<br><br>'
        +'<a class="btn dark" href="negozio.html">Vai al negozio</a></p>';
        var z=document.getElementById('checkout'); if(z)z.style.display='none'; return; }
      cw.innerHTML=html+'<div class="tot"><span>Totale</span><strong>'+SC.eur(tot)+'</strong></div>';
      var ck=document.getElementById('checkout'); if(ck)ck.style.display='';
      var tt=document.getElementById('ppitems');
      if(tt){ // campi PayPal (cart upload)
        var i=1,h=''; for(var id2 in c){
          var pp=cat.filter(function(x){return x.id===id2;})[0]; if(!pp)continue;
          h+='<input type="hidden" name="item_name_'+i+'" value="'+pp.nome+'">'
            +'<input type="hidden" name="amount_'+i+'" value="'+pp.prezzo.toFixed(2)+'">'
            +'<input type="hidden" name="quantity_'+i+'" value="'+c[id2]+'">'
            +'<input type="hidden" name="item_number_'+i+'" value="'+(pp.sku||pp.id)+'">';
          i++;
        }
        tt.innerHTML=h;
      }
    }
    cw.addEventListener('click',function(e){
      var b=e.target.closest('[data-via]'); if(!b)return;
      SC.via(b.getAttribute('data-via')); disegna();
    });
    disegna();
  }
})();
