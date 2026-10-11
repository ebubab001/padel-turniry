/* ================= table tennis: engine (no DOM) ================= */
const TT_UNIT={single:'Одиночный',pair:'Постоянные пары',rotate:'Пары со сменой партнёров'};
const TT_SCHEME={rr:'Круговой',groups:'Группы + плей-офф',ko:'Олимпийская сетка',rotate:'Американо'};
const TT_MIN={rr:3,ko:3,groups:6};
let ttPrev={key:'',sched:null};
function freshTTDraft(){return {name:'',unit:'single',scheme:null,players:[],pts:11,wins:{g:2,ko:3,f:3},rwins:1,tables:2,cycles:null,groupCount:null,advance:2,third:true,consolation:false,seeding:'random',rounds:null}}
/* entrants: players (single, rotate) or fixed pairs */
const ttEntrantCount=d=>d.unit==='pair'?Math.floor(d.players.length/2):d.players.length;
function ttMaxTables(d){const n=ttEntrantCount(d);return Math.max(1,d.unit==='rotate'?Math.floor(n/4):Math.floor(n/2))}
const ttTables=d=>Math.max(1,Math.min(d.tables||1,ttMaxTables(d)));
function ttGroupOptions(n){const out=[];for(let g=2;g<=Math.floor(n/3);g++){if(Math.floor(n/g)>=3&&Math.ceil(n/g)<=6)out.push(g)}return out}
function ttDefaultGroups(n){const o=ttGroupOptions(n);if(!o.length)return null;return o.reduce((b,g)=>Math.abs(n/g-4)<Math.abs(n/b-4)?g:b,o[0])}
function ttRecommend(n){return n<=7?{scheme:'rr',cycles:n<=3?2:1}:{scheme:'groups',cycles:1,groupCount:ttDefaultGroups(n),advance:2}}
function ttGroupSizes(n,g){const s=Array(g).fill(Math.floor(n/g));for(let i=0;i<n%g;i++)s[i]++;return s}
const TT_MIN_PER_MATCH={1:7,2:13,3:22,4:32};
const ttMatchMinutes=(wins,pts)=>Math.round((TT_MIN_PER_MATCH[wins]||13)*Math.max(.6,pts/11));
/* everything the setup screen needs to know, and whether the tournament can start */
function ttPlan(d){
  const n=ttEntrantCount(d),P={n,unit:d.unit,tables:ttTables(d),maxTables:ttMaxTables(d)};
  if(d.unit==='pair'&&d.players.length%2)return {...P,ok:false,err:'Нужно чётное число игроков — у одного нет пары'};
  if(d.unit==='rotate'){
    if(n<4)return {...P,ok:false,err:'Нужно минимум 4 игрока'};
    const c=P.tables,act=activeCount(n,c),step=restStep(n,c);
    if(n%4<2){const key=n+'#'+c;if(ttPrev.key!==key)ttPrev={key,sched:buildAmericanoFull(n,c)};
      return {...P,ok:true,scheme:'rotate',full:true,games:n-1,rounds:ttPrev.sched.length,matches:n*(n-1)/4,minutes:ttEstimate(n*(n-1)/4,0,0,d,c)}}
    const def=Math.ceil((n-1)/step)*step,R=(d.rounds&&d.rounds%step===0)?d.rounds:def;
    return {...P,ok:true,scheme:'rotate',full:false,step,rounds:R,games:R*act/n,rest:n-act,matches:R*act/4,minutes:ttEstimate(R*act/4,0,0,d,c)};
  }
  const rec=ttRecommend(n),scheme=d.scheme||rec.scheme;P.scheme=scheme;P.recommended=rec.scheme;
  const who=d.unit==='pair'?'пары':'игрока';
  if(n<TT_MIN[scheme])return {...P,ok:false,err:`Для формата «${TT_SCHEME[scheme]}» нужно минимум ${TT_MIN[scheme]} ${scheme==='groups'?(d.unit==='pair'?'пар':'игроков'):who}`};
  if(scheme==='rr'){const cy=d.cycles||rec.cycles||1,m=cy*n*(n-1)/2;return {...P,ok:true,cycles:cy,matches:m,games:cy*(n-1),minutes:ttEstimate(m,0,0,d,P.tables)}}
  if(scheme==='ko'){let S=2;while(S<n)S*=2;const third=d.third&&n>=4?1:0,m=n-1+third;
    return {...P,ok:true,size:S,byes:S-n,matches:m,minutes:ttEstimate(m-1-third,0,1+third,d,P.tables)}}
  const opts=ttGroupOptions(n),g=opts.includes(d.groupCount)?d.groupCount:ttDefaultGroups(n);
  const sizes=ttGroupSizes(n,g),adv=Math.min(d.advance||2,2),q=g*adv;
  let gm=0;sizes.forEach(s=>gm+=s*(s-1)/2);
  const third=d.third&&q>=4?1:0,ko=q-1+third,rest=n-q,cons=d.consolation&&rest>=2?rest-1:0;
  return {...P,ok:true,groupOptions:opts,groupCount:g,sizes,advance:adv,qualifiers:q,matches:gm+ko+cons,groupMatches:gm,koMatches:ko,consMatches:cons,
    minutes:ttEstimate(gm,ko-1-third+cons,1+third,d,P.tables)};
}
function ttEstimate(gMatches,koMatches,finals,d,tables){
  const p=d.pts||11,mins=gMatches*ttMatchMinutes(d.unit==='rotate'?d.rwins:d.wins.g,p)+koMatches*ttMatchMinutes(d.wins.ko,p)+finals*ttMatchMinutes(d.wins.f,p);
  return Math.round(mins/Math.max(1,tables)*1.15);
}
const fmtMinutes=m=>m<60?`${m} мин`:`${Math.floor(m/60)} ч${m%60?` ${m%60} мин`:''}`;

