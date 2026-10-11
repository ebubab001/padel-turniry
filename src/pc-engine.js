/* ================= padel classic (FIP rules): engine (no DOM) ================= */
/* match settings: deuce 'adv' | 'golden' | 'star'; fmt 'bo3' | 'one' | 'short'; dec 'set' | 'stb' (super tie-break to 10 instead of the deciding set) */
const PC_DEUCE={adv:'Больше-меньше',golden:'Золотое очко',star:'Стар-пойнт'};
const PC_FMT={bo3:'2 из 3 сетов',one:'1 сет',short:'2 из 3 коротких сетов (до 4)'};
const pcSetLen=c=>c.fmt==='short'?4:6;
const pcNeed=c=>c.fmt==='one'?1:2;
const pcMinutes=c=>c.fmt==='one'?35:c.fmt==='short'?(c.dec==='stb'?40:50):(c.dec==='stb'?70:85);
/* one set: {a,b} games, plus {ta,tb} tie-break points when it went to a tie-break; super tie-break: {a,b,stb:true} points */
function pcSetErr(s,c,isDecider){
  const num=v=>v!==''&&v!=null&&Number.isInteger(+v)&&+v>=0;
  if(isDecider&&c.dec==='stb'&&c.fmt!=='one'){
    if(!num(s.a)||!num(s.b))return 'Введите счёт супер-тай-брейка';
    const w=Math.max(+s.a,+s.b),l=Math.min(+s.a,+s.b);
    if(w===l)return 'В тай-брейке не бывает ничьей';
    if(w<10)return 'Супер-тай-брейк идёт до 10 очков';
    if(l<=8&&w!==10)return `При ${l} у проигравших победители набирают ровно 10`;
    if(l>=9&&w!==l+2)return `После 9:9 нужен отрыв в 2 очка — например ${l+2}:${l}`;
    return null;
  }
  if(!num(s.a)||!num(s.b))return 'Введите счёт сета (геймы)';
  const S=pcSetLen(c),a=+s.a,b=+s.b,w=Math.max(a,b),l=Math.min(a,b);
  if(a===b)return 'В сете не бывает ничьей';
  if(w<S)return `Сет идёт до ${S} геймов`;
  if(w===S&&l<=S-2)return null;
  if(w===S+1&&l===S-1)return null;
  if(w===S+1&&l===S){
    if(!num(s.ta)||!num(s.tb))return `При ${S+1}:${S} введите счёт тай-брейка`;
    const ta=+s.ta,tb=+s.tb,tw=Math.max(ta,tb),tl=Math.min(ta,tb);
    if((ta>tb)!==(a>b))return 'Тай-брейк должен выиграть тот, кто выиграл сет';
    if(tw<7)return 'Тай-брейк идёт до 7 очков';
    if(tl<=5&&tw!==7)return `При ${tl} у проигравших в тай-брейке победители набирают ровно 7`;
    if(tl>=6&&tw!==tl+2)return `В тай-брейке после 6:6 нужен отрыв в 2 очка`;
    return null;
  }
  if(w===S&&l===S-1)return `При ${S}:${S-1} сет не окончен — нужно ${S+1}:${S-1} или тай-брейк при ${S}:${S}`;
  return `Счёт ${a}:${b} невозможен: сет заканчивается при ${S}:${S-2} и меньше, ${S+1}:${S-1} или ${S+1}:${S} с тай-брейком`;
}
function pcMatchCheck(sets,c){
  const need=pcNeed(c);
  if(!sets.length)return {err:'Введите счёт хотя бы одного сета'};
  let wa=0,wb=0;
  for(let i=0;i<sets.length;i++){
    if(wa===need||wb===need)return {err:`Матч уже закончился после ${i}-го сета — лишний сет`};
    const dec=(i===2*need-2)&&need>1;
    const e=pcSetErr(sets[i],c,dec);if(e)return {err:`${dec&&c.dec==='stb'?'Супер-тай-брейк':`Сет ${i+1}`}: ${e}`};
    if(+sets[i].a>+sets[i].b)wa++;else wb++;
  }
  if(wa<need&&wb<need)return {err:`Матч идёт до ${need} ${plural(need,'выигранного сета','выигранных сетов','выигранных сетов')} — сейчас ${wa}:${wb}`};
  return {win:wa>wb?'a':'b',wa,wb};
}
const pcSetText=s=>s.stb?`[${s.a}:${s.b}]`:`${s.a}:${s.b}${s.ta!=null&&s.ta!==''?`(${Math.min(+s.ta,+s.tb)})`:''}`;

