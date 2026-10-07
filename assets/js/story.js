/* Acuolo story: one deterministic timeline. render(t) draws the frame for
   time t (seconds), so the same code drives the homepage scroll section
   (scroll position -> t) and the trailer video (frame number -> t).

     const story = AcuoloStory(stageEl, {W, H, tall, web});
     story.render(t);

   W x H is the stage size in design pixels. Layouts are fractions of the frame,
   so any aspect works; `tall` picks the portrait layout. `web` turns the tool
   cards and Studio areas into links and hands their hover state to CSS. */
(function(){
const clamp=(x,a=0,b=1)=>Math.min(b,Math.max(a,x));
const P=(t,s,d)=>clamp((t-s)/d);
const lerp=(a,b,x)=>a+(b-a)*x;
const bump=(t,s,d)=>Math.sin(Math.PI*P(t,s,d));
const E={
  out:x=>1-Math.pow(1-x,3),
  q5:x=>1-Math.pow(1-x,5),
  in:x=>x*x*x,
  io:x=>x<.5?4*x*x*x:1-Math.pow(-2*x+2,3)/2,
  back:x=>{const c=1.70158;return 1+(c+1)*Math.pow(x-1,3)+c*Math.pow(x-1,2)},
};

/* layout per orientation (fractions of the frame, sizes in u) */
const LAYOUT={
  tall:{
    chips:[[.28,.10],[.72,.135],[.30,.265],[.74,.29],[.27,.715],[.73,.70],[.30,.875],[.72,.86]],
    pairs:[[0,1],[1,3],[3,2],[2,0],[4,5],[5,7],[7,6],[6,4]],
    h1:[.5,.49,.86,9], h2:[.5,.46,.86,7.4], sub2:[.5,.585,.78,3],
    h3:[.5,.45,.88,8.2], sub3:[.5,.635,.8,3],
    eye5:[.5,.115], title5:[.5,.152,.86,4.4],
    core:[.5,.425], mods:[[.27,.27],[.73,.27],[.27,.585],[.73,.585]], modW:43,
    ben:[.5,.79,'column'],
    head6:[.5,.26,.86,7.2], cards:{row:false,top:.355,w:.84,h:11,gap:2}, cap6:[.5,.755,.8,2.9],
    logo:[.5,.43,15,.86], tag7:[.5,.535,.8,3.7], cta:[.5,.625,2.9]
  },
  wide:{
    chips:[[.17,.24],[.40,.13],[.63,.15],[.84,.28],[.86,.70],[.64,.86],[.36,.85],[.14,.72]],
    pairs:[[0,1],[1,2],[2,3],[3,4],[4,5],[5,6],[6,7],[7,0]],
    h1:[.5,.5,.6,8.6], h2:[.5,.47,.62,7], sub2:[.5,.615,.6,2.8],
    h3:[.5,.45,.72,7.8], sub3:[.5,.67,.7,2.7],
    eye5:[.5,.08], title5:[.5,.135,.8,3.9],
    core:[.5,.475], mods:[[.22,.33],[.78,.33],[.22,.665],[.78,.665]], modW:40,
    ben:[.5,.885,'row'],
    head6:[.5,.2,.86,6.2], cards:{row:true,y:.52,w:29,h:27,gap:2.4}, cap6:[.5,.82,.8,2.7],
    logo:[.5,.42,14,.7], tag7:[.5,.575,.7,3.4], cta:[.5,.71,2.6]
  }
};

/* content: every claim here is on the live site */
const CHIPS=[
  ['Spreadsheets','#1D9E75',0,-4],['Docs & wikis','#8C84EA',1,3],['A database tool','#6B9BE0',1,-2],
  ['HR software','#D85A30',1,5],['A CRM','#E0A33A',1,-3],['Project tool','#6B9BE0',1,2],
  ['Chat threads','#8C84EA',0,4],["Someone's memory",'#9A9A9A',0,-5]
];
const ICONS={
  people:'<circle cx="9" cy="8" r="3.2"/><path d="M3.5 19c.6-3.2 2.9-5 5.5-5s4.9 1.8 5.5 5"/><circle cx="16.5" cy="9" r="2.6"/><path d="M15.6 14.2c2.4.1 4.2 1.8 4.8 4.8"/>',
  clients:'<rect x="3.5" y="7.5" width="17" height="11.5" rx="2"/><path d="M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5M3.5 12.5h17"/>',
  projects:'<rect x="4" y="4" width="4.5" height="16" rx="1.2"/><rect x="10" y="4" width="4.5" height="10" rx="1.2"/><rect x="16" y="4" width="4" height="13" rx="1.2"/>',
  process:'<circle cx="6" cy="6" r="2.2"/><circle cx="18" cy="12" r="2.2"/><circle cx="6" cy="18" r="2.2"/><path d="M8.2 6.9 15.9 11M8.2 17.1 15.9 13"/>'
};
const MODS=[
  {k:'people',t:'People',d:'Records · Hiring · Reviews · Leave',bg:'#FAECE7',fg:'#993C1D',lead:'Usual starting point'},
  {k:'clients',t:'Clients',d:'Pipeline · Accounts · Contracts',bg:'#E1F5EE',fg:'#085041'},
  {k:'projects',t:'Projects',d:'Delivery · Resourcing · Status',bg:'#E6F1FB',fg:'#0C447C'},
  {k:'process',t:'Process',d:'Approvals · Requests · Reporting',bg:'#EEEDFE',fg:'#3C3489'}
];
const BENEFITS=['Built around your process','Runs in your own cloud','You own it — no per-seat fees'];
const TOOLS=[['DX','HR diagnostic','#EEEDFE','#3C3489','/products/hr-diagnostic'],['PE','Performance evaluation','#FAECE7','#993C1D','/products/360-feedback'],
  ['CL','Career ladder','#FAEEDA','#633806','/products/career-ladder'],['RC','Recruiting kit','#FAEEDA','#633806','/products/recruiting'],
  ['ES','Engagement survey','#E1F5EE','#085041','/products/engagement-survey']];
const CHECK='<svg viewBox="0 0 24 24"><path d="M5 12.5 10 17.5 19 7"/></svg>';
const NS='http://www.w3.org/2000/svg';

const DURATION=27.5;   // the full trailer, ending on the logo card
const WEB_END=22.6;    // the website stops on the free-tool cards

window.AcuoloStory=function(stage,{W,H,tall=false,web=false}){
  const L=LAYOUT[tall?'tall':'wide'];
  // 1u is 10.8px on the 1920x1080 / 1080x1920 masters; shrinks if the frame is squatter.
  const u=tall?Math.min(W/100,H/177.78):Math.min(W/177.78,H/100);
  const CX=W/2, CY=H/2, R=Math.hypot(W,H)/2+6;

  stage.innerHTML='';
  stage.className='as-stage'+(tall?' as-tall':'')+(web?' as-web':'');
  stage.style.width=W+'px';stage.style.height=H+'px';stage.style.setProperty('--u',u+'px');

  function el(tag,cls,html,parent){const d=document.createElement(tag);if(cls)d.className=cls;if(html!=null)d.innerHTML=html;(parent||stage).appendChild(d);return d}
  const div=(cls,html,parent)=>el('div',cls,html,parent);
  // Links exist for the mouse only: the section's text summary carries the
  // content for screen readers, and the same links follow in the page.
  const link=(cls,html,href)=>{const a=el(web?'a':'div',cls,html);if(web){a.href=href;a.tabIndex=-1}return a};
  function svgLayer(){const s=document.createElementNS(NS,'svg');s.setAttribute('class','as-layer');s.setAttribute('width',W);s.setAttribute('height',H);stage.appendChild(s);return s}
  function line(svg,stroke,width,dash){const l=document.createElementNS(NS,'line');l.setAttribute('stroke',stroke);l.setAttribute('stroke-width',width);
    l.setAttribute('stroke-linecap','round');if(dash)l.setAttribute('stroke-dasharray',dash);svg.appendChild(l);return l}
  function setLine(l,x1,y1,x2,y2,op){l.setAttribute('x1',x1);l.setAttribute('y1',y1);l.setAttribute('x2',x2);l.setAttribute('y2',y2);l.style.opacity=op}
  function place(e,x,y){e.style.left=x*W+'px';e.style.top=y*H+'px'}
  const active=(e,on)=>{if(web)e.style.pointerEvents=on?'auto':'none'};

  /* A headline whose words rise in. "*word*" marks the accent. */
  function head(text,[x,y,w,fs],color){
    const d=div('as-head');place(d,x,y);d.style.width=w*W+'px';d.style.fontSize=fs*u+'px';d.style.color=color;
    const words=[];let acc=false,accEl=null;const toks=text.split(' ');
    toks.forEach((tok,i)=>{
      if(tok.startsWith('*'))acc=true;
      const isAcc=acc; if(tok.replace(/[.,!?…]+$/,'').endsWith('*'))acc=false;
      const w=document.createElement('span');w.className='as-w';
      const m=document.createElement('span');m.className='as-wm';
      const inner=document.createElement('span');inner.className='as-wi'+(isAcc?' as-acc':'');inner.textContent=tok.replace(/\*/g,'');
      m.appendChild(inner);w.appendChild(m);d.appendChild(w);if(i<toks.length-1)d.appendChild(document.createTextNode(' '));
      words.push(inner);if(isAcc&&!accEl)accEl=w;
    });
    return {el:d,words,accEl};
  }
  function sub(text,[x,y,w,fs],color){const d=div('as-sub as-abs',text);place(d,x,y);d.style.width=w*W+'px';d.style.fontSize=fs*u+'px';d.style.color=color;return d}

  /* ---------- build ---------- */
  div('as-layer as-dots');

  // scenes 1-2
  const seamSvg=svgLayer();
  const seams=L.pairs.map(()=>({a:line(seamSvg,'rgba(247,245,240,.38)',2,`${u*.7} ${u*.7}`),b:line(seamSvg,'rgba(247,245,240,.38)',2,`${u*.7} ${u*.7}`),
    x:div('as-x as-abs','<svg viewBox="0 0 24 24"><path d="M6 6l12 12M18 6 6 18" stroke="#fff" stroke-width="3.2" stroke-linecap="round"/></svg>')}));
  const chips=CHIPS.map(([label,col,paid,rot])=>{
    const c=div('as-chip as-abs',`<i style="background:${col}"></i>${label.replace('&','&amp;')}`);
    const tag=paid?div('as-tag','per seat / month',c):null;
    return {el:c,tag,rot,pos:[0,0]};
  });
  const h1=head('Your company runs on…',L.h1,'var(--linen,#F7F5F0)');
  const h2=head('None of them talk to each other.',L.h2,'var(--linen,#F7F5F0)');
  const sub2=sub('Each one fits about 70% of how you actually work.',L.sub2,'rgba(247,245,240,.62)');

  // the collapse: coral, then linen, opening from the centre
  const coralLayer=div('as-layer');coralLayer.style.background='var(--coral,#D85A30)';
  const linenLayer=div('as-layer as-dots-light');linenLayer.style.backgroundColor='var(--linen,#F7F5F0)';

  // scene 4
  const h3=head('One system that runs how *your* company works.',L.h3,'var(--anvil,#141414)');
  const swash=document.createElementNS(NS,'svg');swash.setAttribute('class','as-swash');swash.setAttribute('viewBox','0 0 100 12');swash.setAttribute('preserveAspectRatio','none');
  swash.innerHTML='<path d="M2 9 C 30 3, 70 2, 98 7"/>';h3.accEl.appendChild(swash);
  const swashPath=swash.querySelector('path'),swashLen=swashPath.getTotalLength()||110;
  swashPath.style.strokeDasharray=`${swashLen} ${swashLen}`;
  const sub3=sub('Built around how you already work. Not the other way round.',L.sub3,'var(--as-muted)');

  // scene 5
  const linkSvg=svgLayer();
  const eye5=div('as-eyebrow as-abs','ACUOLO STUDIO');place(eye5,...L.eye5);
  const title5=head('One system. Every part connected.',L.title5,'var(--anvil,#141414)');
  const ring=div('as-ring as-abs');
  const core=div('as-core as-abs','<b>Your company</b><span>one source of truth</span>');place(core,...L.core);
  const corePos=[L.core[0]*W,L.core[1]*H];
  const links=[],mods=[],pulses=[];
  MODS.forEach((m,i)=>{
    const [mx,my]=L.mods[i];
    links.push(line(linkSvg,'rgba(20,20,20,.22)',2));
    const e=link('as-mod as-abs'+(m.lead?' is-lead':''),
      `<div class="as-ic" style="background:${m.bg};color:${m.fg}"><svg viewBox="0 0 24 24">${ICONS[m.k]}</svg></div>`+
      `<div>${m.lead?`<small>${m.lead}</small>`:''}<b>${m.t}</b><p>${m.d}</p></div>`,'/products/studio');
    e.style.width=L.modW*u+'px';place(e,mx,my);
    mods.push({el:e,pos:[mx*W,my*H]});
    pulses.push([div('as-pulse as-abs'),div('as-pulse as-abs')]);
  });
  // keep cards above the pulses travelling under them
  mods.forEach(m=>stage.appendChild(m.el));stage.appendChild(ring);stage.appendChild(core);
  const ben=div('as-ben as-abs');place(ben,L.ben[0],L.ben[1]);ben.style.flexDirection=L.ben[2];
  const pills=BENEFITS.map(b=>div('as-pill',`<i>${CHECK}</i>${b}`,ben));

  // scene 6
  const h6=head('Not ready for a system? *Start free.*',L.head6,'var(--anvil,#141414)');
  const cards=TOOLS.map(([ab,name,bg,fg,href],i)=>{
    const C=L.cards;const e=link('as-card as-abs '+(C.row?'as-v':'as-h'),
      `<div class="as-hl"></div><div class="as-ic" style="background:${bg};color:${fg}">${ab}</div><b>${name}</b><span class="as-free">Free</span>`,href);
    let x,y;
    if(C.row){const cw=C.w*u,gap=C.gap*u,total=5*cw+4*gap;x=(W-total)/2+cw/2+i*(cw+gap);y=C.y*H;e.style.width=cw+'px';e.style.height=C.h*u+'px'}
    else{const ch=C.h*u,gap=C.gap*u;x=W/2;y=C.top*H+ch/2+i*(ch+gap);e.style.width=C.w*W+'px';e.style.height=ch+'px'}
    e.style.left=x+'px';e.style.top=y+'px';
    return {el:e,hl:e.querySelector('.as-hl'),free:e.querySelector('.as-free')};
  });
  const cap6=sub('Answer a few questions. Get a finished document. No account needed.',L.cap6,'var(--as-muted)');

  // scene 7: wipe back to dark, end card (video only; the website stops before it)
  const bandLayer=div('as-layer');bandLayer.style.background='var(--coral,#D85A30)';
  const endLayer=div('as-layer as-dots');endLayer.style.backgroundColor='var(--anvil,#141414)';
  const logo=div('as-logo as-abs');place(logo,L.logo[0],L.logo[1]);logo.style.transform='translate(-50%,-50%)';logo.style.fontSize=L.logo[2]*u+'px';
  const letters=[];
  [...'Acuolo.'].forEach((c,i)=>{const s=document.createElement('span');s.className='as-ch';const n=document.createElement('span');n.textContent=c;
    n.style.color=i<6?'var(--linen,#F7F5F0)':'var(--coral,#D85A30)';s.appendChild(n);logo.appendChild(s);letters.push(n)});
  const tag7=sub('Free HR tools. Custom company systems.',L.tag7,'rgba(247,245,240,.72)');
  const cta=div('as-cta as-abs','Start free — no account →');place(cta,L.cta[0],L.cta[1]);cta.style.fontSize=L.cta[2]*u+'px';

  /* ---------- animation helpers ---------- */
  function words(h,t,tin,tout,st=.065){
    h.words.forEach((w,i)=>{
      const a=E.q5(P(t,tin+i*st,.75)), b=tout==null?0:E.in(P(t,tout+i*.03,.45));
      w.style.transform=`translateY(${(1-a)*118-b*118}%)`;
    });
  }
  function fade(e,t,tin,tout,{dur=.75,dist=2.4,base='translate(-50%,-50%)',scale=0}={}){
    const a=E.q5(P(t,tin,dur)), b=tout==null?0:E.in(P(t,tout,.4));
    e.style.opacity=a*(1-b);
    e.style.transform=`${base} translateY(${(1-a)*dist*u-b*dist*.6*u}px)${scale?` scale(${1-scale+scale*a})`:''}`;
  }
  const clipCircle=r=>`circle(${Math.max(0,r)}px at ${CX}px ${CY}px)`;

  /* ---------- the frame at time t ---------- */
  function render(t){
    // scene 1: "Your company runs on…" and the sprawl arrives
    words(h1,t,.25,3.65);
    chips.forEach((c,i)=>{
      const [fx,fy]=L.chips[i];
      const s0=1.1+i*.16, a=E.back(P(t,s0,.55)), ao=P(t,s0,.25);
      const shake=bump(t,5.55,.6)*u*.5*Math.sin(t*55+i*2);
      let x=fx*W+Math.sin(t*.55+i*1.7)*u*.9+shake, y=fy*H+Math.cos(t*.47+i*2.3)*u*.9;
      const k=E.in(P(t,7.75+(i%4)*.04,.95));
      x=lerp(x,CX,k);y=lerp(y,CY,k);
      const s=(.6+.4*a)*(1-.85*k), r=c.rot+Math.sin(t*.4+i)*1.2+k*c.rot*3;
      c.el.style.transform=`translate(${x}px,${y}px) translate(-50%,-50%) rotate(${r}deg) scale(${s})`;
      c.el.style.opacity=ao*(1-clamp((k-.6)/.4));
      c.pos=[x,y];
      if(c.tag){const ta=E.back(P(t,6.1+i*.07,.45));c.tag.style.opacity=clamp(P(t,6.1+i*.07,.2))*(1-P(t,7.5,.3));
        c.tag.style.transform=`translateX(-50%) scale(${.4+.6*ta})`}
    });

    // scene 2: the seams between them break
    words(h2,t,4.15,7.3);
    fade(sub2,t,4.95,7.25);
    L.pairs.forEach(([i,j],k)=>{
      const A=chips[i].pos,B=chips[j].pos,M=[(A[0]+B[0])/2,(A[1]+B[1])/2];
      const d=E.io(P(t,4.45+k*.05,.6)), g=E.out(P(t,5.6+k*.06,.5))*.4, f=d*(1-g), op=1-P(t,7.25,.35);
      const lop=f>.002?op:0;   // a zero-length line would still draw its round cap
      setLine(seams[k].a,A[0],A[1],lerp(A[0],M[0],f),lerp(A[1],M[1],f),lop);
      setLine(seams[k].b,B[0],B[1],lerp(B[0],M[0],f),lerp(B[1],M[1],f),lop);
      const xs=E.back(P(t,5.65+k*.06,.4));
      seams[k].x.style.transform=`translate(${M[0]}px,${M[1]}px) translate(-50%,-50%) scale(${xs})`;
      seams[k].x.style.opacity=P(t,5.65+k*.06,.12)*op;
    });

    // scene 3: everything collapses into one point, which opens into the new world
    let rc=u*3.6*E.back(P(t,8.45,.45));
    rc+=bump(t,8.75,.25)*u*.6;
    rc=lerp(rc,R,E.io(P(t,8.98,.62)));
    coralLayer.style.clipPath=clipCircle(rc);
    linenLayer.style.clipPath=clipCircle(R*E.io(P(t,9.35,.75)));

    // scene 4: the promise
    words(h3,t,10.05,13.85,.07);
    swashPath.style.strokeDashoffset=swashLen*(1-E.io(P(t,10.95,.6)));
    swash.style.opacity=t<10.95?0:1-P(t,13.85,.3);
    fade(sub3,t,11.3,13.75);

    // scene 5: one system, every part connected
    fade(eye5,t,14.35,19.0,{dist:1.5});
    words(title5,t,14.45,19.0,.05);
    const cOut=E.in(P(t,19.05,.4)), ca=E.back(P(t,14.6,.6));
    core.style.opacity=clamp(P(t,14.6,.25))*(1-cOut);
    core.style.transform=`translate(-50%,-50%) scale(${(.7+.3*ca)*(1-.08*cOut)})`;
    const rp=((t-15.8)/1.5)%1, rOn=P(t,15.8,.3)*(1-cOut);
    ring.style.width=core.offsetWidth+'px';ring.style.height=core.offsetHeight+'px';
    ring.style.transform=`translate(${corePos[0]}px,${corePos[1]}px) translate(-50%,-50%) scale(${1+rp*.35})`;
    ring.style.opacity=t<15.8?0:(1-rp)*.6*rOn;
    mods.forEach((m,i)=>{
      const [mx,my]=m.pos;
      const d=E.io(P(t,15.0+i*.1,.55));
      setLine(links[i],corePos[0],corePos[1],lerp(corePos[0],mx,d),lerp(corePos[1],my,d),d>.002?1-cOut:0);
      const a=E.back(P(t,15.2+i*.14,.6)), o=P(t,15.2+i*.14,.3), out=E.in(P(t,19.0+i*.04,.4));
      const op=o*(1-out);
      m.el.style.opacity=op;active(m.el,op>.6);
      m.el.style.transform=`translate(-50%,-50%) translateY(${(1-a)*3*u-out*1.5*u}px) scale(${.94+.06*a})`;
      pulses[i].forEach((p,j)=>{
        const ph=(((t-15.8)*.55+i*.23+j*.5)%1+1)%1, dir=(i+j)%2?ph:1-ph;
        p.style.transform=`translate(${lerp(corePos[0],mx,dir)}px,${lerp(corePos[1],my,dir)}px) translate(-50%,-50%)`;
        p.style.opacity=t<15.8?0:Math.sin(Math.PI*ph)*P(t,15.8,.4)*(1-cOut);
      });
    });
    pills.forEach((p,i)=>fade(p,t,16.6+i*.18,19.0+i*.04,{base:'',dist:2}));

    // scene 6: start free
    words(h6,t,19.55,23.4,.06);
    cards.forEach((c,i)=>{
      const a=E.q5(P(t,20.1+i*.11,.7)), o=P(t,20.1+i*.11,.35), out=E.in(P(t,23.35,.35));
      // the video sweeps a highlight across the cards; on the site, hover does it
      const lift=web?0:bump(t,22.0+i*.24,.55);
      const op=o*(1-out);
      c.el.style.opacity=op;active(c.el,op>.6);
      c.el.style.transform=`translate(-50%,-50%) translateY(${(1-a)*4*u-lift*1.2*u}px)`;
      if(!web){
        c.el.style.boxShadow=`0 ${(.8+lift*1.6)*u}px ${(3+lift*3)*u}px rgba(20,20,20,${.06+lift*.08})`;
        c.hl.style.opacity=lift;
      }
      const fa=E.back(P(t,21.2+i*.1,.4));
      c.free.style.opacity=clamp(P(t,21.2+i*.1,.15));c.free.style.transform=`scale(${.5+.5*fa})`;
    });
    fade(cap6,t,21.7,23.35);

    // scene 7: back to dark, the name
    bandLayer.style.clipPath=`inset(${H*(1-E.io(P(t,23.5,.65)))}px 0 0 0)`;
    endLayer.style.clipPath=`inset(${H*(1-E.io(P(t,23.68,.65)))}px 0 0 0)`;
    letters.forEach((n,i)=>{n.style.transform=`translateY(${(1-E.q5(P(t,24.3+i*.035,.85)))*118}%)`});
    fade(tag7,t,25.0,null);
    const ka=E.back(P(t,25.5,.6));
    cta.style.opacity=clamp(P(t,25.5,.2));
    cta.style.transform=`translate(-50%,-50%) scale(${.85+.15*ka})`;
  }

  function fitLogo(){const max=L.logo[3]*W;const w=logo.scrollWidth;if(w>max)logo.style.fontSize=parseFloat(logo.style.fontSize)*max/w+'px'}

  // Which background the frame shows at t, for whatever surrounds the stage.
  const background=t=>t<9.4?'dark':t<23.6?'light':'dark';

  return {render,fitLogo,background,duration:DURATION,webEnd:WEB_END};
};
})();