/* ---------- game / match score rules (ITTF): a game is won at `pts` with a 2-point lead ---------- */
function ttGameErr(x,y,pts){
  if(x===''||y===''||x==null||y==null)return 'Введите счёт партии';
  x=Number(x);y=Number(y);
  if(!Number.isInteger(x)||!Number.isInteger(y)||x<0||y<0)return 'Счёт — целые числа от 0';
  if(x>99||y>99)return 'Слишком большой счёт';
  if(x===y)return 'В партии не бывает ничьей';
  const w=Math.max(x,y),l=Math.min(x,y);
  if(w<pts)return `Партия идёт до ${pts} очков`;
  if(l<=pts-2&&w!==pts)return `При ${l} у проигравшего победитель набирает ровно ${pts}`;
  if(l>=pts-1&&w!==l+2)return `После ${pts-1}:${pts-1} нужен отрыв в 2 очка — например ${l+2}:${l}`;
  return null;
}
/* games: [[a,b],...]; need = wins needed. Returns {err} or {win:'a'|'b'} */
function ttMatchCheck(games,need,pts){
  if(!games.length)return {err:'Введите счёт хотя бы одной партии'};
  let wa=0,wb=0;
  for(let i=0;i<games.length;i++){
    if(wa===need||wb===need)return {err:`Матч уже закончился после ${i}-й партии — лишняя партия`};
    const e=ttGameErr(games[i][0],games[i][1],pts);if(e)return {err:`Партия ${i+1}: ${e}`};
    if(+games[i][0]>+games[i][1])wa++;else wb++;
  }
  if(wa<need&&wb<need)return {err:`Матч идёт до ${need} ${plural(need,'победы','побед','побед')} в партиях — сейчас ${wa}:${wb}`};
  return {win:wa>wb?'a':'b',wa,wb};
}
const ttNeed=(T,m)=>T.unit==='rotate'?T.cfg.rwins:m.final?T.cfg.wins.f:(m.ph==='ko'||m.ph==='third'||m.ph==='cons')?T.cfg.wins.ko:T.cfg.wins.g;

