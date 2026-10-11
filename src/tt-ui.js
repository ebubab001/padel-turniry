/* ================= sport picker ================= */
const SPORT_IC={
  padel:'<svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><ellipse cx="22" cy="18" rx="12" ry="14"/><path d="M28 30l9 12"/><circle cx="18" cy="14" r="1.5" fill="currentColor"/><circle cx="25" cy="14" r="1.5" fill="currentColor"/><circle cx="18" cy="21" r="1.5" fill="currentColor"/><circle cx="25" cy="21" r="1.5" fill="currentColor"/><circle cx="21.5" cy="27" r="1.5" fill="currentColor"/></svg>',
  tt:'<svg viewBox="0 0 48 48" width="40" height="40" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><circle cx="20" cy="20" r="13"/><path d="M29 29l10 10"/><circle cx="38" cy="12" r="4" fill="currentColor" stroke="none"/></svg>'
};
function renderSportPick(app){
  app.innerHTML=`
  <div class="topbar"><button class="iconbtn" data-a="home" aria-label="На главную">${IC.home}</button><div style="flex:1"></div></div>
  <div class="eyebrow" style="margin-top:14px">Padla Tour</div>
  <h1 class="big">Создай свой турнир</h1>
  <p class="sub" style="margin:0 0 18px">Выберите вид спорта</p>
  <div class="stack">
    <button class="sportcard" data-a="pick" data-v="padel"><span class="sic pad">${SPORT_IC.padel}</span>
      <span style="min-width:0"><b>Падел</b><span>Американо, Мексикано, парные форматы</span></span><span class="chev">›</span></button>
    <button class="sportcard" data-a="pick" data-v="tt"><span class="sic tt">${SPORT_IC.tt}</span>
      <span style="min-width:0"><b>Настольный теннис</b><span>Круг, группы + плей-офф, сетка, пары</span></span><span class="chev">›</span></button>
  </div>`;
}

