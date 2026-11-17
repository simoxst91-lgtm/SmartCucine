
(function(){
  var n=document.getElementById('nav');
  function o(){n.classList.add('open');document.body.style.overflow='hidden';}
  function c(){n.classList.remove('open');document.body.style.overflow='';}
  var b=document.getElementById('burger'),x=document.getElementById('close');
  if(b)b.addEventListener('click',o); if(x)x.addEventListener('click',c);
  document.addEventListener('keydown',function(e){if(e.key==='Escape')c();});
  var sl=document.querySelectorAll('.slides img'),
      dt=document.querySelectorAll('.dots button'), i=0, t;
  function go(k){
    if(!sl.length)return;
    sl[i].classList.remove('on'); if(dt[i])dt[i].classList.remove('on');
    i=(k+sl.length)%sl.length;
    sl[i].classList.add('on'); if(dt[i])dt[i].classList.add('on');
  }
  function play(){ t=setInterval(function(){go(i+1);},6000); }
  if(sl.length){
    go(0); play();
    for(var j=0;j<dt.length;j++)(function(n){
      dt[n].addEventListener('click',function(){clearInterval(t);go(n);play();});
    })(j);
  }

  var mg=document.getElementById('mapgo');
  if(mg)mg.addEventListener('click',function(){
    var b=document.getElementById('mapbox'),f=document.createElement('iframe');
    f.src='https://www.google.com/maps?q=45.7547999,9.049939&hl=it&z=17&output=embed';
    f.title='Mappa Google dello showroom Smart Cucine, Via Garibaldi 219 Fino Mornasco';
    f.loading='lazy'; f.referrerPolicy='no-referrer-when-downgrade';
    f.setAttribute('allowfullscreen','');
    b.innerHTML=''; b.appendChild(f);
  });

  var ck=document.getElementById('cookie');
  try{ if(ck && !localStorage.getItem('sc_cookie')) ck.classList.add('show');
    var ok=document.getElementById('ckok');
    if(ok)ok.addEventListener('click',function(){
      try{localStorage.setItem('sc_cookie','1');}catch(e){}
      ck.classList.remove('show');});
  }catch(e){ if(ck) ck.classList.add('show'); }
})();