/* ---------- live scoring: who serves, when to change ends ---------- */
/* state: {games:[[a,b]...], cur:[a,b], first:'a'|'b' (singles: side serving first in game 1), dbl:{s,r} player ids for doubles game 1, hist:[]} */
function ttServeInfo(T,m,L){
  const pts=T.cfg.pts,g=L.games.length,[a,b]=L.cur,t=a+b,need=ttNeed(T,m);
  const dz=2*(pts-1);const block=t<dz?Math.floor(t/2):(pts-1)+(t-dz);
  const deciding=g===2*need-2;
  const sideFirst=g%2===0?L.first:(L.first==='a'?'b':'a');
  const info={deciding};
  if(!L.dbl){info.server=(block%2===0)?sideFirst:(sideFirst==='a'?'b':'a');return info}
  /* doubles: cycle S→R→S'→R'; next game the previous first receiver serves first to the player who served to him */
  const pa=ttSide(T,m,'a'),pb=ttSide(T,m,'b'),partner=p=>pa.includes(p)?pa.find(x=>x!==p):pb.find(x=>x!==p);
  let S=L.dbl.s,R=L.dbl.r;
  for(let i=0;i<g;i++){const ns=R,nr=S;S=ns;R=nr}
  let cyc=[S,R,partner(S),partner(R)];
  /* deciding game: when a side first reaches 5, the receiving pair changes its order */
  if(deciding&&L.switchAt!=null&&t>=L.switchAt){
    const b0=L.switchBlock,s0=cyc[b0%4],r0=cyc[(b0+1)%4],c2=[];
    c2[b0%4]=s0;c2[(b0+1)%4]=partner(r0);c2[(b0+2)%4]=partner(s0);c2[(b0+3)%4]=r0;cyc=c2;
  }
  info.server=cyc[block%4];info.receiver=cyc[(block+1)%4];
  info.serverSide=pa.includes(info.server)?'a':'b';
  return info;
}
/* a finished match accepts no more points until it is saved or the last point is undone */
function ttLiveDecided(T,m,L){const need=ttNeed(T,m),wa=L.games.filter(g=>g[0]>g[1]).length,wb=L.games.length-wa;return {wa,wb,need,done:wa>=need||wb>=need}}
function ttLivePoint(T,m,L,side){
  if(ttLiveDecided(T,m,L).done)return ['decided'];
  const pts=T.cfg.pts,need=ttNeed(T,m);
  L.hist.push(JSON.stringify({games:L.games,cur:L.cur,switchAt:L.switchAt,switchBlock:L.switchBlock}));
  L.cur=L.cur.slice();L.cur[side==='a'?0:1]++;
  const [a,b]=L.cur,t=a+b,deciding=L.games.length===2*need-2;
  const events=[];
  if(deciding&&L.switchAt==null&&(a===5||b===5)&&Math.max(a,b)===5&&Math.min(a,b)<5){
    L.switchAt=t;const dz=2*(pts-1);L.switchBlock=t<dz?Math.floor(t/2):(pts-1)+(t-dz);events.push('ends');
  }
  const w=Math.max(a,b),l=Math.min(a,b);
  if(w>=pts&&w-l>=2){
    L.games=L.games.concat([[a,b]]);L.cur=[0,0];L.switchAt=null;L.switchBlock=null;
    const wa=L.games.filter(x=>x[0]>x[1]).length,wb=L.games.length-wa;
    if(wa===need||wb===need)events.push('match');else events.push('game');
  }
  return events;
}
function ttLiveUndo(L){if(!L.hist.length)return false;const s=JSON.parse(L.hist.pop());L.games=s.games;L.cur=s.cur;L.switchAt=s.switchAt;L.switchBlock=s.switchBlock;return true}

