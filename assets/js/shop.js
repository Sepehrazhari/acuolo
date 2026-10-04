/* Shop catalogue: product data, rendering, filtering and sorting.
   Only loaded on shop.html. */

/* Topics are what a product is about; `cat` is what you receive (shown as the
   card badge). A product can sit under more than one topic. Topic buttons are
   built from this list and hidden when nothing would show under them. */
const TOPICS=[
  {id:'performance',label:'Performance & growth'},
  {id:'hiring',label:'Hiring & onboarding'},
  {id:'culture',label:'Culture & policy'},
  {id:'pay',label:'Compensation'},
  {id:'advisory',label:'Diagnostics & advisory'},
];

const FORMAT_LABEL={framework:'Framework',template:'Template',ai:'AI tool',course:'Course',consulting:'Consulting'};

const shopProducts=[
  {id:0,name:"HR diagnostic",desc:"Ten questions about how you work today, and a prioritised answer to what to fix first — weighted for your company size.",price:0,cat:"framework",topics:["advisory"],icon:"DX",ic:"icon-p",link:"/products/hr-diagnostic",cta:"Start the diagnostic →"},
  {id:1,name:"Custom Performance Evaluation Form",desc:"Forms, rating rubrics, and manager guide. A complete review process, not just a form.",price:19,cat:"template",topics:["performance"],icon:"PE",ic:"icon-c",link:"/products/360-feedback",cta:"Build your form →"},
  {id:2,name:"Company handbook",desc:"Full Notion + PDF template covering culture, policies, and values. Editable in 30 minutes.",price:79,cat:"template",topics:["culture"],icon:"HB",ic:"icon-t"},
  {id:3,name:"Onboarding & offboarding kit",desc:"30-60-90 day plans, buddy programs, and exit interview frameworks.",price:49,cat:"template",topics:["hiring"],icon:"OB",ic:"icon-b"},
  {id:4,name:"Career ladder framework",desc:"Level definitions, competencies, and promotion criteria for any team size.",price:99,cat:"framework",topics:["performance"],icon:"CL",ic:"icon-a",link:"/products/career-ladder",cta:"Build your ladder →"},
  {id:5,name:"Compensation system",desc:"Salary bands, benchmarking guide, and pay equity audit template.",price:149,cat:"framework",topics:["pay"],icon:"CS",ic:"icon-c"},
  {id:6,name:"Engagement survey + playbook",desc:"The survey questions, plus what a bad score on each topic usually means and what to do about it.",price:59,cat:"template",topics:["culture"],icon:"ES",ic:"icon-t",link:"/products/engagement-survey",cta:"Build your survey →"},
  {id:7,name:"Remote & hybrid work playbook",desc:"Async norms, meeting rhythms, and time-zone policies for distributed teams.",price:49,cat:"template",topics:["culture"],icon:"RW",ic:"icon-p"},
  {id:8,name:"AI prompt library for HR",desc:"200+ prompts for JDs, offer letters, PIPs, and performance reviews.",price:39,cat:"ai",topics:["hiring","performance"],icon:"AI",ic:"icon-b"},
  {id:9,name:"Recruiting framework",desc:"Interview scorecards, structured question banks, hiring decision rubrics, and email templates for every stage.",price:79,cat:"framework",topics:["hiring"],icon:"RC",ic:"icon-a",link:"/products/recruiting",cta:"Build your kit →"},
  {id:10,name:"Manager bootcamp course",desc:"Self-paced course for first-time managers. The leadership curriculum they never got.",price:197,cat:"course",topics:["performance"],icon:"MB",ic:"icon-p"},
  {id:11,name:"HR audit & strategy session",desc:"90-min deep-dive into your current HR setup with a written action plan.",price:500,cat:"consulting",topics:["advisory"],icon:"HA",ic:"icon-c"},
  {id:12,name:"Fractional CHRO retainer",desc:"Monthly HR leadership for companies not ready to hire full-time.",price:2000,cat:"consulting",topics:["advisory"],icon:"FR",ic:"icon-t"},
];

/* One state object, one pipeline: topic, availability, search and sort all
   apply together, so changing one never silently resets another. */
const shop={topic:'all',liveOnly:false,q:'',sort:'featured'};

const SORTS={
  featured:(a,b)=>(!!b.link-!!a.link)||(a.id-b.id),   // available first, then catalogue order
  'price-asc':(a,b)=>a.price-b.price,
  'price-desc':(a,b)=>b.price-a.price,
  name:(a,b)=>a.name.localeCompare(b.name),
};