/* ================= table tennis: setup ================= */
const curDraft=()=>store.ui.screen==='ttsetup'?store.ttdraft:store.draft;
const isPairInput=d=>d.unit?d.unit==='pair':PAIRF(d.format);
function ttStepper(action,val,label,hint){
  return `<div class="row"><div><div style="font-weight:800">${label}</div>${hint?`<div class="hint" style="margin:0">${hint}</div>`:''}</div>
    <div class="stepper"><button data-a="${action}" data-d="-1" aria-label="Меньше">−</button><span class="val">${val}</span><button data-a="${action}" data-d="1" aria-label="Больше">+</button></div></div>`;
}
const toggle=(action,on,label,hint)=>`<button class="toggle ${on?'on':''}" data-a="${action}" role="switch" aria-checked="${on}"><span><b>${label}</b>${hint?`<small>${hint}</small>`:''}</span><i></i></button>`;
function renderTTSetup(app){
  const d=store.ttdraft,n=ttEntrantCount(d),np=d.players.length,P=ttPlan(d),pairs=d.unit==='pair';
  const unitSeg=`<div class="seg three">${['single','pair','rotate'].map(u=>`<button data-a="tt-unit" data-v="${u}" class="${d.unit===u?'on':''}">${u==='single'?'Одиночный':u==='pair'?'Постоянные пары':'Смена партнёров'}</button>`).join('')}</div>`;
  const unitNote={single:'Каждый играет сам за себя.',pair:'Пара не меняется весь турнир и играет против других пар. Места — у пар.',
    rotate:'Американо: каждый раунд новый партнёр, каждый сыграет в паре с каждым. Места — у каждого игрока отдельно.'}[d.unit];
  const playersBlock=pairs?`<div class="stack" style="gap:8px">${(()=>{const out=[];for(let i=0;i<np;i+=2){const a=d.players[i],b=d.players[i+1];
      out.push(`<div class="pairchip ${b==null?'half':''}"><span class="num">${i/2+1}</span><span class="pn">${esc(a)} + ${b==null?'<span style="color:var(--mute)">ждёт партнёра</span>':esc(b)}</span><button class="x" data-a="rmpair" data-i="${i}" aria-label="Удалить пару">✕</button></div>`)}
      return out.join('')||'<span class="hint" style="margin:0">Добавьте минимум 3 пары</span>'})()}</div>`
    :`<div class="chips">${d.players.map((p,i)=>`<span class="chip">${d.seeding==='manual'&&d.unit!=='rotate'?`<small class="seedno">${i+1}</small>`:''}${esc(p)}<button class="x" data-a="rm" data-i="${i}" aria-label="Удалить ${esc(p)}">✕</button></span>`).join('')||`<span class="hint" style="margin:0">Добавьте минимум ${d.unit==='rotate'?4:3} игроков</span>`}</div>`;
  let fmtBlock='';
  if(d.unit!=='rotate'){
    const rec=n>=3?ttRecommend(n):null,scheme=d.scheme||(rec&&rec.scheme)||'rr';
    const chip=sc=>{const ok=n>=TT_MIN[sc];return `<button class="fmtopt ${scheme===sc?'on':''} ${ok?'':'dim'}" data-a="tt-scheme" data-v="${sc}">
      <b>${TT_SCHEME[sc]}${rec&&rec.scheme===sc?' <em>совет</em>':''}</b><small>${{rr:'Все со всеми. Места по победам',groups:'Группы по 3–6, лучшие — в сетку',ko:'Проиграл — выбыл'}[sc]}</small></button>`};
    let opts='';
    if(P.ok&&scheme==='rr')opts=ttStepper('tt-cycles',P.cycles,'Кругов',P.cycles>1?'Каждый сыграет с каждым дважды':'Каждый с каждым по разу');
    if(P.ok&&scheme==='groups')opts=`<div class="label" style="margin-top:14px">Групп</div>
      <div class="chips">${P.groupOptions.map(g=>`<button class="chip ${g===P.groupCount?'on':''}" data-a="tt-groups" data-v="${g}">${g} ${plural(g,'группа','группы','групп')} по ${(()=>{const z=ttGroupSizes(n,g),mn=Math.min(...z),mx=Math.max(...z);return mn===mx?mx:mn+'–'+mx})()}</button>`).join('')}</div>
      <div class="label" style="margin-top:14px">Из группы в плей-офф</div>
      <div class="seg"><button data-a="tt-adv" data-v="1" class="${P.advance===1?'on':''}">1 лучший</button><button data-a="tt-adv" data-v="2" class="${P.advance===2?'on':''}">2 лучших</button></div>
      <div class="stack" style="gap:8px;margin-top:12px">${toggle('tt-third',d.third,'Матч за 3-е место')}
      ${toggle('tt-cons',d.consolation,'Утешительная сетка','Для тех, кто не вышел из группы')}</div>`;
    if(P.ok&&scheme==='ko')opts=`<div class="stack" style="gap:8px;margin-top:12px">${toggle('tt-third',d.third,'Матч за 3-е место')}</div>
      ${P.byes?`<div class="info">Сетка на ${P.size}: ${P.byes} ${plural(P.byes,'сильнейший проходит','сильнейших проходят','сильнейших проходят')} первый круг без игры.</div>`:''}`;
    fmtBlock=`<section class="card"><div class="label">Формат${n>=3?` · ${n} ${pairs?plural(n,'пара','пары','пар'):plural(n,'игрок','игрока','игроков')}`:''}</div>
      <div class="stack" style="gap:8px">${['rr','groups','ko'].map(chip).join('')}</div>${opts}
      <div class="label" style="margin-top:16px">Посев</div>
      <div class="seg"><button data-a="tt-seed" data-v="random" class="${d.seeding!=='manual'?'on':''}">Жребий</button><button data-a="tt-seed" data-v="manual" class="${d.seeding==='manual'?'on':''}">По порядку списка</button></div>
      <div class="hint">${d.seeding==='manual'?'Первым в списке — сильнейший. Сильные попадут в разные группы и половины сетки.':'Порядок определит случай.'}</div></section>`;
  }
  const sch=P.scheme;
  const winsRow=(key,label)=>ttStepper('tt-wins-'+key,d.wins[key],label,`До ${d.wins[key]} ${plural(d.wins[key],'победы','побед','побед')} — максимум ${2*d.wins[key]-1} ${plural(2*d.wins[key]-1,'партия','партии','партий')}`);
  const matchBlock=`<section class="card"><div class="label">Партия до</div>
    <div class="chips">${[7,11,15,21].map(v=>`<button class="chip ${d.pts===v?'on':''}" data-a="tt-pts" data-v="${v}">${v}</button>`).join('')}</div>
    <div class="hint">Побеждает тот, кто набрал ${d.pts} с отрывом в 2 очка. При ${d.pts-1}:${d.pts-1} играют до отрыва в 2.</div>
    <div class="label" style="margin-top:16px">Матч — до побед в партиях</div>
    ${d.unit==='rotate'?ttStepper('tt-rwins',d.rwins,'Каждый матч',`До ${d.rwins} ${plural(d.rwins,'победы','побед','побед')}`)
      :sch==='ko'?winsRow('ko','Матчи сетки')+winsRow('f','Финал')
      :sch==='groups'?winsRow('g','Группы')+winsRow('ko','Плей-офф')+winsRow('f','Финал')
      :winsRow('g','Каждый матч')}
  </section>`;
  const tablesBlock=`<section class="card">
    ${ttStepper('tt-tables',P.tables,'Столов',n>=2?`Максимум ${P.maxTables}${P.tables<P.maxTables?' — часть игроков будет ждать':''}`:'')}
    ${P.ok?`<div class="info">${d.unit==='rotate'?(P.full?`Каждый сыграет в паре с каждым <b>ровно 1 раз</b> · ${P.rounds} ${plural(P.rounds,'раунд','раунда','раундов')} · по ${P.games} ${plural(P.games,'игре','игры','игр')}`
        :`При ${n} игроках «каждый с каждым» невозможно — у всех будет поровну игр: <b>${P.games}</b>`)+'<br>':''}
      Матчей: <b>${P.matches}</b> · примерно <b>${fmtMinutes(P.minutes)}</b> на ${P.tables} ${plural(P.tables,'столе','столах','столах')}</div>`
      :`<div class="warn">${P.err}</div>`}
    ${d.unit==='rotate'&&P.ok&&!P.full?ttStepper('tt-rounds',P.rounds,'Раундов',`Шаг ${P.step} — чтобы у всех было поровну игр`):''}
  </section>`;
  app.innerHTML=`
  <div class="topbar"><button class="iconbtn" data-a="new" aria-label="Назад">${IC.home}</button><div style="flex:1"></div></div>
  <div class="eyebrow" style="margin-top:14px">Настольный теннис</div>
  <h1 class="big">Новый турнир</h1>
  <div class="stack" style="margin-top:14px">
    <section class="card"><div class="label">Название</div>
      <input class="textin" id="f-name" value="${esc(d.name)}" placeholder="${esc(ttDefaultName())}" maxlength="60" autocomplete="off" aria-label="Название турнира">
      <div class="label" style="margin-top:16px">Кто играет</div>${unitSeg}<div class="hint">${unitNote}</div></section>
    <section class="card">
      <div class="row" style="margin-bottom:10px"><div class="label" style="margin:0">${pairs?`Пары · ${Math.floor(np/2)}${np%2?' + 1 игрок':''}`:`Участники · ${np}`}</div>
        ${np?'<button class="textbtn" data-a="clear" style="padding:0">Очистить</button>':''}</div>
      ${playersBlock}
      ${pairs&&np>=4?'<button class="textbtn" data-a="shufflepairs">Перемешать пары случайно</button>':''}
      <form class="addbox" id="addform"><input class="textin" id="newname" placeholder="${pairs?'Анна + Борис':'Имя игрока'}" autocomplete="off" enterkeyhint="done" aria-label="Имя игрока"><button type="submit" aria-label="Добавить">+</button></form>
      <div class="hint">${pairs?'Вводите пару через «+»: Анна + Борис. Или по одному имени — пары собираются по порядку.':'Можно вставить сразу список — через запятую или с новой строки'}</div>
      <div class="err" id="e-names"></div></section>
    ${fmtBlock}${matchBlock}${tablesBlock}
    <div class="err" id="e-cfg"></div>
    <button class="cta tt" data-a="tt-start">Начать турнир ${IC.arrow}</button>
  </div>`;
  const f=$('#addform'),inp=$('#newname');
  f.addEventListener('submit',e=>{e.preventDefault();addNames(inp.value)});
  inp.addEventListener('paste',e=>{const t=(e.clipboardData||window.clipboardData)?.getData('text')||'';if(/[\n,;+\/]/.test(t)){e.preventDefault();addNames(t)}});
  inp.addEventListener('input',()=>{$('#e-names').textContent=''});
  $('#f-name').addEventListener('input',e=>{d.name=e.target.value;saveLocal()});
}
const ttDefaultName=()=>`Настольный теннис · ${dateRu(Date.now())}`;
function ttStartFromDraft(){
  const d=store.ttdraft,P=ttPlan(d);
  if(!P.ok){$('#e-cfg').textContent=P.err;$('#e-cfg').scrollIntoView({block:'center',behavior:'smooth'});return}
  if(d.players.length>48){$('#e-cfg').textContent='Максимум 48 игроков';return}
  const id=newId(),r=ttStartPlay(d,id);
  if(r.err){$('#e-cfg').textContent=r.err;return}
  const T=r.T;T.name=(d.name.trim()||ttDefaultName()).slice(0,60);T.createdAt=Date.now();T.updatedAt=Date.now();
  store.tournaments[id]=T;
  store.ttdraft={...freshTTDraft(),players:d.players.slice(),unit:d.unit,pts:d.pts,wins:{...d.wins},rwins:d.rwins,tables:d.tables,seeding:d.seeding,third:d.third,consolation:d.consolation,advance:d.advance};
  touch(T);go('play',id,'play');wake();
}