/* ---------- building the tournament ---------- */
function ttSide(T,m,s){const v=s==='a'?m.a:m.b;if(v==null)return [];return T.unit==='rotate'?v:T.entrants[v].m}
function ttSideName(T,m,s){const v=s==='a'?m.a:m.b;if(v==null)return m['wait'+s]||'—';return T.unit==='rotate'?v.map(p=>T.players[p]).join(' / '):T.entrants[v].name}
function ttNewMatch(T,ph,o){const m={id:T.seq++,ph,a:null,b:null,games:[],st:'open',win:null,wo:null,table:null,...o};T.matches.push(m);return m}
/* round robin with the circle method; the round where the two top seeds meet goes last */
function ttRRMatches(T,list,ph,g,cycles){
  const n=list.length,ids=list.slice();if(n%2)ids.push(-1);const m=ids.length,rounds=[];
  for(let r=0;r<m-1;r++){const pairs=[];
    const add=(x,y)=>{if(ids[x]>=0&&ids[y]>=0)pairs.push([ids[x],ids[y]])};
    add(m-1,r);for(let i=1;i<m/2;i++)add((r+i)%(m-1),(r-i+m-1)%(m-1));rounds.push(pairs)}
  const top=rounds.findIndex(p=>p.some(([x,y])=>(x===list[0]&&y===list[1])||(x===list[1]&&y===list[0])));
  if(top>=0)rounds.push(rounds.splice(top,1)[0]);
  let r0=0;
  for(let c=0;c<(cycles||1);c++)rounds.forEach((pairs,ri)=>{pairs.forEach(([x,y])=>ttNewMatch(T,ph,{g,r:r0+ri,a:c%2?y:x,b:c%2?x:y}));});
}
function ttSeedOrder(S){let o=[1];while(o.length<S){const L=o.length*2,n=[];o.forEach(s=>{n.push(s,L+1-s)});o=n}return o}
/* single-elimination bracket for `list` (entrant ids in seed order); byes go to the top seeds */
function ttKO(T,list,ph,third){
  const n=list.length;let S=2;while(S<n)S*=2;const order=ttSeedOrder(S),R=Math.log2(S);
  const rounds=[[]];
  for(let i=0;i<S/2;i++){const sa=order[2*i],sb=order[2*i+1];
    rounds[0].push(ttNewMatch(T,ph,{r:0,a:sa<=n?list[sa-1]:null,b:sb<=n?list[sb-1]:null,ra:true,rb:true,rounds:R}))}
  for(let r=1;r<R;r++){rounds[r]=[];const prev=rounds[r-1];
    for(let i=0;i<prev.length/2;i++)rounds[r].push(ttNewMatch(T,ph,{r,src:{a:{w:prev[2*i].id},b:{w:prev[2*i+1].id}},rounds:R}))}
  const fin=rounds[R-1][0];if(ph==='ko')fin.final=true;
  if(third&&R>=2){const semis=rounds[R-2];ttNewMatch(T,ph==='ko'?'third':ph+'3',{r:R-1,src:{a:{l:semis[0].id},b:{l:semis[1].id}},rounds:R,isThird:true})}
}
function ttStartPlay(d,id){
  const n=ttEntrantCount(d),P=ttPlan(d);if(!P.ok)return {err:P.err};
  const T={id,sport:'tt',name:'',unit:d.unit,scheme:P.scheme,players:d.players.slice(),entrants:[],matches:[],seq:1,
    cfg:{pts:d.pts,wins:{...d.wins},rwins:d.rwins,tables:P.tables,cycles:P.cycles||1,groupCount:P.groupCount||null,advance:P.advance||null,third:!!d.third,consolation:!!d.consolation,seeding:d.seeding},
    stage:'play',status:'active',planned:P.matches};
  if(d.unit==='pair')for(let i=0;i<n;i++)T.entrants.push({name:d.players[2*i]+' / '+d.players[2*i+1],m:[2*i,2*i+1]});
  else T.players.forEach((p,i)=>T.entrants.push({name:p,m:[i]}));
  T.entrants.forEach(e=>e.lot=Math.random());
  const seeded=d.seeding==='manual'?[...Array(n).keys()]:shuffle([...Array(n).keys()]);
  T.entrants.forEach((e,i)=>e.seed=seeded.indexOf(i)+1);
  if(P.scheme==='rotate'){
    const sched=P.full?clone(ttPrev.sched):buildEqualGames(n,P.tables,P.rounds);ttPrev={key:'',sched:null};
    sched.forEach((R,ri)=>R.matches.forEach(mm=>ttNewMatch(T,'am',{r:ri,a:mm.t1.slice(),b:mm.t2.slice()})));
    T.rounds=sched.length;
  }else if(P.scheme==='rr')ttRRMatches(T,seeded,'rr',null,P.cycles);
  else if(P.scheme==='ko')ttKO(T,seeded,'ko',d.third&&n>=4);
  else{
    const g=P.groupCount;T.groups=[...Array(g)].map(()=>[]);
    seeded.forEach((e,i)=>{const row=Math.floor(i/g),col=i%g;T.groups[row%2?g-1-col:col].push(e)});
    T.groups.forEach((list,gi)=>ttRRMatches(T,list,'g',gi,1));
    T.groupStage=true;
  }
  ttPropagate(T);ttAssignTables(T);
  return {T};
}