function inTopic(p,topic){ return topic==='all'||p.topics.includes(topic); }

function visibleProducts(){
  return shopProducts
    .filter(p=>inTopic(p,shop.topic)&&(!shop.liveOnly||p.link)&&(!shop.q||(p.name+' '+p.desc).toLowerCase().includes(shop.q)))
    .sort(SORTS[shop.sort]||SORTS.featured);
}

function renderFilters(){
  const bar=document.getElementById('topicFilters');
  if(!bar) return;
  const pool=shopProducts.filter(p=>!shop.liveOnly||p.link);
  const shown=TOPICS.map(t=>({...t,n:pool.filter(p=>inTopic(p,t.id)).length})).filter(t=>t.n>0);
  // If the active topic just emptied out (e.g. "available now" was ticked), fall back to all.
  if(shop.topic!=='all'&&!shown.some(t=>t.id===shop.topic)) shop.topic='all';
  const btn=(id,label,n)=>`<button type="button" class="filter-btn${shop.topic===id?' active':''}" data-topic="${id}" aria-pressed="${shop.topic===id}">${label} <span class="filter-count">${n}</span></button>`;
  bar.innerHTML=btn('all','All',pool.length)+shown.map(t=>btn(t.id,t.label,t.n)).join('');
}

function renderShop(){
  const list=visibleProducts();
  const grid=document.getElementById('shopGrid');
  const count=document.getElementById('shopCount');
  const live=list.filter(p=>p.link).length;
  if(count) count.textContent=list.length+' product'+(list.length!==1?'s':'')+(shop.liveOnly||!list.length?'':' · '+live+' available now');
  const bundle=document.getElementById('bundleSection');
  if(bundle) bundle.hidden=!(shop.topic==='all'&&!shop.liveOnly&&!shop.q);
  if(!grid) return;
  if(!list.length){
    grid.innerHTML=`<div class="shop-empty">Nothing matches that. <button type="button" class="link-btn" data-reset>Show all products</button></div>`;
    return;
  }
  grid.innerHTML=list.map(p=>{
    const tag=p.link?'a':'div';
    const href=p.link?` href="${p.link}"`:'';
    const footer=p.link
      ? `<span class="product-price">${p.price?'$'+p.price.toLocaleString():'Free'}</span><span class="product-add">${p.cta||'Build it →'}</span>`
      : `<span class="product-price">$${p.price.toLocaleString()}${p.cat==='consulting'?'+':''}</span><span class="badge badge-gray">Coming soon</span>`;
    return `
    <${tag} class="product-card${p.link?'':' is-soon'}"${href}>
      <div class="product-icon ${p.ic}">${p.icon}</div>
      <div style="margin-bottom:6px;"><span class="badge badge-gray">${FORMAT_LABEL[p.cat]||p.cat}</span></div>
      <div class="product-name">${p.name}</div>
      <div class="product-desc">${p.desc}</div>
      <div class="product-footer">${footer}</div>
    </${tag}>`;
  }).join('');
}

function update(){
  renderFilters();
  renderShop();
  // Keep the topic in the address bar so /shop#hiring can be linked to directly.
  const hash=shop.topic==='all'?'':'#'+shop.topic;
  if(location.hash!==hash) history.replaceState(null,'',location.pathname+location.search+hash);
}

function resetShop(){
  shop.topic='all'; shop.liveOnly=false; shop.q='';
  const s=document.getElementById('shopSearch'); if(s) s.value='';
  const l=document.getElementById('shopLiveOnly'); if(l) l.checked=false;
  update();
}

(function initShop(){
  const fromHash=location.hash.slice(1);
  if(TOPICS.some(t=>t.id===fromHash)) shop.topic=fromHash;

  const bar=document.getElementById('topicFilters');
  if(bar) bar.addEventListener('click',e=>{
    const b=e.target.closest('[data-topic]');
    if(b){ shop.topic=b.dataset.topic; update(); }
  });
  const search=document.getElementById('shopSearch');
  if(search) search.addEventListener('input',()=>{ shop.q=search.value.trim().toLowerCase(); renderShop(); });
  const sort=document.getElementById('shopSort');
  if(sort) sort.addEventListener('change',()=>{ shop.sort=sort.value; renderShop(); });
  const live=document.getElementById('shopLiveOnly');
  if(live) live.addEventListener('change',()=>{ shop.liveOnly=live.checked; update(); });
  const grid=document.getElementById('shopGrid');
  if(grid) grid.addEventListener('click',e=>{ if(e.target.closest('[data-reset]')) resetShop(); });

  update();
})();