/* ================= table tennis: tournament screens ================= */
const ttPhaseName=(T,m)=>{
  if(m.ph==='g')return `Группа ${String.fromCharCode(1040+m.g)} · тур ${m.r+1}`;
  if(m.ph==='rr')return `Тур ${m.r+1}`;
  if(m.ph==='am')return `Раунд ${m.r+1}`;
  if(m.ph==='third')return 'Матч за 3-е место';
  const left=m.rounds-m.r,base=left===1?'Финал':left===2?'Полуфинал':left===3?'1/4 финала':left===4?'1/8 финала':`Круг ${m.r+1}`;
  return m.ph==='cons'?`Утешительная · ${base.toLowerCase()}`:base;
};
const GRP=i=>String.fromCharCode(1040+i);
function ttHeader(T,title){
  const p=ttProgress(T),pct=p.all?Math.round(p.done/p.all*100):0;
  return `<div class="topbar"><button class="iconbtn" data-a="home" aria-label="На главную">${IC.home}</button>
    <div style="flex:1;min-width:0;text-align:center;padding-top:4px"><div class="eyebrow tt" style="overflow-wrap:anywhere">${esc(T.name)}</div>
    <div class="sub" style="font-size:13px">${TT_SCHEME[T.scheme]} · до ${T.cfg.pts} · ${p.done}/${p.all} матчей</div></div>
    <button class="iconbtn" data-a="tt-menu" aria-label="Меню турнира">${IC.dots}</button></div>
    ${title}<div class="progress" aria-label="Сыграно ${pct}%"><b style="width:${pct}%;background:var(--tt)"></b></div>`;
}
function renderTTTabbar(T){
  const t=store.ui.tab,res=T.stage==='results';
  $('#tabbar').innerHTML=`<div class="tabbar"><nav aria-label="Разделы">
    <button data-a="tab" data-v="play" class="${t==='play'?'on':''}">${res?IC.trophy:SPORT_IC.tt.replace('width="40" height="40"','')}${res?'Итоги':'Столы'}</button>
    <button data-a="tab" data-v="table" class="${t==='table'?'on':''}">${IC.table}Таблица</button>
    <button data-a="tab" data-v="grid" class="${t==='grid'?'on':''}">${IC.grid}Сетка</button>
  </nav></div>`;
}
function renderTT(app,T){
  if(store.ui.live!=null){const m=T.matches.find(x=>x.id===store.ui.live);if(m&&m.st!=='done'){$('#tabbar').innerHTML='';return renderTTLive(app,T,m)}store.ui.live=null}
  renderTTTabbar(T);
  const t=store.ui.tab;
  if(t==='table')return renderTTTable(app,T);
  if(t==='grid')return renderTTGrid(app,T);
  if(T.stage==='results')return renderTTResults(app,T);
  ttAssignTables(T);
  const onTables=T.matches.filter(m=>m.st!=='done'&&m.table!=null).sort((a,b)=>a.table-b.table);
  const nextUp=T.matches.filter(m=>m.st!=='done'&&m.table==null&&m.a!=null&&m.b!=null);
  const waiting=T.matches.filter(m=>m.st!=='done'&&(m.a==null||m.b==null)).length;
  const stageTitle=T.scheme==='groups'?(T.matches.some(m=>m.ph==='ko')?'Плей-офф':'Групповой этап'):T.scheme==='ko'?(onTables[0]?ttPhaseName(T,onTables[0]):'Сетка'):T.scheme==='rotate'?'Американо':'Круговой турнир';
  const side=(m,s)=>{const L=m.live;return `<div class="team"><div class="names"><span class="n">${esc(ttSideName(T,m,s))}</span></div>${L?`<span class="final">${(L.games.filter(g=>s==='a'?g[0]>g[1]:g[1]>g[0]).length)}<small style="font-size:16px;color:var(--mute)"> · ${L.cur[s==='a'?0:1]}</small></span>`:''}</div>`};
  app.innerHTML=`${ttHeader(T,`<h1 class="big" style="margin-top:14px">${stageTitle}</h1>`)}
  <div class="stack" style="margin-top:14px">
    ${onTables.map(m=>`<article class="card court" id="tm-${m.id}">
      <div class="court-head"><span class="court-tag tt">СТОЛ ${m.table}</span><span class="hint" style="margin:0">${ttPhaseName(T,m)} · до ${ttNeed(T,m)} ${plural(ttNeed(T,m),'победы','побед','побед')}</span></div>
      ${side(m,'a')}<div class="vs">VS</div>${side(m,'b')}
      <div class="court-foot"><div class="btnrow">
        <button class="finish" data-a="tt-score" data-m="${m.id}">Ввести счёт</button>
        <button class="finish alt" data-a="tt-live" data-m="${m.id}">${m.live?'Продолжить счёт':'Счёт по ходу'}</button>
        <button class="iconbtn sm" data-a="tt-mmenu" data-m="${m.id}" aria-label="Ещё">${IC.dots}</button></div></div>
    </article>`).join('')||`<div class="rest">Свободных столов нет — ждём окончания текущих матчей</div>`}
    ${nextUp.length?`<section class="card"><div class="label">Дальше</div>${nextUp.slice(0,8).map(m=>`<div class="mline"><span>${esc(ttSideName(T,m,'a'))}</span><span class="sc pending">${ttPhaseName(T,m).replace('Группа ','').replace(' · тур ',' ·')}</span><span class="r">${esc(ttSideName(T,m,'b'))}</span></div>`).join('')}
      ${nextUp.length>8?`<div class="hint">И ещё ${nextUp.length-8}</div>`:''}<div class="hint">Матч выходит на стол, когда он освобождается и оба соперника свободны.</div></section>`:''}
    ${waiting?`<div class="rest">${waiting} ${plural(waiting,'матч ждёт','матча ждут','матчей ждут')} соперников из прошлых кругов</div>`:''}
  </div>`;
}
/* ---------- score entry: game by game ---------- */
function ttScoreSheet(T,m,prefill){
  const need=ttNeed(T,m),rows=2*need-1,g=prefill||m.games||[];
  const nA=esc(ttSideName(T,m,'a')),nB=esc(ttSideName(T,m,'b'));
  $('#sheet').innerHTML=`<div class="sheet-bg" data-a="closesheet"><div class="sheet" role="dialog" aria-label="Счёт матча">
    <div class="grab"></div><h3>Счёт матча</h3><p>${ttPhaseName(T,m)} · до ${need} ${plural(need,'победы','побед','побед')}, партия до ${T.cfg.pts}</p>
    <div class="gamegrid"><span></span><b title="${nA}">${nA}</b><b title="${nB}">${nB}</b>
    ${[...Array(rows)].map((_,i)=>`<span class="gno">${i+1}</span>
      <input type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="99" class="gin" data-g="${i}" data-s="0" value="${g[i]?g[i][0]:''}" aria-label="Партия ${i+1}, ${nA}">
      <input type="number" inputmode="numeric" pattern="[0-9]*" min="0" max="99" class="gin" data-g="${i}" data-s="1" value="${g[i]?g[i][1]:''}" aria-label="Партия ${i+1}, ${nB}">`).join('')}
    </div>
    <div class="matchsum" id="msum"></div>
    <div class="err" id="serr"></div>
    <button class="act primary" data-a="tt-save" data-m="${m.id}">Сохранить результат</button>
    <button class="act" data-a="closesheet" style="background:none;color:var(--mute)">Отмена</button></div></div>`;
  $('.sheet').addEventListener('click',e=>{if(!e.target.closest('[data-a="closesheet"]'))e.stopPropagation()});
  $('.sheet [data-a="tt-save"]').addEventListener('click',()=>ttSaveScore(T,m));
  const upd=()=>{const games=ttReadGames(),r=games.err?null:ttMatchCheck(games.list,need,T.cfg.pts);
    let wa=0,wb=0;(games.list||[]).forEach(x=>{if(+x[0]>+x[1])wa++;else if(+x[1]>+x[0])wb++});
    $('#msum').innerHTML=`Партии <b>${wa}:${wb}</b>${r&&r.win?` · победа: <b>${r.win==='a'?nA:nB}</b>`:''}`;$('#serr').textContent='';
    document.querySelectorAll('.gin').forEach(el=>{const i=+el.dataset.g,row=[...document.querySelectorAll(`.gin[data-g="${i}"]`)].map(x=>x.value);
      el.classList.toggle('bad',row[0]!==''&&row[1]!==''&&!!ttGameErr(row[0],row[1],T.cfg.pts))})};
  document.querySelectorAll('.gin').forEach(el=>el.addEventListener('input',upd));upd();
  const first=document.querySelector('.gin');if(first&&!g.length)first.focus();
}
function ttReadGames(){
  const rows={};document.querySelectorAll('.gin').forEach(el=>{(rows[el.dataset.g]=rows[el.dataset.g]||[])[+el.dataset.s]=el.value.trim()});
  const list=[];let gap=false;
  for(const k of Object.keys(rows).sort((a,b)=>a-b)){const [x,y]=rows[k];
    if(x===''&&y===''){gap=true;continue}
    if(gap)return {err:`Пропущена партия перед партией ${+k+1}`,list};
    if(x===''||y==='')return {err:`Партия ${+k+1}: введите счёт обоих`,list};
    list.push([+x,+y])}
  return {list};
}
function ttSaveScore(T,m){
  const need=ttNeed(T,m),r=ttReadGames();
  if(r.err){$('#serr').textContent=r.err;return}
  const c=ttMatchCheck(r.list,need,T.cfg.pts);
  if(c.err){$('#serr').textContent=c.err;return}
  closeSheet();ttSetResult(T,m,r.list,c.win,null);buzz();touch(T);
  if(T.stage==='results'){store.ui.tab='play';render();scrollTo(0,0);return}
  render();toast(`Сохранено: ${c.wa}:${c.wb}`);
}
/* ---------- live scoring with serve hints ---------- */
function renderTTLive(app,T,m){
  const L=m.live,need=ttNeed(T,m),dbl=T.unit!=='single';
  const wa=L.games.filter(g=>g[0]>g[1]).length,wb=L.games.length-wa;
  const started=L.first!=null&&(!dbl||L.dbl);
  if(!started){
    const pa=ttSide(T,m,'a'),pb=ttSide(T,m,'b');
    app.innerHTML=`<div class="topbar"><button class="iconbtn" data-a="tt-livex" aria-label="Свернуть">${IC.home}</button><div style="flex:1"></div></div>
    <div class="eyebrow tt" style="margin-top:14px">${ttPhaseName(T,m)}</div><h1 class="big">Кто подаёт первым?</h1>
    <p class="sub">${dbl&&L.first!=null?'Теперь выберите, кто принимает первым':'По правилам — жребий. Нажмите на имя или бросьте жребий.'}</p>
    <div class="stack" style="margin-top:14px">
    ${!dbl?['a','b'].map(s=>`<button class="sportcard" data-a="tt-first" data-v="${s}"><span style="min-width:0"><b>${esc(ttSideName(T,m,s))}</b></span><span class="chev">›</span></button>`).join('')+`<button class="ghost" data-a="tt-lot">Жребий</button>`
     :L.first==null?pa.concat(pb).map(p=>`<button class="sportcard" data-a="tt-dserver" data-v="${p}"><span style="min-width:0"><b>${esc(T.players[p])}</b><span>${pa.includes(p)?esc(ttSideName(T,m,'a')):esc(ttSideName(T,m,'b'))}</span></span><span class="chev">›</span></button>`).join('')+`<button class="ghost" data-a="tt-lot">Жребий</button>`
     :(L.first==='a'?pb:pa).map(p=>`<button class="sportcard" data-a="tt-dreceiver" data-v="${p}"><span style="min-width:0"><b>${esc(T.players[p])}</b><span>принимает подачу ${esc(T.players[L.pendingS])}</span></span><span class="chev">›</span></button>`).join('')}
    </div>`;return;
  }
  const si=ttServeInfo(T,m,L),srvSide=dbl?si.serverSide:si.server;
  const half=s=>{const pts=L.cur[s==='a'?0:1],gw=s==='a'?wa:wb,serving=srvSide===s;
    return `<button class="livehalf ${serving?'serving':''}" data-a="tt-pt" data-v="${s}" aria-label="Очко: ${esc(ttSideName(T,m,s))}">
      <span class="lname">${esc(ttSideName(T,m,s))}</span>
      <span class="lpts">${pts}</span>
      <span class="lgames">Партии: <b>${gw}</b></span>
      ${serving?`<span class="lserve"><i class="ballico tt"></i>${dbl?`подаёт ${esc(T.players[si.server])} → ${esc(T.players[si.receiver])}`:'подача'}</span>`:''}
    </button>`};
  app.innerHTML=`<div class="topbar"><button class="iconbtn" data-a="tt-livex" aria-label="Свернуть">${IC.home}</button>
    <div style="flex:1;text-align:center;padding-top:4px"><div class="eyebrow tt">${ttPhaseName(T,m)}</div><div class="sub" style="font-size:13px">Партия ${L.games.length+1} · до ${need} ${plural(need,'победы','побед','побед')}${si.deciding?' · решающая':''}</div></div>
    <button class="iconbtn" data-a="tt-undo" aria-label="Отменить очко">↶</button></div>
    <div class="livewrap">${half('a')}${half('b')}</div>
    ${L.games.length?`<div class="rest" style="justify-content:center;margin-top:10px">Партии: ${L.games.map(g=>g.join(':')).join(' · ')}</div>`:''}
    <div class="rest" style="justify-content:center;margin-top:6px">Нажимайте на сторону, которая выиграла очко</div>`;
}
function ttLiveTap(T,m,side){
  const ev=ttLivePoint(T,m,m.live,side);buzz();touch(T);
  if(ev.includes('ends'))toast('Смена сторон');
  if(ev.includes('match')){
    render();const L=m.live,wa=L.games.filter(g=>g[0]>g[1]).length,wb=L.games.length-wa;
    return sheet('Матч окончен',`${esc(ttSideName(T,m,'a'))} — ${esc(ttSideName(T,m,'b'))}: <b>${wa}:${wb}</b> (${L.games.map(g=>g.join(':')).join(', ')})`,[
      {label:'Сохранить результат',kind:'primary',run:()=>{const c=ttMatchCheck(L.games,ttNeed(T,m),T.cfg.pts);if(c.err){toast(c.err);return}store.ui.live=null;ttSetResult(T,m,L.games,c.win,null);touch(T);render();scrollTo(0,0);toast('Результат сохранён')}},
      {label:'Отменить последнее очко',run:()=>{ttLiveUndo(m.live);touch(T);render()}}]);
  }
  if(ev.includes('game')){const g=m.live.games[m.live.games.length-1];toast(`Партия ${g[0]}:${g[1]} · смена сторон`)}
  render();
}
/* ---------- tables, bracket, results ---------- */
function ttStandRows(T,R,ids,adv){
  return ids.map((e,i)=>{const s=R.stats[e];return `<div class="lb-row">
    <span class="place ${i<3&&s.g?'p'+(i+1):''}">${s.g?i+1:'—'}</span>
    <div style="min-width:0"><div class="lb-name">${esc(T.entrants[e].name)}${T.entrants[e].out?' <small style="color:var(--coral)">снят</small>':''}${adv&&i<adv?' <small class="qual">выход</small>':''}${R.lot&&R.lot[e]?' <small style="color:var(--mute)">жребий</small>':''}</div>
      <div class="lb-meta">${s.g} ${plural(s.g,'матч','матча','матчей')} · ${s.w}–${s.l} · партии ${s.gw}:${s.gl} · очки ${s.pw}:${s.pl}</div></div>
    <span class="delta zero" title="Очки за матчи">${s.mp}</span></div>`}).join('');
}
function renderTTTable(app,T){
  let body='';
  const note=`<div class="hint" style="margin-top:12px">Очки: 2 за победу, 1 за поражение, 0 за неявку. При равенстве — личные встречи, затем партии и очки между равными (ITTF).</div>`;
  if(T.scheme==='rotate'){const R=ttRankPlayers(T);body=`<section class="card"><div class="row" style="margin-bottom:4px"><div class="label" style="margin:0">Игрок</div><div class="label" style="margin:0">Очки</div></div>${ttStandRows(T,R,R.order)}<div class="hint" style="margin-top:12px">Очки: 2 за победу, 1 за поражение. При равенстве — соотношение партий, затем очков.</div></section>`}
  else if(T.scheme==='rr'){const R=ttRank(T,T.entrants.map((x,i)=>i),T.matches);body=`<section class="card"><div class="row" style="margin-bottom:4px"><div class="label" style="margin:0">${T.unit==='pair'?'Пара':'Игрок'}</div><div class="label" style="margin:0">Очки</div></div>${ttStandRows(T,R,R.order)}${note}</section>`}
  else if(T.scheme==='groups'){body=T.groups.map((list,gi)=>{const R=ttRank(T,list,T.matches.filter(m=>m.ph==='g'&&m.g===gi));
      return `<section class="card"><div class="row" style="margin-bottom:4px"><div class="label" style="margin:0">Группа ${GRP(gi)}</div><div class="label" style="margin:0">Очки</div></div>${ttStandRows(T,R,R.order,T.cfg.advance)}</section>`}).join('')+`<div class="rest">${note.replace(/<[^>]+>/g,'')}</div>`}
  else{const rows=ttFinal(T);body=`<section class="card"><div class="label">Места по итогам сетки</div>${rows.map(r=>`<div class="lb-row"><span class="place ${r.p1<=3&&T.stage==='results'?'p'+r.p1:''} ${r.tie?'tie':''}">${r.place}</span><div style="min-width:0"><div class="lb-name">${esc(r.name)}</div><div class="lb-meta">${r.st.w}–${r.st.l} · партии ${r.st.gw}:${r.st.gl}</div></div><span></span></div>`).join('')}<div class="hint" style="margin-top:12px">Места окончательные после финала.</div></section>`}
  app.innerHTML=`${ttHeader(T,'<h1 class="big" style="margin-top:14px">Таблица</h1>')}<div class="stack" style="margin-top:14px">${body}</div>`;
}
function ttMatchLine(T,m){
  const sc=m.bye?'—':m.wo?(m.wo==='ab'?'н/я':'н/я'):m.st==='done'?m.games.map(g=>g.join(':')).join(' '):m.table?`Стол ${m.table}`:'';
  const summary=m.st==='done'&&!m.bye&&!m.wo?(()=>{const wa=m.games.filter(g=>g[0]>g[1]).length;return `${wa}:${m.games.length-wa}`})():m.wo?'w/o':m.bye?'пропуск':'';
  const nameA=`<span class="${m.win==='a'?'wn':''}">${esc(ttSideName(T,m,'a'))}</span>`,nameB=`<span class="r ${m.win==='b'?'wn':''}">${esc(ttSideName(T,m,'b'))}</span>`;
  const inner=`${nameA}<span class="sc ${m.st==='done'?'':'pending'}" title="${esc(sc)}">${summary||sc||'·'}</span>${nameB}`;
  return m.st==='done'&&!m.bye?`<button class="mline" data-a="tt-fix" data-m="${m.id}">${inner}</button>`:`<div class="mline">${inner}</div>`;
}
function renderTTGrid(app,T){
  const sec=(title,ms)=>ms.length?`<section class="card"><div class="round-title"><b>${title}</b></div>${ms.map(m=>ttMatchLine(T,m)).join('')}</section>`:'';
  let body='';
  const byRound=(ph,g)=>{const ms=T.matches.filter(m=>m.ph===ph&&(g==null||m.g===g));const rs=[...new Set(ms.map(m=>m.r))].sort((a,b)=>a-b);return rs.map(r=>({r,ms:ms.filter(m=>m.r===r)}))};
  if(T.scheme==='groups')T.groups.forEach((l,gi)=>{body+=sec(`Группа ${GRP(gi)}`,T.matches.filter(m=>m.ph==='g'&&m.g===gi))});
  if(T.scheme==='rr')byRound('rr').forEach(x=>body+=sec(`Тур ${x.r+1}`,x.ms));
  if(T.scheme==='rotate')byRound('am').forEach(x=>body+=sec(`Раунд ${x.r+1}`,x.ms));
  ['ko','cons'].forEach(ph=>byRound(ph).forEach(x=>body+=sec(ttPhaseName(T,x.ms[0]),x.ms.filter(m=>!(m.bye&&m.a==null&&m.b==null)))));
  const th=T.matches.filter(m=>m.ph==='third');body+=sec('Матч за 3-е место',th);
  if(T.scheme==='groups'&&!T.matches.some(m=>m.ph==='ko'))body+=`<div class="rest">Сетка плей-офф появится, когда закончатся все матчи групп</div>`;
  app.innerHTML=`${ttHeader(T,'<h1 class="big" style="margin-top:14px">Сетка</h1>')}<div class="stack" style="margin-top:14px"><div class="rest">Нажмите на сыгранный матч, чтобы исправить счёт</div>${body}</div>`;
}
function ttPodium(rows){
  const firstOf=p=>rows.find(r=>r.p1===p);const top=[firstOf(1),firstOf(2),firstOf(3)];
  const h=[150,110,84],bg=['var(--gold)','var(--silver)','var(--bronze)'];
  return `<div class="podium">${[1,0,2].filter(i=>top[i]).map(i=>{const r=top[i],shared=rows.filter(x=>x.p1===r.p1);return `<div class="pod"><span class="nm">${shared.map(x=>esc(x.name)).join('<br>')}</span>
    <div class="blk" style="height:${h[i]}px;background:${bg[i]}"><span>${r.place}</span><small>${r.st.w}–${r.st.l}</small></div></div>`}).join('')}</div>`;
}
function renderTTResults(app,T){
  const rows=ttFinal(T),champ=rows.filter(r=>r.p1===1),p=ttProgress(T);
  app.innerHTML=`${ttHeader(T,'')}
  <div class="eyebrow tt" style="margin-top:14px">${p.done<p.all?'Турнир остановлен досрочно':'Все матчи сыграны'}</div>
  <div class="sub" style="margin-top:8px">${T.unit!=='pair'&&champ.length===1?'Чемпион':'Чемпионы'}</div>
  <div class="champ tt">${champ.map(r=>esc(r.name)).join(', ')}</div>
  <section class="card pop" style="margin-top:18px;padding-bottom:0;overflow:hidden">${ttPodium(rows)}</section>
  <div class="stack" style="margin-top:14px">
    <section class="card"><div class="label">Итоговые места</div>${rows.map(r=>`<div class="lb-row"><span class="place ${r.p1<=3?'p'+r.p1:''} ${r.tie?'tie':''}">${r.place}</span><div style="min-width:0"><div class="lb-name">${esc(r.name)}</div><div class="lb-meta">${r.st.w} ${plural(r.st.w,'победа','победы','побед')} · ${r.st.l} ${plural(r.st.l,'поражение','поражения','поражений')} · партии ${r.st.gw}:${r.st.gl}</div></div><span></span></div>`).join('')}</section>
    <button class="cta tt" data-a="finishT">${IC.check} Завершить турнир</button>
    <button class="ghost" data-a="share">Поделиться результатом</button>
    <div class="rest" style="justify-content:center">Турнир сохранится в завершённых. Ошибку в счёте можно исправить во вкладке «Сетка».</div>
  </div>`;
  if(!T.celebrated){T.celebrated=true;touch(T);confetti()}
}
function renderTTArchived(app,T){
  const rows=ttFinal(T),champ=rows.filter(r=>r.p1===1);
  const byPh=[...new Set(T.matches.map(m=>m.ph))];
  app.innerHTML=`<div class="topbar"><button class="iconbtn" data-a="home" aria-label="На главную">${IC.home}</button>
    <div style="flex:1"></div><button class="iconbtn" data-a="amenu" aria-label="Действия">${IC.dots}</button></div>
  <div class="eyebrow tt" style="margin-top:14px">Настольный теннис · ${TT_SCHEME[T.scheme]} · ${dateRu(T.finishedAt||T.createdAt)}</div>
  <h1 class="big">${esc(T.name)}</h1>
  <div class="sub">${T.unit!=='pair'&&champ.length===1?'Чемпион':'Чемпионы'}: <b style="color:var(--tt)">${champ.map(r=>esc(r.name)).join(', ')}</b></div>
  <section class="card" style="margin-top:18px;padding-bottom:0;overflow:hidden">${ttPodium(rows)}</section>
  <div class="stack" style="margin-top:14px">
    <section class="card"><div class="label">Итоговые места</div>${rows.map(r=>`<div class="lb-row"><span class="place ${r.p1<=3?'p'+r.p1:''} ${r.tie?'tie':''}">${r.place}</span><div style="min-width:0"><div class="lb-name">${esc(r.name)}</div><div class="lb-meta">${r.st.w}–${r.st.l} · партии ${r.st.gw}:${r.st.gl}</div></div><span></span></div>`).join('')}</section>
    <section class="card"><div class="label">Все матчи</div>${T.matches.filter(m=>!m.bye).map(m=>{const line=ttMatchLine(T,m).replace('<button class="mline" data-a="tt-fix"','<div class="mline" data-x').replace(/<\/button>$/,'</div>');return `<div class="hint" style="margin:8px 0 0">${ttPhaseName(T,m)}</div>${line}`}).join('')}</section>
    <button class="cta tt" data-a="share">Поделиться результатом</button>
  </div>`;
}
function ttCardData(T){
  const rows=ttFinal(T),champ=rows.filter(r=>r.p1===1);
  return {sport:'НАСТОЛЬНЫЙ ТЕННИС',meta:`${TT_SCHEME[T.scheme]} · ${dateRu(T.finishedAt||T.createdAt)} · до ${T.cfg.pts}`,
    champLabel:T.unit!=='pair'&&champ.length===1?'ЧЕМПИОН':'ЧЕМПИОНЫ',champ:champ.map(r=>r.name).join(', '),champSub:`${champ[0].st.w} ${plural(champ[0].st.w,'победа','победы','побед')} · партии ${champ[0].st.gw}:${champ[0].st.gl}`,
    head:[T.unit==='pair'?'ПАРА':'ИГРОК','В–П'],
    rows:rows.map(r=>({name:r.name,place:r.place,p1:r.p1,tie:r.tie,mid:`партии ${r.st.gw}:${r.st.gl}`,pill:`${r.st.w}–${r.st.l}`,kind:'zero',sub:`${r.st.w}–${r.st.l}`})),
    foot:'Места — по итогам турнира (правила ITTF)'};
}
function ttCopyText(T){const rows=ttFinal(T);return `${T.name} (Настольный теннис, ${TT_SCHEME[T.scheme]}, ${dateRu(T.finishedAt||T.createdAt)})\n`+rows.map(r=>`${r.place}. ${r.name} — ${r.st.w}–${r.st.l}, партии ${r.st.gw}:${r.st.gl}`).join('\n')}