/* ---------- results flow ---------- */
const ttDone=m=>m.st==='done';
const ttOut=(T,e)=>T.unit!=='rotate'&&e!=null&&T.entrants[e].out;
function ttWinnerOf(m){if(!ttDone(m)||!m.win)return null;return m.win==='a'?m.a:m.b}
function ttLoserOf(m){if(!ttDone(m)||!m.win||m.bye)return null;return m.win==='a'?m.b:m.a}
/* fill bracket slots from finished matches, auto-advance byes and withdrawn players; repeat until stable */
function ttPropagate(T){
  let changed=true,guard=0;
  while(changed&&guard++<200){changed=false;
    T.matches.forEach(m=>{
      if(m.src)['a','b'].forEach(s=>{const k='r'+s;if(m[k])return;const src=m.src[s],sm=T.matches.find(x=>x.id===(src.w??src.l));
        if(sm&&ttDone(sm)){m[s]=src.w!=null?ttWinnerOf(sm):ttLoserOf(sm);m[k]=true;changed=true}});
      if(m.st!=='done'&&(m.ra||!m.src)&&(m.rb||!m.src)){
        const A=m.a,B=m.b;
        if(m.src||m.ph==='ko'||m.ph==='cons'){
          if(A==null&&B==null){m.st='done';m.bye=true;m.win=null;changed=true;return}
          if(A==null||B==null){m.st='done';m.bye=true;m.win=A==null?'b':'a';changed=true;return}
        }
        if(T.unit!=='rotate'&&A!=null&&B!=null&&(ttOut(T,A)||ttOut(T,B))&&!m.live){
          m.st='done';m.games=[];m.wo=ttOut(T,A)?(ttOut(T,B)?'ab':'a'):'b';m.win=m.wo==='a'?'b':m.wo==='b'?'a':null;
          if(m.wo==='ab'){m.bye=true;m.win=null}changed=true}
      }
    });
  }
  if(T.groupStage&&T.matches.filter(m=>m.ph==='g').every(ttDone)&&!T.matches.some(m=>m.ph==='ko'))ttMakePlayoff(T);
  const left=T.matches.filter(m=>!ttDone(m));
  if(!left.length&&T.stage==='play'){T.stage='results'}
}
function ttMakePlayoff(T){
  const ranks=T.groups.map((list,gi)=>ttRank(T,list,T.matches.filter(m=>m.ph==='g'&&m.g===gi)).order);
  const adv=T.cfg.advance,firsts=ranks.map(r=>r[0]),seconds=adv>1?ranks.map(r=>r[1]):[];
  let best=null,bestCost=1e9;
  const tryOrder=sec=>{const list=firsts.concat(sec);const c=ttSameGroupCost(T,list);if(c<bestCost){bestCost=c;best=list}};
  if(seconds.length<=7)ttPermute(seconds).forEach(tryOrder);else for(let k=0;k<seconds.length;k++){tryOrder(seconds.slice(k).concat(seconds.slice(0,k)));tryOrder(seconds.slice(k).concat(seconds.slice(0,k)).reverse())}
  ttKO(T,best||firsts.concat(seconds),'ko',T.cfg.third&&best.length>=4);
  if(T.cfg.consolation){const rest=[];for(let p=adv;p<6;p++)ranks.forEach(r=>{if(r[p]!=null)rest.push(r[p])});if(rest.length>=2)ttKO(T,rest,'cons',false)}
  T.groupRanks=ranks;
}
function ttPermute(a){if(a.length<=1)return [a.slice()];const out=[];a.forEach((x,i)=>ttPermute(a.slice(0,i).concat(a.slice(i+1))).forEach(p=>out.push([x].concat(p))));return out}
/* players from one group should meet as late as possible in the bracket */
function ttSameGroupCost(T,list){
  const n=list.length;let S=2;while(S<n)S*=2;const order=ttSeedOrder(S),pos={};order.forEach((s,i)=>pos[s]=i);
  const R=Math.log2(S),grp=e=>T.groups.findIndex(g=>g.includes(e));let cost=0;
  for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)if(grp(list[i])===grp(list[j])){let a=pos[i+1],b=pos[j+1],r=0;while(a!==b){a>>=1;b>>=1;r++}cost+=Math.pow(10,R-r)}
  return cost;
}
function ttAssignTables(T){
  const busy=new Set(),used=new Set();
  T.matches.forEach(m=>{if(m.st!=='done'&&m.table!=null){used.add(m.table);ttSide(T,m,'a').concat(ttSide(T,m,'b')).forEach(p=>busy.add(p))}else if(m.st==='done')m.table=null});
  const prio=m=>(m.ph==='g'||m.ph==='rr'||m.ph==='am'?0:m.ph==='cons'?1:2)*1000+(m.r||0)*10+(m.isThird?1:0);
  const ready=T.matches.filter(m=>m.st!=='done'&&m.table==null&&m.a!=null&&m.b!=null).sort((x,y)=>prio(x)-prio(y)||x.id-y.id);
  for(const m of ready){
    let free=null;for(let t=1;t<=T.cfg.tables;t++)if(!used.has(t)){free=t;break}
    if(free==null)break;
    const ps=ttSide(T,m,'a').concat(ttSide(T,m,'b'));if(ps.some(p=>busy.has(p)))continue;
    m.table=free;used.add(free);ps.forEach(p=>busy.add(p));
  }
}
/* record a result; games already validated */
function ttSetResult(T,m,games,win,wo){
  m.games=games;m.win=win;m.wo=wo||null;m.st='done';m.live=null;m.table=null;
  ttPropagate(T);ttAssignTables(T);
}
/* can this finished match still be corrected without breaking later rounds? */
function ttCanEdit(T,m){
  if(m.bye)return {ok:false,why:'Это пропуск круга — счёта нет'};
  if(m.wo&&T.unit!=='rotate'&&(ttOut(T,m.a)||ttOut(T,m.b)))return {ok:false,why:'Игрок снят с турнира — техническое поражение не исправляется'};
  if(m.ph==='g'&&T.matches.some(x=>(x.ph==='ko'||x.ph==='cons'||x.ph==='third')&&ttDone(x)&&!x.bye))return {ok:false,why:'Плей-офф уже начался — результаты групп изменить нельзя'};
  const dep=T.matches.filter(x=>x.src&&((x.src.a&&(x.src.a.w===m.id||x.src.a.l===m.id))||(x.src.b&&(x.src.b.w===m.id||x.src.b.l===m.id))));
  if(dep.some(x=>ttDone(x)&&!x.bye))return {ok:false,why:'Следующий матч сетки уже сыгран — сначала исправьте его'};
  return {ok:true};
}
function ttReopen(T,m){
  const reset=x=>{T.matches.filter(y=>y.src&&((y.src.a&&(y.src.a.w===x.id||y.src.a.l===x.id))||(y.src.b&&(y.src.b.w===x.id||y.src.b.l===x.id)))).forEach(y=>{
    ['a','b'].forEach(s=>{const src=y.src[s];if(src.w===x.id||src.l===x.id){y[s]=null;y['r'+s]=false}});
    if(y.st==='done'){y.st='open';y.win=null;y.bye=false;y.wo=null;y.games=[];reset(y)}})};
  if(m.ph==='g'&&T.matches.some(x=>x.ph==='ko'||x.ph==='cons'||x.ph==='third')){T.matches=T.matches.filter(x=>x.ph==='g'||x.ph==='rr'||x.ph==='am');T.groupRanks=null}
  reset(m);m.st='open';m.win=null;m.wo=null;m.games=[];m.table=null;T.stage='play';
  ttPropagate(T);ttAssignTables(T);
}
function ttWithdraw(T,e){
  T.entrants[e].out=true;
  T.matches.forEach(m=>{if(m.st!=='done'&&(m.a===e||m.b===e)){m.live=null}});
  ttPropagate(T);ttAssignTables(T);
}

