/* Shared site behaviour: mobile navigation, FAQ accordion, scroll reveal.
   Loaded on every storefront page. */

function toggleMobileNav(){
  const panel=document.getElementById('navMobilePanel');
  const btn=document.querySelector('.nav-toggle');
  const isOpen=panel.classList.toggle('open');
  btn.classList.toggle('open',isOpen);
  btn.setAttribute('aria-expanded',isOpen?'true':'false');
}

function closeMobileNav(){
  document.getElementById('navMobilePanel').classList.remove('open');
  const btn=document.querySelector('.nav-toggle');
  btn.classList.remove('open');
  btn.setAttribute('aria-expanded','false');
}

function toggleFaq(el){
  const answer=el.nextElementSibling;
  const toggle=el.querySelector('.faq-toggle');
  const isOpen=answer.classList.contains('open');
  document.querySelectorAll('.faq-answer').forEach(a=>a.classList.remove('open'));
  document.querySelectorAll('.faq-toggle').forEach(t=>t.textContent='+');
  document.querySelectorAll('.faq-question').forEach(q=>q.setAttribute('aria-expanded','false'));
  if(!isOpen){ answer.classList.add('open'); toggle.textContent='\u2212'; el.setAttribute('aria-expanded','true'); }
}

const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduceMotion && 'IntersectionObserver' in window){
  const revealObserver=new IntersectionObserver((entries,obs)=>{
    entries.forEach(entry=>{
      if(entry.isIntersecting){
        entry.target.classList.add('in-view');
        obs.unobserve(entry.target);
      }
    });
  },{threshold:0.15});
  // The scroll story animates itself; fading its pinned frame would fight it.
  document.querySelectorAll('main section:not(.hero):not(.story)').forEach(el=>{
    // Anything already on screen at load is shown immediately. Hiding it and
    // waiting for the observer causes a visible flash of missing content, and
    // there is nothing to animate in for something the reader can already see.
    if(el.getBoundingClientRect().top < window.innerHeight){
      el.classList.add('reveal','in-view');
      return;
    }
    el.classList.add('reveal'); revealObserver.observe(el);
  });
}
