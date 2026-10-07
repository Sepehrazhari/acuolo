/* Homepage scroll story: pins the Acuolo story on screen and drives it from
   the scroll position, Apple-product-page style. Scroll down plays it
   forward, scroll up rewinds. Needs story.js loaded first. */
(function(){
const section=document.getElementById('story');
if(!section||!window.AcuoloStory) return;
const pin=section.querySelector('.story-pin');
const stage=section.querySelector('[data-story-stage]');
const hint=section.querySelector('.story-hint');
const skip=section.querySelector('.story-skip');
const bar=section.querySelector('.story-progress');
const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const clamp=x=>Math.min(1,Math.max(0,x));

const nav=document.querySelector('.site-nav');
let story=null, dims=null, target=0, cur=0, p=0, raf=0, last=0, navH=0;
function measureNav(){
  navH=nav?nav.offsetHeight:0;
  section.style.setProperty('--story-top',navH+'px');
}

/* The stage is drawn at a fixed design width (1920 landscape, 1080 portrait)
   with a height matching the screen's shape, then scaled to fill it exactly. */
function build(){
  const w=pin.clientWidth, h=pin.clientHeight;
  if(!w||!h) return;
  const tall=w/h<1, W=tall?1080:1920, H=Math.round(W*h/w);
  const same=dims&&dims.tall===tall&&Math.abs(dims.H-H)/dims.H<.12;
  if(!same){
    story=window.AcuoloStory(stage,{W,H,tall,web:true});
    dims={tall,W,H};
  }
  stage.style.transform=`scale(${w/dims.W})`;
  story.render(cur);
}

/* 0 when the section's top is 60% of the way down the area below the nav,
   1 when it un-pins. */
function progress(){
  const vh=pin.clientHeight, lead=vh*.6;
  const pinned=section.offsetHeight-vh;
  return clamp((lead-(section.getBoundingClientRect().top-navH))/(pinned+lead));
}

function paintUI(){
  const dark=story.background(cur)==='dark';
  hint.style.opacity=p<.03?.75:0;
  skip.style.opacity=p<.97?1:0;
  skip.style.pointerEvents=p<.97?'auto':'none';
  hint.style.color=skip.style.color=dark?'#F7F5F0':'#141414';
  bar.style.transform=`scaleX(${p})`;
}

// Ease toward the scroll target so wheel steps feel smooth, then stop.
function tick(now){
  const dt=Math.min(.05,(now-last)/1000)||.016; last=now;
  cur+=(target-cur)*(1-Math.exp(-dt*9));
  if(Math.abs(target-cur)<.003) cur=target;
  story.render(cur); paintUI();
  raf=cur!==target?requestAnimationFrame(tick):0;
}
function onScroll(){
  if(!story) return;
  p=progress(); target=p*story.webEnd;
  if(!raf&&target!==cur){last=performance.now();raf=requestAnimationFrame(tick)}
  else if(!raf) paintUI();
}

if(reduceMotion){
  // No scroll-driven motion: show the finished last scene, unpinned.
  section.classList.add('is-static');
  measureNav();build();
  if(story){cur=story.webEnd;story.render(cur)}
  return;
}

section.classList.add('is-live');
measureNav();build();
p=progress(); cur=target=p*(story?story.webEnd:0);
story&&story.render(cur); story&&paintUI();
window.addEventListener('scroll',onScroll,{passive:true});
let resizeTimer=0;
window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{measureNav();build();onScroll()},120)});
// Fonts change text widths, which the core box measures each frame.
if(document.fonts) document.fonts.ready.then(()=>story&&story.render(cur));
})();