/* ---------- standings (ITTF 3.7.5): match points 2 / 1 / 0, ties by results between the tied players ---------- */
function ttTally(T,ids,matches,key){
  const s={};ids.forEach(e=>s[key(e)]={mp:0,w:0,l:0,gw:0,gl:0,pw:0,pl:0,g:0});
  matches.forEach(m=>{if(!ttDone(m)||m.bye||!m.win)return;
    const A=T.unit==='rotate'?m.a:[m.a],B=T.unit==='rotate'?m.b:[m.b];
    const apply=(list,won,wo)=>list.forEach(e=>{const o=s[key(e)];if(!o)return;o.g++;if(won){o.w++;o.mp+=2}else{o.l++;o.mp+=wo?0:1}});
    const aWon=m.win==='a';apply(A,aWon,m.wo==='a');apply(B,!aWon,m.wo==='b');
    if(!m.wo)m.games.forEach(([x,y])=>{A.forEach(e=>{const o=s[key(e)];if(!o)return;o.pw+=+x;o.pl+=+y;if(+x>+y)o.gw++;else o.gl++});
      B.forEach(e=>{const o=s[key(e)];if(!o)return;o.pw+=+y;o.pl+=+x;if(+y>+x)o.gw++;else o.gl++})});
  });
  return s;
}
const ttRatio=(a,b)=>b===0?(a===0?1:Infinity):a/b;
function ttRank(T,ids,matches){
  const key=e=>e;const tieInfo={};
  const resolve=(sub)=>{
    if(sub.length<=1)return sub;
    const inner=matches.filter(m=>sub.includes(m.a)&&sub.includes(m.b));
    const s=ttTally(T,sub,inner,key);
    const crit=[e=>s[e].mp,e=>ttRatio(s[e].gw,s[e].gl),e=>ttRatio(s[e].pw,s[e].pl)];
    for(const c of crit){
      const vals=[...new Set(sub.map(c))];
      if(vals.length>1){vals.sort((x,y)=>y-x);return vals.flatMap(v=>resolve(sub.filter(e=>c(e)===v)))}
    }
    sub.forEach(e=>tieInfo[e]=true);
    return sub.slice().sort((x,y)=>T.entrants[x].lot-T.entrants[y].lot);
  };
  const all=ttTally(T,ids,matches,key);
  const byMp=[...new Set(ids.map(e=>all[e].mp))].sort((x,y)=>y-x);
  const order=byMp.flatMap(v=>resolve(ids.filter(e=>all[e].mp===v)));
  return {order,stats:all,lot:tieInfo};
}
/* rotating partners: individual table, overall ratios (no head-to-head between changing pairs) */
function ttRankPlayers(T){
  const ids=T.players.map((p,i)=>i),s=ttTally(T,ids,T.matches,e=>e);
  const order=ids.slice().sort((x,y)=>s[y].mp-s[x].mp||ttRatio(s[y].gw,s[y].gl)-ttRatio(s[x].gw,s[x].gl)||ttRatio(s[y].pw,s[y].pl)-ttRatio(s[x].pw,s[x].pl)||T.entrants[x].lot-T.entrants[y].lot);
  return {order,stats:s};
}
/* final places for the whole tournament: [{e,name,place,p1,tie,st}] */
function ttFinal(T){
  const rows=[];
  const statsAll=T.unit==='rotate'?ttTally(T,T.players.map((p,i)=>i),T.matches,e=>e):ttTally(T,T.entrants.map((x,i)=>i),T.matches,e=>e);
  const push=(list,start)=>{list.forEach(e=>rows.push({e,name:T.entrants[e].name,p1:start,place:list.length>1?`${start}–${start+list.length-1}`:String(start),tie:list.length>1,st:statsAll[e]}))};
  if(T.scheme==='rotate'||T.scheme==='rr'){
    const R=T.scheme==='rotate'?ttRankPlayers(T):ttRank(T,T.entrants.map((x,i)=>i),T.matches);
    R.order.forEach((e,i)=>rows.push({e,name:T.entrants[e].name,p1:i+1,place:String(i+1),st:statsAll[e],lot:R.lot&&R.lot[e]}));
    return rows;
  }
  const koPlaces=(ph,thirdPh,offset)=>{
    const ms=T.matches.filter(m=>m.ph===ph);if(!ms.length)return 0;
    const R=ms[0].rounds,inB=new Set();ms.filter(m=>m.r===0).forEach(m=>{if(m.a!=null)inB.add(m.a);if(m.b!=null)inB.add(m.b)});
    const lostIn={};ms.forEach(m=>{const l=ttLoserOf(m);if(l!=null)lostIn[l]=m.r});
    const fin=ms.find(m=>m.r===R-1),champ=fin?ttWinnerOf(fin):null;
    const th=T.matches.find(m=>m.ph===thirdPh);
    let place=offset+1;
    if(champ!=null){push([champ],place);place++}
    for(let r=R-1;r>=0;r--){
      let lost=[...inB].filter(e=>lostIn[e]===r&&e!==champ);
      if(r===R-2&&th&&ttDone(th)&&th.win){const w=ttWinnerOf(th),l=ttLoserOf(th);if(w!=null){push([w],place);place++}if(l!=null){push([l],place);place++}lost=lost.filter(e=>e!==w&&e!==l)}
      if(lost.length){push(lost,place);place+=lost.length}
    }
    const undecided=[...inB].filter(e=>!rows.some(x=>x.e===e));if(undecided.length){push(undecided,place);place+=undecided.length}
    return place-1-offset;
  };
  let used=koPlaces('ko','third',0);
  if(T.scheme==='groups'){
    used+=koPlaces('cons','cons3',used);
    if(T.groupRanks){const maxLen=Math.max(...T.groupRanks.map(r=>r.length));
      for(let p=0;p<maxLen;p++){const list=T.groupRanks.map(r=>r[p]).filter(e=>e!=null&&!rows.some(x=>x.e===e));if(list.length){push(list,used+1);used+=list.length}}}
    else{const R=ttRank(T,T.entrants.map((x,i)=>i),T.matches.filter(m=>m.ph==='g'));R.order.forEach(e=>{if(!rows.some(x=>x.e===e)){push([e],used+1);used++}})}
  }
  return rows;
}
const ttProgress=T=>{const real=T.matches.filter(m=>!m.bye||m.cancelled);return {done:real.filter(m=>ttDone(m)&&!m.cancelled).length,all:T.scheme==='groups'&&!T.matches.some(m=>m.ph==='ko')?Math.max(real.length,T.planned||0):real.length}};
