(function (global){
  var cfg={}, q=[], sid='';
  function lsGet(k){ try{return localStorage.getItem(k);}catch{return null;} }
  function lsSet(k,v){ try{localStorage.setItem(k,v);}catch{} }
  function getUTM(){ try{var p=new URLSearchParams(location.search), o={}; ['utm_source','utm_medium','utm_campaign','utm_content','utm_term'].forEach(function(k){var v=p.get(k); if(v)o[k]=v;}); return o;}catch(e){return{};} }

  function flush(){
    if(!cfg.endpoint || !q.length) return;
    var batch=q.splice(0,q.length);
    var body=JSON.stringify({events:batch});
    var blob=new Blob([body],{type:'application/json'});
    var ok = navigator && 'sendBeacon' in navigator && navigator.sendBeacon(cfg.endpoint, blob);
    if(!ok){ fetch(cfg.endpoint,{method:'POST', headers:{'Content-Type':'application/json'}, body}).catch(function(){ q.unshift.apply(q,batch); }); }
  }
  function enqueue(event, payload){
    if(cfg.consent===false) return;
    var base={
      event:event,
      ts:Date.now(),
      sessionId:sid,
      campaignId: lsGet('infdl.ci') || cfg.campaignId,
      creatorId: lsGet('infdl.cr') || undefined,
      clickId:   lsGet('infdl.ck') || undefined,
      source: cfg.source || 'custom',
      utm: getUTM(),
      payload: payload || {}
    };
    q.push(base); flush();
  }

  function init(opts){
    cfg=opts||{}; sid=lsGet('infdl.sid') || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
    lsSet('infdl.sid', sid);
    if(cfg.campaignId) lsSet('infdl.ci', cfg.campaignId);
    if(cfg.creatorId) lsSet('infdl.cr', cfg.creatorId);
    try{
      var u=new URL(location.href);
      var ci=u.searchParams.get('ci'), cr=u.searchParams.get('cr'), ck=u.searchParams.get('ck');
      if(ci) lsSet('infdl.ci', ci);
      if(cr) lsSet('infdl.cr', cr);
      if(ck) lsSet('infdl.ck', ck);
    }catch(e){}
    track('page_view', {});
    document.addEventListener('click', function(e){
      var el = e.target;
      if(el && el.matches && el.matches('[data-track=\"add_to_cart\"]')){
        track('add_to_cart', { productId: el.getAttribute('data-product-id'), price: Number(el.getAttribute('data-price')||0) });
      }
    });
  }
  function track(event, payload){ enqueue(event, payload); }

  global.infdl = { init:init, track:track };
})(window);