/* ================= table tennis: actions ================= */
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-a]');if(!b)return;const a=b.dataset.a;
  if(a==='pick'){if(b.dataset.v==='tt'){store.ttdraft=store.ttdraft||freshTTDraft();return go('ttsetup',null)}return go('setup',null)}
  if(!a.startsWith('tt-'))return;
  const d=store.ttdraft,T=cur(),M=T&&T.matches?T.matches.find(x=>x.id===+b.dataset.m):null;
  const redraw=()=>{saveLocal();render()};
  switch(a){
    case 'tt-unit':d.unit=b.dataset.v;d.rounds=null;buzz();return redraw();
    case 'tt-scheme':{const n=ttEntrantCount(d);if(n<TT_MIN[b.dataset.v]){$('#e-cfg').textContent=`Для формата «${TT_SCHEME[b.dataset.v]}» нужно минимум ${TT_MIN[b.dataset.v]} ${d.unit==='pair'?'пар':'игроков'}`;return}d.scheme=b.dataset.v;return redraw()}
    case 'tt-cycles':{const P=ttPlan(d);d.cycles=Math.min(3,Math.max(1,(P.cycles||1)+ +b.dataset.d));buzz();return redraw()}
    case 'tt-groups':d.groupCount=+b.dataset.v;return redraw();
    case 'tt-adv':d.advance=+b.dataset.v;return redraw();
    case 'tt-third':d.third=!d.third;return redraw();
    case 'tt-cons':d.consolation=!d.consolation;return redraw();
    case 'tt-seed':d.seeding=b.dataset.v;return redraw();
    case 'tt-pts':d.pts=+b.dataset.v;return redraw();
    case 'tt-rwins':d.rwins=Math.min(4,Math.max(1,d.rwins+ +b.dataset.d));buzz();return redraw();
    case 'tt-tables':d.tables=Math.min(ttMaxTables(d),Math.max(1,ttTables(d)+ +b.dataset.d));d.rounds=null;buzz();return redraw();
    case 'tt-rounds':{const P=ttPlan(d);if(!P.ok||!P.step)return;d.rounds=Math.max(P.step,Math.min(Math.floor(60/P.step)*P.step,P.rounds+ +b.dataset.d*P.step));buzz();return redraw()}
    case 'tt-start':return ttStartFromDraft();
    case 'tt-score':if(M&&M.st!=='done')ttScoreSheet(T,M);return;
    case 'tt-live':if(!M||M.st==='done')return;M.live=M.live||{games:[],cur:[0,0],first:null,dbl:null,hist:[]};store.ui.live=M.id;touch(T);render();return scrollTo(0,0);
    case 'tt-livex':store.ui.live=null;saveLocal();return render();
    case 'tt-first':{const m=T.matches.find(x=>x.id===store.ui.live);m.live.first=b.dataset.v;touch(T);return render()}
    case 'tt-lot':{const m=T.matches.find(x=>x.id===store.ui.live),side=Math.random()<.5?'a':'b';
      if(T.unit==='single'){m.live.first=side;toast(`Жребий: подаёт ${ttSideName(T,m,side)}`)}
      else{const ps=ttSide(T,m,side);m.live.pendingS=ps[Math.floor(Math.random()*2)];m.live.first=side;toast(`Жребий: подаёт ${T.players[m.live.pendingS]}`)}
      touch(T);return render()}
    case 'tt-dserver':{const m=T.matches.find(x=>x.id===store.ui.live),p=+b.dataset.v;m.live.pendingS=p;m.live.first=ttSide(T,m,'a').includes(p)?'a':'b';touch(T);return render()}
    case 'tt-dreceiver':{const m=T.matches.find(x=>x.id===store.ui.live);m.live.dbl={s:m.live.pendingS,r:+b.dataset.v};touch(T);return render()}
    case 'tt-pt':{const m=T.matches.find(x=>x.id===store.ui.live);if(m&&m.st!=='done')ttLiveTap(T,m,b.dataset.v);return}
    case 'tt-undo':{const m=T.matches.find(x=>x.id===store.ui.live);if(!m)return;if(!ttLiveUndo(m.live)){if(m.live.games.length===0&&m.live.cur[0]+m.live.cur[1]===0){m.live.first=null;m.live.dbl=null}else toast('Нечего отменять')}touch(T);return render()}
    case 'tt-mmenu':{if(!M)return;const acts=[];
      if(T.unit!=='rotate')['a','b'].forEach(s=>acts.push({label:`Не пришёл: ${esc(ttSideName(T,M,s))}`,run:()=>sheet('Техническое поражение?',`${esc(ttSideName(T,M,s))} получит поражение без игры (0 очков), соперник — победу.`,[{label:'Засчитать',kind:'danger',run:()=>{ttSetResult(T,M,[],s==='a'?'b':'a',s);touch(T);render()}}])}));
      else ['a','b'].forEach(s=>acts.push({label:`Не явилась пара: ${esc(ttSideName(T,M,s))}`,run:()=>sheet('Техническое поражение?','Пара получит поражение без игры (0 очков).',[{label:'Засчитать',kind:'danger',run:()=>{ttSetResult(T,M,[],s==='a'?'b':'a',s);touch(T);render()}}])}));
      if(M.live)acts.push({label:'Сбросить счёт по ходу',run:()=>{M.live=null;touch(T);render()}});
      return sheet(ttPhaseName(T,M),`${esc(ttSideName(T,M,'a'))} — ${esc(ttSideName(T,M,'b'))}`,acts)}
    case 'tt-fix':{if(!M)return;const c=ttCanEdit(T,M);if(!c.ok)return sheet('Нельзя исправить',c.why,[]);
      return sheet('Исправить счёт?',`Сейчас: ${M.wo?'техническое поражение':M.games.map(g=>g.join(':')).join(', ')}.${M.ph==='g'&&T.matches.some(x=>x.ph==='ko')?' Сетка плей-офф будет составлена заново после исправления.':''}`,
        [{label:'Исправить',kind:'primary',run:()=>{const old=M.wo?[]:M.games.slice();ttReopen(T,M);touch(T);store.ui.tab='play';render();ttScoreSheet(T,M,old)}}])}
    case 'tt-menu':{const acts=[{label:'Переименовать',run:()=>renameSheet(T)}];
      if(T.unit!=='rotate'&&T.stage==='play'){const alive=T.entrants.map((x,i)=>i).filter(i=>!T.entrants[i].out);
        acts.push({label:T.unit==='pair'?'Снять пару с турнира':'Снять игрока с турнира',run:()=>sheet(T.unit==='pair'?'Кого снять?':'Кого снять?','Все его оставшиеся матчи засчитаются как техническое поражение.',alive.map(i=>({label:esc(T.entrants[i].name),run:()=>sheet('Снять с турнира?',`${esc(T.entrants[i].name)} — оставшиеся матчи будут засчитаны соперникам. Отменить нельзя.`,[{label:'Снять',kind:'danger',run:()=>{ttWithdraw(T,i);touch(T);render();toast('Снят с турнира')}}])})))})}
      if(T.stage==='play'&&(T.scheme==='rr'||T.scheme==='rotate'))acts.push({label:'Остановить и подвести итоги',kind:'primary',run:()=>sheet('Остановить турнир?','Несыгранные матчи не войдут в зачёт.',[{label:'Подвести итоги',kind:'primary',run:()=>{T.matches.forEach(m=>{if(m.st!=='done'){m.st='done';m.bye=true;m.cancelled=true;m.win=null;m.table=null;m.live=null}});T.stage='results';touch(T);store.ui.tab='play';render();scrollTo(0,0)}}])});
      acts.push({label:'Удалить турнир',kind:'danger',run:()=>sheet('Удалить турнир?','Все результаты этого турнира будут удалены.',[{label:'Удалить',kind:'danger',run:()=>deleteT(T)}])});
      const p=ttProgress(T);return sheet(T.name,`Настольный теннис · ${TT_SCHEME[T.scheme]} · сыграно ${p.done} из ${p.all}<br>${syncChip().replace('id="sync"','')}`,acts)}
    default:{if(a.startsWith('tt-wins-')){const k=a.slice(8);d.wins[k]=Math.min(4,Math.max(1,d.wins[k]+ +b.dataset.d));buzz();return redraw()}}
  }
});