/* ---------- live scoring ---------- */
/* L: {sets:[...], g:[a,b] games in current set, p:[a,b] points in current game, deuces:n, order:[4 player ids], first:0, hist:[]} */
const PC_PT=['0','15','30','40'];
function pcLiveState(T,m,L){
  const c=T.cfg,need=pcNeed(c),S=pcSetLen(c);
  const wa=L.sets.filter(s=>+s.a>+s.b).length,wb=L.sets.length-wa;
  const done=wa>=need||wb>=need;
  const deciderSTB=!done&&need>1&&L.sets.length===2*need-2&&c.dec==='stb';
  const tieBreak=!done&&!deciderSTB&&L.g[0]===S&&L.g[1]===S;
  return {need,S,wa,wb,done,stb:deciderSTB,tb:tieBreak||deciderSTB,tbTo:deciderSTB?10:7};
}
function pcPointLabel(T,m,L){
  const st=pcLiveState(T,m,L),[a,b]=L.p;
  if(st.tb)return [String(a),String(b)];
  if(a>=3&&b>=3){
    if(a===b)return ['40','40'];
    return a>b?['AD','40']:['40','AD'];
  }
  return [PC_PT[Math.min(a,3)],PC_PT[Math.min(b,3)]];
}
/* is the next point at 40:40 decisive? (golden point, or the 3rd deuce under star point) */
function pcDecisive(T,L){const c=T.cfg,[a,b]=L.p;if(!(a>=3&&b>=3&&a===b))return false;return c.deuce==='golden'||(c.deuce==='star'&&L.deuces>=3)}
/* serve: order of 4 players across games [team A first server, team B first server, A partner, B partner] */
function pcServeInfo(T,m,L){
  const st=pcLiveState(T,m,L),gamesPlayed=L.sets.reduce((x,s)=>x+(s.stb?1:(+s.a)+(+s.b)),0)+L.g[0]+L.g[1];
  const o=L.order;
  if(!st.tb)return {server:o[gamesPlayed%4],tb:false};
  const t=L.p[0]+L.p[1],block=t===0?0:1+Math.floor((t-1)/2);
  return {server:o[(gamesPlayed+block)%4],tb:true};
}
/* returns events: 'game','set','match','ends','decided' */
function pcLivePoint(T,m,L,side){
  if(pcLiveState(T,m,L).done)return ['decided'];
  L.hist.push(JSON.stringify({sets:L.sets,g:L.g,p:L.p,deuces:L.deuces}));
  const st=pcLiveState(T,m,L),i=side==='a'?0:1,ev=[];
  L.p=L.p.slice();L.p[i]++;
  const [a,b]=L.p;let gameWon=null;
  if(st.tb){
    const t=a+b;
    if(Math.max(a,b)>=st.tbTo&&Math.abs(a-b)>=2)gameWon=a>b?'a':'b';
    else if(t%6===0)ev.push('ends');
    if(gameWon){
      const set=st.stb?{a,b,stb:true}:{a:L.g[0]+(a>b?1:0),b:L.g[1]+(b>a?1:0),ta:a,tb:b};
      L.sets=L.sets.concat([set]);L.g=[0,0];L.p=[0,0];L.deuces=0;ev.push('set');
    }
  }else{
    const was=[a-(i===0?1:0),b-(i===1?1:0)];
    const decisive=was[0]>=3&&was[1]>=3&&was[0]===was[1]&&(T.cfg.deuce==='golden'||(T.cfg.deuce==='star'&&L.deuces>=3));
    if(decisive)gameWon=side;
    else if((a>=4||b>=4)&&Math.abs(a-b)>=2)gameWon=a>b?'a':'b';
    else if(a>=3&&b>=3&&a===b){L.deuces=(L.deuces||0)+1;L.p=[3,3]}
    if(gameWon){
      L.g=L.g.slice();L.g[gameWon==='a'?0:1]++;L.p=[0,0];L.deuces=0;ev.push('game');
      const S=st.S,[ga,gb]=L.g,w=Math.max(ga,gb),l=Math.min(ga,gb);
      if((w===S&&l<=S-2)||(w===S+1&&l===S-1)){L.sets=L.sets.concat([{a:ga,b:gb}]);L.g=[0,0];ev.push('set')}
      if((ga+gb)%2===1&&!ev.includes('set'))ev.push('ends');
    }
  }
  if(ev.includes('set')){const last=L.sets[L.sets.length-1],tot=last.stb?1:(+last.a)+(+last.b);if(tot%2===1)ev.push('ends')}
  if(pcLiveState(T,m,L).done)ev.push('match');
  return ev;
}
function pcLiveUndo(L){if(!L.hist.length)return false;const s=JSON.parse(L.hist.pop());L.sets=s.sets;L.g=s.g;L.p=s.p;L.deuces=s.deuces;return true}
