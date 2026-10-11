/* ================= padel classic (FIP): screens ================= */
function freshPCDraft(){return {sport:'pc',name:'',unit:'pair',scheme:null,players:[],deuce:'golden',fmt:'bo3',dec:'stb',tables:2,cycles:null,groupCount:null,advance:2,third:true,consolation:false,seeding:'random',wins:{g:1,ko:1,f:1},pts:11,rwins:1}}
const pcDefaultName=()=>`Падел · классика · ${dateRu(Date.now())}`;
const rulesBadge=(txt,cls)=>`<span class="rulesbadge ${cls||''}">${txt}</span>`;
function renderPCSetup(app){
  const d=store.pcdraft,np=d.players.length,n=Math.floor(np/2),P=ttPlan(d);
  const rec=n>=3?ttRecommend(n):null,scheme=d.scheme||(rec&&rec.scheme)||'rr';
  const chip=sc=>{const ok=n>=TT_MIN[sc];return `<button class="fmtopt ${scheme===sc?'on':''} ${ok?'':'dim'}" data-a="pc-scheme" data-v="${sc}">
    <b>${TT_SCHEME[sc]}${rec&&rec.scheme===sc?' <em>совет</em>':''}</b><small>${{rr:'Лига: каждая пара с каждой',groups:'Как в турнирах федераций: группы, затем сетка',ko:'Как в профессиональном туре: проиграл — выбыл'}[sc]}</small></button>`};
  let opts='';
  if(P.ok&&scheme==='rr')opts=ttStepper('pc-cycles',P.cycles,'Кругов',P.cycles>1?'Каждая пара сыграет с каждой дважды':'Каждая пара с каждой по разу');
  if(P.ok&&scheme==='groups')opts=`<div class="label" style="margin-top:14px">Групп</div>
    <div class="chips">${P.groupOptions.map(g=>`<button class="chip ${g===P.groupCount?'on':''}" data-a="pc-groups" data-v="${g}">${g} ${plural(g,'группа','группы','групп')} по ${(()=>{const z=ttGroupSizes(n,g),mn=Math.min(...z),mx=Math.max(...z);return mn===mx?mx:mn+'–'+mx})()}</button>`).join('')}</div>
    <div class="label" style="margin-top:14px">Из группы в плей-офф</div>
    <div class="seg"><button data-a="pc-adv" data-v="1" class="${P.advance===1?'on':''}">1 лучшая</button><button data-a="pc-adv" data-v="2" class="${P.advance===2?'on':''}">2 лучших</button></div>
    <div class="stack" style="gap:8px;margin-top:12px">${toggle('pc-third',d.third,'Матч за 3-е место')}${toggle('pc-cons',d.consolation,'Утешительная сетка','Для пар, не вышедших из группы')}</div>`;
  if(P.ok&&scheme==='ko')opts=`<div class="stack" style="gap:8px;margin-top:12px">${toggle('pc-third',d.third,'Матч за 3-е место')}</div>
    ${P.byes?`<div class="info">Сетка на ${P.size}: ${P.byes} ${plural(P.byes,'сильнейшая пара проходит','сильнейшие пары проходят','сильнейших пар проходят')} первый круг без игры — как в профессиональном туре.</div>`:''}`;
  const pairsHtml=(()=>{const out=[];for(let i=0;i<np;i+=2){const a=d.players[i],b=d.players[i+1];
    out.push(`<div class="pairchip ${b==null?'half':''}"><span class="num">${i/2+1}</span><span class="pn">${esc(a)} + ${b==null?'<span style="color:var(--mute)">ждёт партнёра</span>':esc(b)}</span><button class="x" data-a="rmpair" data-i="${i}" aria-label="Удалить пару">✕</button></div>`)}
    return out.join('')||'<span class="hint" style="margin:0">Добавьте минимум 3 пары</span>'})();
  app.innerHTML=`
  <div class="topbar"><button class="iconbtn" data-a="pick" data-v="padel" aria-label="Назад">${IC.home}</button><div style="flex:1"></div></div>
  <div class="eyebrow" style="margin-top:14px">Падел · классический турнир</div>
  <h1 class="big">Новый турнир</h1>
  <div style="margin:6px 0 0">${rulesBadge('Международные правила FIP')}</div>
  <p class="sub" style="margin:8px 0 0">Счёт 15 / 30 / 40, сеты и тай-брейки — как на официальных турнирах. Пары постоянные.</p>
  <div class="stack" style="margin-top:14px">
    <section class="card"><div class="label">Название</div>
      <input class="textin" id="f-name" value="${esc(d.name)}" placeholder="${esc(pcDefaultName())}" maxlength="60" autocomplete="off" aria-label="Название турнира"></section>
    <section class="card">
      <div class="row" style="margin-bottom:10px"><div class="label" style="margin:0">Пары · ${n}${np%2?' + 1 игрок':''}</div>${np?'<button class="textbtn" data-a="clear" style="padding:0">Очистить</button>':''}</div>
      <div class="stack" style="gap:8px">${pairsHtml}</div>
      ${np>=4?'<button class="textbtn" data-a="shufflepairs">Перемешать пары случайно</button>':''}
      <form class="addbox" id="addform"><input class="textin" id="newname" placeholder="Анна + Борис" autocomplete="off" enterkeyhint="done" aria-label="Игроки пары"><button type="submit" aria-label="Добавить">+</button></form>
      <div class="hint">Вводите пару через «+»: Анна + Борис. Или по одному имени — пары собираются по порядку.</div>
      <div class="err" id="e-names"></div></section>
    <section class="card"><div class="label">Формат${n>=3?` · ${n} ${plural(n,'пара','пары','пар')}`:''}</div>
      <div class="stack" style="gap:8px">${['rr','groups','ko'].map(chip).join('')}</div>${opts}
      <div class="label" style="margin-top:16px">Посев</div>
      <div class="seg"><button data-a="pc-seed" data-v="random" class="${d.seeding!=='manual'?'on':''}">Жребий</button><button data-a="pc-seed" data-v="manual" class="${d.seeding==='manual'?'on':''}">По порядку (как рейтинг)</button></div>
      <div class="hint">${d.seeding==='manual'?'Первая пара в списке — сильнейшая. Сильные попадут в разные группы и половины сетки.':'Порядок определит случай.'}</div></section>
    <section class="card"><div class="label">Счёт при 40:40</div>
      <div class="stack" style="gap:8px">${['golden','star','adv'].map(k=>`<button class="fmtopt ${d.deuce===k?'on':''}" data-a="pc-deuce" data-v="${k}"><b>${PC_DEUCE[k]}${k==='golden'?' <em>чаще всего</em>':''}</b><small>${{golden:'Один решающий розыгрыш, принимающие выбирают сторону',star:'Новое правило FIP: до двух «больше-меньше», затем решающее очко',adv:'Классика: нужно выиграть два очка подряд'}[k]}</small></button>`).join('')}</div>
      <div class="label" style="margin-top:16px">Длина матча</div>
      <div class="stack" style="gap:8px">${['bo3','short','one'].map(k=>`<button class="fmtopt ${d.fmt===k?'on':''}" data-a="pc-fmt" data-v="${k}"><b>${PC_FMT[k]}</b><small>${{bo3:'Как в профессиональном туре. Тай-брейк при 6:6',short:'Сеты до 4 геймов, тай-брейк при 4:4 — быстрее',one:'Один сет до 6, тай-брейк при 6:6 — самый короткий'}[k]}</small></button>`).join('')}</div>
      ${d.fmt!=='one'?`<div class="label" style="margin-top:16px">Решающий сет</div>
      <div class="seg"><button data-a="pc-dec" data-v="stb" class="${d.dec==='stb'?'on':''}">Супер-тай-брейк до 10</button><button data-a="pc-dec" data-v="set" class="${d.dec==='set'?'on':''}">Полный сет</button></div>`:''}
    </section>
    <section class="card">
      ${ttStepper('pc-tables',P.tables,'Кортов',n>=2?`Максимум ${P.maxTables}${P.tables<P.maxTables?' — часть пар будет ждать':''}`:'')}
      ${P.ok?`<div class="info">Матчей: <b>${P.matches}</b> · примерно <b>${fmtMinutes(P.minutes)}</b> на ${P.tables} ${plural(P.tables,'корте','кортах','кортах')}</div>`:`<div class="warn">${P.err}</div>`}
    </section>
    <div class="err" id="e-cfg"></div>
    <button class="cta" data-a="pc-start">Начать турнир ${IC.arrow}</button>
  </div>`;
  const f=$('#addform'),inp=$('#newname');
  f.addEventListener('submit',e=>{e.preventDefault();addNames(inp.value)});
  inp.addEventListener('paste',e=>{const t=(e.clipboardData||window.clipboardData)?.getData('text')||'';if(/[\n,;+\/]/.test(t)){e.preventDefault();addNames(t)}});
  inp.addEventListener('input',()=>{$('#e-names').textContent=''});
  $('#f-name').addEventListener('input',e=>{d.name=e.target.value;saveLocal()});
}
function pcStartFromDraft(){
  const d=store.pcdraft,P=ttPlan(d);
  if(!P.ok){$('#e-cfg').textContent=P.err;$('#e-cfg').scrollIntoView({block:'center',behavior:'smooth'});return}
  if(d.players.length>64){$('#e-cfg').textContent='Максимум 32 пары';return}
  const id=newId(),r=ttStartPlay(d,id);
  if(r.err){$('#e-cfg').textContent=r.err;return}
  const T=r.T;T.name=(d.name.trim()||pcDefaultName()).slice(0,60);T.createdAt=Date.now();T.updatedAt=Date.now();T.level='pro';
  store.tournaments[id]=T;
  store.pcdraft={...freshPCDraft(),players:d.players.slice(),deuce:d.deuce,fmt:d.fmt,dec:d.dec,tables:d.tables,seeding:d.seeding,third:d.third,consolation:d.consolation,advance:d.advance};
  touch(T);go('play',id,'play');wake();
}
/* ---------- score entry by sets ---------- */
function pcOpenScore(T,m,prefill){
  const sets=prefill||(m.live&&m.live.sets.length?m.live.sets:null)||m.games||[];
  store.ui.score=m.id;store.ui.scoreVals=sets.map(s=>({a:String(s.a),b:String(s.b),ta:s.ta!=null?String(s.ta):'',tb:s.tb!=null?String(s.tb):''}));store.ui.live=null;
  saveLocal();render();scrollTo(0,0);
}
function renderPCScore(app,T,m){
  const c=T.cfg,need=pcNeed(c),rows=2*need-1,S=pcSetLen(c),vals=store.ui.scoreVals||[];
  const nA=esc(ttSideName(T,m,'a')),nB=esc(ttSideName(T,m,'b'));
  $('#tabbar').innerHTML='';
  const rowHtml=i=>{const v=vals[i]||{},dec=need>1&&i===rows-1&&c.dec==='stb';
    return `<div class="setrow" data-row="${i}">
      <span class="gno">${dec?'СТБ':i+1}</span>
      <input type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="99" class="gin" data-g="${i}" data-s="a" value="${esc(v.a||'')}" aria-label="${dec?'Супер-тай-брейк':'Сет '+(i+1)}, ${nA}">
      <input type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="99" class="gin" data-g="${i}" data-s="b" value="${esc(v.b||'')}" aria-label="${dec?'Супер-тай-брейк':'Сет '+(i+1)}, ${nB}">
      ${dec?'':`<div class="tbrow" data-tb="${i}" hidden><span>Тай-брейк</span>
        <input type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="99" class="gin tbin" data-g="${i}" data-s="ta" value="${esc(v.ta||'')}" aria-label="Тай-брейк сета ${i+1}, ${nA}">
        <input type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="99" class="gin tbin" data-g="${i}" data-s="tb" value="${esc(v.tb||'')}" aria-label="Тай-брейк сета ${i+1}, ${nB}"></div>`}
    </div>`};
  app.innerHTML=`<div class="topbar"><button class="iconbtn" data-a="tt-scorex" aria-label="Назад">${IC.home}</button><div style="flex:1"></div></div>
  <div class="eyebrow" style="margin-top:14px">${ttPhaseName(T,m)}${m.table?' · корт '+m.table:''}</div>
  <h1 class="big">Счёт матча</h1>
  <p class="sub" style="margin:0 0 14px">${PC_FMT[c.fmt]}${need>1&&c.dec==='stb'?', при 1:1 — супер-тай-брейк до 10':''} · сет до ${S}, тай-брейк при ${S}:${S}</p>
  <section class="card">
    <div class="setgrid-head"><span></span><b>${nA}</b><b>${nB}</b></div>
    ${[...Array(rows)].map((_,i)=>rowHtml(i)).join('')}
    <div class="hint">В сете — геймы. Если сет закончился ${S+1}:${S}, появятся поля для счёта тай-брейка.</div>
    <div class="matchsum" id="msum"></div>
    <div class="err" id="serr"></div>
  </section>
  <div class="stack" style="margin-top:14px">
    <button class="cta" data-a="pc-save">Сохранить результат</button>
    <button class="ghost" data-a="tt-scorex">Отмена</button>
  </div>`;
  const upd=()=>{
    const v=[];document.querySelectorAll('.gin').forEach(el=>{(v[+el.dataset.g]=v[+el.dataset.g]||{a:'',b:'',ta:'',tb:''})[el.dataset.s]=el.value});store.ui.scoreVals=v;saveLocal();
    document.querySelectorAll('.tbrow').forEach(r=>{const i=+r.dataset.tb,x=v[i]||{},a=+x.a,b=+x.b;r.hidden=!(x.a!==''&&x.b!==''&&Math.max(a,b)===S+1&&Math.min(a,b)===S)});
    const r=pcReadSets(T),chk=r.err?null:pcMatchCheck(r.list,c);
    let wa=0,wb=0;(r.list||[]).forEach(s=>{if(+s.a>+s.b)wa++;else if(+s.b>+s.a)wb++});
    $('#msum').innerHTML=`Сеты <b>${wa}:${wb}</b>${chk&&chk.win?` · победа: <b>${chk.win==='a'?nA:nB}</b>`:''}`;$('#serr').textContent='';
  };
  document.querySelectorAll('.gin').forEach((el,idx,all)=>{el.addEventListener('input',upd);
    el.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();const vis=[...all].filter(x=>!x.closest('[hidden]'));const k=vis.indexOf(el),nx=vis[k+1];if(nx)nx.focus();else el.blur()}})});
  upd();
}
function pcReadSets(T){
  const c=T.cfg,S=pcSetLen(c),need=pcNeed(c),rows={};
  document.querySelectorAll('.gin').forEach(el=>{(rows[el.dataset.g]=rows[el.dataset.g]||{})[el.dataset.s]=el.value.trim()});
  const list=[];let gap=false;
  for(const k of Object.keys(rows).sort((a,b)=>a-b)){const r=rows[k],dec=need>1&&+k===2*need-2&&c.dec==='stb';
    if((r.a||'')===''&&(r.b||'')===''){gap=true;continue}
    if(gap)return {err:`Пропущен сет перед ${dec?'супер-тай-брейком':'сетом '+(+k+1)}`,list};
    if(r.a===''||r.b==='')return {err:`${dec?'Супер-тай-брейк':'Сет '+(+k+1)}: введите счёт обеих пар`,list};
    const s=dec?{a:+r.a,b:+r.b,stb:true}:{a:+r.a,b:+r.b};
    if(!dec&&Math.max(s.a,s.b)===S+1&&Math.min(s.a,s.b)===S){s.ta=r.ta===''?'':+r.ta;s.tb=r.tb===''?'':+r.tb}
    list.push(s)}
  return {list};
}
function pcSaveScore(T,m){
  const r=pcReadSets(T);if(r.err){$('#serr').textContent=r.err;return}
  const c=pcMatchCheck(r.list,T.cfg);if(c.err){$('#serr').textContent=c.err;return}
  if(document.activeElement)document.activeElement.blur();
  store.ui.score=null;store.ui.scoreVals=null;
  ttSetResult(T,m,r.list,c.win,null);buzz();touch(T);store.ui.tab='play';render();scrollTo(0,0);
  if(T.stage!=='results')toast(`Сохранено: ${c.wa}:${c.wb} по сетам`);
}
/* ---------- live scoring 15 / 30 / 40 ---------- */
function renderPCLive(app,T,m){
  const L=m.live,pa=ttSide(T,m,'a'),pb=ttSide(T,m,'b');
  if(!L.order){
    const step=L.pick==null?1:2,list=step===1?pa.concat(pb):(pa.includes(L.pick)?pb:pa);
    app.innerHTML=`<div class="topbar"><button class="iconbtn" data-a="tt-livex" aria-label="Свернуть">${IC.home}</button><div style="flex:1"></div></div>
    <div class="eyebrow" style="margin-top:14px">${ttPhaseName(T,m)}</div><h1 class="big">${step===1?'Кто подаёт первым?':'Кто подаёт первым у соперников?'}</h1>
    <p class="sub">${step===1?'Пара, выигравшая жребий, выбирает подающего.':'Этот игрок подаёт во втором гейме.'}</p>
    <div class="stack" style="margin-top:14px">${list.map(p=>`<button class="sportcard" data-a="pc-pick" data-v="${p}"><span style="min-width:0"><b>${esc(T.players[p])}</b><span>${pa.includes(p)?esc(ttSideName(T,m,'a')):esc(ttSideName(T,m,'b'))}</span></span><span class="chev">›</span></button>`).join('')}
    ${step===1?'<button class="ghost" data-a="pc-lot">Жребий</button>':''}</div>`;return;
  }
  const st=pcLiveState(T,m,L);
  if(st.done){
    const cool=L.decidedAt&&Date.now()-L.decidedAt<1000;
    app.innerHTML=`<div class="topbar"><button class="iconbtn" data-a="tt-livex" aria-label="Свернуть">${IC.home}</button><div style="flex:1"></div></div>
    <div class="eyebrow" style="margin-top:14px">${ttPhaseName(T,m)}</div><h1 class="big">Матч окончен</h1>
    <section class="card" style="margin-top:14px;text-align:center">
      <div class="lname">${esc(ttSideName(T,m,'a'))} — ${esc(ttSideName(T,m,'b'))}</div>
      <div class="lpts" style="font-size:72px">${st.wa}:${st.wb}</div>
      <div class="hint">Сеты: ${L.sets.map(pcSetText).join(' · ')}</div>
      <div style="margin-top:8px;font-weight:800">Победа: ${esc(ttSideName(T,m,st.wa>st.wb?'a':'b'))}</div>
    </section>
    <div class="stack ${cool?'cool':''}" style="margin-top:14px">
      <button class="cta" data-a="pc-livesave">Сохранить результат</button>
      <button class="ghost" data-a="pc-undo">Отменить последнее очко</button>
    </div>`;
    if(cool)setTimeout(()=>{if(store.ui.live===m.id)render()},1000-(Date.now()-L.decidedAt));return;
  }
  const lab=pcPointLabel(T,m,L),si=pcServeInfo(T,m,L),srvSide=pa.includes(si.server)?'a':'b';
  const decisive=pcDecisive(T,L);
  const half=s=>{const i=s==='a'?0:1,serving=srvSide===s;
    return `<button class="livehalf ${serving?'serving pad':''}" data-a="pc-pt" data-v="${s}" aria-label="Очко: ${esc(ttSideName(T,m,s))}">
      <span class="lname">${esc(ttSideName(T,m,s))}</span>
      <span class="lpts">${lab[i]}</span>
      <span class="lgames">Геймы: <b>${L.g[i]}</b> · сеты: <b>${s==='a'?st.wa:st.wb}</b></span>
      ${serving?`<span class="lserve pad"><i class="ballico"></i>подаёт ${esc(T.players[si.server])}</span>`:''}
    </button>`};
  const what=st.stb?'Супер-тай-брейк до 10':st.tb?'Тай-брейк до 7':`Сет ${L.sets.length+1}`;
  app.innerHTML=`<div class="topbar"><button class="iconbtn" data-a="tt-livex" aria-label="Свернуть">${IC.home}</button>
    <div style="flex:1;text-align:center;padding-top:4px"><div class="eyebrow">${ttPhaseName(T,m)}</div><div class="sub" style="font-size:13px">${what} · ${PC_DEUCE[T.cfg.deuce]}</div></div>
    <button class="iconbtn" data-a="pc-undo" aria-label="Отменить очко">↶</button></div>
    ${decisive?`<div class="decisive">Решающее очко — ${T.cfg.deuce==='star'?'стар-пойнт':'золотое очко'}. Принимающие выбирают сторону</div>`:''}
    <div class="livewrap">${half('a')}${half('b')}</div>
    ${L.sets.length?`<div class="rest" style="justify-content:center;margin-top:10px">Сеты: ${L.sets.map(pcSetText).join(' · ')}</div>`:''}
    <div class="rest" style="justify-content:center;margin-top:6px">Нажимайте на пару, которая выиграла очко</div>`;
}
function pcLiveTap(T,m,side){
  const ev=pcLivePoint(T,m,m.live,side);
  if(ev.includes('decided'))return render();
  buzz();touch(T);
  if(ev.includes('match')){m.live.decidedAt=Date.now();toast('Матч окончен — сохраните результат')}
  else if(ev.includes('set')){const s=m.live.sets[m.live.sets.length-1];toast(`Сет ${pcSetText(s)}${ev.includes('ends')?' · смена сторон':''}`)}
  else if(ev.includes('ends'))toast('Смена сторон');
  render();
}
function pcLiveSave(T,m){
  const L=m.live,c=pcMatchCheck(L.sets,T.cfg);if(c.err){toast(c.err);return}
  store.ui.live=null;ttSetResult(T,m,L.sets,c.win,null);buzz();touch(T);store.ui.tab='play';render();scrollTo(0,0);
  if(T.stage!=='results')toast(`Сохранено: ${c.wa}:${c.wb} по сетам`);
}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
  if(!a.startsWith('pc-'))return;
  const d=store.pcdraft,T=cur(),M=T&&T.matches?T.matches.find(x=>x.id===+b.dataset.m):null;
  const redraw=()=>{saveLocal();render()};
  const LM=()=>T&&T.matches.find(x=>x.id===store.ui.live);
  switch(a){
    case 'pc-scheme':{const n=Math.floor(d.players.length/2);if(n<TT_MIN[b.dataset.v]){$('#e-cfg').textContent=`Для формата «${TT_SCHEME[b.dataset.v]}» нужно минимум ${TT_MIN[b.dataset.v]} пар`;return}d.scheme=b.dataset.v;return redraw()}
    case 'pc-cycles':{const P=ttPlan(d);d.cycles=Math.min(3,Math.max(1,(P.cycles||1)+ +b.dataset.d));buzz();return redraw()}
    case 'pc-groups':d.groupCount=+b.dataset.v;return redraw();
    case 'pc-adv':d.advance=+b.dataset.v;return redraw();
    case 'pc-third':d.third=!d.third;return redraw();
    case 'pc-cons':d.consolation=!d.consolation;return redraw();
    case 'pc-seed':d.seeding=b.dataset.v;return redraw();
    case 'pc-deuce':d.deuce=b.dataset.v;return redraw();
    case 'pc-fmt':d.fmt=b.dataset.v;return redraw();
    case 'pc-dec':d.dec=b.dataset.v;return redraw();
    case 'pc-tables':d.tables=Math.min(ttMaxTables(d),Math.max(1,ttTables(d)+ +b.dataset.d));buzz();return redraw();
    case 'pc-start':return pcStartFromDraft();
    case 'pc-open':store.pcdraft=store.pcdraft||freshPCDraft();return go('pcsetup',null);
    case 'pc-save':{const m=T.matches.find(x=>x.id===store.ui.score);if(m&&m.st!=='done')pcSaveScore(T,m);return}
    case 'pc-pick':{const m=LM();if(!m)return;const p=+b.dataset.v,L=m.live;
      if(L.pick==null){L.pick=p}else{const pa=ttSide(T,m,'a'),first=L.pick,second=p,part=x=>(pa.includes(x)?pa:ttSide(T,m,'b')).find(y=>y!==x);L.order=[first,second,part(first),part(second)]}
      touch(T);return render()}
    case 'pc-lot':{const m=LM();if(!m)return;const ps=ttSide(T,m,'a').concat(ttSide(T,m,'b'));m.live.pick=ps[Math.floor(Math.random()*4)];toast(`Жребий: подаёт ${T.players[m.live.pick]}`);touch(T);return render()}
    case 'pc-pt':{const m=LM();if(m&&m.st!=='done')pcLiveTap(T,m,b.dataset.v);return}
    case 'pc-undo':{const m=LM();if(!m)return;if(!pcLiveUndo(m.live)){if(!m.live.sets.length&&!m.live.g[0]&&!m.live.g[1]&&!m.live.p[0]&&!m.live.p[1]){m.live.order=null;m.live.pick=null}else toast('Нечего отменять')}touch(T);return render()}
    case 'pc-livesave':{const m=LM();if(m&&m.st!=='done')pcLiveSave(T,m);return}
  }
});
